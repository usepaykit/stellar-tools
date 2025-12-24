import z from "zod";

import { schemaFor } from "../utils";
import { Environment } from "./shared";

export interface CreditBalance {
  /**
   * The unique identifier for the credit balance.
   */
  id: string;

  /**
   * The organization ID of the credit balance.
   */
  organizationId: string;

  /**
   * The customer ID of the credit balance.
   */
  customerId: string;

  /**
   * The product ID of the credit balance.
   */
  productId: string;

  /**
   * The environment of the credit balance.
   */
  environment: Environment;
  /**
   * The metadata of the credit balance.
   */
  metadata: Record<string, unknown>;

  /**
   * The balance of the credit balance.
   */
  balance: number;

  /**
   * The consumed amount of the credit balance.
   */
  consumed: number;

  /**
   * The granted amount of the credit balance.
   */
  granted: number;

  /**
   * The created at timestamp for the credit balance.
   */
  createdAt: string;
  /**
   * The updated at timestamp for the credit balance.
   */
  updatedAt: string;
}

export interface CreditTransaction {
  /**
   * The unique identifier for the credit transaction.
   */
  id: string;
  /**
   * The organization ID of the credit transaction.
   */
  organizationId: string;
  /**
   * The customer ID of the credit transaction.
   */
  customerId: string;
  /**
   * The product ID of the credit transaction.
   */
  productId: string;
  /**
   * The balance ID of the credit transaction.
   */
  balanceId: string;
  /**
   * The amount of the credit transaction.
   */
  amount: number;

  /**
   * The balance before the credit transaction.
   */
  balanceBefore: number;

  /**
   * The balance after the credit transaction.
   */
  balanceAfter: number;

  /**
   * The reason of the credit transaction.
   */
  reason: string;

  /**
   * The metadata of the credit transaction.
   */
  metadata: Record<string, unknown>;

  /**
   * The created at timestamp for the credit transaction.
   */
  createdAt: string;

  /**
   * The updated at timestamp for the credit transaction.
   */
  updatedAt: string;
}

export interface CreditTransactionParams {
  /**
   * The product ID of the credit transaction.
   */
  productId: string;

  /**
   * The amount of credits to deduct.
   */
  amount: number;

  /**
   * The reason of the credit transaction.
   */
  reason?: string;

  /**
   * The metadata of the credit transaction.
   */
  metadata?: Record<string, unknown>;
}

export const creditTransactionSchema = schemaFor<CreditTransactionParams>()(
  z.object({
    productId: z.string(),
    amount: z.number(),
    reason: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
  })
);

export interface CreditTransactionHistoryParams {
  /**
   * The product ID of the credit transaction.
   */
  productId: string;

  /**
   * The limit of the credit transaction history.
   */
  limit?: number;

  /**
   * The offset of the credit transaction history.
   */
  offset?: number;
}

export const creditTransactionHistorySchema =
  schemaFor<CreditTransactionHistoryParams>()(
    z.object({
      productId: z.string(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    })
  );

export interface CheckCreditsParams {
  /**
   * The product ID of the credit action.
   */
  productId: string;

  /**
   * The raw amount of the credit action.
   */
  rawAmount: number;

  /**
  /**
   * The metadata of the credit action.
   */
  metadata?: Record<string, unknown>;
}

export const checkCreditSchema = schemaFor<CheckCreditsParams>()(
  z.object({
    productId: z.string(),
    rawAmount: z.number(),
    metadata: z.record(z.string(), z.any()).optional(),
  })
);

export interface ConsumeCreditParams {
  /**
   * The product ID of the credit action.
   */
  productId: string;

  /**
   * The reason of the credit action.
   */
  reason: string;

  /**
   * The raw amount of the credit action.
   */
  rawAmount: number;
  /**
   * The metadata of the credit action.
   */
  metadata?: Record<string, unknown>;
}

export const consumeCreditSchema = schemaFor<ConsumeCreditParams>()(
  z.object({
    productId: z.string(),
    reason: z.string(),
    rawAmount: z.number(),
    metadata: z.record(z.string(), z.any()).optional(),
  })
);
