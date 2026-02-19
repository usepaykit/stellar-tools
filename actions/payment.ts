"use server";

import { retrieveCheckoutAndCustomer } from "@/actions/checkout";
import { putCheckout } from "@/actions/checkout";
import { EventTrigger, WebhookTrigger, withEvent } from "@/actions/event";
import { resolveOrgContext } from "@/actions/organization";
import { validateLimits } from "@/actions/plan";
import {
  Customer,
  Network,
  Payment,
  Refund,
  assets,
  checkouts,
  customers,
  db,
  payments,
  products,
  refunds,
} from "@/db";
import { JWTApi } from "@/integrations/jwt";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { generateResourceId } from "@/lib/utils";
import { ApiClient, Result } from "@stellartools/core";
import { and, desc, eq } from "drizzle-orm";

const paymentActionHandler = (call: () => Promise<Payment>, organizationId: string, environment: Network) => {
  return withEvent(
    async () => {
      const payment = await call();
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
          map: ({ amount, checkoutId, customerId, id: paymentId }) => ({ customerId, checkoutId, amount, paymentId }),
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

export const postPayment = async (
  params: Omit<Payment, "id" | "organizationId" | "environment" | "createdAt" | "updatedAt">,
  orgId?: string,
  env?: Network,
  options?: { paymentCount?: number }
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  if (options?.paymentCount) {
    await validateLimits(organizationId, environment, [
      { domain: "payments", table: payments, limit: options.paymentCount, type: "throughput" },
    ]);
  }

  return paymentActionHandler(
    async () => {
      const [payment] = await db
        .insert(payments)
        .values({ ...params, id: generateResourceId("pay", organizationId, 25), organizationId, environment })
        .returning();
      return payment;
    },
    organizationId,
    environment
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

export const retrievePaymentWithDetails = async (
  id: string,
  orgId?: string,
  env?: Network
): Promise<{ payment: Payment; customer: Customer | null; refunds: Refund[] } | null> => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [payment] = await db
    .select()
    .from(payments)
    .where(
      and(eq(payments.id, id), eq(payments.organizationId, organizationId), eq(payments.environment, environment))
    );

  if (!payment) return null;

  let customer: Customer | null = null;
  if (payment.customerId) {
    const [c] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.id, payment.customerId),
          eq(customers.organizationId, organizationId),
          eq(customers.environment, environment)
        )
      );
    customer = c ?? null;
  }

  const refundsList = await db
    .select()
    .from(refunds)
    .where(
      and(eq(refunds.paymentId, id), eq(refunds.organizationId, organizationId), eq(refunds.environment, environment))
    )
    .orderBy(desc(refunds.createdAt));

  return { payment, customer, refunds: refundsList };
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

export const putPayment = async (
  id: string,
  organizationId: string,
  environment: Network,
  params: Partial<Payment>
) => {
  return paymentActionHandler(
    async () => {
      return await db
        .update(payments)
        .set({ ...params, updatedAt: new Date() })
        .where(and(eq(payments.id, id), eq(payments.organizationId, organizationId)))
        .returning()
        .then(([payment]) => payment);
    },
    organizationId,
    environment
  );
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
    putPayment(paymentId, organizationId, environment, { status: "confirmed" });
  } else {
    putPayment(paymentId, organizationId, environment, { status: "failed" });
  }
};

export const sweepAndProcessPayment = async (checkoutId: string) => {
  const checkout = await retrieveCheckoutAndCustomer(checkoutId);

  if (!checkout || checkout.status !== "open") return checkout;

  const { organizationId, environment, initialPagingToken, merchantPublicKey, productType, customerId } = checkout;

  const stellar = new StellarCoreApi(environment);

  const result = await stellar.verifyPaymentByPagingToken(merchantPublicKey, checkoutId, initialPagingToken!);

  if (result.isErr()) throw new Error(result.error.message);

  if (!result.value) return checkout;

  const { hash, amount, successful } = result.value;

  const createSubscriptionHandler = async () => {
    if (!checkout.productId) return Result.err(new Error("Product ID is required for subscription"));

    const accessToken = await new JWTApi().sign(
      { orgId: checkout.organizationId, environment: checkout.environment },
      1 * 60 // 1 minute
    );

    const api = new ApiClient({
      baseUrl: process.env.NEXT_PUBLIC_APP_URL!,
      headers: { "x-auth-token": accessToken },
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

  if (!successful) {
    await Promise.all([
      putCheckout(checkoutId, { status: "failed" }, organizationId, environment),
      postPayment(
        { checkoutId, customerId, amount: parseInt(amount), transactionHash: hash, status: "failed" },
        organizationId,
        environment
      ),
    ]);
  }

  await Promise.all([
    putCheckout(checkoutId, { status: "completed" }, checkout.organizationId, checkout.environment),
    postPayment(
      { customerId, checkoutId, amount: parseInt(amount), transactionHash: hash, status: "confirmed" },
      organizationId,
      environment
    ),
    ...(productType === "subscription" ? [createSubscriptionHandler()] : []),
  ]);

  return checkout;
};
