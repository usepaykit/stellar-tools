export const FREE_THRESHOLD_USD = 10_000;
export const BPS_DENOMINATOR = 10_000; // 1 bps = 1/10_000 (100 bps = 1%)

// Rate constants in basis points (100 bps = 1%)
export const TIER_RATE_BPS = {
  FREE: 0,
  STANDARD: 70, // $10K – $1M
  GROWTH: 50, // $1M  – $5M
  SCALE: 40, // $5M  – $20M
} as const;

export type TierName = keyof typeof TIER_RATE_BPS;

export const DEFAULT_FEE_RATE_BPS: number = TIER_RATE_BPS.STANDARD;

export const VOLUME_TIERS = [
  { maxVolume: 1_000_000, rateBps: TIER_RATE_BPS.STANDARD, name: "STANDARD" as TierName },
  { maxVolume: 5_000_000, rateBps: TIER_RATE_BPS.GROWTH, name: "GROWTH" as TierName },
  { maxVolume: 20_000_000, rateBps: TIER_RATE_BPS.SCALE, name: "SCALE" as TierName },
] as const;

export function getVolumeTierRateBps(monthlyVolumeUsd: number): number {
  if (monthlyVolumeUsd <= FREE_THRESHOLD_USD) return TIER_RATE_BPS.FREE;
  const tier = VOLUME_TIERS.find((t) => monthlyVolumeUsd <= t.maxVolume);
  return tier?.rateBps ?? TIER_RATE_BPS.SCALE;
}

export function getVolumeTier(monthlyVolumeUsd: number): (typeof VOLUME_TIERS)[number] | null {
  if (monthlyVolumeUsd <= FREE_THRESHOLD_USD) return null;
  return VOLUME_TIERS.find((t) => monthlyVolumeUsd <= t.maxVolume) ?? VOLUME_TIERS[VOLUME_TIERS.length - 1];
}

export function calculatePaymentFee(
  paymentUsd: number,
  prevMonthlyUsd: number
): { feeUsd: number; rateBps: number; newMonthlyUsd: number } {
  const newMonthlyUsd = prevMonthlyUsd + paymentUsd;

  if (newMonthlyUsd <= FREE_THRESHOLD_USD) {
    return { feeUsd: 0, rateBps: TIER_RATE_BPS.FREE, newMonthlyUsd };
  }

  const billableFrom = Math.max(prevMonthlyUsd, FREE_THRESHOLD_USD);
  const billableUsd = newMonthlyUsd - billableFrom;
  const rateBps = getVolumeTierRateBps(newMonthlyUsd);

  return { feeUsd: (billableUsd * rateBps) / BPS_DENOMINATOR, rateBps, newMonthlyUsd };
}

export function calculateMonthlyFee(monthlyVolumeUsd: number, rateBps: number): number {
  if (monthlyVolumeUsd <= FREE_THRESHOLD_USD) return 0;
  return ((monthlyVolumeUsd - FREE_THRESHOLD_USD) * rateBps) / BPS_DENOMINATOR;
}

export function effectivePct(monthlyVolumeUsd: number, fee: number): number {
  if (monthlyVolumeUsd === 0) return 0;
  return (fee / monthlyVolumeUsd) * 100;
}

export const STROOPS_PER_XLM = 10_000_000;
export const XLM_USD_RATE = 0.12; // approximate — swap for a live oracle in production

export function stroopsToUsd(stroops: number): number {
  return (stroops / STROOPS_PER_XLM) * XLM_USD_RATE;
}

export function stroopsToUsdCents(stroops: number): number {
  return Math.round(stroopsToUsd(stroops) * 100);
}
