import { ApiClient } from "../api-client";
import {
  Checkout,
  CheckoutEmbedDetails,
  CreateCheckout,
  UpdateCheckout,
  createCheckoutSchema,
  updateCheckoutSchema,
} from "../schema/checkout";
import { ERR, OK, Result } from "../utils";

export class CheckoutApi {
  constructor(private apiClient: ApiClient) {}

  async create(params: CreateCheckout): Promise<Result<Checkout, Error>> {
    const { error, data } = createCheckoutSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const response = await this.apiClient.post<Checkout>(`/checkouts`, {
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return ERR(new Error(`Failed to create checkout: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }

  async retrieve(id: string): Promise<Result<Checkout, Error>> {
    const response = await this.apiClient.get<Checkout>(`/checkouts/${id}`);

    if (!response.ok) {
      return ERR(new Error(`Failed to retrieve checkout: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }

  async update(id: string, params: UpdateCheckout): Promise<Result<Checkout, Error>> {
    const { error, data } = updateCheckoutSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const response = await this.apiClient.put<Checkout>(`/checkouts/${id}`, {
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return ERR(new Error(`Failed to update checkout: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }

  async delete(id: string): Promise<Result<Checkout, Error>> {
    const response = await this.apiClient.delete<Checkout>(`/checkouts/${id}`);

    if (!response.ok) {
      return ERR(new Error(`Failed to delete checkout: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }

  async retrieveEmbedDetails(id: string): Promise<Result<CheckoutEmbedDetails, Error>> {
    const response = await this.apiClient.get<CheckoutEmbedDetails>(`/checkouts/${id}/embed-details`);

    if (!response.ok) {
      return ERR(new Error(`Failed to get checkout embed details: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }
}
