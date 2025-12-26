import { ApiClient } from "../api-client";
import { Product } from "../schema/product";
import { ERR, OK, ResultFP, tryCatchAsync } from "../utils";

export class ProductApi {
  constructor(private readonly apiClient: ApiClient) {}

  async retrieve(productId: string): Promise<ResultFP<Product, Error>> {
    const [response, productError] = await tryCatchAsync(
      this.apiClient.get<Product>(`/api/products/${productId}`)
    );

    if (productError) {
      return ERR(
        new Error(`Failed to retrieve product: ${productError.message}`)
      );
    }

    if (!response.ok) {
      return ERR(
        new Error(`Failed to retrieve product: ${response.error?.message}`)
      );
    }

    return OK(response.value);
  }
}
