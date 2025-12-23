import { ApiClient } from "../api-client";
import {
  CreditBalance,
  CreditTransaction,
  CreditTransactionHistoryParams,
  CreditTransactionParams,
  creditTransactionHistorySchema,
  creditTransactionSchema,
} from "../schema/credits";
import { tryCatchAsync } from "../utils";

export class CreditApi {
  constructor(private apiClient: ApiClient) {}

  async check(customerId: string, productId: string) {
    const [response, error] = await tryCatchAsync(
      this.apiClient.get<CreditBalance>(
        `/api/customers/${customerId}/credits/${productId}`
      )
    );

    if (error) {
      throw new Error(`Failed to check credits: ${error.message}`);
    }

    return response;
  }

  /**
   * Deduct credits from customer's balance
   */
  async deduct(customerId: string, params: CreditTransactionParams) {
    const { error, data } = creditTransactionSchema.safeParse(params);

    if (error) {
      throw new Error(`Invalid parameters: ${error.message}`);
    }

    const { productId, amount, reason, metadata } = data;

    const [response, deductError] = await tryCatchAsync(
      this.apiClient.post<CreditBalance>(
        `/api/customers/${customerId}/credits/${productId}/deduct`,
        {
          body: JSON.stringify({ amount, reason, metadata }),
        }
      )
    );

    if (deductError) {
      throw new Error(`Failed to deduct credits: ${deductError.message}`);
    }

    return response;
  }

  /**
   * Refund credits back to customer's balance
   */
  async refund(customerId: string, params: CreditTransactionParams) {
    const { error, data } = creditTransactionSchema.safeParse(params);

    if (error) {
      throw new Error(`Invalid parameters: ${error.message}`);
    }

    const { productId, amount, reason, metadata } = data;

    const [response, refundError] = await tryCatchAsync(
      this.apiClient.post<CreditBalance>(
        `/api/customers/${customerId}/credits/${productId}/refund`,
        { body: JSON.stringify({ amount, reason, metadata }) }
      )
    );

    if (refundError) {
      throw new Error(`Failed to refund credits: ${refundError.message}`);
    }

    return response;
  }

  /**
   * Grant credits to customer (admin operation)
   */
  async grant(customerId: string, params: CreditTransactionParams) {
    const { error, data } = creditTransactionSchema.safeParse(params);

    if (error) {
      throw new Error(`Invalid parameters: ${error.message}`);
    }

    const { productId, amount, reason, metadata } = data;

    const [response, grantError] = await tryCatchAsync(
      this.apiClient.post<CreditBalance>(
        `/api/customers/${customerId}/credits/${productId}/grant`,
        { body: JSON.stringify({ amount, reason, metadata }) }
      )
    );

    if (grantError) {
      throw new Error(`Failed to grant credits: ${grantError.message}`);
    }

    return response;
  }

  /**
   * Get transaction history for a customer
   */
  async getTransactions(
    customerId: string,
    options?: CreditTransactionHistoryParams
  ) {
    const { error, data } = creditTransactionHistorySchema.safeParse(options);

    if (error) {
      throw new Error(`Invalid parameters: ${error.message}`);
    }

    const { productId, limit, offset } = data;

    const params = new URLSearchParams();
    if (productId) params.set("productId", productId);
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));

    const [response, transactionHistoryError] = await tryCatchAsync(
      this.apiClient.get<{
        transactions: CreditTransaction[];
        total: number;
      }>(`/api/customers/${customerId}/credits/transactions?${params}`)
    );

    if (transactionHistoryError) {
      throw new Error(
        `Failed to get transactions: ${transactionHistoryError.message}`
      );
    }

    return response;
  }

  /**
   * Get a single transaction by ID
   */
  async getTransaction(transactionId: string) {
    const [response, transactionError] = await tryCatchAsync(
      this.apiClient.get<CreditTransaction>(
        `/api/credits/transactions/${transactionId}`
      )
    );

    if (transactionError) {
      throw new Error(`Failed to get transaction: ${transactionError.message}`);
    }

    return response;
  }

  async calculateBalance(
    customerId: string,
    productId: string,
    amount: number
  ) {
    const [response, balanceError] = await tryCatchAsync(
      this.apiClient.post<CreditBalance>(
        `/api/customers/${customerId}/credits/${productId}/calculate-balance`,
        { body: JSON.stringify({ amount }) }
      )
    );

    if (balanceError) {
      throw new Error(`Failed to calculate balance: ${balanceError.message}`);
    }

    return response;
  }
}
