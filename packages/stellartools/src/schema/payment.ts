import z from "zod";

import { Environment } from "./shared";

export const paymentStatusEnum = z.enum(["pending", "confirmed", "failed"]);

type PaymentStatus = z.infer<typeof paymentStatusEnum>;

export interface Payment {
  /**
   * The unique identifier for the payment.
   */
  id: string;

  /**
   * The organization ID of the payment.
   */
  organizationId: string;

  /**
   * The checkout ID of the payment.
   */
  checkoutId: string;

  /**
   * The customer ID of the payment.
   */
  customerId: string;

  /**
   * The asset ID of the payment.
   */
  assetId: string;

  /**
   * The amount of the payment.
   */
  amount: number;

  /**
   * The status of the payment.
   */
  status: PaymentStatus;

  /**
   * The transaction hash of the payment.
   */
  transactionHash: string;

  /**
   * The created at timestamp for the payment.
   */
  createdAt: string;

  /**
   * The updated at timestamp for the payment.
   */
  updatedAt: string;

  /**
   * The environment of the payment.
   */
  environment: Environment;
}

export const retrievePaymentSchema = z.object({
  verifyOnChain: z.boolean().default(false),
});

export type RetrievePayment = z.infer<typeof retrievePaymentSchema>;
