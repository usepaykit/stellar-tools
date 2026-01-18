"use server";

import {
  Network,
  Organization,
  OrganizationSecret,
  SecretAccessLog,
  db,
  organizationSecrets,
  organizations,
  secretAccessLog,
  teamMembers,
} from "@/db";
import { CookieManager } from "@/integrations/cookie-manager";
import { Encryption } from "@/integrations/encryption";
import { FileUploadApi } from "@/integrations/file-upload";
import { JWT } from "@/integrations/jwt";
import { and, eq, lt, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { resolveAccountContext } from "./account";
import { postTeamMember } from "./team-member";

export const postOrganization = async (
  params: Omit<Organization, "id" | "accountId">,
  formDataWithFiles?: FormData
) => {
  const organizationId = `org_${nanoid(25)}`;
  const logoFile = formDataWithFiles?.get("logo");

  if (logoFile) {
    const logoUploadResult = await new FileUploadApi().upload([logoFile as File]);

    const [logoUrl] = logoUploadResult || [];

    params.logoUrl = logoUrl;
  }

  const { accountId } = await resolveAccountContext();

  const [organization] = await db
    .insert(organizations)
    .values({ ...params, id: organizationId, accountId })
    .returning();

  await postTeamMember({
    organizationId: organization.id,
    accountId,
    role: "owner",
    metadata: null,
  });

  return organization;
};

export const retrieveOrganizations = async (accId?: string) => {
  const { accountId } = await resolveAccountContext(accId);

  const orgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      logoUrl: organizations.logoUrl,
      role: teamMembers.role,
      memberCount:
        sql<number>`(SELECT COUNT(*) FROM ${teamMembers} WHERE ${teamMembers.organizationId} = ${organizations.id})`.as(
          "member_count"
        ),
    })
    .from(teamMembers)
    .innerJoin(organizations, eq(teamMembers.organizationId, organizations.id))
    .where(and(eq(teamMembers.accountId, accountId)));

  return orgs;
};

export const retrieveOrganization = async (id: string) => {
  const [organization] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);

  if (!organization) throw new Error("Organization not found");

  return organization;
};

export const retrieveOrganizationIdAndSecret = async (id: string, environment: Network) => {
  const prefix = environment === "testnet" ? "testnet" : "mainnet";

  const [result] = await db
    .select({
      organizationId: organizations.id,
      secret: sql<{
        encrypted: string;
        version: number;
        publicKey: string;
      } | null>`
        CASE 
          WHEN ${sql.identifier(`${prefix}SecretEncrypted`)} IS NOT NULL THEN
            jsonb_build_object(
              'encrypted', ${organizationSecrets[environment === "testnet" ? "testnetSecretEncrypted" : "mainnetSecretEncrypted"]},
              'version', ${organizationSecrets[environment === "testnet" ? "testnetSecretVersion" : "mainnetSecretVersion"]},
              'publicKey', ${organizationSecrets[environment === "testnet" ? "testnetPublicKey" : "mainnetPublicKey"]}
            )
          ELSE NULL 
        END`,
    })
    .from(organizations)
    .leftJoin(organizationSecrets, eq(organizations.id, organizationSecrets.organizationId))
    .where(eq(organizations.id, id))
    .limit(1);

  if (!result) throw new Error("Organization not found");

  return result;
};
export const putOrganization = async (id: string, params: Partial<Organization>) => {
  const [organization] = await db
    .update(organizations)
    .set({ ...params, updatedAt: new Date() })
    .where(eq(organizations.id, id))
    .returning();

  if (!organization) throw new Error("Organization not found");

  return organization;
};

export const deleteOrganization = async (id: string) => {
  await db.delete(organizations).where(eq(organizations.id, id)).returning();

  return null;
};

// -- Organization Internal --

export const setCurrentOrganization = async (orgId: string, environment: Network = "testnet") => {
  const payload = { orgId, environment };
  const token = await new JWT().sign(payload, "1y");

  await new CookieManager().set([
    { key: "selectedOrg", value: token, maxAge: 365 * 24 * 60 * 60 }, // 1 year
  ]);
};

export const getCurrentOrganization = async () => {
  const token = await new CookieManager().get("selectedOrg");

  if (!token) return null;

  const { orgId, environment } = (await new JWT().verify(token)) as {
    orgId: string;
    environment: Network;
  };

  const organization = await retrieveOrganization(orgId);

  return { id: organization.id, environment };
};

export const switchEnvironment = async (environment: Network) => {
  const currentOrg = await getCurrentOrganization();

  if (!currentOrg) {
    throw new Error("No organization selected");
  }

  await setCurrentOrganization(currentOrg.id, environment);
};

