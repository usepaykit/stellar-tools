import { ApiClient } from "../api-client";
import {
  Payment,
  RetrievePayment,
  retrievePaymentSchema,
} from "../schema/payment";
import { ERR, OK, buildError, tryCatchAsync } from "../utils";

export class PaymentApi {
  constructor(private apiClient: ApiClient) {}

  retrieve = async (id: string, opts?: RetrievePayment) => {
    const { error, data } = retrievePaymentSchema.safeParse(opts);

    if (error) {
      return ERR(buildError(`Invalid parameters: ${error.message}`, error));
    }

    const [response, paymentError] = await tryCatchAsync(
      this.apiClient.get<Payment>(`/payments/${id}`, {
        body: JSON.stringify(data),
      })
    );

    if (paymentError) {
      return ERR(
        buildError(
          `Failed to retrieve payment: ${paymentError.message}`,
          paymentError
        )
      );
    }

    return OK(response);
  };
}
