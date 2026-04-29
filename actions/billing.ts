"use server";

import { Network, charges, db, payments } from "@/db";
import { decrypt } from "@/integrations/encryption";
import { getAssetUsdPrice } from "@/integrations/price-feed";
import { sendAssetPayment } from "@/integrations/stellar-core";
import { BPS_DENOMINATOR, FREE_THRESHOLD_USD, TIER_RATE_BPS } from "@/lib/pricing";
import { generateResourceId } from "@/lib/utils";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import moment from "moment";

import { retrieveOrganizationIdAndSecret } from "./organization";
import { retrievePayments } from "./payment";

const getVolumeTierRateBps = async (monthlyVolumeUsd: number): Promise<number> => {
  if (monthlyVolumeUsd <= 10_000) return TIER_RATE_BPS.FREE;
  if (monthlyVolumeUsd <= 1_000_000) return TIER_RATE_BPS.STANDARD;
  if (monthlyVolumeUsd <= 5_000_000) return TIER_RATE_BPS.GROWTH;
  return TIER_RATE_BPS.SCALE;
};

async function getMonthlyVolumeCents(orgId: string): Promise<number> {
  const startOfMonth = moment().startOf("month").toDate();
  const endOfMonth = moment().endOf("month").toDate();

  const [res] = await db
    .select({ total: sql<number>`sum(amount_usd_at_time)::bigint` })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, orgId),
        eq(payments.status, "confirmed"),
        gte(payments.createdAt, startOfMonth),
        lt(payments.createdAt, endOfMonth)
      )
    );
  return Number(res?.total ?? 0);
}

export async function processPaymentBilling(paymentId: string, organizationId: string, environment: Network) {
  console.log("Processing payment billing for payment", paymentId);

  const [payment, secret] = await Promise.all([
    retrievePayments(undefined, undefined, { paymentId, limit: 1 }, { withAsset: true }).then((res) => res.data[0]),
    retrieveOrganizationIdAndSecret(organizationId, environment).then((res) => res.secret),
  ]);

  if (!payment || payment.status !== "confirmed") return;

  if (!secret || !payment || !payment.asset) {
    throw new Error(`One of secret, payment, or asset is missing for payment ${paymentId}`);
  }

  // 1. Convert Payment to USD Cents
  const assetPrice = await getAssetUsdPrice(payment.asset.metadata ?? {});
  const paymentValueCents = Math.round((Number(payment.amount) / 1e7) * assetPrice * 100);

  console.log("Payment value cents", paymentValueCents);

  // 2. Reconcile Tiers
  const currentVolumeCents = await getMonthlyVolumeCents(payment.organizationId);
  const currentVolumeUsd = currentVolumeCents / 100;

  console.log("Current volume USD", currentVolumeUsd);

  // Logic: Only charge if they are above the $10k free threshold
  if (currentVolumeUsd + paymentValueCents / 100 <= FREE_THRESHOLD_USD) return;

  const rateBps = await getVolumeTierRateBps(currentVolumeUsd);

  if (rateBps === 0) return;

  // 3. Calculate Fee (High Precision)
  // amount_in_stroops * bps / 10,000
  const feeStroops = (payment.amount * BigInt(rateBps)) / BigInt(BPS_DENOMINATOR);
  const feeUsdCents = Math.round((Number(feeStroops) / 1e7) * assetPrice * 100);

  const chargeId = generateResourceId("ch", paymentId, 20);

  // 4. Create record and attempt transfer
  try {
    const secretKey = decrypt(secret.encrypted);
    const keeperKey = process.env.CHARGES_PUBLIC_KEY!;

    const res = await sendAssetPayment(
      secretKey,
      keeperKey,
      payment.asset.code,
      payment.asset.issuer!,
      feeStroops.toString(),
      payment.environment,
      `Fee: ${paymentId}`
    );

    await db.insert(charges).values({
      id: chargeId,
      organizationId: payment.organizationId,
      paymentId: payment.id,
      amount: feeStroops,
      amountUsd: feeUsdCents,
      assetId: payment.asset.id,
      type: "platform_fee",
      status: res.isOk() ? "succeeded" : "failed",
      transactionHash: res.isOk() ? res.value?.hash : null,
      error: res.isErr() ? res.error.message : null,
      environment: payment.environment,
    });
  } catch (err: any) {
    console.error("[Billing Error]", err);
  }
}
