import { postWebhookLog } from "@/actions/webhook";
import { Network, WebhookEvent } from "@/db";
import { Webhook as WebhookSchema } from "@/db/schema";
import { Webhook } from "@stellartools/core";
import { nanoid } from "nanoid";

export class WebhookDelivery {
  constructor() {}

  deliver = async (
    webhook: WebhookSchema,
    eventType: WebhookEvent,
    payload: Record<string, unknown>,
    environment: Network
  ) => {
    const startTime = Date.now();

    const webhookId = `wh+evt_${nanoid(25)}`;

    const webhookPayload = {
      id: webhookId,
      object: "event",
      type: eventType,
      created: Math.floor(Date.now() / 1000),
      data: payload,
      livemode: environment === "mainnet",
    };

    const signature = new Webhook().generateSignature(
      JSON.stringify(webhookPayload),
      webhook.secret
    );

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "StellarTools-Webhooks/1.0",
          "X-Stellar-Signature": signature,
          "X-Stellar-Event": eventType,
        },
        body: JSON.stringify(webhookPayload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const duration = Date.now() - startTime;
      const responseText = await response.text().catch(() => "");

      await postWebhookLog(webhook.id, {
        id: webhookId,
        organizationId: webhook.organizationId,
        eventType,
        payload: webhookPayload,
        statusCode: response.status,
        errorMessage: response.ok ? null : responseText,
        environment,
      });

      if (!response.ok) {
        throw new Error(
          `Webhook delivery failed: ${response.status} - ${responseText}`
        );
      }

      console.log(
        `✅ Webhook delivered to ${webhook.url} in ${duration}ms (${response.status})`
      );

      return { success: true, webhookId: webhook.id };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await postWebhookLog(webhook.id, {
        organizationId: webhook.organizationId,
        eventType,
        payload: webhookPayload,
        statusCode: null,
        errorMessage,
        environment,
      });

      console.error(
        `❌ Webhook delivery failed to ${webhook.url} after ${duration}ms:`,
        errorMessage
      );

      throw error;
    }
  };
}
