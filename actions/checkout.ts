"use server";

import { retrieveAssets } from "@/actions/asset";
import { withEvent } from "@/actions/event";
import { resolveOrgContext, retrieveOrganizationIdAndSecret } from "@/actions/organization";
import {
  Checkout,
  Network,
  Product,
  accounts,
  assets,
  checkouts,
  customers,
  db,
  organizationSecrets,
  organizations,
  products,
} from "@/db";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { computeDiff, generateResourceId } from "@/lib/utils";
import { CheckoutStatus } from "@/packages/stellartools/dist/schema/checkout";
import { and, eq, or, sql } from "drizzle-orm";

export const postCheckout = async (
  params: Omit<Checkout, "id" | "organizationId" | "environment" | "createdAt" | "updatedAt" | "initialPagingToken">,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const { secret } = await retrieveOrganizationIdAndSecret(organizationId, environment);

  /**
   * Should have no more than 25 chars
   * So that it fits in the memo field of the SEP-7 Pay or Tx request
   */
  const checkoutId = generateResourceId("cz", organizationId, 20);

  const stellar = new StellarCoreApi(environment);

  const $pagingTokenResult = await stellar.getLatestPagingToken(secret?.publicKey!);

  if ($pagingTokenResult.isErr()) throw new Error($pagingTokenResult.error.message);

  const initialPagingToken = $pagingTokenResult.value;

  if (params.assetCode) {
    const assetsList = await retrieveAssets(null, environment);

    const asset = assetsList.find((asset) => asset.code === params.assetCode);

    if (!asset) {
      throw new Error(
        `Invalid asset code, Only ${assetsList.map((a) => a.code).join(", ")} are supported. Got ${params.assetCode}`
      );
    }

    params.assetCode = asset.code;
  }

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

export const retrieveCheckouts = async (
  orgId?: string,
  env?: Network,
  parameters?: { status?: CheckoutStatus },
  overrideOrganizationContext?: boolean,
  options?: { withProduct?: boolean }
): Promise<{ checkout: Checkout; product?: Product }[]> => {
  if (overrideOrganizationContext) {
    return await db
      .select({
        checkout: checkouts,
      })
      .from(checkouts)
      .where(and(...(parameters?.status ? [eq(checkouts.status, parameters.status)] : [])));
  }

  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return await db
    .select({
      checkout: checkouts,
      product: products,
    })
    .from(checkouts)
    .where(
      and(
        eq(checkouts.organizationId, organizationId),
        eq(checkouts.environment, environment),
        ...(parameters?.status ? [eq(checkouts.status, parameters.status)] : []),
        ...(options?.withProduct ? [eq(checkouts.productId, products.id)] : [])
      )
    );
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
      assets: { id: assets.id, code: assets.code, issuer: assets.issuer },
      finalAmount: sql<number>`COALESCE(${checkouts.amount}, ${products.priceAmount})`.as("final_amount"),
      merchantPublicKey: sql<string>`
      CASE 
        WHEN ${checkouts.environment} = 'testnet' THEN ${organizationSecrets.testnetPublicKey}
        ELSE ${organizationSecrets.mainnetPublicKey}
      END`.as("merchant_public_key"),
      organizationName: organizations.name,
      organizationLogo: organizations.logoUrl,
      merchantEmail: accounts.email,
    })
    .from(checkouts)
    .leftJoin(customers, eq(checkouts.customerId, customers.id))
    .leftJoin(organizationSecrets, eq(checkouts.organizationId, organizationSecrets.organizationId))
    .leftJoin(products, eq(checkouts.productId, products.id))
    .leftJoin(assets, or(eq(products.assetId, assets.id), eq(checkouts.assetCode, assets.id)))
    .leftJoin(organizations, eq(checkouts.organizationId, organizations.id))
    .leftJoin(accounts, eq(organizations.accountId, accounts.id))
    .where(eq(checkouts.id, id));

  const {
    checkout,
    customer,
    finalAmount,
    merchantPublicKey,
    product,
    assets: assets$1,
    organizationName,
    organizationLogo,
    merchantEmail,
  } = result;

  if (!assets$1) throw new Error(`Asset not found, Checkout must be associated with an asset`);

  return {
    ...checkout,
    merchantPublicKey,
    finalAmount,
    productType: product?.type ?? "one_time",
    productName: product?.name ?? "Payment",
    recurringPeriod: product?.recurringPeriod ?? "month",
    customerEmail: customer?.email || checkout.customerEmail,
    customerPhone: customer?.phone || checkout.customerPhone,
    assetId: assets$1.id,
    assetCode: assets$1.code,
    assetIssuer: assets$1.issuer,
    productImage: product?.images?.[0] ?? null,
    customerImage: customer?.image ?? null,
    organizationName,
    organizationLogo,
    merchantEmail,
  };
};

export const putCheckout = async (id: string, params: Partial<Checkout>, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const oldCheckout = await retrieveCheckout(id, organizationId, environment);

  return withEvent(
    async () => {
      return await db
        .update(checkouts)
        .set({ ...params, updatedAt: new Date() })
        .where(
          and(
            eq(checkouts.id, id),
            eq(checkouts.organizationId, organizationId),
            eq(checkouts.environment, environment)
          )
        )
        .returning()
        .then(([checkout]) => checkout);
    },
    {
      events: [
        {
          type: "checkout::updated",
          map: (checkout) => ({
            checkoutId: checkout.id,
            data: { $changes: computeDiff(oldCheckout, checkout, undefined, ".") },
          }),
        },
      ],
      webhooks: { organizationId, environment, triggers: [] },
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

  const stellar = new StellarCoreApi(result.checkout.environment);

  // Build XDR with a placeholder source account. The wallet will substitute its own
  // address via the `replace=` parameter (SEP-007). We use a known funded testnet
  // account as placeholder just to get a valid sequence number for XDR construction.
  const PLACEHOLDER_SOURCE = "GA5OJOBKLD4MJEZ6SE7FCNDXKHUQAEOKPDXAZTURGNTXL6BJHPMIC6BW";
  const xdrResult = await stellar.buildPaymentXDR({
    customerAddress: PLACEHOLDER_SOURCE,
    merchantAddress: secret.publicKey,
    amount: rawAmount,
    memo: checkout.id,
    network: result.checkout.environment,
    assetCode,
    assetIssuer: asset?.issuer ?? null,
    checkoutExpiresAt: checkout.expiresAt,
  });

  if (xdrResult.isErr()) throw xdrResult.error;

  const networkPassphrase = stellar.getNetworkPassphrase(result.checkout.environment);

  // web+stellar:tx per SEP-007. No callback: wallet signs and submits to the network directly (fewer round trips).
  const paymentUri =
    `web+stellar:tx` +
    `?xdr=${encodeURIComponent(xdrResult.value)}` +
    `&replace=tx.sourceAccount%3AX%3BX%3Apayer+account` +
    `&network_passphrase=${encodeURIComponent(networkPassphrase)}` +
    `&msg=${encodeURIComponent("Pay " + rawAmount + " " + assetCode)}`;

  return {
    id: checkout.id,
    merchantAddress: secret.publicKey,
    amount: rawAmount, // Stroops
    assetCode,
    paymentUri,
    expiresAt: checkout.expiresAt,
  };
}
