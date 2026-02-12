import { Result } from "better-result";

import { ApiClient } from "../api-client";
import { Payment, RetrievePayment, retrievePaymentSchema } from "../schema/payment";
import { unwrap, validateSchema } from "../utils";

export class PaymentApi {
  constructor(private apiClient: ApiClient) {}

  async retrieve(id: string, opts?: RetrievePayment) {
    return unwrap(
      await Result.andThenAsync(validateSchema(retrievePaymentSchema, opts), async (data) => {
        return await this.apiClient.get<Payment>(`/payments/${id}`, data);
      })
    );
  }
}
