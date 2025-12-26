import { ApiClient } from "../api-client";
import {
  Checkout,
  CreateCheckout,
  UpdateCheckout,
  createCheckoutSchema,
  updateCheckoutSchema,
} from "../schema/checkout";
import { ERR, OK, ResultFP, tryCatchAsync } from "../utils";

export class CheckoutApi {
  constructor(private apiClient: ApiClient) {}

  async create(params: CreateCheckout): Promise<ResultFP<Checkout, Error>> {
    const { error, data } = createCheckoutSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const [response, checkoutError] = await tryCatchAsync(
      this.apiClient.post<Checkout>(`/checkouts`, {
        body: JSON.stringify(data),
      })
    );

    if (checkoutError) {
      return ERR(
        new Error(`Failed to create checkout: ${checkoutError.message}`)
      );
    }

    if (!response.ok) {
      return ERR(
        new Error(`Failed to create checkout: ${response.error?.message}`)
      );
    }

    return OK(response.value);
  }

  async retrieve(id: string): Promise<ResultFP<Checkout, Error>> {
    const [response, error] = await tryCatchAsync(
      this.apiClient.get<Checkout>(`/checkouts/${id}`)
    );

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    if (!response.ok) {
      return ERR(
        new Error(`Failed to retrieve checkout: ${response.error?.message}`)
      );
    }

    return OK(response.value);
  }

  async update(
    id: string,
    params: UpdateCheckout
  ): Promise<ResultFP<Checkout, Error>> {
    const { error, data } = updateCheckoutSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const [response, checkoutError] = await tryCatchAsync(
      this.apiClient.put<Checkout>(`/checkouts/${id}`, {
        body: JSON.stringify(data),
      })
    );

    if (checkoutError) {
      return ERR(
        new Error(`Failed to update checkout: ${checkoutError.message}`)
      );
    }

    if (!response.ok) {
      return ERR(
        new Error(`Failed to update checkout: ${response.error?.message}`)
      );
    }

    return OK(response.value);
  }

  async delete(id: string): Promise<ResultFP<Checkout, Error>> {
    const [response, checkoutError] = await tryCatchAsync(
      this.apiClient.delete<Checkout>(`/checkouts/${id}`)
    );

    if (checkoutError) {
      return ERR(
        new Error(`Failed to delete checkout: ${checkoutError.message}`)
      );
    }

    if (!response.ok) {
      return ERR(
        new Error(`Failed to delete checkout: ${response.error?.message}`)
      );
    }

    return OK(response.value);
  }
}
