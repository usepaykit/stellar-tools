import { ApiClient } from "../api-client";
import { Product } from "../schema/product";
import { ERR, OK, Result } from "../utils";

export class ProductApi {
  constructor(private readonly apiClient: ApiClient) {}

  async retrieve(productId: string): Promise<Result<Product, Error>> {
    const response = await this.apiClient.get<Product>(
      `/api/products/${productId}`
    );

    if (!response.ok) {
      return ERR(
        new Error(`Failed to retrieve product: ${response.error?.message}`)
      );
    }

    return OK(response.value.data);
  }
}
