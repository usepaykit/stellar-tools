"use server";

import { Network, Payment, assets, checkouts, customers, db, payments, products, refunds } from "@/db";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { and, desc, eq } from "drizzle-orm";

import { resolveOrgContext } from "./organization";

export const postPayment = async (
  params: Omit<Payment, "organizationId" | "environment">,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [payment] = await db
    .insert(payments)
    .values({ ...params, organizationId, environment })
    .returning();

  return payment;
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
