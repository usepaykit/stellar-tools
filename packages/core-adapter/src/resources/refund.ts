import { Result } from "better-result";

import { ApiClient } from "../api-client";
import { CreateRefund, Refund, createRefundSchema } from "../schema/refund";
import { validateSchema } from "../utils";

export class RefundApi {
  constructor(private apiClient: ApiClient) {}

  async create(params: CreateRefund) {
    return Result.andThenAsync(validateSchema(createRefundSchema, params), async (data) => {
      const response = await this.apiClient.post<Refund>("/refunds", data);
      return response.map((r) => r.data);
    });
  }
}
