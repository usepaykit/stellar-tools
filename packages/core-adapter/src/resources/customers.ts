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
import { ERR, OK, ResultFP, tryCatchAsync } from "../utils";

export class CustomerApi {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async create(params: CreateCustomer): Promise<ResultFP<Customer, Error>> {
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

    if (!response.ok) {
      return ERR(
        new Error(`Failed to create customer: ${response.error?.message}`)
      );
    }

    return OK(response.value);
  }

  async list(params: ListCustomers): Promise<ResultFP<Array<Customer>, Error>> {
    const { error, data } = listCustomersSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const [response, customerError] = await tryCatchAsync(
      this.apiClient.get<Array<Customer>>(`/customers`, {
        body: JSON.stringify({ ...data, organization: "xxx" }), // todo: resolve by organization from ApiKey
      })
    );

    if (customerError) {
      return ERR(
        new Error(`Failed to list customers: ${customerError.message}`)
      );
    }

    if (!response.ok) {
      return ERR(
        new Error(`Failed to list customers: ${response.error?.message}`)
      );
    }

    return OK(response.value);
  }

  async retrieve(id: string): Promise<ResultFP<Customer, Error>> {
    const [response, customerError] = await tryCatchAsync(
      this.apiClient.get<Customer>(`/customers/${id}`)
    );

    if (customerError) {
      return ERR(
        new Error(`Failed to retrieve customer: ${customerError.message}`)
      );
    }

    if (!response.ok) {
      return ERR(
        new Error(`Failed to retrieve customer: ${response.error?.message}`)
      );
    }

    return OK(response.value);
  }

  async update(
    id: string,
    params: UpdateCustomer
  ): Promise<ResultFP<Customer, Error>> {
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

    if (!response.ok) {
      return ERR(
        new Error(`Failed to update customer: ${response.error?.message}`)
      );
    }

    return OK(response.value);
  }

  async delete(id: string): Promise<ResultFP<Customer, Error>> {
    const [response, error] = await tryCatchAsync(
      this.apiClient.delete<Customer>(`/customers/${id}`)
    );

    if (error) {
      return ERR(new Error(`Failed to delete customer: ${error.message}`));
    }

    if (!response.ok) {
      return ERR(
        new Error(`Failed to delete customer: ${response.error?.message}`)
      );
    }

    return OK(response.value);
  }
}
