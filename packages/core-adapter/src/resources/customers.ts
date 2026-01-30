import { Result } from "better-result";
import { z } from "zod";

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
import { validateSchema } from "../utils";

export class CustomerApi {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async create(params: CreateCustomer) {
    return Result.andThenAsync(validateSchema(createCustomerSchema, params), async (data) => {
      const response = await this.apiClient.post<Customer>("/customers", data);
      return response.map((r) => r.data);
    });
  }

  async list(params: ListCustomers) {
    return Result.andThenAsync(validateSchema(listCustomersSchema, params), async (data) => {
      const response = await this.apiClient.get<Array<Customer>>(`/customers`, data);
      return response.map((r) => r.data);
    });
  }

  async retrieve(id: string) {
    return Result.andThenAsync(validateSchema(z.string(), id), async (id) => {
      const response = await this.apiClient.get<Customer>(`/customers/${id}`);
      return response.map((r) => r.data);
    });
  }

  async update(id: string, params: UpdateCustomer) {
    return Result.andThenAsync(validateSchema(updateCustomerSchema, params), async (data) => {
      const response = await this.apiClient.put<Customer>(`/customers/${id}`, data);
      return response.map((r) => r.data);
    });
  }

  async delete(id: string) {
    return Result.andThenAsync(validateSchema(z.string(), id), async (id) => {
      const response = await this.apiClient.delete<Customer>(`/customers/${id}`);
      return response.map((r) => r.data);
    });
  }
}
