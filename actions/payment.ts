"use server";

import { Network, Payment, db, payments } from "@/db";
import { Stellar } from "@/integrations/stellar";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postPayment = async (params: Partial<Payment>) => {
  const [payment] = await db
    .insert(payments)
    .values({ id: `pay_${nanoid(25)}`, ...params } as Payment)
    .returning();

  return payment;
};

export const retrievePayments = async (
  organizationId: string,
  network: Network
) => {
  return await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, organizationId),
        eq(payments.environment, network)
      )
    );
};

export const retrievePayment = async (id: string, organizationId: string) => {
  const [payment] = await db
    .select()
    .from(payments)
    .where(
      and(eq(payments.id, id), eq(payments.organizationId, organizationId))
    );

  if (!payment) throw new Error("Payment not found");

  return payment;
};

export const putPayment = async (
  id: string,
  organizationId: string,
  params: Partial<Payment>
) => {
  const [payment] = await db
    .update(payments)
    .set({ ...params, updatedAt: new Date() })
    .where(
      and(eq(payments.id, id), eq(payments.organizationId, organizationId))
    )
    .returning();

  if (!payment) throw new Error("Payment not found");

  return payment;
};

export const deletePayment = async (id: string, organizationId: string) => {
  await db
    .delete(payments)
    .where(
      and(eq(payments.id, id), eq(payments.organizationId, organizationId))
    )
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
  const stellar = new Stellar(environment);

  const txResult = await stellar.retrieveTx(transactionHash);

  if (txResult.error) throw new Error(txResult.error);

  if (txResult.data?.successful) {
    putPayment(paymentId, organizationId, { status: "confirmed" });
  } else {
    putPayment(paymentId, organizationId, { status: "failed" });
  }
};
