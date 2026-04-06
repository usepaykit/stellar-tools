import { Result } from "better-result";
import { z } from "zod";

import { ApiClient } from "../api-client";
import { Payment } from "../schema/payment";
import { unwrap, validateSchema } from "../utils";

export class PaymentApi {
  constructor(private apiClient: ApiClient) {}

  async retrieve(id: string) {
    return unwrap(
      await Result.andThenAsync(validateSchema(z.string(), id), async () => {
        return await this.apiClient.get<Payment>(`/payments/${id}`);
      })
    );
  }
}
