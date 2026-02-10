"use server";

import { resolveOrgContext, retrieveOrganization } from "@/actions/organization";
import { ApiKey, Network, accounts, apiKeys, db, organizations, plan } from "@/db";
import { JWTApi } from "@/integrations/jwt";
import { generateResourceId } from "@/lib/utils";
import { and, eq, sql } from "drizzle-orm";

export const postApiKey = async (
  params: Omit<ApiKey, "id" | "organizationId" | "environment" | "token">,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return await db
    .insert(apiKeys)
    .values({
      ...params,
      id: generateResourceId("st_api", organizationId, 25),
      organizationId,
      environment,
      token: generateResourceId("st_key", organizationId, 52),
    })
    .returning()
    .then(([apiKey]) => apiKey);
};

export const retrieveApiKeys = async (orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.organizationId, organizationId), eq(apiKeys.environment, environment)));
};

export const retrieveApiKey = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, organizationId), eq(apiKeys.environment, environment)))
    .limit(1)
    .then(([apiKey]) => apiKey);
};

export const putApiKey = async (id: string, retUpdate: Partial<ApiKey>, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return await db
    .update(apiKeys)
    .set({ ...retUpdate, updatedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, organizationId), eq(apiKeys.environment, environment)))
    .returning()
    .then(([apiKey]) => apiKey);
};

export const deleteApiKey = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, organizationId), eq(apiKeys.environment, environment)))
    .returning()
    .then(() => null);
};

export const resolveApiKeyOrSessionToken$1 = async (apiKey: string, sessionToken?: string) => {
  if (sessionToken) {
    const { orgId, environment } = (await new JWTApi().verify(sessionToken)) as {
      orgId: string;
      environment: Network;
    };

    const organization = await retrieveOrganization(orgId);

    return { organizationId: organization.id, environment };
  }

  const [record] = await db.select().from(apiKeys).where(eq(apiKeys.token, apiKey)).limit(1);

  if (!record) throw new Error("Invalid apiKey");

  const organization = await retrieveOrganization(record.organizationId);

  return {
    organizationId: organization.id,
    environment: record.environment,
    apiKeyId: record.id,
  };
};

export const resolveApiKeyOrSessionToken = async (apiKey: string, sessionToken?: string) => {
  const context = await (async () => {
    if (sessionToken) {
      const { orgId, environment } = (await new JWTApi().verify(sessionToken)) as {
        orgId: string;
        environment: Network;
      };

      return await db
        .select({
          organizationId: organizations.id,
          environment: sql<Network>`${environment}`,
          plan: plan,
        })
        .from(organizations)
        .innerJoin(accounts, eq(organizations.accountId, accounts.id))
        .leftJoin(plan, eq(accounts.planId, plan.id))
        .where(eq(organizations.id, orgId))
        .limit(1)
        .then(([r]) => r);
    }

    return await db
      .select({
        organizationId: organizations.id,
        environment: apiKeys.environment,
        apiKeyId: apiKeys.id,
        plan: plan,
      })
      .from(apiKeys)
      .innerJoin(organizations, eq(apiKeys.organizationId, organizations.id))
      .innerJoin(accounts, eq(organizations.accountId, accounts.id))
      .leftJoin(plan, eq(accounts.planId, plan.id))
      .where(eq(apiKeys.token, apiKey))
      .limit(1)
      .then(([res]) => res);
  })();

  if (!context) throw new Error("Invalid Auth");

  return { ...context, entitlements: context.plan! };
};
