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
import { ERR, OK, Result } from "../utils";

export class CreditApi {
  constructor(private apiClient: ApiClient) {}

  async refund(customerId: string, params: CreditTransactionParams): Promise<Result<CreditBalance, Error>> {
    const { error, data } = creditTransactionSchema.safeParse(params);

    if (error) return ERR(new Error(`Invalid parameters: ${error.message}`));

    const { productId, amount, reason, metadata } = data;

    const response = await this.apiClient.post<CreditBalance>(
      `/api/customers/${customerId}/credit/${productId}/transaction`,
      { body: JSON.stringify({ amount, reason, metadata, type: "refund" }) }
    );

    if (!response.ok) {
      return ERR(new Error(`Failed to refund credits: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }

  async getTransactions(
    customerId: string,
    options?: CreditTransactionHistoryParams
  ): Promise<Result<Array<CreditTransaction>, Error>> {
    const { error, data } = creditTransactionHistorySchema.safeParse(options);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const { productId, limit, offset } = data;

    const params = new URLSearchParams();
    if (productId) params.set("productId", productId);
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));

    const response = await this.apiClient.get<{
      data: Array<CreditTransaction>;
    }>(`/api/customers/${customerId}/credit/transactions?${params}`);

    if (!response.ok) {
      return ERR(new Error(`Failed to get transaction history: ${response.error?.message}`));
    }

    return OK(response.value.data.data);
  }

  async getTransaction(transactionId: string, customerId: string): Promise<Result<CreditTransaction, Error>> {
    const response = await this.apiClient.get<CreditTransaction>(
      `/api/customers/${customerId}/credit/transactions/${transactionId}`
    );

    if (!response.ok) {
      return ERR(new Error(`Failed to get transaction: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }

  async check(customerId: string, params: CheckCreditsParams): Promise<Result<boolean, Error>> {
    const { error, data } = checkCreditSchema.safeParse(params);

    if (error) return ERR(new Error(`Invalid parameters: ${error.message}`));

    const { productId, rawAmount } = data;

    const response = await this.apiClient.get<{
      isSufficient: boolean;
    }>(`/api/customers/${customerId}/credit/${productId}/transaction`, {
      body: JSON.stringify({ rawAmount, dryRun: true }),
    });

    if (!response.ok) {
      return ERR(new Error(`Failed to check credits: ${response.error?.message}`));
    }

    return OK(response.value.data.isSufficient);
  }

  async consume(customerId: string, params: ConsumeCreditParams): Promise<Result<CreditBalance, Error>> {
    const { error, data } = consumeCreditSchema.safeParse(params);

    if (error) return ERR(new Error(`Invalid parameters: ${error.message}`));

    const { productId, rawAmount, reason, metadata } = data;

    const payload = { amount: rawAmount, reason, metadata, type: "deduct" };

    const response = await this.apiClient.post<CreditBalance>(
      `/api/customers/${customerId}/credit/${productId}/transaction`,
      { body: JSON.stringify(payload) }
    );

    if (!response.ok) {
      return ERR(new Error(`Failed to deduct credits: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }
}
