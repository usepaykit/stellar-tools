import "server-only";

import { DEFAULT_FEE_RATE_BPS, TIER_RATE_BPS, type TierName } from "./pricing";

export function encodeFeeToken(rateBps: number): string {
  return Buffer.from(JSON.stringify({ v: 1, r: rateBps })).toString("base64url");
}

export function decodeFeeToken(token: string | null | undefined): number {
  if (!token) return DEFAULT_FEE_RATE_BPS;
  try {
    const data = JSON.parse(Buffer.from(token, "base64url").toString());
    return typeof data.r === "number" ? data.r : DEFAULT_FEE_RATE_BPS;
  } catch {
    return DEFAULT_FEE_RATE_BPS;
  }
}

export const TIER_FEE_TOKENS: Record<TierName, string> = {
  FREE: encodeFeeToken(TIER_RATE_BPS.FREE),
  STANDARD: encodeFeeToken(TIER_RATE_BPS.STANDARD),
  GROWTH: encodeFeeToken(TIER_RATE_BPS.GROWTH),
  SCALE: encodeFeeToken(TIER_RATE_BPS.SCALE),
} as const;

export function tokenForRateBps(rateBps: number): string {
  const entry = Object.entries(TIER_FEE_TOKENS).find(([name]) => TIER_RATE_BPS[name as TierName] === rateBps);
  return entry?.[1] ?? encodeFeeToken(rateBps);
}
