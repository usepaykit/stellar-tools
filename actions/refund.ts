"use server";

import { Refund, refunds } from "@/db";
import { db } from "@/db";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postRefund = async (params: Partial<Refund>) => {
  const [refund] = await db
    .insert(refunds)
    .values({ id: `rf_${nanoid(25)}`, ...params } as Refund)
    .returning();

  if (!refund) throw new Error("Failed to create refund");

  return refund as Refund;
};

export const getRefund = async (id: string, organizationId: string) => {
  const [refund] = await db
    .select()
    .from(refunds)
    .where(and(eq(refunds.id, id), eq(refunds.organizationId, organizationId)))
    .limit(1);

  if (!refund) throw new Error("Refund not found");

  return refund;
};

export const updateRefund = async (
  id: string,
  organizationId: string,
  params: Partial<Refund>
) => {
  const [refund] = await db
    .update(refunds)
    .set({ ...params, updatedAt: new Date() } as Refund)
    .where(and(eq(refunds.id, id), eq(refunds.organizationId, organizationId)))
    .returning();

  if (!refund) throw new Error("Failed to update refund");

  return refund as Refund;
};

export const deleteRefund = async (id: string, organizationId: string) => {
  await db
    .delete(refunds)
    .where(and(eq(refunds.id, id), eq(refunds.organizationId, organizationId)))
    .returning();

  return null;
};

export const getRefunds = async (organizationId: string) => {
  const refundsList = await db
    .select()
    .from(refunds)
    .where(eq(refunds.organizationId, organizationId))
    .orderBy(desc(refunds.createdAt));

  if (!refundsList) throw new Error("Failed to get refunds");

  return refundsList;
};
