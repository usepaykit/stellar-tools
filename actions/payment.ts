"use server";

import { applyPaymentFee } from "@/actions/billing";
import { retrieveCheckout, retrieveCheckoutAndCustomer } from "@/actions/checkout";
import { putCheckout } from "@/actions/checkout";
import { createCustomerWallet, retrieveCustomerWallets, retrieveCustomers } from "@/actions/customers";
import { EventTrigger, WebhookTrigger, withEvent } from "@/actions/event";
import { resolveOrgContext, retrieveOrganization } from "@/actions/organization";
import { retrieveProducts } from "@/actions/product";
import {
  Checkout,
  Customer,
  Network,
  Organization,
  Payment,
  Product,
  Refund,
  ResolvedPayment,
  assets,
  customers,
  db,
  payments,
  refunds,
} from "@/db";
import { CustomerPaymentReceiptEmail } from "@/emails/customer-payment-receipt-email";
import { MerchantFirstPaymentConfirmedEmail } from "@/emails/merchant-first-payment-confirmed";
import { MerchantMeteredFirstPurchaseEmail } from "@/emails/merchant-metered-first-purchase";
import { MerchantSubscriptionStartedEmail } from "@/emails/merchant-subscription-started";
import { EmailApi } from "@/integrations/email";
import { JWTApi } from "@/integrations/jwt";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { generateResourceId } from "@/lib/utils";
import { ApiClient, Result } from "@stellartools/core";
import { and, count, desc, eq } from "drizzle-orm";
import moment from "moment";

type PaymentContext = {
  org: Organization;
  customer?: Customer;
  product?: Product;
  checkout?: Checkout;
};

async function loadPaymentContext(
  payment: Payment,
  organizationId: string,
  environment: Network
): Promise<PaymentContext> {
  const [org, customer, checkout] = await Promise.all([
    retrieveOrganization(organizationId),
    payment.customerId
      ? retrieveCustomers({ id: payment.customerId }, undefined, organizationId, environment).then((res) => res[0])
      : undefined,
    payment.checkoutId ? retrieveCheckout(payment.checkoutId) : undefined,
  ]);

  const product = checkout?.productId
    ? await retrieveProducts(organizationId, environment, checkout.productId).then((res) => res[0]?.product)
    : undefined;

  return { org, customer, product, checkout };
}

const MERCHANT_EMAIL_TEMPLATES = {
  one_time: (ctx: Required<PaymentContext>, p: Payment) => ({
    subject: "Whops! You just got paid 💸",
    component: MerchantFirstPaymentConfirmedEmail({
      organizationName: ctx.org.name,
      organizationLogo: ctx.org.logoUrl,
      productName: ctx.product.name || ctx.checkout.description || "Payment",
      amount: `${p.amount} ${p.metadata?.assetCode}`,
      assetCode: p.metadata?.assetCode as string,
      transactionHash: p.transactionHash,
    }),
  }),
  metered: (ctx: Required<PaymentContext>, _: Payment) => ({
    subject: "Whops! You just got a new metered sale 💸",
    component: MerchantMeteredFirstPurchaseEmail({
      organizationName: ctx.org.name,
      organizationLogo: ctx.org.logoUrl,
      productName: ctx.product.name || ctx.checkout.description || "Payment",
      creditsGranted: ctx.product.creditsGranted ?? 0,
      creditExpiryDays: ctx.product.creditExpiryDays ?? 30,
      customerEmail: ctx.customer.email ?? ctx.checkout.customerEmail ?? undefined,
    }),
  }),
  subscription: (ctx: Required<PaymentContext>, p: Payment) => ({
    subject: "Whops! You just got a new subscription 🎉",
    component: MerchantSubscriptionStartedEmail({
      organizationName: ctx.org.name,
      organizationLogo: ctx.org.logoUrl,
      amount: `${p.amount} ${p.metadata?.assetCode}`,
      assetCode: p.metadata?.assetCode as string,
      currentPeriodEnd: moment(ctx.checkout.subscriptionData?.periodEnd).format("MMMM DD, YYYY [at] h:mm A"),
      productName: ctx.product.name || ctx.checkout.description || "Payment",
    }),
  }),
};

const paymentActionHandler = async (call: () => Promise<Payment>, organizationId: string, environment: Network) => {
  return withEvent(call, async (payment) => {
    const events: EventTrigger<typeof payment>[] = [];
    const webhooks: WebhookTrigger<typeof payment>[] = [];
    const sideEffects: Promise<any>[] = [];

    const assetLabel = `${payment.amount} ${payment.metadata?.assetCode}`;
    const basePayload = {
      customerId: payment.customerId,
      checkoutId: payment.checkoutId,
      amount: payment.amount,
      paymentId: payment.id,
      subscriptionId: payment.subscriptionId,
    };

    if (payment.status === "confirmed") {
      // Platform Logic
      sideEffects.push(applyPaymentFee(payment.id, organizationId, payment.amount));

      events.push({
        type: "payment::completed",
        map: (p) => ({ customerId: p.customerId, data: { ...basePayload, amount: assetLabel } }),
      });
      webhooks.push({ event: "payment.confirmed", map: () => basePayload });

      // Load all data once
      const ctx = await loadPaymentContext(payment, organizationId, environment);
      const emailApi = new EmailApi();

      // Customer Receipt
      if (ctx.customer?.email) {
        sideEffects.push(
          emailApi.sendEmail(
            ctx.customer.email,
            "Payment Confirmed",
            CustomerPaymentReceiptEmail({
              customerName: ctx.customer.name,
              amount: assetLabel,
              reference: payment.id,
              date: moment().format("MMMM DD, YYYY [at] h:mm A"),
              organizationName: ctx.org.name,
              organizationLogo: ctx.org.logoUrl,
            })
          )
        );
      }

      // Merchant "First Payout" logic
      const paymentCount = await retrievePaymentCount(organizationId);
      if (
        paymentCount === 1 &&
        ctx.org.supportEmail &&
        ctx.product &&
        ctx.checkout &&
        MERCHANT_EMAIL_TEMPLATES[ctx.product.type]
      ) {
        const { subject, component } = MERCHANT_EMAIL_TEMPLATES[ctx.product.type](
          ctx as Required<PaymentContext>,
          payment
        );
        sideEffects.push(emailApi.sendEmail(ctx.org.supportEmail, subject, component));
      }
    }

    if (payment.status === "failed") {
      events.push({
        type: "payment::failed",
        map: (p) => ({ customerId: p.customerId, data: { ...basePayload, amount: assetLabel } }),
      });

      webhooks.push({ event: "payment.failed", map: () => basePayload });
    }

    // Fire side effects in parallel, don't block the response
    sideEffects.forEach((p) => p.catch((err) => console.error(`[Side-Effect Error]:`, err)));

    return { events, webhooks: { organizationId, environment, triggers: webhooks } };
  });
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

export const retrievePaymentCount = async (organizationId: string, customerId?: string) => {
  const [{ value: confirmedCount }] = await db
    .select({ value: count() })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, organizationId),
        customerId ? eq(payments.customerId, customerId) : undefined,
        eq(payments.status, "confirmed")
      )
    );

  return Number(confirmedCount);
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
          subscriptionId: null,
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
      subscriptionId: null,
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

  return checkout;
};
