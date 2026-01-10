"use server";

import { Network, Refund, refunds } from "@/db";
import { db } from "@/db";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { resolveOrgContext } from "./organization";

export const postRefund = async (
  params: Omit<Refund, "id" | "organizationId" | "environment">,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [refund] = await db
    .insert(refunds)
    .values({
      id: `rf_${nanoid(25)}`,
      organizationId,
      environment,
      ...params,
    } as Refund)
    .returning();

  if (!refund) throw new Error("Failed to create refund");

  return refund as Refund;
};

export const getRefund = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [refund] = await db
    .select()
    .from(refunds)
    .where(
      and(
        eq(refunds.id, id),
        eq(refunds.organizationId, organizationId),
        eq(refunds.environment, environment)
      )
    )
    .limit(1);

  if (!refund) throw new Error("Refund not found");

  return refund;
};

export const updateRefund = async (
  id: string,
  retUpdate: Partial<Refund>,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [refund] = await db
    .update(refunds)
    .set({ ...retUpdate, updatedAt: new Date() } as Refund)
    .where(
      and(
        eq(refunds.id, id),
        eq(refunds.organizationId, organizationId),
        eq(refunds.environment, environment)
      )
    )
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
