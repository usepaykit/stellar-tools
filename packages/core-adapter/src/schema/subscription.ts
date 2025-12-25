import { z } from "zod";

import { schemaFor } from "..";
import { Environment, environmentSchema } from "./shared";

export const subscriptionStatusEnum = z.enum([
  "active",
  "past_due",
  "canceled",
  "paused",
]);

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
  canceledAt?: string;

  /**
   * The date the subscription was paused.
   */
  pausedAt?: string;

  /**
   * The last payment ID of the subscription.
   */
  lastPaymentId?: string;

  /**
   * The next billing date of the subscription.
   */
  nextBillingDate?: string;

  /**
   * The number of failed payments of the subscription.
   */
  failedPaymentCount?: number;

  /**
   * The created at timestamp for the subscription.
   */
  createdAt: string;

  /**
   * The updated at timestamp for the subscription.
   */
  updatedAt: string;

  /**
   * The metadata of the subscription.
   */
  metadata?: Record<string, unknown>;

  /**
   * The environment of the subscription.
   */
  environment: Environment;
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
    lastPaymentId: z.string().optional(),
    nextBillingDate: z.string(),
    failedPaymentCount: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    metadata: z.record(z.string(), z.any()).default({}),
    environment: environmentSchema,
  })
);

export const createSubscriptionSchema = subscriptionSchema.pick({
  customerId: true,
  productId: true,
  metadata: true,
});

export type CreateSubscription = Pick<
  Subscription,
  "customerId" | "productId" | "metadata"
>;

export const pauseSubscriptionSchema = subscriptionSchema.pick({
  id: true,
});

export type PauseSubscription = Pick<Subscription, "id">;

export const resumeSubscriptionSchema = subscriptionSchema.pick({
  id: true,
});

export type ResumeSubscription = Pick<Subscription, "id">;

export const updateSubscriptionSchema = subscriptionSchema.pick({
  metadata: true,
  cancelAtPeriodEnd: true,
  nextBillingDate: true,
});

export type UpdateSubscription = Partial<
  Pick<Subscription, "metadata" | "cancelAtPeriodEnd" | "nextBillingDate">
>;
