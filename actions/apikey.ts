"use server";

import { apiKeys, db, organizations } from "@/db";
import { eq } from "drizzle-orm";

export const resolveApiKey = async (apiKey: string) => {
  const [record] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, apiKey))
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
