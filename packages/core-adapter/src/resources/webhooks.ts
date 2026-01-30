import { Result } from "better-result";
import crypto from "crypto";
import { z } from "zod";

import { ApiClient } from "../api-client";
import { CreateWebhook, UpdateWebhook, Webhook, createWebhookSchema, updateWebhookSchema } from "../schema/webhooks";
import { validateSchema } from "../utils";

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

  async create(params: CreateWebhook) {
    return Result.andThenAsync(validateSchema(createWebhookSchema, params), async (data) => {
      const response = await this.apiClient.post<Webhook>("/webhooks", data);
      return response.map((r) => r.data);
    });
  }

  async retrieve(id: string) {
    return Result.andThenAsync(validateSchema(z.string(), id), async (id) => {
      const response = await this.apiClient.get<Webhook>(`/webhooks/${id}`);
      return response.map((r) => r.data);
    });
  }

  async update(id: string, params: UpdateWebhook) {
    return Result.andThenAsync(validateSchema(updateWebhookSchema, params), async (data) => {
      const response = await this.apiClient.put<Webhook>(`/webhooks/${id}`, data);
      return response.map((r) => r.data);
    });
  }

  async delete(id: string): Promise<Result<Webhook, Error>> {
    return Result.andThenAsync(validateSchema(z.string(), id), async (id) => {
      const response = await this.apiClient.delete<Webhook>(`/webhooks/${id}`);
      return response.map((r) => r.data);
    });
  }
}
