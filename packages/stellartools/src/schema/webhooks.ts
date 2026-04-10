import { z } from "zod";

import { schemaFor } from "../utils";
import { Checkout } from "./checkout";
import { Customer, CustomerWallet } from "./customer";
import { Payment } from "./payment";
import { Refund } from "./refund";
import { Subscription } from "./subscription";

export const WEBHOOK_EVENT_TYPES = [
  "customer.created",
  "customer.updated",
  "customer.deleted",
  "customer.wallet_linked",
  "checkout.created",
  "payment.pending",
  "payment.confirmed",
  "payment.failed",
  "refund.succeeded",
  "refund.failed",
  "subscription.created",
  "subscription.updated",
  "subscription.canceled",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export interface Webhook {
  /**
   * The unique identifier for the webhook.
   */
  id: string;

  /**
   * The URL of the webhook.
   */
  url: string;

  /**
   * The secret of the webhook.
   */
  secret: string;

  /**
   * The event types of the webhook.
   */
  events: Array<WebhookEventType>;

  /**
   * The name of the webhook.
   */
  name: string;

  /**
   * The description of the webhook.
   */
  description?: string;

  /**
   * The is disabled flag of the webhook.
   */
  isDisabled: boolean;

  /**
   * The created at timestamp for the webhook.
   */
  createdAt: string;

  /**
   * The updated at timestamp for the webhook.
   */
  updatedAt: string;
}

export const webhookSchema = schemaFor<Webhook>()(
  z.object({
    id: z.string(),
    url: z.string(),
    secret: z.string(),
    events: z.array(z.custom<WebhookEventType>((v) => WEBHOOK_EVENT_TYPES.includes(v as WebhookEventType))),
    name: z.string(),
    description: z.string().optional(),
    isDisabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
);

export const createWebhookSchema = webhookSchema
  .pick({
    name: true,
    url: true,
    description: true,
    events: true,
  })
  .refine((data) => data.events.length > 0, {
    message: "At least one event is required",
    path: ["events"],
  });

export type CreateWebhook = Pick<Webhook, "name" | "url" | "description" | "events">;

export const updateWebhookSchema = webhookSchema
  .partial()
  .pick({
    name: true,
    url: true,
    description: true,
    events: true,
    isDisabled: true,
  })
  .refine((data) => {
    if (data.events) {
      return data.events.length && data.events.length > 0
        ? true
        : {
            message: "At least one event is required",
            path: ["events"],
          };
    }
  });

export type UpdateWebhook = Partial<Pick<Webhook, "name" | "url" | "description" | "events" | "isDisabled">>;

// --- Core Event Envelopes ---

export interface WebhookEventBase<TName extends string, TObject> {
  /**
   * The unique identifier for the event.
   */
  id: string;
  /**
   * The type of the event.
   */
  type: TName;
  /**
   * The created at timestamp for the event.
   */
  created: string;
  /**
   * The data of the event.
   */
  data: {
    /**
     * The object of the event.
     */
    object: TObject;
    /**
     * The previous attributes of the object.
     */
    previous_attributes?: Partial<TObject>;
  };
}

export interface WebhookObjectMap {
  "customer.created": Customer;
  "customer.updated": Customer;
  "customer.deleted": Customer;
  "customer.wallet_linked": CustomerWallet;
  "checkout.created": Checkout;
  "payment.confirmed": Payment;
  "payment.pending": Payment;
  "payment.failed": Payment;
  "refund.succeeded": Refund;
  "refund.failed": Refund;
  "subscription.created": Subscription;
  "subscription.updated": Subscription;
  "subscription.canceled": Subscription;
}

export type WebhookEvent = {
  [K in WebhookEventType]: WebhookEventBase<K, WebhookObjectMap[K]>;
}[WebhookEventType];

export type WebhookObject<K extends WebhookEventType> = WebhookObjectMap[K];
