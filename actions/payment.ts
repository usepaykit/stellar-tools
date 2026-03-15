"use server";

import { applyPaymentFee } from "@/actions/billing";
import { retrieveCheckoutAndCustomer } from "@/actions/checkout";
import { putCheckout } from "@/actions/checkout";
import { createCustomerWallet, retrieveCustomerWallets } from "@/actions/customers";
import { EventTrigger, WebhookTrigger, withEvent } from "@/actions/event";
import { resolveOrgContext } from "@/actions/organization";
import {
  Customer,
  Network,
  Payment,
  Refund,
  ResolvedPayment,
  assets,
  customers,
  db,
  payments,
  products,
  refunds,
} from "@/db";
import { sendEmailEvent } from "@/integrations/email-handler";
import { JWTApi } from "@/integrations/jwt";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { generateResourceId } from "@/lib/utils";
import { ApiClient, Result } from "@stellartools/core";
import { and, count, desc, eq } from "drizzle-orm";

const paymentActionHandler = async (call: () => Promise<Payment>, organizationId: string, environment: Network) => {
  const payment = await withEvent(call, (payment) => {
    let events: EventTrigger<typeof payment>[] = [];
    const webhooksTriggers: WebhookTrigger<typeof payment>[] = [];

    if (payment.status == "confirmed") {
      events.push({
        type: "payment::completed",
        map: ({ checkoutId, amount, customerId, id: paymentId, metadata }) => ({
          customerId: customerId ?? undefined,
          data: {
            amount: `${amount} ${metadata?.assetCode}`,
            checkoutId,
            paymentId,
          },
        }),
      });
      webhooksTriggers.push({
        event: "payment.confirmed",
        map: ({ amount, checkoutId, customerId, id: paymentId }) => ({ customerId, checkoutId, amount, paymentId }),
      });
    }

    if (payment.status == "failed") {
      events.push({
        type: "payment::failed",
        map: ({ checkoutId, amount, customerId, id: paymentId, metadata }) => ({
          customerId: customerId ?? undefined,
          data: {
            customerId,
            amount: `${amount} ${metadata?.assetCode}`,
            checkoutId,
            paymentId,
          },
        }),
      });
      webhooksTriggers.push({
        event: "payment.failed",
        map: ({ customerId, amount, checkoutId, id: paymentId }) => ({ customerId, amount, checkoutId, paymentId }),
      });
    }

    return { events, webhooks: { organizationId, environment, triggers: webhooksTriggers } };
  });

  if (payment.status === "confirmed") {
    await applyPaymentFee(payment.id, organizationId, payment.amount);
  }

  return payment;
};

export const postPayment = async (
  params: Omit<
    Payment,
    | "id"
    | "organizationId"
    | "environment"
    | "createdAt"
    | "updatedAt"
    | "platformFeeUsd"
    | "orgMonthlyVolumeUsd"
    | "customerWalletId"
  >,
  orgId?: string,
  env?: Network,
  options?: { customerWalletAddress?: string; assetCode?: string; assetId?: string | null }
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  let customerWalletId: string | null = null;

  if (params?.customerId && options?.customerWalletAddress) {
    customerWalletId = (
      await retrieveCustomerWallets(
        params.customerId,
        { walletAddress: options.customerWalletAddress },
        organizationId,
        environment
      )
    )?.[0]?.id;
  }

  return paymentActionHandler(
    async () => {
      const [payment] = await db
        .insert(payments)
        .values({
          ...params,
          id: generateResourceId("pay", organizationId, 25),
          organizationId,
          environment,
          customerWalletId,
          assetId: options?.assetId ?? null,
          metadata: { ...(params.metadata ?? {}), assetCode: options?.assetCode },
        })
        .returning();
      return payment;
    },
    organizationId,
    environment
  );
};

