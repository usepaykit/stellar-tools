import { ApiClient } from "../api-client";
import {
  CreateCustomer,
  Customer,
  ListCustomers,
  UpdateCustomer,
  createCustomerSchema,
  listCustomersSchema,
  updateCustomerSchema,
} from "../schema/customer";
import { ERR, OK, tryCatchAsync } from "../utils";

export class CustomerApi {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async create(params: CreateCustomer) {
    const { error, data } = createCustomerSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const [response, customerError] = await tryCatchAsync(
      this.apiClient.post<Customer>("/customers", {
        body: JSON.stringify(data),
      })
    );

    if (customerError) {
      return ERR(
        new Error(`Failed to create customer: ${customerError.message}`)
      );
    }

    return OK(response.value);
  }

  async list(params: ListCustomers) {
    const { error, data } = listCustomersSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const [response, customerError] = await tryCatchAsync(
      this.apiClient.get<Customer>(`/customers`, {
        body: JSON.stringify({ ...data, organization: "xxx" }), // todo: resolve by organization from ApiKey
      })
    );

    if (customerError) {
      return ERR(
        new Error(`Failed to list customers: ${customerError.message}`)
      );
    }

    return OK(response.value);
  }

  async retrieve(id: string) {
    const [response, error] = await tryCatchAsync(
      this.apiClient.get<Customer>(`/customers/${id}`)
    );

    if (error) {
      return ERR(new Error(`Failed to retrieve customer: ${error.message}`));
    }

    return OK(response.value);
  }

  async update(id: string, params: UpdateCustomer) {
    const { error, data } = updateCustomerSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const [response, customerError] = await tryCatchAsync(
      this.apiClient.put<Customer>(`/customers/${id}`, {
        body: JSON.stringify(data),
      })
    );

    if (customerError) {
      return ERR(
        new Error(`Failed to update customer: ${customerError.message}`)
      );
    }

    return OK(response.value);
  }

  async delete(id: string) {
    const [response, error] = await tryCatchAsync(
      this.apiClient.delete<Customer>(`/customers/${id}`)
    );

    if (error) {
      return ERR(new Error(`Failed to delete customer: ${error.message}`));
    }

    return OK(response.value);
  }
}
