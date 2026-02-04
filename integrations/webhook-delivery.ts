import { postWebhookLog } from "@/actions/webhook";
import { Webhook as WebhookSchema } from "@/db/schema";
import { generateResourceId } from "@/lib/utils";
import { ApiClient, WebhookEvent, WebhookSigner } from "@stellartools/core";

export class WebhookDelivery {
  deliver = async (webhook: WebhookSchema, eventType: WebhookEvent, payload: Record<string, unknown>) => {
    const startTime = Date.now();
    const webhookEventId = generateResourceId("wh+evt", webhook.id, 52);

    const webhookPayload = {
      id: webhookEventId,
      object: "event",
      type: eventType,
      created: Math.floor(Date.now() / 1000),
      data: payload,
    };

    const signature = new WebhookSigner().generateSignature(JSON.stringify(webhookPayload), webhook.secret);

    const url = new URL(webhook.url);

    const client = new ApiClient({
      baseUrl: url.origin.replace(/\/$/, ""),
      headers: {
        "X-StellarTools-Signature": signature,
        "X-StellarTools-Event": eventType,
        "User-Agent": "StellarTools-Webhooks/1.0",
      },
      maxRetries: 0,
    });

    const result = await client.postDetailed<Record<string, unknown>>(
      url.pathname.slice(1) || "",
      JSON.stringify(webhookPayload)
    );

    const duration = Date.now() - startTime;

    let statusCode: number | null = null;
    let responseData: any = null;
    let isSuccess = false;
    let errorMessage: string | null = null;

    if (result.isOk()) {
      statusCode = result.value.status;
      responseData = result.value.data;
      isSuccess = result.value.ok;
      if (!isSuccess) errorMessage = `Server returned ${statusCode}`;
    } else {
      console.log({ result });
      errorMessage = result.error.message;
    }

    await postWebhookLog(
      webhook.id,
      {
        id: webhookEventId,
        eventType,
        request: webhookPayload,
        statusCode,
        errorMessage,
        responseTime: duration,
        response: responseData,
        description: `Delivery to ${webhook.url}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        nextRetry: null,
        apiVersion: "2025-12-27.stellartools",
      },
      webhook.organizationId,
      webhook.environment
    );

    if (!isSuccess) {
      console.error(`✗ Webhook failed: ${webhook.url} (${statusCode})`);
      if (result.isErr()) console.log(result.error.message);
      throw new Error(errorMessage ?? "Delivery failed");
    }

    console.log(`✓ Webhook delivered: ${webhook.url} in ${duration}ms`);
    return { success: true };
  };
}
