import { Result } from "better-result";

import { ApiClient } from "../api-client";
import {
  Checkout,
  CheckoutEmbedDetails,
  CreateCheckout,
  UpdateCheckout,
  createCheckoutSchema,
  retrieveCheckoutSchema,
  updateCheckoutSchema,
} from "../schema/checkout";
import { validateSchema } from "../utils";

export class CheckoutApi {
  constructor(private apiClient: ApiClient) {}

  async create(params: CreateCheckout) {
    return Result.andThenAsync(validateSchema(createCheckoutSchema, params), async (data) => {
      return await this.apiClient.post<Checkout>("checkout", data);
    });
  }

  async retrieve(id: string) {
    return Result.andThenAsync(validateSchema(retrieveCheckoutSchema, { id }), async (id) => {
      return await this.apiClient.get<Checkout>(`checkout/${id}`);
    });
  }

  async update(id: string, params: UpdateCheckout) {
    return Result.andThenAsync(validateSchema(updateCheckoutSchema, params), async (data) => {
      return await this.apiClient.put<Checkout>(`checkout/${id}`, data);
    });
  }

  async delete(id: string) {
    return Result.andThenAsync(validateSchema(retrieveCheckoutSchema, { id }), async (id) => {
      return await this.apiClient.delete<Checkout>(`checkout/${id}`);
    });
  }

  async retrieveEmbedDetails(id: string) {
    return Result.andThenAsync(validateSchema(retrieveCheckoutSchema, { id }), async (id) => {
      return await this.apiClient.get<CheckoutEmbedDetails>(`checkout/${id}/embed-details`);
    });
  }
}
