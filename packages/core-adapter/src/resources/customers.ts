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
import { ERR, OK, Result } from "../utils";

export class CustomerApi {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async create(params: CreateCustomer): Promise<Result<Customer, Error>> {
    const { error, data } = createCustomerSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const response = await this.apiClient.post<Customer>("/customers", {
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return ERR(new Error(`Failed to create customer: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }

  async list(params: ListCustomers): Promise<Result<Array<Customer>, Error>> {
    const { error, data } = listCustomersSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const response = await this.apiClient.get<Array<Customer>>(`/customers`, {
      body: JSON.stringify({ ...data, organization: "xxx" }), // todo: resolve by organization from ApiKey
    });

    if (!response.ok) {
      return ERR(new Error(`Failed to list customers: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }

  async retrieve(id: string): Promise<Result<Customer, Error>> {
    const response = await this.apiClient.get<Customer>(`/customers/${id}`);

    if (!response.ok) {
      return ERR(new Error(`Failed to retrieve customer: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }

  async update(id: string, params: UpdateCustomer): Promise<Result<Customer, Error>> {
    const { error, data } = updateCustomerSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const response = await this.apiClient.put<Customer>(`/customers/${id}`, {
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return ERR(new Error(`Failed to update customer: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }

  async delete(id: string): Promise<Result<Customer, Error>> {
    const response = await this.apiClient.delete<Customer>(`/customers/${id}`);

    if (!response.ok) {
      return ERR(new Error(`Failed to delete customer: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }
}
