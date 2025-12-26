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
import { ERR, OK, ResultFP, tryCatchAsync } from "../utils";

export class CreditApi {
  constructor(private apiClient: ApiClient) {}

  async refund(
    customerId: string,
    params: CreditTransactionParams
  ): Promise<ResultFP<CreditBalance, Error>> {
    const { error, data } = creditTransactionSchema.safeParse(params);

    if (error) return ERR(new Error(`Invalid parameters: ${error.message}`));

    const { productId, amount, reason, metadata } = data;

    const [response, refundError] = await tryCatchAsync(
      this.apiClient.post<CreditBalance>(
        `/api/customers/${customerId}/credit/${productId}/transaction`,
        { body: JSON.stringify({ amount, reason, metadata, type: "refund" }) }
      )
    );

    if (refundError || !response.ok) {
      return ERR(
        new Error(`Failed to refund credits: ${refundError?.message}`)
      );
    }

    return OK(response.value);
  }

  async getTransactions(
    customerId: string,
    options?: CreditTransactionHistoryParams
  ): Promise<ResultFP<Array<CreditTransaction>, Error>> {
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

    if (transactionHistoryError || !response.ok) {
      return ERR(
        new Error(
          `Failed to get transaction history: ${transactionHistoryError?.message}`
        )
      );
    }

    return OK(response.value.data);
  }

  async getTransaction(
    transactionId: string,
    customerId: string
  ): Promise<ResultFP<CreditTransaction, Error>> {
    const [response, transactionError] = await tryCatchAsync(
      this.apiClient.get<CreditTransaction>(
        `/api/customers/${customerId}/credit/transactions/${transactionId}`
      )
    );

    if (transactionError || !response.ok) {
      return ERR(
        new Error(`Failed to get transaction: ${transactionError?.message}`)
      );
    }

    return OK(response.value);
  }

  async check(
    customerId: string,
    params: CheckCreditsParams
  ): Promise<ResultFP<boolean, Error>> {
    const { error, data } = checkCreditSchema.safeParse(params);

    if (error) return ERR(new Error(`Invalid parameters: ${error.message}`));

    const { productId, rawAmount } = data;

    const [response, checkError] = await tryCatchAsync(
      this.apiClient.get<{
        isSufficient: boolean;
      }>(`/api/customers/${customerId}/credit/${productId}/transaction`, {
        body: JSON.stringify({ rawAmount, dryRun: true }),
      })
    );

    if (checkError || !response.ok) {
      return ERR(new Error(`Failed to check credits: ${checkError?.message}`));
    }

    return OK(response.value.isSufficient);
  }

  async consume(
    customerId: string,
    params: ConsumeCreditParams
  ): Promise<ResultFP<CreditBalance, Error>> {
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

    if (deductError || !response.ok) {
      return ERR(
        new Error(`Failed to deduct credits: ${deductError?.message}`)
      );
    }

    return OK(response.value);
  }
}
