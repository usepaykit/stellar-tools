import crypto from "crypto";

import { ApiClient } from "../api-client";
import { CreateWebhook, UpdateWebhook, Webhook, createWebhookSchema, updateWebhookSchema } from "../schema/webhooks";
import { ERR, OK, Result } from "../utils";

export class WebhookSigner {
  constructor() {}

  generateSignature(payload: string, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;

    const hmac = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

    return `t=${timestamp},v1=${hmac}`;
  }

  verifySignature(payload: string, signature: string, secret: string, tolerance: number = 300): boolean {
    try {
      const parts = signature.split(",");
      const timestamp = parseInt(parts[0].split("=")[1]);
      const receivedSignature = parts[1].split("=")[1];

      const now = Math.floor(Date.now() / 1000);

      if (Math.abs(now - timestamp) > tolerance) return false;

      const signedPayload = `${timestamp}.${payload}`;

      const expectedSignature = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

      return crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  }
}

export class WebhookApi extends WebhookSigner {
  constructor(private apiClient: ApiClient) {
    super();
  }

  async create(params: CreateWebhook): Promise<Result<Webhook, Error>> {
    const { error, data } = createWebhookSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const response = await this.apiClient.post<Webhook>("/webhooks", {
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return ERR(new Error(`Failed to create webhook: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }

  async retrieve(id: string): Promise<Result<Webhook, Error>> {
    const response = await this.apiClient.get<Webhook>(`/webhooks/${id}`);

    if (!response.ok) {
      return ERR(new Error(`Failed to retrieve webhook: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }

  async update(id: string, params: UpdateWebhook): Promise<Result<Webhook, Error>> {
    const { error, data } = updateWebhookSchema.safeParse(params);

    if (error) {
      return ERR(new Error(`Invalid parameters: ${error.message}`));
    }

    const response = await this.apiClient.put<Webhook>(`/webhooks/${id}`, {
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return ERR(new Error(`Failed to update webhook: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }

  async delete(id: string): Promise<Result<Webhook, Error>> {
    const response = await this.apiClient.delete<Webhook>(`/webhooks/${id}`);

    if (!response.ok) {
      return ERR(new Error(`Failed to delete webhook: ${response.error?.message}`));
    }

    return OK(response.value.data);
  }
}
