"use server";

import { Network, Organization, db, organizations, teamMembers } from "@/db";
import { CookieManager } from "@/integrations/cookie-manager";
import { JWT } from "@/integrations/jwt";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { resolveAccountContext } from "./account";
import { postTeamMember } from "./team-member";

export const postOrganization = async (
  params: Omit<Organization, "id" | "accountId">
) => {
  const { accountId } = await resolveAccountContext();

  const [organization] = await db
    .insert(organizations)
    .values({ ...params, id: `org_${nanoid(25)}`, accountId })
    .returning();

  await postTeamMember({
    organizationId: organization.id,
    accountId,
    role: "owner",
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
  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);

  if (!organization) throw new Error("Organization not found");

  return organization;
};

export const putOrganization = async (
  id: string,
  params: Partial<Organization>
) => {
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

export const setCurrentOrganization = async (
  orgId: string,
  environment: Network = "testnet"
) => {
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
    organizationId: organizationId ?? orgContext.id,
    environment: environment ?? orgContext.environment,
  };
};
