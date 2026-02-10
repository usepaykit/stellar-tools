import { Result } from "better-result";

import { ApiClient } from "../api-client";
import {
  Checkout,
  CheckoutEmbedDetails,
  CreateCheckout,
  CreateDirectCheckout,
  UpdateCheckout,
  createCheckoutSchema,
  createDirectCheckoutSchema,
  retrieveCheckoutSchema,
  updateCheckoutSchema,
} from "../schema/checkout";
import { validateSchema } from "../utils";

export class CheckoutApi {
  constructor(private apiClient: ApiClient) {}

  /**
   * Create a standard checkout using a Product ID.
   * Amount and Asset are resolved automatically from the product.
   */
  async create(params: CreateCheckout) {
    return Result.andThenAsync(validateSchema(createCheckoutSchema, params), (data) =>
      this.apiClient.post<Checkout>("checkout", data)
    );
  }

  /**
   * Create a dynamic checkout with a specific amount and asset.
   * Use this for ad-hoc payments or dynamic pricing.
   */
  async createDirect(params: CreateDirectCheckout) {
    return Result.andThenAsync(validateSchema(createDirectCheckoutSchema, params), (data) =>
      this.apiClient.post<Checkout>("checkout/direct", data)
    );
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
