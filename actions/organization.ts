"use server";

import { Network, Organization, db, organizations } from "@/db";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postOrganization = async (params: Partial<Organization>) => {
  const [organization] = await db
    .insert(organizations)
    .values({ id: `org_${nanoid(25)}`, ...params } as Organization)
    .returning();

  return organization;
};

export const retrieveOrganizations = async (
  accountId: string,
  environment: Network
) => {
  return await db
    .select()
    .from(organizations)
    .where(
      and(
        eq(organizations.accountId, accountId),
        eq(organizations.environment, environment)
      )
    );
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

export const retrieveOrganizationBySlug = async (slug: string) => {
  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
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


