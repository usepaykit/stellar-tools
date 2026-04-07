"use server";

import { retrieveCustomerPortalSession } from "@/actions/customers";
import { resolveOrgContext, retrieveOrganization } from "@/actions/organization";
import { ApiKey, Network, apiKeys, db, organizations } from "@/db";
import { verifyJwt } from "@/integrations/jwt";
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
      id: generateResourceId("st_api", organizationId, 20),
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

export const resolveApiKeyOrAuthorizationToken$1 = async (apiKey: string, sessionToken?: string) => {
  if (sessionToken) {
    const { orgId, environment } = verifyJwt<{ orgId: string; environment: Network }>(sessionToken);

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

export const resolveApiKeyOrAuthorizationToken = async (
  apiKey?: string | null, // 1st degree
  sessionToken?: string | null, // 2nd degree
  portalToken?: string | null // 3rd degree
) => {
  if (portalToken) {
    const session = await retrieveCustomerPortalSession(portalToken);

    if (!session) throw new Error("Invalid portal token");

    return {
      organizationId: session.organizationId,
      environment: session.environment,
    };
  }

  if (sessionToken) {
    const { orgId, environment } = verifyJwt<{ orgId: string; environment: Network }>(sessionToken);

    const [row] = await db
      .select({ organizationId: organizations.id, environment: sql<Network>`${environment}` })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!row) throw new Error("Invalid Auth");

    return row;
  }

  const [row] = await db
    .select({ organizationId: organizations.id, environment: apiKeys.environment, apiKeyId: apiKeys.id })
    .from(apiKeys)
    .innerJoin(organizations, eq(apiKeys.organizationId, organizations.id))
    .where(apiKey ? eq(apiKeys.token, apiKey) : undefined)
    .limit(1);

  if (!row) throw new Error("Invalid Auth");

  return row;
};
