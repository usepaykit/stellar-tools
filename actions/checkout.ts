"use server";

import { Checkout, Network, checkouts, db } from "@/db";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postCheckout = async (params: Partial<Checkout>) => {
  const [checkout] = await db
    .insert(checkouts)
    .values({ id: `cz_${nanoid(25)}`, ...params } as Checkout)
    .returning();

  return checkout;
};

export const retrieveCheckouts = async (
  organizationId: string,
  environment: Network
) => {
  return await db
    .select()
    .from(checkouts)
    .where(
      and(
        eq(checkouts.organizationId, organizationId),
        eq(checkouts.environment, environment)
      )
    );
};

export const retrieveCheckout = async (id: string, organizationId: string) => {
  const [checkout] = await db
    .select()
    .from(checkouts)
    .where(
      and(eq(checkouts.id, id), eq(checkouts.organizationId, organizationId))
    );

  if (!checkout) throw new Error("Checkout not found");

  return checkout;
};

export const putCheckout = async (
  id: string,
  organizationId: string,
  params: Partial<Checkout>
) => {
  const [checkout] = await db
    .update(checkouts)
    .set({ ...params, updatedAt: new Date() })
    .where(
      and(eq(checkouts.id, id), eq(checkouts.organizationId, organizationId))
    )
    .returning();

  if (!checkout) throw new Error("Checkout not found");

  return checkout;
};

export const deleteCheckout = async (id: string, organizationId: string) => {
  await db
    .delete(checkouts)
    .where(
      and(eq(checkouts.id, id), eq(checkouts.organizationId, organizationId))
    )
    .returning();

  return null;
};
