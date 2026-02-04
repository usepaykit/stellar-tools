"use server";

import { resolveOrgContext, retrieveOrganization } from "@/actions/organization";
import { ApiKey, Network, apiKeys, db } from "@/db";
import { JWT } from "@/integrations/jwt";
import { generateResourceId } from "@/lib/utils";
import { and, eq } from "drizzle-orm";

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

export const resolveApiKeyOrSessionToken = async (apiKey: string, sessionToken?: string) => {
  if (sessionToken) {
    const { orgId, environment } = (await new JWT().verify(sessionToken)) as {
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
