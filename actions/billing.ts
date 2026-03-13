"use server";

import { db, organizations, payments } from "@/db";
import { calculatePaymentFee, stroopsToUsdCents } from "@/lib/pricing";
import { TIER_FEE_TOKENS, decodeFeeToken, tokenForRateBps } from "@/lib/pricing.server";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import moment from "moment";

async function getPrevMonthlyVolumeUsdCents(orgId: string, excludePaymentId?: string): Promise<number> {
  const rows = await db
    .select({ orgMonthlyVolumeUsd: payments.orgMonthlyVolumeUsd, id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, orgId),
        eq(payments.status, "confirmed"),
        gte(payments.createdAt, moment().startOf("month").toDate()),
        lt(payments.createdAt, moment().endOf("month").toDate())
      )
    )
    .orderBy(desc(payments.createdAt))
    .limit(excludePaymentId ? 2 : 1);

  const prev = excludePaymentId ? rows.find((r) => r.id !== excludePaymentId) : rows[0];
  return prev?.orgMonthlyVolumeUsd ?? 0;
}

export async function applyPaymentFee(paymentId: string, orgId: string, amountStroops: number): Promise<void> {
  const prevMonthlyUsdCents = await getPrevMonthlyVolumeUsdCents(orgId, paymentId);

  const { feeUsd, rateBps, newMonthlyUsd } = calculatePaymentFee(
    stroopsToUsdCents(amountStroops) / 100,
    prevMonthlyUsdCents / 100
  );

  await db
    .update(payments)
    .set({
      platformFeeUsd: Math.round(feeUsd * 100),
      orgMonthlyVolumeUsd: Math.round(newMonthlyUsd * 100),
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId));

  const newToken = tokenForRateBps(rateBps);

  const [org] = await db
    .select({ feeToken: organizations.feeToken })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const isCustom = org?.feeToken && !Object.values(TIER_FEE_TOKENS).includes(org.feeToken);

  if (!isCustom && org?.feeToken !== newToken) {
    await db
      .update(organizations)
      .set({ feeToken: newToken, updatedAt: new Date() })
      .where(eq(organizations.id, orgId));
  }
}

export async function getOrgFeeRateBps(orgId: string): Promise<number> {
  const [org] = await db
    .select({ feeToken: organizations.feeToken })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  return decodeFeeToken(org?.feeToken);
}
