import { postWebhook } from "@/actions/webhook";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { generateResourceId } from "@/lib/utils";
import { Result, z as Schema, createWebhookSchema } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: ["session", "apikey"],
  schema: { body: createWebhookSchema.extend({ secret: Schema.string().optional() }) },
  handler: async ({ body, auth: { organizationId, environment }, authToken }) => {
    const webhookPayload = {
      name: body.name,
      url: body.url,
      events: body.events,
      isDisabled: false,
      description: body.description ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      secret: authToken && body.secret ? body.secret : generateResourceId("whsec", organizationId, 32, "sha256"),
    };

    return await postWebhook(organizationId, environment, webhookPayload).then(Result.ok);
  },
});
