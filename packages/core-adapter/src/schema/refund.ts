import { z } from "zod";

import { schemaFor } from "../utils";
import { Environment, environmentSchema } from "./shared";

export const refundStatusEnum = z.enum(["pending", "succeeded", "failed"]);

type RefundStatus = z.infer<typeof refundStatusEnum>;

export interface Refund {
  /**
   * The unique identifier for the refund.
   */
  id: string;

  /**
   * The organization ID of the refund.
   */
  organizationId: string;

  /**
   * The payment ID of the refund.
   */
  paymentId: string;

  /**
   * The customer ID of the refund.
   */
  customerId: string;

  /**
   * The asset ID of the refund.
   */
  assetId: string;

  /**
   * The amount of the refund.
   */
  amount: number;

  /**
   * The transaction hash of the refund.
   */
  transactionHash: string;

  /**
   * The reason for the refund.
   */
  reason: string;

  /**
   * The status of the refund.
   */
  status: RefundStatus;

  /**
   * The created at timestamp for the refund.
   */
  createdAt: string;

  /**
   * The updated at timestamp for the refund.
   */
  updatedAt: string;

  /**
   * The metadata for the refund.
   */
  metadata: Record<string, unknown>;

  /**
   * The environment of the refund.
   */
  environment: Environment;

  /**
   * The receiver public key of the refund.
   */
  receiverPublicKey: string;
}

export const refundSchema = schemaFor<Refund>()(
  z.object({
    id: z.string(),
    organizationId: z.string(),
    paymentId: z.string(),
    customerId: z.string(),
    assetId: z.string(),
    amount: z.number(),
    transactionHash: z.string(),
    reason: z.string(),
    status: refundStatusEnum,
    createdAt: z.string(),
    updatedAt: z.string(),
    metadata: z.record(z.string(), z.any()).default({}),
    environment: environmentSchema,
    receiverPublicKey: z.string(),
  })
);

export const createRefundSchema = refundSchema.pick({
  paymentId: true,
  customerId: true,
  assetId: true,
  amount: true,
  reason: true,
  metadata: true,
  receiverPublicKey: true,
});

export interface CreateRefund extends Pick<
  Refund,
  | "paymentId"
  | "customerId"
  | "assetId"
  | "amount"
  | "reason"
  | "metadata"
  | "receiverPublicKey"
> {
  organizationId: string;
  environment: Environment;
}
