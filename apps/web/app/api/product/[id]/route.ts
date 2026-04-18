import { Result, z as Schema, updateProductSchema } from "@stellartools/core";
import { deleteProduct, putProduct } from "@stellartools/web/actions";
import { apiHandler, createOptionsHandler } from "@stellartools/web/lib";

export const OPTIONS = createOptionsHandler();

const paramsSchema = Schema.object({ id: Schema.string() });

export const PUT = apiHandler({
  auth: ["session", "apikey"],
  schema: { body: updateProductSchema, params: paramsSchema },
  handler: async ({ body, auth: { organizationId }, params: { id } }) => {
    const product = await putProduct(id, organizationId, body);
    return Result.ok(product);
  },
});

export const DELETE = apiHandler({
  auth: ["session", "apikey"],
  schema: { params: paramsSchema },
  handler: async ({ params: { id }, auth: { organizationId } }) => {
    const product = await deleteProduct(id, organizationId);
    return Result.ok(product);
  },
});
