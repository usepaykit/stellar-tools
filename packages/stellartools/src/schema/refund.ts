import { z } from "zod";

import { schemaFor } from "../utils";

export const refundStatusEnum = z.enum(["pending", "succeeded", "failed"]);

type RefundStatus = z.infer<typeof refundStatusEnum>;

export interface Refund {
  /**
   * The unique identifier for the refund.
   */
  id: string;

  /**
   * The payment ID of the refund.
   */
  paymentId: string;

  /**
   * The customer ID of the refund.
   */
  customerId?: string | null;

  /**
   * The amount of the refund e.g `"50 XLM"` or `"100 USDC"`.
   */
  amount: string;

  /**
   * The reason for the refund.
   */
  reason: string | null;

  /**
   * The status of the refund.
   */
  status: RefundStatus;

  /**
   * The created at timestamp for the refund.
   */
  createdAt: string;

  /**
   * The metadata for the refund.
   */
  metadata: Record<string, unknown> | null;

  /**
   * The receiver public key of the refund.
   */
  receiverWalletAddress: string | null;
}

export const refundSchema = schemaFor<Refund>()(
  z.object({
    id: z.string(),
    paymentId: z.string(),
    customerId: z.string(),
    amount: z.string(),
    reason: z.string(),
    status: refundStatusEnum,
    createdAt: z.string(),
    metadata: z.record(z.string(), z.any()).default({}).nullable(),
    receiverWalletAddress: z.string().nullable(),
  })
);

export const createRefundSchema = refundSchema.pick({
  paymentId: true,
  reason: true,
  metadata: true,
});

export interface CreateRefund extends Pick<Refund, "paymentId" | "reason" | "metadata"> {}
