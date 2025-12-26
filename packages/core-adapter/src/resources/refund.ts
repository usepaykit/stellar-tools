import { ApiClient } from "../api-client";
import { CreateRefund, Refund, createRefundSchema } from "../schema/refund";
import { ERR, OK, ResultFP, tryCatchAsync } from "../utils";

export class RefundApi {
  constructor(private apiClient: ApiClient) {}

  async create(params: CreateRefund): Promise<ResultFP<Refund, Error>> {
    const { error, data } = createRefundSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const [response, refundError] = await tryCatchAsync(
      this.apiClient.post<Refund>("/refunds", {
        body: JSON.stringify(data),
      })
    );

    if (refundError) {
      return ERR(new Error(`Failed to create refund: ${refundError.message}`));
    }

    if (!response.ok) {
      return ERR(
        new Error(`Failed to create refund: ${response.error?.message}`)
      );
    }

    return OK(response.value);
  }
}
