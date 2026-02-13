import { SuggestedString } from "@stellartools/core";

export const subscriptionIntervals = { day: 1, week: 7, month: 30, year: 365 };

const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/([^.]+\.)?stellartools\.dev$/,
  /^https?:\/\/([^.]+\.)*localhost(:\d{1,5})?$/,
  /^https?:\/\/([^.]+\.)*127\.0\.0\.1\.nip\.io(:\d{1,5})?$/,
];

export function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const isAllowed = requestOrigin && ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(requestOrigin));

  return {
    "Access-Control-Allow-Origin": isAllowed ? requestOrigin : "https://stellartools.dev",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-session-token, x-api-key",
    "Access-Control-Allow-Credentials": "true",
  };
}

export type PaymentMethod = SuggestedString<"usdc" | "polar" | "paystack">;
