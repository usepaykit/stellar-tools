import { postWebhookLog } from "@/actions/webhook";
import { Webhook as WebhookSchema } from "@/db/schema";
import { ApiClient, WebhookEvent, WebhookSigner } from "@stellartools/core";
import { nanoid } from "nanoid";

export class WebhookDelivery {
  constructor() {}

  deliver = async (webhook: WebhookSchema, eventType: WebhookEvent, payload: Record<string, unknown>) => {
    const startTime = Date.now();
    const webhookEventId = `wh+evt_${nanoid(52)}`;
    const requestId = `wh+req_${nanoid(52)}`;

    const webhookPayload = {
      id: webhookEventId,
      object: "event",
      type: eventType,
      created: Math.floor(Date.now() / 1000),
      data: payload,
    };

    const signature = new WebhookSigner().generateSignature(JSON.stringify(webhookPayload), webhook.secret);

    try {
      const apiClient = new ApiClient({
        baseUrl: webhook.url,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "StellarTools-Webhooks/1.0",
          "X-Stellar-Signature": signature,
          "X-Stellar-Event": eventType,
        },
        retryOptions: { max: 3, baseDelay: 1000, debug: false },
        timeout: 15000,
      });

      const result = await apiClient.post(webhook.url, {
        body: JSON.stringify(webhookPayload),
        requestId,
      });

      const duration = Date.now() - startTime;

      const response = result?.value;
      const statusCode = response?.status ?? null;
      const responseText = response?.text ?? null;
      const responseData = response?.data as Record<string, unknown> | null;
      const isSuccess = response?.ok ?? false;

      await postWebhookLog(
        webhook.id,
        {
          id: webhookEventId,
          eventType,
          request: webhookPayload,
          statusCode,
          errorMessage: isSuccess ? null : responseText,
          responseTime: duration,
          response: responseData ?? null,
          description: `Webhook delivery to ${webhook.url}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          nextRetry: null,
          apiVersion: "2025-12-27.stellartools",
        },
        webhook.organizationId,
        webhook.environment
      );

      if (!isSuccess) {
        throw new Error(`Webhook delivery failed: ${statusCode} - ${responseText}`);
      }

      console.log(`✅ Webhook delivered to ${webhook.url} in ${duration}ms (${statusCode})`);

      return { success: true, webhookId: webhook.id };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await postWebhookLog(
        webhook.id,
        {
          id: webhookEventId,
          eventType,
          request: webhookPayload,
          statusCode: null,
          errorMessage,
          responseTime: duration,
          response: null,
          description: `Webhook delivery to ${webhook.url}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          nextRetry: null,
          apiVersion: "2025-12-27.stellartools",
        },
        webhook.organizationId,
        webhook.environment
      );

      console.error(`❌ Webhook delivery failed to ${webhook.url} after ${duration}ms:`, errorMessage);

      throw error;
    }
  };
}
