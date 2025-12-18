import type { BetterAuthPluginDBSchema } from "better-auth/db";
import { z } from "zod";
import { StellarOptions } from "./types";
import { mergeSchema } from "better-auth/db";

export const stellar$PluginSchema = {
  subscription: {
    fields: {
      plan: { type: "string", required: true },
      referenceId: { type: "string", required: true },
      status: { type: "string", defaultValue: "pending" },
      assetCode: { type: "string", defaultValue: "XLM" },
      amount: { type: "string", required: true },
      periodStart: { type: "date", required: false },
      periodEnd: { type: "date", required: false },
      cancelAtPeriodEnd: { type: "boolean", defaultValue: false },
      lastTransactionHash: { type: "string", required: false },
    },
  },
  user: {
    fields: {
      stellarWalletAddresses: { type: "string[]", required: false },
    },
  },
  payment: {
    fields: {
      userId: { type: "string", required: true },
      memo: { type: "string", required: true },
      amount: { type: "string", required: true },
      status: { type: "string", defaultValue: "pending" }, // pending, success, failed
      txHash: { type: "string", required: false },
    },
  },
} satisfies BetterAuthPluginDBSchema;

export const getSchema = (options: StellarOptions) => {
  let baseSchema = stellar$PluginSchema;

  if (options.schema) {
    baseSchema = mergeSchema(baseSchema, options.schema);
  }

  return baseSchema;
};

export const planSchema = z.object({
  name: z.string(),
  price: z.string(),
  assetCode: z.string(),
  assetIssuer: z.string().optional(),
  interval: z.enum(["day", "week", "month", "year"]),
  limits: z.record(z.string(), z.unknown()),
});

export const subscriptionSchema = z.object({
  id: z.string(),
  plan_id: z.string(),
  reference_id: z.string(),
  status: z.enum(["pending", "active", "cancelled"]),
  asset_code: z.string(),
  amount: z.string(),
  period_start: z.date(),
  period_end: z.date(),
  cancel_at_period_end: z.boolean(),
  last_transaction_hash: z.string().optional(),
  user_id: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type PlanSchema = z.infer<typeof planSchema>;

export type SubscriptionSchema = z.infer<typeof subscriptionSchema>;
