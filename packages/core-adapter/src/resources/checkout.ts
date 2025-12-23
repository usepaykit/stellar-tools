import { ApiClient } from "../api-client";
import {
  Checkout,
  CreateCheckout,
  UpdateCheckout,
  createCheckoutSchema,
  updateCheckoutSchema,
} from "../schema/checkout";
import { tryCatchAsync } from "../utils";

export class CheckoutApi {
  constructor(private apiClient: ApiClient) {}

  async create(params: CreateCheckout) {
    const { error, data } = createCheckoutSchema.safeParse(params);

    if (error) {
      throw new Error(`Invalid parameters: ${error.message}`);
    }

    const [response, checkoutError] = await tryCatchAsync(
      this.apiClient.post<Checkout>(`/checkouts`, {
        body: JSON.stringify(data),
      })
    );

    if (checkoutError) {
      throw new Error(`Failed to create checkout: ${checkoutError.message}`);
    }

    return response;
  }

  async retrieve(id: string) {
    const [response, error] = await tryCatchAsync(
      this.apiClient.get<Checkout>(`/checkouts/${id}`)
    );

    if (error) {
      throw new Error(`Invalid parameters: ${error.message}`);
    }

    return response;
  }

  async update(id: string, params: UpdateCheckout) {
    const { error, data } = updateCheckoutSchema.safeParse(params);

    if (error) {
      throw new Error(`Invalid parameters: ${error.message}`);
    }

    const [response, checkoutError] = await tryCatchAsync(
      this.apiClient.put<Checkout>(`/checkouts/${id}`, {
        body: JSON.stringify(data),
      })
    );

    if (checkoutError) {
      throw new Error(`Failed to update checkout: ${checkoutError.message}`);
    }

    return response;
  }

  async delete(id: string) {
    const [response, error] = await tryCatchAsync(
      this.apiClient.delete<Checkout>(`/checkouts/${id}`)
    );

    if (error) {
      throw new Error(`Failed to delete checkout: ${error.message}`);
    }

    return response;
  }
}
