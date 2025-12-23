"use server";

import { ApiKey, Network, apiKeys, db, organizations } from "@/db";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postApiKey = async (params: Partial<ApiKey>) => {
  const [apiKey] = await db
    .insert(apiKeys)
    .values({ id: `st_api_${nanoid(25)}`, ...params } as ApiKey)
    .returning();

  return apiKey;
};

export const retrieveApiKeys = async (
  organizationId: string,
  environment: Network
) => {
  return await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.organizationId, organizationId),
        eq(apiKeys.environment, environment)
      )
    );
};

export const retrieveApiKey = async (id: string, organizationId: string) => {
  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, organizationId)))
    .limit(1);

  if (!apiKey) throw new Error("Api key not found");

  return apiKey;
};

export const putApiKey = async (
  id: string,
  organizationId: string,
  retUpdate: Partial<ApiKey>
) => {
  const [apiKey] = await db
    .update(apiKeys)
    .set({ ...retUpdate, updatedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, organizationId)))
    .returning();

  if (!apiKey) throw new Error("Api key not found");

  return apiKey;
};

export const deleteApiKey = async (id: string, organizationId: string) => {
  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, organizationId)))
    .returning();

  return null;
};

export const resolveApiKey = async (apiKey: string) => {
  const [record] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.token, apiKey))
    .limit(1);

  if (!record) throw new Error("Invalid apiKey");

  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, record.organizationId))
    .limit(1);

  if (!organization) throw new Error("Invalid organization");

  return {
    organizationId: organization.id,
    environment: organization.environment,
    apiKeyId: record.id,
  };
};
