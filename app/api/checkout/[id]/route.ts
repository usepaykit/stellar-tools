import { deleteCheckout, putCheckout, retrieveCheckout } from "@/actions/checkout";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { Result, z as Schema, updateCheckoutSchema } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

const paramsSchema = Schema.object({ id: Schema.string() });
export const GET = apiHandler({
  auth: ["session", "apikey", "app"],
  requiredAppScope: "read:checkouts",
  schema: { params: paramsSchema },
  handler: async ({ params: { id }, auth: { organizationId, environment } }) => {
    const checkout = await retrieveCheckout(id, organizationId, environment);
    return Result.ok(checkout);
  },
});

export const PUT = apiHandler({
  auth: ["session", "apikey", "app"],
  requiredAppScope: "write:checkouts",
  schema: { params: paramsSchema, body: updateCheckoutSchema },
  handler: async ({ params: { id }, auth: { organizationId, environment }, body }) => {
    const checkout = await putCheckout(id, body, organizationId, environment);
    return Result.ok(checkout);
  },
});

export const DELETE = apiHandler({
  auth: ["session", "apikey", "app"],
  requiredAppScope: "write:checkouts",
  schema: { params: paramsSchema },
  handler: async ({ params: { id }, auth: { organizationId, environment } }) => {
    await deleteCheckout(id, organizationId, environment);
    return Result.ok(null);
  },
});
