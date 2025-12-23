import { ApiClient } from "../api-client";
import {
  CreateCustomer,
  Customer,
  UpdateCustomer,
  createCustomerSchema,
  updateCustomerSchema,
} from "../schema/customer";
import { tryCatchAsync } from "../utils";

export class CustomerApi {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  create = async (params: CreateCustomer) => {
    const { error, data } = createCustomerSchema.safeParse(params);

    if (error) {
      throw new Error(`Invalid parameters: ${error.message}`);
    }

    const [response, customerError] = await tryCatchAsync(
      this.apiClient.post<Customer>("/customers", {
        body: JSON.stringify(data),
      })
    );

    if (customerError) {
      throw new Error(`Failed to create customer: ${customerError.message}`);
    }

    return response;
  };

  retrieve = async (id: string) => {
    const [response, error] = await tryCatchAsync(
      this.apiClient.get<Customer>(`/customers/${id}`)
    );

    if (error) {
      throw new Error(`Failed to retrieve customer: ${error.message}`);
    }

    return response;
  };

  update = async (id: string, params: UpdateCustomer) => {
    const { error, data } = updateCustomerSchema.safeParse(params);

    if (error) {
      throw new Error(`Invalid parameters: ${error.message}`);
    }

    const [response, customerError] = await tryCatchAsync(
      this.apiClient.put<Customer>(`/customers/${id}`, {
        body: JSON.stringify(data),
      })
    );

    if (customerError) {
      throw new Error(`Failed to update customer: ${customerError.message}`);
    }

    return response;
  };

  delete = async (id: string) => {
    const [response, error] = await tryCatchAsync(
      this.apiClient.delete<Customer>(`/customers/${id}`)
    );

    if (error) {
      throw new Error(`Failed to delete customer: ${error.message}`);
    }

    return response;
  };
}
