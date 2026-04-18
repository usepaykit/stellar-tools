import {
  z as SchemaZod,
  SuggestedString,
  subscriptionStatusEnum as subscriptionStatusEnum$1,
} from "@stellartools/core";

export const networkEnum = ["testnet", "mainnet"] as const;

export const authProviderEnum = ["google", "local"] as const;

export const payoutStatusEnum = ["pending", "succeeded", "failed"] as const;

export const eventTypeEnum = [
  "customer::created",
  "customer::updated",
  "payment::completed",
  "payment::failed",
  "payout::requested",
  "payout::processed",
  "checkout::created",
  "checkout::updated",
  "refund::created",
  "refund::failed",
  "subscription::created",
  "subscription::updated",
  "subscription::deleted",
  "subscription::canceled",
  "payment_method::created",
  "payment_method::deleted",
  "customer_portal_session::created",
] as const;

export const accountBillingCycleEnum = ["monthly", "yearly"] as const;

export const subscriptionStatusEnum = subscriptionStatusEnum$1.enum;

export type AccountBillingCycle = (typeof accountBillingCycleEnum)[number];

export type Network = (typeof networkEnum)[number];

export type AuthProvider = (typeof authProviderEnum)[number];

export type PayoutStatus = (typeof payoutStatusEnum)[number];

export type EventType = (typeof eventTypeEnum)[number];

export type SubscriptionStatus = SchemaZod.infer<typeof subscriptionStatusEnum$1>;

export type AssetCode = SuggestedString<"XLM" | "USDC">;

export type AssetIssuer = SuggestedString<"native">;

export const paymentStatusEnum = ["pending", "confirmed", "failed"] as const;

export type PaymentStatus = (typeof paymentStatusEnum)[number];

