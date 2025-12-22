import { ApiClient } from "../api-client";
import {
  Checkout,
  CreateCheckout,
  UpdateCheckout,
  createCheckoutSchema,
  updateCheckoutSchema,
} from "../schema/checkout";
import { ERR, OK, buildError, tryCatchAsync } from "../utils";

export class CheckoutApi {
  constructor(private apiClient: ApiClient) {}

  create = async (params: CreateCheckout) => {
    const { error, data } = createCheckoutSchema.safeParse(params);

    if (error) {
      return ERR(buildError(`Invalid parameters: ${error.message}`, error));
    }

    const [response, checkoutError] = await tryCatchAsync(
      this.apiClient.post<Checkout>(`/checkouts`, {
        body: JSON.stringify(data),
      })
    );

    if (checkoutError) {
      return ERR(
        buildError(
          `Failed to create checkout: ${checkoutError.message}`,
          checkoutError
        )
      );
    }

    return OK(response);
  };

  retrieve = async (id: string) => {
    const [response, error] = await tryCatchAsync(
      this.apiClient.get<Checkout>(`/checkouts/${id}`)
    );

    if (error) {
      return ERR(buildError(`Invalid parameters: ${error.message}`, error));
    }

    return OK(response);
  };

  update = async (id: string, params: UpdateCheckout) => {
    const { error, data } = updateCheckoutSchema.safeParse(params);

    if (error) {
      return ERR(buildError(`Invalid parameters: ${error.message}`, error));
    }

    const [response, checkoutError] = await tryCatchAsync(
      this.apiClient.put<Checkout>(`/checkouts/${id}`, {
        body: JSON.stringify(data),
      })
    );

    if (checkoutError) {
      return ERR(
        buildError(
          `Failed to update checkout: ${checkoutError.message}`,
          checkoutError
        )
      );
    }

    return OK(response);
  };

  delete = async (id: string) => {
    const [response, error] = await tryCatchAsync(
      this.apiClient.delete<Checkout>(`/checkouts/${id}`)
    );

    if (error) {
      return ERR(
        buildError(`Failed to delete checkout: ${error.message}`, error)
      );
    }

    return OK(response);
  };
}
