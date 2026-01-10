export const roles = ["owner", "admin", "developer", "viewer"] as const;

export const checkoutStatus = [
  "open",
  "completed",
  "expired",
  "failed",
] as const;

export type Role = (typeof roles)[number];
export type CheckoutStatus = (typeof checkoutStatus)[number];
