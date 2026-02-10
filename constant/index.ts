import { SuggestedString } from "@stellartools/core";

export const subscriptionIntervals = { day: 1, week: 7, month: 30, year: 365 };

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export type PaymentMethod = SuggestedString<"usdc" | "polar" | "paystack">;
