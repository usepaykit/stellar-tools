"use server";

import { ApiKey, Network, apiKeys, db, organizations } from "@/db";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { resolveOrgContext } from "./organization";

export const postApiKey = async (
  params: Omit<ApiKey, "id" | "organizationId" | "environment">
) => {
  const { organizationId, environment } = await resolveOrgContext();

  const [apiKey] = await db
    .insert(apiKeys)
    .values({
      ...params,
      id: `st_api_${nanoid(25)}`,
      organizationId,
      environment,
    } as ApiKey)
    .returning();

  return apiKey;
};

export const retrieveApiKeys = async (orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

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

export const retrieveApiKey = async (
  id: string,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.id, id),
        eq(apiKeys.organizationId, organizationId),
        eq(apiKeys.environment, environment)
      )
    )
    .limit(1);

  if (!apiKey) throw new Error("Api key not found");

  return apiKey;
};

export const putApiKey = async (
  id: string,
  retUpdate: Partial<ApiKey>,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [apiKey] = await db
    .update(apiKeys)
    .set({ ...retUpdate, updatedAt: new Date() })
    .where(
      and(
        eq(apiKeys.id, id),
        eq(apiKeys.organizationId, organizationId),
        eq(apiKeys.environment, environment)
      )
    )
    .returning();

  if (!apiKey) throw new Error("Api key not found");

  return apiKey;
};

export const deleteApiKey = async (
  id: string,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  await db
    .delete(apiKeys)
    .where(
      and(
        eq(apiKeys.id, id),
        eq(apiKeys.organizationId, organizationId),
        eq(apiKeys.environment, environment)
      )
    )
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
    environment: record.environment,
    apiKeyId: record.id,
  };
};
