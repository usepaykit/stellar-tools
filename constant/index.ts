import { SuggestedString } from "@stellartools/core";

export const subscriptionIntervals = { day: 1, week: 7, month: 30, year: 365 };

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export type PaymentMethod = SuggestedString<"usdc" | "polar" | "paystack">;

export const APP_PRICE_CONFIG: Record<
  string,
  { monthlyAmount: number; yearlyAmount: number; usdc: string | null; polar: string | null; paystack: string | null }
> = {
  free: { monthlyAmount: 0, yearlyAmount: 0, usdc: null, polar: null, paystack: null },
  starter: {
    usdc: process.env.USDC_STARTER_KEY!,
    monthlyAmount: 29,
    yearlyAmount: 29 * 12 - 29 * 12 * 0.3, // 30% discount for yearly
    polar: process.env.POLAR_STARTER_KEY!,
    paystack: process.env.PAYSTACK_STARTER_KEY!,
  },
  growth: {
    usdc: process.env.USDC_GROWTH_KEY!,
    monthlyAmount: 99,
    yearlyAmount: 99 * 12 - 99 * 12 * 0.4, // 40% discount for yearly
    polar: process.env.POLAR_GROWTH_KEY!,
    paystack: process.env.PAYSTACK_GROWTH_KEY!,
  },
  scale: {
    usdc: process.env.USDC_SCALE_KEY!,
    monthlyAmount: 299,
    yearlyAmount: 299 * 12 - 299 * 12 * 0.35, // 35% discount for yearly
    polar: process.env.POLAR_SCALE_KEY!,
    paystack: process.env.PAYSTACK_SCALE_KEY!,
  },
  enterprise: {
    usdc: null,
    monthlyAmount: 0,
    yearlyAmount: 0,
    polar: null,
    paystack: null,
  },
};
