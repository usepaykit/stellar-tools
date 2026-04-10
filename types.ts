import { Network } from "@/constant/schema.client";
import { EventType } from "@/constant/schema.client";
import { computeDiff } from "@/lib/utils";
import { MaybeArray, WebhookEventType, WebhookObject } from "@stellartools/core";

export type EventDataDiff = { $changes?: ReturnType<typeof computeDiff> };

export interface EventEmitParams {
  type: EventType;
  customerId?: string | null; // for customer operations
  merchantId?: string | null; // for merchant operations
  subscriptionId?: string | null;
  data?: Record<
    string,
    string | number | boolean | null | undefined | Date | EventDataDiff | ReturnType<typeof computeDiff>
  >;
}

export interface EventTrigger<T> {
  type: EventType;
  map: (result: T) => MaybeArray<Omit<EventEmitParams, "type">>;
}

export interface WebhookTrigger<T, K extends WebhookEventType = WebhookEventType> {
  event: K;
  map: (result: T) => {
    object: WebhookObject<K>;
    previous_attributes?: Partial<WebhookObject<K>>;
  };
}

export interface EventConfig<T> {
  events?: MaybeArray<EventTrigger<T>>;
  webhooks?: {
    organizationId: string;
    environment: Network;
    triggers: MaybeArray<WebhookTrigger<T, any>>;
  };
}
