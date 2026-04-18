import { Result, z as Schema, updateWebhookSchema } from "@stellartools/core";
import { deleteWebhook, putWebhook, retrieveWebhooks } from "@stellartools/web/actions";
import { apiHandler, createOptionsHandler } from "@stellartools/web/lib";

export const OPTIONS = createOptionsHandler();

const paramsSchema = Schema.object({ id: Schema.string() });

export const GET = apiHandler({
  auth: ["session", "apikey"],
  schema: { params: paramsSchema },
  handler: async ({ params: { id }, auth: { organizationId, environment } }) => {
    return await retrieveWebhooks(organizationId, environment, { id }).then(Result.ok);
  },
});

export const PUT = apiHandler({
  auth: ["session", "apikey"],
  schema: { params: paramsSchema, body: updateWebhookSchema },
  handler: async ({ params: { id }, body, auth: { organizationId, environment } }) => {
    return await putWebhook(id, body, organizationId, environment).then(Result.ok);
  },
});

export const DELETE = apiHandler({
  auth: ["session", "apikey"],
  schema: { params: paramsSchema },
  handler: async ({ params: { id }, auth: { organizationId, environment } }) => {
    return await deleteWebhook(id, organizationId, environment).then(Result.ok);
  },
});
