import { SuggestedString } from "@stellartools/core";

export const subscriptionIntervals = { day: 1, week: 7, month: 30, year: 365 };

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-session-token, x-api-key",
};

export type PaymentMethod = SuggestedString<"usdc" | "polar" | "paystack">;
