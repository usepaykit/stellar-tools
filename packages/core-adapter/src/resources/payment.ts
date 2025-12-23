import { ApiClient } from "../api-client";
import {
  Payment,
  RetrievePayment,
  retrievePaymentSchema,
} from "../schema/payment";
import { tryCatchAsync } from "../utils";

export class PaymentApi {
  constructor(private apiClient: ApiClient) {}

  retrieve = async (id: string, opts?: RetrievePayment) => {
    const { error, data } = retrievePaymentSchema.safeParse(opts);

    if (error) {
      throw new Error(`Invalid parameters: ${error.message}`);
    }

    const [response, paymentError] = await tryCatchAsync(
      this.apiClient.get<Payment>(`/payments/${id}`, {
        body: JSON.stringify(data),
      })
    );

    if (paymentError) {
      throw new Error(`Failed to retrieve payment: ${paymentError.message}`);
    }

    return response;
  };
}
