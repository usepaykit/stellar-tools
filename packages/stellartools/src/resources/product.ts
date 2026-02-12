import { Result } from "better-result";
import { z } from "zod";

import { ApiClient } from "../api-client";
import { Product } from "../schema/product";
import { unwrap, validateSchema } from "../utils";

export class ProductApi {
  constructor(private readonly apiClient: ApiClient) {}

  async retrieve(productId: string) {
    return unwrap(
      await Result.andThenAsync(validateSchema(z.string(), productId), async (productId) => {
        return await this.apiClient.get<Product>(`/api/products/${productId}`);
      })
    );
  }
}
