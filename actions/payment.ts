"use server";

import { retrieveCheckout } from "@/actions/checkout";
import { putCheckout } from "@/actions/checkout";
import { EventTrigger, WebhookTrigger, withEvent } from "@/actions/event";
import { resolveOrgContext } from "@/actions/organization";
import { ProductType } from "@/constant/schema.client";
import { Network, Payment, assets, checkouts, customers, db, payments, products, refunds } from "@/db";
import { JWT } from "@/integrations/jwt";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { generateResourceId } from "@/lib/utils";
import { ApiClient, Result } from "@stellartools/core";
import { and, desc, eq } from "drizzle-orm";

export const postPayment = async (
  params: Omit<Payment, "id" | "organizationId" | "environment" | "createdAt" | "updatedAt">,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return withEvent(
    async () => {
      const [payment] = await db
        .insert(payments)
        .values({ ...params, id: generateResourceId("pay", organizationId, 40), organizationId, environment })
        .returning();
      return payment;
    },
    (payment) => {
      let events: EventTrigger<typeof payment>[] = [];
      const webhooksTriggers: WebhookTrigger<typeof payment>[] = [];

      if (payment.status == "confirmed") {
        events.push({
          type: "payment::completed",
          map: ({ checkoutId, amount, customerId, id: paymentId }) => {
            return {
              customerId: customerId ?? undefined,
              data: { amount, checkoutId, paymentId },
            };
          },
        });
        webhooksTriggers.push({
          event: "payment.confirmed",
          map: ({ amount, checkoutId, id: paymentId }) => ({ checkoutId, amount, paymentId }),
        });
      }

      if (payment.status == "failed") {
        events.push({
          type: "payment::failed",
          map: ({ checkoutId, amount, customerId, id: paymentId }) => ({
            customerId: customerId ?? undefined,
            data: { customerId, amount, checkoutId, paymentId },
          }),
        });
        webhooksTriggers.push({
          event: "payment.failed",
          map: ({ customerId, amount, checkoutId, id: paymentId }) => ({ customerId, amount, checkoutId, paymentId }),
        });
      }

      return { events, webhooks: { organizationId, environment, triggers: webhooksTriggers } };
    }
  );
};

export const retrievePayments = async (orgId?: string, params?: { customerId?: string }, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const conditions = [eq(payments.organizationId, organizationId), eq(payments.environment, environment)];

  if (params?.customerId) {
    conditions.push(eq(payments.customerId, params.customerId));
  }

  return await db
    .select()
    .from(payments)
    .where(and(...conditions));
};

export const retrievePayment = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [payment] = await db
    .select()
    .from(payments)
    .where(
      and(eq(payments.id, id), eq(payments.organizationId, organizationId), eq(payments.environment, environment))
    );

  if (!payment) throw new Error("Payment not found");

  return payment;
};

export const retrievePaymentsWithDetails = async (orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const result = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      transactionHash: payments.transactionHash,
      status: payments.status,
      createdAt: payments.createdAt,
      checkoutId: payments.checkoutId,
      customerEmail: customers.email,
      assetCode: assets.code,
      refundStatus: refunds.status,
      refundedAt: refunds.createdAt,
    })
    .from(payments)
    .leftJoin(customers, eq(payments.customerId, customers.id))
    .leftJoin(checkouts, eq(payments.checkoutId, checkouts.id))
    .leftJoin(products, eq(checkouts.productId, products.id))
    .leftJoin(assets, eq(products.assetId, assets.id))
    .leftJoin(refunds, eq(payments.id, refunds.paymentId))
    .where(and(eq(payments.organizationId, organizationId), eq(payments.environment, environment)))
    .orderBy(desc(payments.createdAt));

  return result;
};

export const putPayment = async (id: string, organizationId: string, params: Partial<Payment>) => {
  const [payment] = await db
    .update(payments)
    .set({ ...params, updatedAt: new Date() })
    .where(and(eq(payments.id, id), eq(payments.organizationId, organizationId)))
    .returning();

  if (!payment) throw new Error("Payment not found");

  return payment;
};

export const deletePayment = async (id: string, organizationId: string) => {
  await db
    .delete(payments)
    .where(and(eq(payments.id, id), eq(payments.organizationId, organizationId)))
    .returning();

  return null;
};

// STELLAR

export const refreshTxStatus = async (
  paymentId: string,
  transactionHash: string,
  organizationId: string,
  environment: Network
): Promise<void> => {
  const stellar = new StellarCoreApi(environment);

  const txResult = await stellar.retrieveTx(transactionHash);

  if (txResult.isErr()) throw new Error(txResult.error?.message);

  if (txResult.value?.successful) {
    putPayment(paymentId, organizationId, { status: "confirmed" });
  } else {
    putPayment(paymentId, organizationId, { status: "failed" });
  }
};

export async function verifyAndProcessPayment(
  txHash: string,
  checkoutId: string,
  environment: Network,
  organizationId: string,
  productType: ProductType
) {
  const stellar = new StellarCoreApi(environment);

  const tx = await stellar.retrieveTx(txHash);
  if (tx.isErr()) throw new Error(tx.error?.message);

  const [checkout, paymentOp] = await Promise.all([
    retrieveCheckout(checkoutId),
    stellar.retrievePayment(txHash).then((result) => result.value?.records.find((op) => op.type_i === 1)),
  ]);

  if (!checkout) throw new Error("Checkout record lost");

  if (!paymentOp) throw new Error("Payment operation not found in transaction");

  const amountInStroops = parseInt(paymentOp.amount || "0");

  if (!tx.value?.successful) {
    await Promise.all([
      putCheckout(checkoutId, { status: "failed" }, organizationId, environment),
      postPayment(
        {
          checkoutId,
          customerId: checkout.customerId ?? null,
          amount: amountInStroops,
          transactionHash: txHash,
          status: "failed",
        },
        organizationId,
        environment
      ),
    ]);
  }

  const createSubscriptionHandler = async () => {
    if (!checkout.productId) return Result.err(new Error("Product ID is required for subscription"));

    const accessToken = await new JWT().sign({ orgId: organizationId, environment }, 5 * 60);

    const api = new ApiClient({
      baseUrl: process.env.NEXT_PUBLIC_APP_URL!,
      headers: { "x-session-token": accessToken },
    });

    const period =
      checkout.subscriptionData &&
      "periodStart" in checkout.subscriptionData &&
      "periodEnd" in checkout.subscriptionData
        ? {
            from: new Date(checkout.subscriptionData.periodStart),
            to: new Date(checkout.subscriptionData.periodEnd),
          }
        : null;

    if (!period) return Result.err(new Error("Period is required for subscription"));

    const result = await api.post<{ id: string; success: boolean }>("/api/subscriptions", {
      body: JSON.stringify({
        customerIds: [checkout.customerId],
        productId: checkout.productId,
        period,
        cancelAtPeriodEnd: checkout.subscriptionData?.cancelAtPeriodEnd ?? false,
      }),
    });

    return Result.ok(result);
  };

  return await Promise.all([
    putCheckout(checkoutId, { status: "completed" }),
    postPayment({
      customerId: checkout.customerId,
      checkoutId,
      amount: amountInStroops,
      transactionHash: txHash,
      status: "confirmed",
    }),
    ...(productType === "subscription" ? [createSubscriptionHandler()] : []),
  ]);
}
