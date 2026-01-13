"use server";

import { Checkout, Network, checkouts, db } from "@/db";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { resolveOrgContext } from "./organization";

export const postCheckout = async (
  params: Omit<Checkout, "id" | "organizationId" | "environment">,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [checkout] = await db
    .insert(checkouts)
    .values({ id: `cz_${nanoid(25)}`, organizationId, environment, ...params })
    .returning();

  return checkout;
};

export const retrieveCheckouts = async (orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return await db
    .select()
    .from(checkouts)
    .where(
      and(eq(checkouts.organizationId, organizationId), eq(checkouts.environment, environment))
    );
};

export const retrieveCheckout = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [checkout] = await db
    .select()
    .from(checkouts)
    .where(
      and(
        eq(checkouts.id, id),
        eq(checkouts.organizationId, organizationId),
        eq(checkouts.environment, environment)
      )
    );

  if (!checkout) throw new Error("Checkout not found");

  return checkout;
};

export const putCheckout = async (
  id: string,
  params: Partial<Checkout>,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [checkout] = await db
    .update(checkouts)
    .set({ ...params, updatedAt: new Date() })
    .where(
      and(
        eq(checkouts.id, id),
        eq(checkouts.organizationId, organizationId),
        eq(checkouts.environment, environment)
      )
    )
    .returning();

  if (!checkout) throw new Error("Checkout not found");

  return checkout;
};

export const deleteCheckout = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  await db
    .delete(checkouts)
    .where(
      and(
        eq(checkouts.id, id),
        eq(checkouts.organizationId, organizationId),
        eq(checkouts.environment, environment)
      )
    )
    .returning();

  return null;
};