export const retrievePayments = async (
  orgId?: string,
  params?: { customerId?: string },
  env?: Network
): Promise<ResolvedPayment[]> => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const rows = await db
    .select({
      payment: payments,
      hasRefund: refunds.id,
    })
    .from(payments)
    .leftJoin(refunds, and(eq(payments.id, refunds.paymentId), eq(refunds.status, "succeeded")))
    .where(
      and(
        eq(payments.organizationId, organizationId),
        eq(payments.environment, environment),
        params?.customerId ? eq(payments.customerId, params.customerId) : undefined
      )
    );

  return rows.map(({ payment, hasRefund }) => ({ ...payment, refunded: !!hasRefund }));
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
): Promise<{ payment: Payment; customer: Customer | null; refund: Refund | null } | null> => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const rows = await db
    .select({
      payment: payments,
      customer: customers,
      refund: refunds,
    })
    .from(payments)
    .leftJoin(customers, eq(payments.customerId, customers.id))
    .leftJoin(refunds, and(eq(payments.id, refunds.paymentId), eq(refunds.status, "succeeded")))
    .where(and(eq(payments.id, id), eq(payments.organizationId, organizationId), eq(payments.environment, environment)))
    .orderBy(desc(refunds.createdAt));

  if (rows.length === 0) return null;

  return {
    payment: rows[0].payment,
    customer: rows[0].customer,
    refund: rows[0].refund,
  };
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
    .leftJoin(assets, eq(payments.assetId, assets.id))
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

  const {
    organizationId,
    environment,
    initialPagingToken,
    merchantPublicKey,
    productType,
    customerId,
    assetId,
    assetCode,
    assetIssuer,
  } = checkout;

  const stellar = new StellarCoreApi(environment);

  const result = await stellar.verifyPaymentByPagingToken(merchantPublicKey, checkoutId, initialPagingToken!);

  if (result.isErr()) throw new Error(result.error.message);

  if (!result.value) return checkout;

  const { hash, amount, successful, from: payerAddress } = result.value;

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
        {
          checkoutId,
          customerId,
          amount: Number(amount),
          transactionHash: hash,
          status: "failed",
          metadata: null,
          assetId,
        },
        organizationId,
        environment,
        { assetId, assetCode: assetCode ?? undefined }
      ),
    ]);
    return checkout;
  }

  const confirmedPayment = await postPayment(
    {
      customerId,
      checkoutId,
      amount: Number(amount),
      transactionHash: hash,
      status: "confirmed",
      metadata: null,
      assetId,
    },
    organizationId,
    environment,
    { assetId, assetCode: assetCode ?? undefined }
  );

  let customerWalletId: string | null = null;

  if (customerId) {
    customerWalletId = (
      await createCustomerWallet(organizationId, environment, {
        customerId,
        address: payerAddress,
        metadata: null,
      })
    )?.id;
  }

  await Promise.all([
    putCheckout(checkoutId, { status: "completed" }, checkout.organizationId, checkout.environment),
    applyPaymentFee(
      confirmedPayment.id,
      organizationId,
      Number(amount),
      assetCode ?? "XLM",
      assetIssuer,
      customerWalletId
    ),
    ...(productType === "subscription" ? [createSubscriptionHandler()] : []),
  ]);

  dispatchPaymentEmails({ checkout, amount }).catch(() => {});

  return checkout;
};

async function dispatchPaymentEmails({
  checkout,
  amount,
}: {
  checkout: Awaited<ReturnType<typeof retrieveCheckoutAndCustomer>>;
  amount: string;
}) {
  if (!checkout) return;

  const merchantEmail = checkout.merchantEmail;
  if (!merchantEmail) return;

  const customerEmail = checkout.customerEmail ?? undefined;
  const organizationName = checkout.organizationName ?? "Merchant";
  const productName = checkout.productName ?? "Payment";
  const assetCode = checkout.assetCode ?? "XLM";
  const { customerId, organizationId, productType } = checkout;

  const eventsToSend = [];

  if (customerId) {
    const [{ value: confirmedCount }] = await db
      .select({ value: count() })
      .from(payments)
      .where(
        and(
          eq(payments.customerId, customerId),
          eq(payments.status, "confirmed"),
          eq(payments.organizationId, organizationId)
        )
      );

    if (Number(confirmedCount) === 1) {
      eventsToSend.push({
        type: "payment.first_purchase",
        payload: { merchantEmail, customerEmail, productName, amount, assetCode, organizationName },
      });
    }

    if (productType === "metered" && checkout.productId) {
      const [product] = await db
        .select({ creditsGranted: products.creditsGranted, creditExpiryDays: products.creditExpiryDays })
        .from(products)
        .where(eq(products.id, checkout.productId))
        .limit(1);

      const [{ value: meteredCount }] = await db
        .select({ value: count() })
        .from(payments)
        .where(
          and(
            eq(payments.customerId, customerId),
            eq(payments.status, "confirmed"),
            eq(payments.organizationId, organizationId),
            eq(payments.checkoutId, checkout.id ?? "")
          )
        );

      if (Number(meteredCount) === 1 && product?.creditsGranted) {
        eventsToSend.push({
          type: "metered.first_purchase",
          payload: {
            merchantEmail,
            customerEmail,
            productName,
            organizationName,
            creditsGranted: product.creditsGranted,
            creditExpiryDays: product.creditExpiryDays ?? 30,
          },
        });
      }
    }
  }

  if (productType === "subscription" && checkout.subscriptionData) {
    const sd = checkout.subscriptionData;
    eventsToSend.push({
      type: "subscription.started",
      payload: {
        merchantEmail,
        customerEmail,
        productName,
        amount,
        assetCode,
        organizationName,
        currentPeriodEnd: sd.periodEnd ? new Date(sd.periodEnd).toLocaleDateString() : "—",
      },
    });
  }

  await Promise.allSettled(eventsToSend.map((e) => sendEmailEvent(e)));
}
