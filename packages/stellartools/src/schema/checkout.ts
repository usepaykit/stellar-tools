import { z } from "zod";

import { schemaFor } from "../utils";
import { Environment, environmentSchema } from "./shared";

export const checkoutStatusEnum = z.enum(["open", "completed", "expired", "failed"]);

export type CheckoutStatus = z.infer<typeof checkoutStatusEnum>;

export type SubscriptionData = {
  /**
   * The start date of the subscription.
   */
  periodStart: string;

  /**
   * The end date of the subscription.
   */
  periodEnd: string;

  /**
   * Whether to cancel the subscription at the end of the current period.
   */
  cancelAtPeriodEnd?: boolean;
};

export interface Checkout {
  /**
   * The unique identifier for the checkout.
   */
  id: string;

  /**
   * The organization ID of the checkout.
   */
  organizationId: string;

  /**
   * The customer ID of the checkout.
   */
  customerId: string;

  /**
   * The product ID of the checkout.
   */
  productId?: string;

  /**
   * The amount of the checkout.
   */
  amount?: number;

  /**
   * The asset code of the checkout.
   */
  assetCode?: string;

  /**
   * The description of the checkout.
   */
  description?: string;

  /**
   * The status of the checkout.
   */
  status: CheckoutStatus;

  /**
   * The payment URL of the checkout.
   */
  paymentUrl: string;

  /**
   * The expiration date of the checkout.
   */
  expiresAt: string;

  /**
   * The created date of the checkout.
   */
  createdAt: string;

  /**
   * The updated date of the checkout.
   */
  updatedAt: string;

  /**
   * The metadata of the checkout.
   */
  metadata: Record<string, unknown>;

  /**
   * The environment of the checkout.
   */
  environment: Environment;

  /**
   * URL to redirect the customer to after payment (e.g. thank-you page).
   */
  redirectUrl?: string;

  /**
   * The subscription data of the checkout.
   */
  subscriptionData?: SubscriptionData;
}

export const subscriptionDataSchema = schemaFor<SubscriptionData>()(
  z.object({
    periodStart: z.string(),
    periodEnd: z.string(),
    cancelAtPeriodEnd: z.boolean().default(false).optional(),
  })
);

export const checkoutSchema = schemaFor<Checkout>()(
  z.object({
    id: z.string(),
    organizationId: z.string(),
    customerId: z.string(),
    productId: z.string().optional(),
    amount: z.number().optional(),
    description: z.string().optional(),
    status: checkoutStatusEnum,
    paymentUrl: z.string(),
    expiresAt: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    metadata: z.record(z.string(), z.any()).default({}),
    environment: environmentSchema,
    redirectUrl: z.string().optional(),
    subscriptionData: subscriptionDataSchema.optional(),
  })
);

const baseCreateSchema = z.object({
  customerId: z.string().optional(),
  customerEmail: z.email().optional(),
  customerPhone: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
  redirectUrl: z.string().optional(),
});

export const createCheckoutSchema = baseCreateSchema.extend({
  productId: z.string().min(1, "Product ID is required"),
});

export const createDirectCheckoutSchema = baseCreateSchema.extend({
  amount: z.number().positive("Amount must be greater than 0"),
  assetCode: z.string().min(1, "Asset code is required"), // e.g. "XLM", "USDC"
});

export type CreateCheckout = z.infer<typeof createCheckoutSchema>;
export type CreateDirectCheckout = z.infer<typeof createDirectCheckoutSchema>;

export const updateCheckoutSchema = checkoutSchema.pick({
  status: true,
  metadata: true,
});

export type UpdateCheckout = Pick<Checkout, "status" | "metadata">;

export const retrieveCheckoutSchema = checkoutSchema.pick({
  id: true,
});
