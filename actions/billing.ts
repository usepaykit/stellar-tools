"use server";

import { assets, db, organizations, payments } from "@/db";
import type { AssetMetadata } from "@/db/schema";
import { PriceFeedApi } from "@/integrations/price-feed";
import { TIER_RATE_BPS, calculatePaymentFee } from "@/lib/pricing";
import { decodeFeeToken, tokenForRateBps } from "@/lib/pricing.server";
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

export async function applyPaymentFee(
  paymentId: string,
  orgId: string,
  amount: string | number, // XLM amount from Horizon (e.g. "1.0000000") or numeric units
  assetCode = "XLM",
  assetIssuer?: string | null
): Promise<void> {
  const [[assetRow], prevMonthlyUsdCents] = await Promise.all([
    db
      .select({ metadata: assets.metadata })
      .from(assets)
      .where(and(eq(assets.code, assetCode.toUpperCase()), eq(assets.issuer, assetIssuer ?? "native")))
      .limit(1),
    getPrevMonthlyVolumeUsdCents(orgId, paymentId),
  ]);

  const feed = new PriceFeedApi();
  const assetUsd = await feed.getAssetUsdPrice((assetRow?.metadata ?? {}) as AssetMetadata);
  const paymentUsd = parseFloat(String(amount)) * assetUsd;

  const { feeUsd, rateBps, newMonthlyUsd } = calculatePaymentFee(paymentUsd, prevMonthlyUsdCents / 100);

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

  const currentRateBps = decodeFeeToken(org?.feeToken);
  const isCustom = !(Object.values(TIER_RATE_BPS) as number[]).includes(currentRateBps);

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
