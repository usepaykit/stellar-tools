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
import { Product } from "../schema/product";
import { ERR, OK, tryCatchAsync } from "../utils";

export class CreditApi {
  constructor(private apiClient: ApiClient) {}

  async refund(customerId: string, params: CreditTransactionParams) {
    const { error, data } = creditTransactionSchema.safeParse(params);

    if (error) return ERR(new Error(`Invalid parameters: ${error.message}`));

    const { productId, amount, reason, metadata } = data;

    const [response, refundError] = await tryCatchAsync(
      this.apiClient.post<CreditBalance>(
        `/api/customers/${customerId}/credit/${productId}/transaction`,
        { body: JSON.stringify({ amount, reason, metadata, type: "refund" }) }
      )
    );

    if (refundError) {
      return ERR(new Error(`Failed to refund credits: ${refundError.message}`));
    }

    return OK(response.value);
  }

  async getTransactions(
    customerId: string,
    options?: CreditTransactionHistoryParams
  ) {
    const { error, data } = creditTransactionHistorySchema.safeParse(options);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const { productId, limit, offset } = data;

    const params = new URLSearchParams();
    if (productId) params.set("productId", productId);
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));

    const [response, transactionHistoryError] = await tryCatchAsync(
      this.apiClient.get<{
        data: Array<CreditTransaction>;
      }>(`/api/customers/${customerId}/credit/transactions?${params}`)
    );

    if (transactionHistoryError) {
      return ERR(
        new Error(
          `Failed to get transaction history: ${transactionHistoryError.message}`
        )
      );
    }

    return OK(response.value!.data);
  }

  async getTransaction(transactionId: string, customerId: string) {
    const [response, transactionError] = await tryCatchAsync(
      this.apiClient.get<CreditTransaction>(
        `/api/customers/${customerId}/credit/transactions/${transactionId}`
      )
    );

    if (transactionError) {
      return ERR(
        new Error(`Failed to get transaction: ${transactionError.message}`)
      );
    }

    return OK(response.value);
  }

  async check(customerId: string, params: CheckCreditsParams) {
    const { error, data } = checkCreditSchema.safeParse(params);

    if (error) return ERR(new Error(`Invalid parameters: ${error.message}`));

    const { productId, rawAmount } = data;

    const [product, creditBalance] = await Promise.all([
      this.apiClient.get<Product>(`/api/products/${productId}`),
      this.apiClient.get<CreditBalance>(
        `/api/customers/${customerId}/credits/${productId}`
      ),
    ]);

    if (product.error || creditBalance.error) {
      return ERR(
        new Error("Failed to retrieve product config or credit balance")
      );
    }

    /**
     * Calculate actual credits
     * If divisor is 1024 and rawAmount is bytes, result is KB
     * If divisor is null, we treat rawAmount as the unit itself
     */
    const units = product.value.unitDivisor
      ? rawAmount / product.value.unitDivisor
      : rawAmount;

    // result = units / unitsPerCredit (e.g., 1000 tokens / 10 tokens per credit = 100 credits)
    const creditsToDeduct = Math.ceil(
      units / (product.value.unitsPerCredit || 1)
    );

    if (creditsToDeduct > creditBalance.value.balance) {
      return ERR(new Error("Insufficient credits"));
    }

    return OK(true);
  }

  async consume(customerId: string, params: ConsumeCreditParams) {
    const { error, data } = consumeCreditSchema.safeParse(params);

    if (error) return ERR(new Error(`Invalid parameters: ${error.message}`));

    const { productId, rawAmount, reason, metadata } = data;

    const payload = { amount: rawAmount, reason, metadata, type: "deduct" };

    const [response, deductError] = await tryCatchAsync(
      this.apiClient.post<CreditBalance>(
        `/api/customers/${customerId}/credit/${productId}/transaction`,
        { body: JSON.stringify(payload) }
      )
    );

    if (deductError) {
      return ERR(new Error(`Failed to deduct credits: ${deductError.message}`));
    }

    return OK(response.value);
  }
}
