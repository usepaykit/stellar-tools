import { z } from "zod";

import { schemaFor } from "../utils";
import { Environment, environmentSchema } from "./shared";

export const webhookEvent = [
  "customer.created",
  "customer.updated",
  "customer.deleted",
  "checkout.created",
  "payment.pending",
  "payment.confirmed",
  "payment.failed",
  "refund.created",
  "refund.succeeded",
  "refund.failed",
] as const;

export type WebhookEvent = (typeof webhookEvent)[number];

export interface Webhook {
  /**
   * The unique identifier for the webhook.
   */
  id: string;

  /**
   * The organization ID of the webhook.
   */
  organizationId: string;

  /**
   * The URL of the webhook.
   */
  url: string;

  /**
   * The secret of the webhook.
   */
  secret: string;

  /**
   * The events of the webhook.
   */
  events: Array<WebhookEvent>;

  /**
   * The name of the webhook.
   */
  name: string;

  /**
   * The description of the webhook.
   */
  description: string;

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

  /**
   * The environment of the webhook.
   */
  environment: Environment;
}

export const webhookSchema = schemaFor<Webhook>()(
  z.object({
    id: z.string(),
    organizationId: z.string(),
    url: z.string(),
    secret: z.string(),
    events: z.array(
      z.custom<WebhookEvent>((v) => webhookEvent.includes(v as WebhookEvent))
    ),
    name: z.string(),
    description: z.string(),
    isDisabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    environment: environmentSchema,
  })
);

export const createWebhookSchema = webhookSchema
  .pick({
    name: true,
    url: true,
    description: true,
    events: true,
    organizationId: true,
  })
  .refine((data) => data.events.length > 0, {
    message: "At least one event is required",
    path: ["events"],
  });

export type CreateWebhook = Pick<
  Webhook,
  "name" | "url" | "description" | "events" | "organizationId"
>;

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

export type UpdateWebhook = Partial<
  Pick<Webhook, "name" | "url" | "description" | "events" | "isDisabled">
>;
