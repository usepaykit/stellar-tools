import { z } from "zod";

import { schemaFor } from "..";

export const subscriptionStatusEnum = z.enum(["trialing", "active", "past_due", "canceled", "paused"]);

type SubscriptionStatus = z.infer<typeof subscriptionStatusEnum>;

export interface Subscription {
  /**
   * The unique identifier for the subscription.
   */
  id: string;

  /**
   * The customer ID of the subscription.
   */
  customerId: string;

  /**
   * The product ID of the subscription.
   */
  productId: string;

  /**
   * The status of the subscription.
   */
  status: SubscriptionStatus;

  /**
   * The start date of the current period.
   */
  currentPeriodStart: string;

  /**
   * The end date of the current period.
   */
  currentPeriodEnd: string;

  /**
   * Whether to cancel the subscription at the end of the current period.
   */
  cancelAtPeriodEnd: boolean;

  /**
   * The date the subscription was canceled.
   */
  canceledAt: string | null;

  /**
   * The date the subscription was paused.
   */
  pausedAt: string | null;

  /**
   * The number of failed payments of the subscription.
   */
  failedPaymentCount: number | null;

  /**
   * The created at timestamp for the subscription.
   */
  createdAt: string | null;

  /**
   * The updated at timestamp for the subscription.
   */
  updatedAt: string;

  /**
   * The metadata of the subscription.
   */
  metadata: Record<string, unknown> | null;

  /**
   * The number of trial days for the subscription.
   */
  trialDays: number | null;
}

export const subscriptionSchema = schemaFor<Subscription>()(
  z.object({
    id: z.string(),
    customerId: z.string(),
    productId: z.string(),
    status: subscriptionStatusEnum,
    currentPeriodStart: z.string(),
    currentPeriodEnd: z.string(),
    cancelAtPeriodEnd: z.boolean(),
    canceledAt: z.string(),
    pausedAt: z.string(),
    failedPaymentCount: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    metadata: z.record(z.string(), z.any()).default({}),
    trialDays: z.number().default(0),
  })
);

export const createSubscriptionSchema = z.object({
  customerIds: z.array(z.string()),
  productId: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  cancelAtPeriodEnd: z.boolean().optional().default(false),
  period: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
  trialDays: z.number().default(0).optional().nullable(),
});

export type CreateSubscription = z.infer<typeof createSubscriptionSchema>;

export const pauseSubscriptionSchema = subscriptionSchema.pick({
  id: true,
});

export type PauseSubscription = Pick<Subscription, "id">;

export const resumeSubscriptionSchema = subscriptionSchema.pick({
  id: true,
});

export type ResumeSubscription = Pick<Subscription, "id">;

export const updateSubscriptionSchema = z.object({
  metadata: z.record(z.string(), z.any()).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  productId: z.string().optional(),
});

export type UpdateSubscription = z.infer<typeof updateSubscriptionSchema>;
