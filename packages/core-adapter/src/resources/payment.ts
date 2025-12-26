import { ApiClient } from "../api-client";
import {
  Payment,
  RetrievePayment,
  retrievePaymentSchema,
} from "../schema/payment";
import { ERR, OK, ResultFP, tryCatchAsync } from "../utils";

export class PaymentApi {
  constructor(private apiClient: ApiClient) {}

  async retrieve(
    id: string,
    opts?: RetrievePayment
  ): Promise<ResultFP<Payment, Error>> {
    const { error, data } = retrievePaymentSchema.safeParse(opts);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const [response, paymentError] = await tryCatchAsync(
      this.apiClient.get<Payment>(`/payments/${id}`, {
        body: JSON.stringify(data),
      })
    );

    if (paymentError) {
      return ERR(
        new Error(`Failed to retrieve payment: ${paymentError.message}`)
      );
    }

    if (!response.ok) {
      return ERR(
        new Error(`Failed to retrieve payment: ${response.error?.message}`)
      );
    }

    return OK(response.value);
  }
}
