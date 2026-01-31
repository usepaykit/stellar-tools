export const roles = ["owner", "admin", "developer", "viewer"] as const;

export const networkEnum = ["testnet", "mainnet"] as const;

export const authProviderEnum = ["google", "local"] as const;

export const payoutStatusEnum = ["pending", "succeeded", "failed"] as const;

export const productTypeEnum = ["subscription", "one_time", "metered"] as const;

export const subscriptionStatusEnum = ["active", "past_due", "canceled", "paused"] as const;

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
  "subscription::created",
  "subscription::updated",
  "subscription::deleted",
] as const;

export type Role = (typeof roles)[number];

export type Network = (typeof networkEnum)[number];

export type AuthProvider = (typeof authProviderEnum)[number];

export type PayoutStatus = (typeof payoutStatusEnum)[number];

export type EventType = (typeof eventTypeEnum)[number];

export type ProductType = (typeof productTypeEnum)[number];

export type SubscriptionStatus = (typeof subscriptionStatusEnum)[number];
