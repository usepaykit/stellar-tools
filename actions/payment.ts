"use server";

import { retrieveAccount } from "@/actions/account";
import { processPaymentBilling } from "@/actions/billing";
import { retrieveCheckout, retrieveCheckoutAndCustomer } from "@/actions/checkout";
import { putCheckout } from "@/actions/checkout";
import { retrieveCustomers, upsertCustomerWallet } from "@/actions/customers";
import { paginate, runAtomic, withEvent } from "@/actions/event";
import { resolveOrgContext, retrieveOrganization } from "@/actions/organization";
import { retrieveProducts } from "@/actions/product";
import { PaymentStatus } from "@/constant/schema.client";
import {
  Account,
  Checkout,
  Customer,
  Network,
  Organization,
  Payment,
  Product,
  ResolvedPayment,
  assets,
  customerWallets,
  customers,
  db,
  payments,
  refunds,
} from "@/db";
import { CustomerPaymentReceiptEmail } from "@/emails/customer-payment-receipt-email";
import { MerchantFirstPaymentConfirmedEmail } from "@/emails/merchant-first-payment-confirmed";
import { MerchantMeteredFirstPurchaseEmail } from "@/emails/merchant-metered-first-purchase";
import { MerchantSubscriptionStartedEmail } from "@/emails/merchant-subscription-started";
import { sendEmail } from "@/integrations/email";
import { verifyPaymentByPagingToken } from "@/integrations/stellar-core";
import { generateResourceId } from "@/lib/utils";
import { ApiListParams, EventTrigger, PaginatedResult, WebhookTrigger } from "@/types";
import { all } from "better-all";
import { and, count, desc, eq } from "drizzle-orm";
import moment from "moment";

type PaymentContext = {
  org: Organization;
  customer?: Customer;
  product?: Product;
  checkout?: Checkout;
  account?: Account;
};

async function loadPaymentContext(
  payment: Payment,
  organizationId: string,
  environment: Network
): Promise<PaymentContext> {
  const { org, customer, checkout, product } = await all({
    org: async () => retrieveOrganization(organizationId),
    account: async () => retrieveAccount({ organizationId }),
    customer: async () => {
      if (!payment.customerId) return undefined;
      return retrieveCustomers(
        { id: payment.customerId },
        { requireLookUpParams: true },
        organizationId,
        environment
      ).then((res) => res.data[0]);
    },
    checkout: async () => {
      if (!payment.checkoutId) return undefined;
      return retrieveCheckout(payment.checkoutId, organizationId, environment);
    },
    async product() {
      const productId = (await this.$.checkout)?.productId ?? undefined;
      if (!productId) return undefined;
      return retrieveProducts(organizationId, environment, { productId }).then((res) => res[0]?.product);
    },
  });

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

const paymentActionHandler = async (
  call: () => Promise<Payment>,
  organizationId: string,
  environment: Network,
  options?: { failErrorMessage?: string }
) => {
  return withEvent(call, async (payment) => {
    const events: EventTrigger<typeof payment>[] = [];
    const webhooks: WebhookTrigger<typeof payment>[] = [];
    const sideEffects: Promise<any>[] = [];

    const rawAmount = `${payment.amount} ${payment.metadata?.assetCode}`;

    console.log({ rawAmount });

    const basePayload = {
      id: payment.id,
      checkoutId: payment.checkoutId!,
      customerId: payment.customerId!,
      amount: rawAmount,
      status: payment.status,
      transactionHash: payment.transactionHash,
      createdAt: payment.createdAt?.toISOString(),
      metadata: payment.metadata,
    };

    if (payment.status === "confirmed") {
      // Platform Logic
      sideEffects.push(processPaymentBilling(payment.id, organizationId, environment));

      events.push({
        type: "payment::completed",
        map: (p) => ({
          customerId: p.customerId,
          subscriptionId: p.subscriptionId,
          data: {
            ...basePayload,
            subscriptionId: p.subscriptionId,
            ...(options?.failErrorMessage && { error: options.failErrorMessage }),
          },
        }),
      });
      webhooks.push({
        event: "payment.confirmed",
        map: () => ({ object: basePayload, previous_attributes: undefined }),
      });

      // Load all data once
      const ctx = await loadPaymentContext(payment, organizationId, environment);

      console.log({ ctx });

      // Customer Receipt
      if (ctx.customer?.email) {
        sideEffects.push(
          sendEmail(
            ctx.customer.email,
            "Payment Confirmed",
            CustomerPaymentReceiptEmail({
              customerName: ctx.customer.name,
              amount: rawAmount,
              reference: payment.id,
              date: moment().format("MMMM DD, YYYY [at] h:mm A"),
              organizationName: ctx.org.name,
              organizationLogo: ctx.org.logoUrl,
            })
          )
        );
      }

      // Merchant "First Payout" logic
      const paymentCount = await retrievePaymentCount(organizationId, undefined, { status: "confirmed" });
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

        if (ctx.account?.email) {
          sideEffects.push(sendEmail(ctx.account.email, subject, component));
        }
      }
    }

    if (payment.status === "failed") {
      events.push({
        type: "payment::failed",
        map: (p) => ({
          customerId: p.customerId,
          data: { ...basePayload, ...(options?.failErrorMessage && { error: options.failErrorMessage }) },
        }),
      });

      webhooks.push({ event: "payment.failed", map: () => ({ object: basePayload, previous_attributes: undefined }) });
    }

    // Fire side effects in parallel, don't block the response
    sideEffects.forEach((p) => p.catch((err) => console.error(`[Side-Effect Error]:`, err)));

    console.dir({ webhooks, events }, { depth: 100 });

    return {
      events,
      webhooks: { organizationId, environment, triggers: webhooks as WebhookTrigger<typeof payment>[] },
    };
  });
};

