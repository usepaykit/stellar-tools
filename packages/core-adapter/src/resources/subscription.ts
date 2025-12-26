import { ApiClient } from "../api-client";
import {
  CreateSubscription,
  Subscription,
  UpdateSubscription,
  createSubscriptionSchema,
  updateSubscriptionSchema,
} from "../schema/subscription";
import { ERR, OK, ResultFP, tryCatchAsync } from "../utils";

export class SubscriptionApi {
  constructor(private apiClient: ApiClient) {}

  async create(
    params: CreateSubscription
  ): Promise<ResultFP<Subscription, Error>> {
    const { error, data } = createSubscriptionSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const [response, subscriptionError] = await tryCatchAsync(
      this.apiClient.post<Subscription>("/subscriptions", {
        body: JSON.stringify(data),
      })
    );

    if (subscriptionError || !response.ok) {
      return ERR(
        new Error(
          `Failed to create subscription: ${subscriptionError?.message}`
        )
      );
    }

    return OK(response.value);
  }

  async retrieve(id: string): Promise<ResultFP<Subscription, Error>> {
    const [response, subscriptionError] = await tryCatchAsync(
      this.apiClient.get<Subscription>(`/subscriptions/${id}`)
    );

    if (subscriptionError || !response.ok) {
      return ERR(
        new Error(
          `Failed to retrieve subscription: ${subscriptionError?.message}`
        )
      );
    }

    return OK(response.value);
  }

  async list(customerId: string): Promise<ResultFP<Subscription[], Error>> {
    const [response, subscriptionError] = await tryCatchAsync(
      this.apiClient.get<Subscription[]>(`/subscriptions`, {
        body: JSON.stringify({ customerId }),
      })
    );

    if (subscriptionError || !response.ok) {
      return ERR(
        new Error(`Failed to list subscriptions: ${subscriptionError?.message}`)
      );
    }

    return OK(response.value);
  }

  async pause(id: string): Promise<ResultFP<Subscription, Error>> {
    const [response, subscriptionError] = await tryCatchAsync(
      this.apiClient.post<Subscription>(`/subscriptions/${id}/pause`)
    );

    if (subscriptionError || !response.ok) {
      return ERR(
        new Error(`Failed to pause subscription: ${subscriptionError?.message}`)
      );
    }

    return OK(response.value);
  }

  async resume(id: string): Promise<ResultFP<Subscription, Error>> {
    const [response, subscriptionError] = await tryCatchAsync(
      this.apiClient.post<Subscription>(`/subscriptions/${id}/resume`)
    );

    if (subscriptionError || !response.ok) {
      return ERR(
        new Error(
          `Failed to resume subscription: ${subscriptionError?.message}`
        )
      );
    }

    return OK(response.value);
  }

  async update(
    id: string,
    params: UpdateSubscription
  ): Promise<ResultFP<Subscription, Error>> {
    const { error, data } = updateSubscriptionSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error?.message}`));
    }

    const [response, subscriptionError] = await tryCatchAsync(
      this.apiClient.put<Subscription>(`/subscriptions/${id}`, {
        body: JSON.stringify(data),
      })
    );

    if (subscriptionError || !response.ok) {
      return ERR(
        new Error(
          `Failed to update subscription: ${subscriptionError?.message}`
        )
      );
    }

    return OK(response.value);
  }

  async cancel(id: string): Promise<ResultFP<Subscription, Error>> {
    const [response, subscriptionError] = await tryCatchAsync(
      this.apiClient.post<Subscription>(`/subscriptions/${id}/cancel`)
    );

    if (subscriptionError || !response.ok) {
      return ERR(
        new Error(
          `Failed to cancel subscription: ${subscriptionError?.message}`
        )
      );
    }

    return OK(response.value);
  }
}
