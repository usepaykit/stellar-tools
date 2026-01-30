import { Result } from "better-result";

import { ApiClient } from "../api-client";
import { Payment, RetrievePayment, retrievePaymentSchema } from "../schema/payment";
import { validateSchema } from "../utils";

export class PaymentApi {
  constructor(private apiClient: ApiClient) {}

  async retrieve(id: string, opts?: RetrievePayment) {
    return Result.andThenAsync(validateSchema(retrievePaymentSchema, opts), async (data) => {
      const response = await this.apiClient.get<Payment>(`/payments/${id}`, data);
      return response.map((r) => r.data);
    });
  }
}
