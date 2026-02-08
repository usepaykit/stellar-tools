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
      return await this.apiClient.post<Subscription>("/subscriptions", data);
    });
  }

  async retrieve(id: string) {
    return Result.andThenAsync(validateSchema(z.string(), id), async (id) => {
      return await this.apiClient.get<Subscription>(`/subscriptions/${id}`);
    });
  }

  async list(customerId: string) {
    return Result.andThenAsync(validateSchema(z.string(), customerId), async (customerId) => {
      return await this.apiClient.get<Array<Subscription>>(`/subscriptions`, {
        body: JSON.stringify({ customerId }),
      });
    });
  }

  async pause(id: string) {
    return Result.andThenAsync(validateSchema(z.string(), id), async (id) => {
      return await this.apiClient.post<Subscription>(`/subscriptions/${id}/pause`);
    });
  }

  async resume(id: string) {
    return Result.andThenAsync(validateSchema(z.string(), id), async (id) => {
      return await this.apiClient.post<Subscription>(`/subscriptions/${id}/resume`);
    });
  }

  async update(id: string, params: UpdateSubscription) {
    return Result.andThenAsync(validateSchema(updateSubscriptionSchema, params), async (data) => {
      return await this.apiClient.put<Subscription>(`/subscriptions/${id}`, data);
    });
  }

  async cancel(id: string) {
    return Result.andThenAsync(validateSchema(z.string(), id), async (id) => {
      return await this.apiClient.post<Subscription>(`/subscriptions/${id}/cancel`);
    });
  }
}
