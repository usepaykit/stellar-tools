"use server";

import { withEvent } from "@/actions/event";
import { resolveOrgContext } from "@/actions/organization";
import { Checkout, Network, checkouts, db } from "@/db";
import { computeDiff } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postCheckout = async (
  params: Omit<Checkout, "id" | "organizationId" | "environment">,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const checkoutId = `cz_${nanoid(25)}`;

  return withEvent(
    async () => {
      const [checkout] = await db
        .insert(checkouts)
        .values({ id: checkoutId, organizationId, environment, ...params })
        .returning();

      return checkout;
    },
    {
      type: "checkout::created",
      map: ({ productId, expiresAt, amount }) => ({
        checkoutId,
        data: { productId, expiresAt, amount },
      }),
    }
  );
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

  const oldCheckout = await retrieveCheckout(id, orgId, env);

  return withEvent(
    async () => {
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
    },
    {
      type: "checkout::updated",
      map: (newCheckout) => ({
        checkoutId: newCheckout.id,
        data: { $changes: computeDiff(oldCheckout, newCheckout) },
      }),
    }
  );
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
