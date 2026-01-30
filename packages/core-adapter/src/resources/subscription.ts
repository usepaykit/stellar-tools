import { Result } from "better-result";
import { z } from "zod";

import { ApiClient } from "../api-client";
import {
  CreateSubscription,
  Subscription,
  UpdateSubscription,
  createSubscriptionSchema,
  updateSubscriptionSchema,
} from "../schema/subscription";
import { validateSchema } from "../utils";

export class SubscriptionApi {
  constructor(private apiClient: ApiClient) {}

  async create(params: CreateSubscription) {
    return Result.andThenAsync(validateSchema(createSubscriptionSchema, params), async (data) => {
      const response = await this.apiClient.post<Subscription>("/subscriptions", data);
      return response.map((r) => r.data);
    });
  }

  async retrieve(id: string) {
    return Result.andThenAsync(validateSchema(z.string(), id), async (id) => {
      const response = await this.apiClient.get<Subscription>(`/subscriptions/${id}`);
      return response.map((r) => r.data);
    });
  }

  async list(customerId: string) {
    return Result.andThenAsync(validateSchema(z.string(), customerId), async (customerId) => {
      const response = await this.apiClient.get<Array<Subscription>>(`/subscriptions`, {
        body: JSON.stringify({ customerId }),
      });
      return response.map((r) => r.data);
    });
  }

  async pause(id: string) {
    return Result.andThenAsync(validateSchema(z.string(), id), async (id) => {
      const response = await this.apiClient.post<Subscription>(`/subscriptions/${id}/pause`);
      return response.map((r) => r.data);
    });
  }

  async resume(id: string) {
    return Result.andThenAsync(validateSchema(z.string(), id), async (id) => {
      const response = await this.apiClient.post<Subscription>(`/subscriptions/${id}/resume`);
      return response.map((r) => r.data);
    });
  }

  async update(id: string, params: UpdateSubscription) {
    return Result.andThenAsync(validateSchema(updateSubscriptionSchema, params), async (data) => {
      const response = await this.apiClient.put<Subscription>(`/subscriptions/${id}`, data);
      return response.map((r) => r.data);
    });
  }

  async cancel(id: string) {
    return Result.andThenAsync(validateSchema(z.string(), id), async (id) => {
      const response = await this.apiClient.post<Subscription>(`/subscriptions/${id}/cancel`);
      return response.map((r) => r.data);
    });
  }
}
