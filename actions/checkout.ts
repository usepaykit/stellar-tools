"use server";

import { withEvent } from "@/actions/event";
import { resolveOrgContext, retrieveOrganizationIdAndSecret } from "@/actions/organization";
import { Checkout, Network, assets, checkouts, customers, db, organizationSecrets, products } from "@/db";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { computeDiff, generateResourceId } from "@/lib/utils";
import { and, eq, sql } from "drizzle-orm";

export const postCheckout = async (
  params: Omit<Checkout, "id" | "organizationId" | "environment" | "createdAt" | "updatedAt" | "initialPagingToken">,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const { secret } = await retrieveOrganizationIdAndSecret(organizationId, environment);

  // Should have no more than 25 chars so that it fits in the memo field of the SEP-7 Pay or Tx request
  const checkoutId = generateResourceId("cz", organizationId, 20);

  const stellar = new StellarCoreApi(environment);

  const $pagingTokenResult = await stellar.getLatestPagingToken(secret?.publicKey!);

  if ($pagingTokenResult.isErr()) throw new Error($pagingTokenResult.error.message);

  const initialPagingToken = $pagingTokenResult.value;

  return withEvent(
    async () => {
      const [checkout] = await db
        .insert(checkouts)
        .values({ ...params, id: checkoutId, organizationId, environment, initialPagingToken })
        .returning();

      return checkout;
    },
    {
      events: [
        {
          type: "checkout::created",
          map: ({ productId, expiresAt, amount, customerId, id: checkoutId }) => ({
            customerId: customerId ?? undefined,
            data: { productId, expiresAt, amount, checkoutId },
          }),
        },
      ],
      webhooks: {
        organizationId,
        environment,
        triggers: [
          {
            event: "checkout.created",
            map: ({ id: checkoutId, productId, expiresAt, amount, customerId }) => ({
              checkoutId,
              productId,
              expiresAt,
              amount,
              customerId,
            }),
          },
        ],
      },
    }
  );
};

export const retrieveCheckouts = async (orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return await db
    .select()
    .from(checkouts)
    .where(and(eq(checkouts.organizationId, organizationId), eq(checkouts.environment, environment)));
};

export const retrieveCheckout = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [checkout] = await db
    .select()
    .from(checkouts)
    .where(
      and(eq(checkouts.id, id), eq(checkouts.organizationId, organizationId), eq(checkouts.environment, environment))
    );

  if (!checkout) throw new Error("Checkout not found");

  return checkout;
};

export const retrieveCheckoutAndCustomer = async (id: string) => {
  const [result] = await db
    .select({
      checkout: checkouts,
      customer: customers,
      product: {
        type: products.type,
        priceAmount: products.priceAmount,
        name: products.name,
        recurringPeriod: products.recurringPeriod,
        images: products.images,
      },
      assets: { code: assets.code, issuer: assets.issuer },
      finalAmount: sql<number>`COALESCE(${checkouts.amount}, ${products.priceAmount})`.as("final_amount"),
      merchantPublicKey: sql<string>`
      CASE 
        WHEN ${checkouts.environment} = 'testnet' THEN ${organizationSecrets.testnetPublicKey}
        ELSE ${organizationSecrets.mainnetPublicKey}
      END`.as("merchant_public_key"),
    })
    .from(checkouts)
    .leftJoin(customers, eq(checkouts.customerId, customers.id))
    .leftJoin(organizationSecrets, eq(checkouts.organizationId, organizationSecrets.organizationId))
    .leftJoin(products, eq(checkouts.productId, products.id))
    .leftJoin(assets, eq(products.assetId, assets.id))
    .where(eq(checkouts.id, id));

  const { checkout, customer, finalAmount, merchantPublicKey, product, assets: assets$1 } = result;

  return {
    ...checkout,
    merchantPublicKey,
    finalAmount,
    productType: product?.type ?? "one_time",
    productName: product?.name ?? "Payment",
    recurringPeriod: product?.recurringPeriod ?? "month",
    hasEmail: !!(customer?.email || checkout.customerEmail),
    hasPhone: !!(customer?.phone || checkout.customerPhone),
    customerEmail: customer?.email || checkout.customerEmail,
    customerPhone: customer?.phone || checkout.customerPhone,
    assetCode: assets$1?.code ?? null,
    assetIssuer: assets$1?.issuer ?? null,
    productImage: product?.images?.[0] ?? null,
  };
};

export const putCheckout = async (id: string, params: Partial<Checkout>, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const oldCheckout = await retrieveCheckout(id, organizationId, environment);

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
      events: [
        {
          type: "checkout::updated",
          map: (checkout) => ({ checkoutId: checkout.id, data: { $changes: computeDiff(oldCheckout, checkout) } }),
        },
      ],
    }
  );
};

export const deleteCheckout = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  await db
    .delete(checkouts)
    .where(
      and(eq(checkouts.id, id), eq(checkouts.organizationId, organizationId), eq(checkouts.environment, environment))
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

  const { secret } = await retrieveOrganizationIdAndSecret(result.checkout.organizationId, result.checkout.environment);

  if (!secret?.publicKey) throw new Error("Merchant wallet not configured");

  const { checkout, product, asset } = result;

  const rawAmount = product?.priceAmount ?? checkout.amount ?? 0;
  const assetCode = asset!.code!;

  // Normalize units (Stellar uses 7 decimal places)
  const amountNormalized = (rawAmount / 10_000_000).toFixed(7);

  const stellar = new StellarCoreApi(result.checkout.environment);

  const paymentUri = stellar.makeCheckoutURI({
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    id: checkout.id,
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
