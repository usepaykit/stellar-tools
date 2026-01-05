import { ApiClient } from "../api-client";
import {
  Payment,
  RetrievePayment,
  retrievePaymentSchema,
} from "../schema/payment";
import { ERR, OK, Result } from "../utils";

export class PaymentApi {
  constructor(private apiClient: ApiClient) {}

  async retrieve(
    id: string,
    opts?: RetrievePayment
  ): Promise<Result<Payment, Error>> {
    const { error, data } = retrievePaymentSchema.safeParse(opts);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const response = await this.apiClient.get<Payment>(`/payments/${id}`, {
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return ERR(
        new Error(`Failed to retrieve payment: ${response.error?.message}`)
      );
    }

    return OK(response.value.data);
  }
}