export const resolveOrgContext = async (
  organizationId?: string,
  environment?: Network
): Promise<{ organizationId: string; environment: Network }> => {
  if (organizationId && environment) {
    return { organizationId, environment };
  }

  const orgContext = await getCurrentOrganization();

  if (!orgContext) {
    throw new Error("No organization context found");
  }

  return {
    organizationId: orgContext.id,
    environment: orgContext.environment,
  };
};

// -- Organization Secrets --

export const retrieveOrganizationSecrets = async (organizationId: string) => {
  const secrets = await db
    .select()
    .from(organizationSecrets)
    .where(eq(organizationSecrets.organizationId, organizationId));

  return secrets;
};

export const retrieveOrganizationSecret = async (id: string) => {
  const [secret] = await db.select().from(organizationSecrets).where(eq(organizationSecrets.id, id)).limit(1);

  return secret;
};

export const postOrganizationSecret = async (
  params: Omit<OrganizationSecret, "id" | "organizationId" | "createdAt" | "updatedAt">,
  orgId?: string,
  env?: Network
) => {
  const { organizationId } = await resolveOrgContext(orgId, env);

  const [secret] = await db
    .insert(organizationSecrets)
    .values({ ...params, id: `sec_${nanoid(25)}`, organizationId })
    .returning();

  return secret;
};

export const putOrganizationSecret = async (id: string, params: Partial<OrganizationSecret>) => {
  const [secret] = await db
    .update(organizationSecrets)
    .set({ ...params, updatedAt: new Date() })
    .where(eq(organizationSecrets.id, id))
    .returning();

  if (!secret) throw new Error("Secret not found");

  return secret;
};

export const deleteOrganizationSecret = async (id: string) => {
  await db.delete(organizationSecrets).where(eq(organizationSecrets.id, id)).returning();

  return null;
};

// -- Rotate Organization Secret --

export const rotateAllSecrets = async (newVersion: number, performedBy: string) => {
  const encryption = new Encryption();
  const stats = { total: 0, succeeded: 0, failed: 0 };

  // 1. Generator: Fetch only records that are behind the current version
  // We don't need 'offset' because as we update records, they no longer match the 'lt' filter
  async function* getStaleSecrets(batchSize = 50) {
    while (true) {
      const records = await db
        .select()
        .from(organizationSecrets)
        .where(
          or(
            lt(organizationSecrets.testnetSecretVersion, newVersion),
            lt(organizationSecrets.mainnetSecretVersion, newVersion)
          )
        )
        .limit(batchSize);

      if (records.length === 0) break;
      yield records;
    }
  }

  // 2. Process the stream
  for await (const batch of getStaleSecrets()) {
    await Promise.all(
      batch.map(async (secret) => {
        try {
          // Re-encrypt testnet (Mandatory field in your schema)
          const testnetReencrypted = encryption.reencrypt(
            secret.testnetSecretEncrypted,
            secret.testnetSecretVersion,
            newVersion
          );

          // Re-encrypt mainnet (Optional field in your schema)
          const hasMainnet = secret.mainnetSecretEncrypted && secret.mainnetSecretVersion;
          const mainnetReencrypted = hasMainnet
            ? encryption.reencrypt(secret.mainnetSecretEncrypted!, secret.mainnetSecretVersion!, newVersion)
            : null;

          await db.transaction(async (tx) => {
            await tx
              .update(organizationSecrets)
              .set({
                testnetSecretEncrypted: testnetReencrypted,
                testnetSecretVersion: newVersion,
                ...(mainnetReencrypted && {
                  mainnetSecretEncrypted: mainnetReencrypted,
                  mainnetSecretVersion: newVersion,
                }),
                updatedAt: new Date(),
              })
              .where(eq(organizationSecrets.id, secret.id));

            const logs: SecretAccessLog[] = [
              {
                id: `log_${nanoid(25)}`,
                organizationId: secret.organizationId,
                secretId: secret.id,
                action: "rotate" as const,
                environment: "testnet" as const,
                metadata: {
                  performedBy,
                  oldVersion: secret.testnetSecretVersion,
                  newVersion,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ];

            if (mainnetReencrypted) {
              logs.push({
                id: `log_${nanoid(25)}`,
                organizationId: secret.organizationId,
                secretId: secret.id,
                action: "rotate" as const,
                environment: "mainnet" as const,
                metadata: {
                  performedBy,
                  oldVersion: secret.mainnetSecretVersion,
                  newVersion,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }

            await tx.insert(secretAccessLog).values(logs);
          });

          stats.succeeded++;
        } catch (error) {
          console.error(`❌ Failed to rotate ${secret.organizationId}:`, error);
          stats.failed++;
        } finally {
          stats.total++;
        }
      })
    );

    console.log(`Processed ${stats.total} organizations...`);
  }

  return stats;
};
