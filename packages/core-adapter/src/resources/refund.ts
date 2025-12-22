import { ApiClient } from "../api-client";
import { CreateRefund, Refund, createRefundSchema } from "../schema/refund";
import { ERR, OK, buildError, tryCatchAsync } from "../utils";

export class RefundApi {
  constructor(private apiClient: ApiClient) {}

  create = async (params: CreateRefund) => {
    const { error, data } = createRefundSchema.safeParse(params);

    if (error) {
      return ERR(buildError(`Invalid parameters: ${error.message}`, error));
    }

    const [response, refundError] = await tryCatchAsync(
      this.apiClient.post<Refund>("/refunds", {
        body: JSON.stringify(data),
      })
    );

    if (refundError) {
      return ERR(
        buildError(
          `Failed to create refund: ${refundError.message}`,
          refundError
        )
      );
    }

    return OK(response);
  };
}
