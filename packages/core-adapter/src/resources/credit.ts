import { Result } from "better-result";
import { z } from "zod";

import { ApiClient } from "../api-client";
import {
  CheckCreditsParams,
  ConsumeCreditParams,
  CreditBalance,
  CreditTransaction,
  CreditTransactionHistoryParams,
  CreditTransactionParams,
  checkCreditSchema,
  consumeCreditSchema,
  creditTransactionHistorySchema,
  creditTransactionSchema,
} from "../schema/credits";
import { validateSchema } from "../utils";

export class CreditApi {
  constructor(private apiClient: ApiClient) {}

  async refund(customerId: string, params: CreditTransactionParams) {
    return Result.andThenAsync(validateSchema(creditTransactionSchema, params), async (data) => {
      const response = await this.apiClient.post<CreditBalance>(
        `/api/customers/${customerId}/credit/${data.productId}/transaction`,
        data
      );
      return response.map((r) => r.data);
    });
  }

  async getTransactions(customerId: string, options?: CreditTransactionHistoryParams) {
    return Result.andThenAsync(validateSchema(creditTransactionHistorySchema, options), async (data) => {
      const response = await this.apiClient.get<Array<CreditTransaction>>(
        `/api/customers/${customerId}/credit/transactions`,
        data
      );
      return response.map((r) => r.data);
    });
  }

  async getTransaction(transactionId: string, customerId: string) {
    return Result.andThenAsync(
      validateSchema(z.object({ transactionId: z.string(), customerId: z.string() }), { transactionId, customerId }),
      async (data) => {
        const response = await this.apiClient.get<CreditTransaction>(
          `/api/customers/${data.customerId}/credit/transactions/${data.transactionId}`
        );
        return response.map((r) => r.data);
      }
    );
  }

  async check(customerId: string, params: CheckCreditsParams) {
    return Result.andThenAsync(validateSchema(checkCreditSchema, params), async (data) => {
      const response = await this.apiClient.get<{ isSufficient: boolean }>(
        `/api/customers/${customerId}/credit/${data.productId}/transaction`,
        { body: JSON.stringify({ rawAmount: data.rawAmount, dryRun: true }) }
      );
      return response.map((r) => r.data.isSufficient);
    });
  }

  async consume(customerId: string, params: ConsumeCreditParams) {
    return Result.andThenAsync(validateSchema(consumeCreditSchema, params), async (data) => {
      const response = await this.apiClient.post<CreditBalance>(
        `/api/customers/${customerId}/credit/${data.productId}/transaction`,
        { ...data, type: "deduct", dryRun: false }
      );
      return response.map((r) => r.data);
    });
  }
}
