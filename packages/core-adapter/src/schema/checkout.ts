import { z } from "zod";

import { schemaFor } from "../utils";
import { Environment, environmentSchema } from "./shared";

export const checkoutStatusEnum = z.enum([
  "open",
  "completed",
  "expired",
  "failed",
]);

type CheckoutStatus = z.infer<typeof checkoutStatusEnum>;

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
   * The description of the checkout.
   */
  description: string;

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
}

export const checkoutSchema = schemaFor<Checkout>()(
  z.object({
    id: z.string(),
    organizationId: z.string(),
    customerId: z.string(),
    productId: z.string().optional(),
    amount: z.number().optional(),
    description: z.string(),
    status: checkoutStatusEnum,
    paymentUrl: z.string(),
    expiresAt: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    metadata: z.record(z.string(), z.any()).default({}),
    environment: environmentSchema,
  })
);

export const createCheckoutSchema = checkoutSchema
  .pick({
    organizationId: true,
    customerId: true,
    productId: true,
    amount: true,
    description: true,
    metadata: true,
    environment: true,
  })
  .refine((data) => data.productId !== undefined || data.amount !== undefined, {
    message: "Either productId or amount must be specified",
    path: ["productId"],
  });

export type CreateCheckout = Pick<
  Checkout,
  | "organizationId"
  | "customerId"
  | "productId"
  | "amount"
  | "description"
  | "metadata"
  | "environment"
>;

export const updateCheckoutSchema = checkoutSchema.pick({
  status: true,
  metadata: true,
});

export type UpdateCheckout = Pick<Checkout, "status" | "metadata">;
