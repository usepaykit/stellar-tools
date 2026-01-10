import { ApiClient } from "../api-client";
import {
  CreateSubscription,
  Subscription,
  UpdateSubscription,
  createSubscriptionSchema,
  updateSubscriptionSchema,
} from "../schema/subscription";
import { ERR, OK, Result } from "../utils";

export class SubscriptionApi {
  constructor(private apiClient: ApiClient) {}

  async create(
    params: CreateSubscription
  ): Promise<Result<Subscription, Error>> {
    const { error, data } = createSubscriptionSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const response = await this.apiClient.post<Subscription>("/subscriptions", {
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return ERR(
        new Error(`Failed to create subscription: ${response.error?.message}`)
      );
    }

    return OK(response.value.data);
  }

  async retrieve(id: string): Promise<Result<Subscription, Error>> {
    const response = await this.apiClient.get<Subscription>(
      `/subscriptions/${id}`
    );

    if (!response.ok) {
      return ERR(
        new Error(`Failed to retrieve subscription: ${response.error?.message}`)
      );
    }

    return OK(response.value.data);
  }

  async list(customerId: string): Promise<Result<Subscription[], Error>> {
    const response = await this.apiClient.get<Array<Subscription>>(
      `/subscriptions`,
      { body: JSON.stringify({ customerId }) }
    );

    if (!response.ok) {
      return ERR(
        new Error(`Failed to list subscriptions: ${response.error?.message}`)
      );
    }

    return OK(response.value.data);
  }

  async pause(id: string): Promise<Result<Subscription, Error>> {
    const response = await this.apiClient.post<Subscription>(
      `/subscriptions/${id}/pause`
    );

    if (!response.ok) {
      return ERR(
        new Error(`Failed to pause subscription: ${response.error?.message}`)
      );
    }

    return OK(response.value.data);
  }

  async resume(id: string): Promise<Result<Subscription, Error>> {
    const response = await this.apiClient.post<Subscription>(
      `/subscriptions/${id}/resume`
    );

    if (!response.ok) {
      return ERR(
        new Error(`Failed to resume subscription: ${response.error?.message}`)
      );
    }

    return OK(response.value.data);
  }

  async update(
    id: string,
    params: UpdateSubscription
  ): Promise<Result<Subscription, Error>> {
    const { error, data } = updateSubscriptionSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const response = await this.apiClient.put<Subscription>(
      `/subscriptions/${id}`,
      { body: JSON.stringify(data) }
    );

    if (!response.ok) {
      return ERR(
        new Error(`Failed to update subscription: ${response.error?.message}`)
      );
    }

    return OK(response.value.data);
  }

  async cancel(id: string): Promise<Result<Subscription, Error>> {
    const response = await this.apiClient.post<Subscription>(
      `/subscriptions/${id}/cancel`
    );

    if (!response.ok) {
      return ERR(
        new Error(`Failed to cancel subscription: ${response.error?.message}`)
      );
    }

    return OK(response.value.data);
  }
}