export const postPayment = async (
  params: Omit<Payment, "id" | "organizationId" | "environment" | "createdAt" | "updatedAt" | "customerWalletId">,
  orgId?: string,
  env?: Network,
  options?: { customerWalletAddress?: string; assetCode?: string; assetId?: string | null; failErrorMessage?: string }
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  let customerWalletId: string | null = null;

  if (params?.customerId && options?.customerWalletAddress) {
    customerWalletId = await upsertCustomerWallet(
      params.customerId,
      { walletAddress: options.customerWalletAddress },
      organizationId,
      environment
    ).then((w) => w?.id ?? null);
  }

  console.log({ customerWalletId });

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
  env?: Network,
  params?: { customerId?: string; paymentId?: string; subscriptionId?: string } & ApiListParams,
  options?: { withCustomer?: boolean; withWallets?: boolean; withRefunds?: boolean; withAsset?: boolean }
): Promise<PaginatedResult<ResolvedPayment>> => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const limit = params?.limit ?? 10;

  const rows = await db
    .select({
      payment: payments,
      ...(options?.withRefunds && { hasRefund: refunds.id }),
      ...(options?.withWallets && { wallets: customerWallets }),
      ...(options?.withRefunds && { refunds: refunds }),
      ...(options?.withCustomer && { customer: customers }),
      ...(options?.withAsset && { asset: assets }),
    })
    .from(payments)
    .leftJoin(refunds, and(eq(payments.id, refunds.paymentId), eq(refunds.status, "succeeded")))
    .leftJoin(customerWallets, eq(payments.customerWalletId, customerWallets.id))
    .leftJoin(assets, eq(payments.assetId, assets.id))
    .leftJoin(customers, eq(payments.customerId, customers.id))
    .where(
      and(
        params?.paymentId ? eq(payments.id, params.paymentId) : undefined,
        eq(payments.organizationId, organizationId),
        eq(payments.environment, environment),
        params?.customerId ? eq(payments.customerId, params.customerId) : undefined,
        params?.subscriptionId ? eq(payments.subscriptionId, params.subscriptionId) : undefined
      )
    )
    .orderBy(desc(payments.createdAt))
    .limit(limit)
    .offset(params?.starting_after ? parseInt(params.starting_after) : 0);

  return await paginate(
    rows.map(({ customer, payment, hasRefund, wallets, refunds, asset }) => ({
      ...payment,
      refunded: !!hasRefund,
      wallets,
      refunds,
      customer,
      asset,
    })),
    limit
  );
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

export const retrievePaymentCount = async (
  organizationId: string,
  customerId?: string,
  filter?: { status?: PaymentStatus; subscriptionId?: string }
) => {
  const [{ value: confirmedCount }] = await db
    .select({ value: count() })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, organizationId),
        customerId ? eq(payments.customerId, customerId) : undefined,
        filter?.status ? eq(payments.status, filter.status) : undefined,
        filter?.subscriptionId ? eq(payments.subscriptionId, filter.subscriptionId) : undefined
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

export const sweepAndProcessPayment = async (checkoutId: string) => {
  const checkout = await retrieveCheckoutAndCustomer(checkoutId);

  if (!checkout || checkout.status !== "open" || checkout.productType == "subscription") {
    return checkout;
  }

  const {
    organizationId,
    environment,
    initialPagingToken,
    merchantPublicKey,
    customerId,
    assetId,
    assetCode,
    assetIssuer,
  } = checkout;

  const result = await verifyPaymentByPagingToken(merchantPublicKey, checkoutId, initialPagingToken!, environment);

  if (result.isErr()) throw new Error(result.error.message);

  if (!result.value) return checkout;

  const { hash, amount, successful, from: payerAddress } = result.value;

  if (!successful) {
    await runAtomic(async () => {
      await putCheckout(checkoutId, { status: "failed" }, organizationId, environment);
      await postPayment(
        {
          subscriptionId: null,
          checkoutId,
          customerId,
          amount: BigInt(amount),
          transactionHash: hash,
          status: "failed",
          metadata: null,
          assetId,
        },
        organizationId,
        environment,
        { assetId, assetCode: assetCode ?? undefined, customerWalletAddress: payerAddress }
      );
    });

    return checkout;
  }

  await runAtomic(async () => {
    await putCheckout(checkoutId, { status: "completed" }, checkout.organizationId, checkout.environment).catch(
      (err) => {
        console.error("Error putting checkout", err);
      }
    );

    await postPayment(
      {
        subscriptionId: null,
        customerId,
        checkoutId,
        amount: BigInt(amount),
        transactionHash: hash,
        status: "confirmed",
        metadata: null,
        assetId,
      },
      organizationId,
      environment,
      { assetId, assetCode: assetCode ?? undefined, customerWalletAddress: payerAddress }
    );
  });

  return checkout;
};
