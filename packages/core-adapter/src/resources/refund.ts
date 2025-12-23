import { ApiClient } from "../api-client";
import { CreateRefund, Refund, createRefundSchema } from "../schema/refund";
import { tryCatchAsync } from "../utils";

export class RefundApi {
  constructor(private apiClient: ApiClient) {}

  create = async (params: CreateRefund) => {
    const { error, data } = createRefundSchema.safeParse(params);

    if (error) {
      throw new Error(`Invalid parameters: ${error.message}`);
    }

    const [response, refundError] = await tryCatchAsync(
      this.apiClient.post<Refund>("/refunds", {
        body: JSON.stringify(data),
      })
    );

    if (refundError) {
      throw new Error(`Failed to create refund: ${refundError.message}`);
    }

    return response;
  };
}
