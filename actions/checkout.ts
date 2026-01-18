"use server";

import { withEvent } from "@/actions/event";
import { resolveOrgContext, retrieveOrganizationIdAndSecret } from "@/actions/organization";
import { Checkout, Network, assets, checkouts, db, products } from "@/db";
import { StellarCoreApi } from "@/integrations/stellar-core";
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
    },
    {
      events: ["checkout.created"],
      organizationId,
      environment,
      payload: ({ updatedAt: _$, organizationId: _$1, ...checkoutWithoutOrg }) => ({
        ...checkoutWithoutOrg,
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

// -- CHECKOUT INTERNALS --

export async function getCheckoutPaymentDetails(id: string, orgId?: string, env?: Network) {
  const whereClause = and(
    eq(checkouts.id, id),
    ...(orgId ? [eq(checkouts.organizationId, orgId)] : []),
    ...(env ? [eq(checkouts.environment, env)] : [])
  );

  const [result] = await db
    .select({
      checkout: checkouts,
      product: products,
      asset: assets,
    })
    .from(checkouts)
    .leftJoin(products, eq(checkouts.productId, products.id))
    .leftJoin(assets, eq(products.assetId, assets.id))
    .where(whereClause)

    .limit(1);

  if (!result) throw new Error("Checkout not found");

  const { secret } = await retrieveOrganizationIdAndSecret(
    result.checkout.organizationId,
    result.checkout.environment
  );

  if (!secret?.publicKey) throw new Error("Merchant wallet not configured");

  const { checkout, product, asset } = result;

  const rawAmount = product?.priceAmount ?? checkout.amount ?? 0;
  const assetCode = asset?.code ?? "XLM";

  // Normalize units (Stellar uses 7 decimal places)
  const amountNormalized = (rawAmount / 10_000_000).toFixed(7);

  const stellar = new StellarCoreApi(result.checkout.environment);

  const paymentUri = stellar.makePaymentURI({
    destination: secret.publicKey,
    amount: amountNormalized,
    assetCode: assetCode === "XLM" ? undefined : assetCode,
    assetIssuer: asset?.issuer ?? undefined,
    memo: checkout.id,
    callback: checkout.successUrl ?? undefined,
  });

  return {
    id: checkout.id,
    merchantAddress: secret.publicKey,
    amount: rawAmount, // Stroops
    amountFormatted: amountNormalized, // Lumens
    assetCode,
    paymentUri,
    expiresAt: checkout.expiresAt,
  };
}
