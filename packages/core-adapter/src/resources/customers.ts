import { ApiClient } from "../api-client";
import {
  CreateCustomer,
  Customer,
  UpdateCustomer,
  createCustomerSchema,
  updateCustomerSchema,
} from "../schema/customer";
import { ERR, OK, buildError, tryCatchAsync } from "../utils";

export class CustomerApi {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  create = async (params: CreateCustomer) => {
    const { error, data } = createCustomerSchema.safeParse(params);

    if (error) {
      return ERR(buildError(`Invalid parameters: ${error.message}`, error));
    }

    const [response, customerError] = await tryCatchAsync(
      this.apiClient.post<Customer>("/customers", {
        body: JSON.stringify(data),
      })
    );

    if (customerError) {
      return ERR(
        buildError(
          `Failed to create customer: ${customerError.message}`,
          customerError
        )
      );
    }

    return OK(response);
  };

  retrieve = async (id: string) => {
    const [response, error] = await tryCatchAsync(
      this.apiClient.get<Customer>(`/customers/${id}`)
    );

    if (error) {
      return ERR(
        buildError(`Failed to retrieve customer: ${error.message}`, error)
      );
    }

    return OK(response);
  };

  update = async (id: string, params: UpdateCustomer) => {
    const { error, data } = updateCustomerSchema.safeParse(params);

    if (error) {
      return ERR(buildError(`Invalid parameters: ${error.message}`, error));
    }

    const [response, customerError] = await tryCatchAsync(
      this.apiClient.put<Customer>(`/customers/${id}`, {
        body: JSON.stringify(data),
      })
    );

    if (customerError) {
      return ERR(
        buildError(
          `Failed to update customer: ${customerError.message}`,
          customerError
        )
      );
    }

    return OK(response);
  };

  delete = async (id: string) => {
    const [response, error] = await tryCatchAsync(
      this.apiClient.delete<Customer>(`/customers/${id}`)
    );

    if (error) {
      return ERR(
        buildError(`Failed to delete customer: ${error.message}`, error)
      );
    }

    return OK(response);
  };
}
