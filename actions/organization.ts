"use server";

import { resolveAccountContext } from "@/actions/account";
import {
  Network,
  Organization,
  OrganizationSecret,
  SecretAccessLog,
  assets,
  customers,
  db,
  organizationSecrets,
  organizations,
  payments,
  products,
  secretAccessLog,
  subscriptions,
} from "@/db";
import { CookieManager } from "@/integrations/cookie-manager";
import { EncryptionApi } from "@/integrations/encryption";
import { FileUploadApi } from "@/integrations/file-upload";
import { JWTApi } from "@/integrations/jwt";
import { PriceFeedApi } from "@/integrations/price-feed";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { TIER_FEE_TOKENS } from "@/lib/pricing.server";
import { generateResourceId, normalizeTimeSeries } from "@/lib/utils";
import { and, eq, gte, lt, or, sql } from "drizzle-orm";

export const postOrganizationAndSecret = async (
  params: Omit<Organization, "id" | "accountId" | "feeToken">,
  defaultEnvironment: Network,
  options?: { formDataWithFiles?: FormData }
) => {
  const logoFile = options?.formDataWithFiles?.get("logo");

  if (logoFile) {
    const logoUploadResult = await new FileUploadApi().upload([logoFile as File]);
    params.logoUrl = logoUploadResult?.[0] ?? null;
  }

  const { accountId } = await resolveAccountContext();

  const organizationId = generateResourceId("org", accountId, 25);

  const [organization] = await db
    .insert(organizations)
    .values({ ...params, id: organizationId, accountId, feeToken: TIER_FEE_TOKENS.FREE })
    .returning();

  const account = await new StellarCoreApi(defaultEnvironment).createAccount();

  if (account.isErr()) throw new Error(account.error?.message);

  await Promise.allSettled([
    postOrganizationSecretWithEncryption(
      {
        testnetSecret: account.value!.keypair.secret(),
        testnetSecretVersion: parseInt(process.env.NEXT_PUBLIC_CURRENT_ENCRYPTION_KEY_VERSION!) || 1,
        testnetPublicKey: account.value!.keypair.publicKey(),
        mainnetSecret: null,
        mainnetPublicKey: null,
        mainnetSecretVersion: 0,
      },
      organization.id,
      defaultEnvironment
    ),
  ]);

  return { success: true, id: organization.id };
};

