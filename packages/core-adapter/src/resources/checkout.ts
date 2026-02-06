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
      const response = await this.apiClient.post<Checkout>("checkout", data);
      return response.map((r) => r.data);
    });
  }

  async retrieve(id: string) {
    return Result.andThenAsync(validateSchema(retrieveCheckoutSchema, { id }), async (id) => {
      const response = await this.apiClient.get<Checkout>(`checkout/${id}`);
      return response.map((r) => r.data);
    });
  }

  async update(id: string, params: UpdateCheckout) {
    return Result.andThenAsync(validateSchema(updateCheckoutSchema, params), async (data) => {
      const response = await this.apiClient.put<Checkout>(`checkout/${id}`, data);
      return response.map((r) => r.data);
    });
  }

  async delete(id: string) {
    return Result.andThenAsync(validateSchema(retrieveCheckoutSchema, { id }), async (id) => {
      const response = await this.apiClient.delete<Checkout>(`checkout/${id}`);
      return response.map((r) => r.data);
    });
  }

  async retrieveEmbedDetails(id: string) {
    return Result.andThenAsync(validateSchema(retrieveCheckoutSchema, { id }), async (id) => {
      const response = await this.apiClient.get<CheckoutEmbedDetails>(`checkout/${id}/embed-details`);
      return response.map((r) => r.data);
    });
  }
}