export const retrieveOrganizations = async (accId?: string) => {
  const { accountId } = await resolveAccountContext(accId);

  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      logoUrl: organizations.logoUrl,
    })
    .from(organizations)
    .where(eq(organizations.accountId, accountId));

  return rows;
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
      secret: sql<{ encrypted: string; version: number; publicKey: string } | null>`
        CASE WHEN ${sql.raw(`"organization_secret"."${prefix}_secret_encrypted"`)} IS NOT NULL THEN
            jsonb_build_object(
              'encrypted', ${sql.raw(`"organization_secret"."${prefix}_secret_encrypted"`)},
              'version', ${sql.raw(`"organization_secret"."${prefix}_secret_version"`)},
              'publicKey', ${sql.raw(`"organization_secret"."${prefix}_public_key"`)}
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

export const putOrganization = async (
  id: string,
  params: Partial<Organization>,
  options?: { formDataWithFiles?: FormData }
) => {
  const logoFile = options?.formDataWithFiles?.get("logo");

  if (logoFile) {
    const logoUploadResult = await new FileUploadApi().upload([logoFile as File]);
    params.logoUrl = logoUploadResult?.[0] ?? null;
  }

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
  const token = await new JWTApi().sign(payload, "1y");

  await new CookieManager().set([
    { key: "selectedOrg", value: token, maxAge: 365 * 24 * 60 * 60 }, // 1 year
  ]);
};

export const getCurrentOrganization = async () => {
  const token = await new CookieManager().get("selectedOrg");

  if (!token) return null;

  const { orgId, environment } = (await new JWTApi().verify(token)) as {
    orgId: string;
    environment: Network;
  };

  const organization = await retrieveOrganization(orgId);

  return { id: organization.id, environment, token };
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

// -- Internal --

export const postOrganizationSecretWithEncryption = async (
  params: {
    mainnetPublicKey: string | null;
    testnetPublicKey: string | null;
    testnetSecretVersion: number;
    mainnetSecretVersion: number;
    testnetSecret: string | null;
    mainnetSecret: string | null;
  },
  orgId?: string,
  env?: Network
) => {
  const encryption = new EncryptionApi();
  const { organizationId } = await resolveOrgContext(orgId, env);

  const [secret] = await db
    .insert(organizationSecrets)
    .values({
      mainnetPublicKey: params.mainnetPublicKey,
      testnetPublicKey: params.testnetPublicKey,
      mainnetSecretVersion: params.testnetSecretVersion,
      testnetSecretVersion: params.testnetSecretVersion,
      mainnetSecretEncrypted: params.mainnetSecret ? encryption.encrypt(params.mainnetSecret) : null,
      testnetSecretEncrypted: params.testnetSecret ? encryption.encrypt(params.testnetSecret) : null,
      id: generateResourceId("org_sec", organizationId, 25),
      organizationId,
    })
    .returning();

  return secret;
};

export const putOrganizationSecretWithEncryption = async (id: string, params: Partial<OrganizationSecret>) => {
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
  const encryption = new EncryptionApi();
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
          const testnetReencrypted = secret.testnetSecretEncrypted
            ? encryption.reencrypt(secret.testnetSecretEncrypted)
            : null;

          // Re-encrypt mainnet (Optional field in your schema)
          const hasMainnet = secret.mainnetSecretEncrypted && secret.mainnetSecretVersion;
          const mainnetReencrypted = hasMainnet ? encryption.reencrypt(secret.mainnetSecretEncrypted!) : null;

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
                id: generateResourceId("log", secret.organizationId, 25),
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
                id: generateResourceId("log", secret.organizationId, 25),
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
          console.error(`✗ Failed to rotate ${secret.organizationId}:`, error);
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

// -- Dashboard Internals --

export const retrieveOverviewStats = async (options: { orgId?: string; env?: Network; since?: Date } = {}) => {
  const { organizationId, environment } = await resolveOrgContext(options.orgId, options.env);

  const DEFAULT_PERIOD_MS = 28 * 24 * 60 * 60 * 1000;

  const since = options.since ?? new Date(Date.now() - DEFAULT_PERIOD_MS);

  const metricsPromise = db
    .select({
      activeSubscriptions: sql<number>`count(*) FILTER (WHERE ${subscriptions.status} = 'active')`,
      activeTrials: sql<number>`count(*) FILTER (WHERE ${subscriptions.status} = 'trialing')`,
      totalCustomers: sql<number>`(SELECT count(*) FROM ${customers} WHERE ${customers.organizationId} = ${organizationId} AND ${customers.environment} = ${environment})`,
    })
    .from(subscriptions)
    .innerJoin(products, eq(subscriptions.productId, products.id))
    .where(and(eq(subscriptions.organizationId, organizationId), eq(subscriptions.environment, environment)))
    .then((r) => r[0]);

  const mrrByAssetQuery = db
    .select({
      assetMetadata: assets.metadata,
      totalAmount: sql<number>`coalesce(sum(${products.priceAmount}), 0)::bigint`,
    })
    .from(subscriptions)
    .innerJoin(products, eq(subscriptions.productId, products.id))
    .innerJoin(assets, eq(products.assetId, assets.id))
    .where(
      and(
        eq(subscriptions.organizationId, organizationId),
        eq(subscriptions.environment, environment),
        eq(subscriptions.status, "active")
      )
    )
    .groupBy(assets.id);

  const revenueChartQuery = db
    .select({
      date: sql<string>`date_trunc('day', ${payments.createdAt})::text`,
      amount: sql<number>`sum(${payments.amount})::bigint`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, organizationId),
        eq(payments.environment, environment),
        eq(payments.status, "confirmed"),
        gte(payments.createdAt, since)
      )
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  // Revenue grouped by asset — direct join now that payments.assetId exists
  const revenueByAssetQuery = db
    .select({
      assetMetadata: assets.metadata,
      totalAmount: sql<number>`sum(${payments.amount})::bigint`,
    })
    .from(payments)
    .leftJoin(assets, eq(payments.assetId, assets.id))
    .where(
      and(
        eq(payments.organizationId, organizationId),
        eq(payments.environment, environment),
        eq(payments.status, "confirmed"),
        gte(payments.createdAt, since)
      )
    )
    .groupBy(assets.id);

  const customersChartQuery = db
    .select({
      date: sql<string>`date_trunc('day', ${customers.createdAt})::text`,
      count: sql<number>`count(*)::int`,
    })
    .from(customers)
    .where(
      and(
        eq(customers.organizationId, organizationId),
        eq(customers.environment, environment),
        gte(customers.createdAt, since)
      )
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const subscriptionsChartQuery = db
    .select({
      date: sql<string>`date_trunc('day', ${subscriptions.createdAt})::text`,
      count: sql<number>`count(*)::int`,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.organizationId, organizationId),
        eq(subscriptions.environment, environment),
        gte(subscriptions.createdAt, since)
      )
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const trialsChartQuery = db
    .select({
      date: sql<string>`date_trunc('day', ${subscriptions.createdAt})::text`,
      count: sql<number>`count(*)::int`,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.organizationId, organizationId),
        eq(subscriptions.environment, environment),
        eq(subscriptions.status, "trialing"),
        gte(subscriptions.createdAt, since)
      )
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const [
    metrics,
    revenueChart,
    customersChart,
    subscriptionsChart,
    trialsChart,
    revenueByAsset,
    mrrByAsset,
    periodFeesUsdCents,
  ] = await Promise.all([
    metricsPromise,
    revenueChartQuery,
    customersChartQuery,
    subscriptionsChartQuery,
    trialsChartQuery,
    revenueByAssetQuery,
    mrrByAssetQuery,
    db
      .select({ sum: sql<number>`coalesce(sum(${payments.platformFeeUsd}), 0)::bigint` })
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, organizationId),
          eq(payments.environment, environment),
          eq(payments.status, "confirmed"),
          gte(payments.createdAt, since)
        )
      )
      .then((r) => Number(r[0]?.sum ?? 0)),
  ]);

  const feed = new PriceFeedApi();

  const toUsdCents = async (amount: number, metadata: typeof assets.$inferSelect.metadata) => {
    const usdPrice = await feed.getAssetUsdPrice(metadata ?? {});
    return amount * usdPrice * 100;
  };

  const sumUsdCents = (rows: { totalAmount: number; assetMetadata: typeof assets.$inferSelect.metadata }[]) =>
    Promise.all(rows.map((r) => toUsdCents(Number(r.totalAmount), r.assetMetadata))).then((vals) =>
      vals.reduce((a, b) => a + b, 0)
    );

  const [revenueUsdCents, mrrUsdCents] = await Promise.all([sumUsdCents(revenueByAsset), sumUsdCents(mrrByAsset)]);

  return {
    activeTrials: Number(metrics.activeTrials),
    activeSubscriptions: Number(metrics.activeSubscriptions),
    mrr: Math.round(mrrUsdCents),
    revenue: Math.round(revenueUsdCents),
    platformFeesUsd: Number(periodFeesUsdCents) / 100,
    totalCustomers: Number(metrics.totalCustomers),
    newCustomers: customersChart.reduce((acc, curr) => acc + curr.count, 0),
    charts: {
      revenue: normalizeTimeSeries(
        revenueChart.map((r) => ({ date: r.date.split(" ")[0], value: r.amount })),
        28,
        "day"
      ),
      subscriptions: normalizeTimeSeries(
        subscriptionsChart.map((s) => ({ date: s.date.split(" ")[0], count: s.count })),
        28,
        "day"
      ),
      trials: normalizeTimeSeries(
        trialsChart.map((t) => ({ date: t.date.split(" ")[0], count: t.count })),
        28,
        "day"
      ),
      customers: normalizeTimeSeries(
        customersChart.map((c) => ({ date: c.date.split(" ")[0], count: c.count })),
        28,
        "day"
      ),
    },
  };
};
