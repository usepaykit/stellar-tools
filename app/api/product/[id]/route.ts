import { putProduct } from "@/actions/product";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { Result, z as Schema, updateProductSchema } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

const paramsSchema = Schema.object({ id: Schema.string() });

export const PUT = apiHandler({
  auth: true,
  schema: { body: updateProductSchema, params: paramsSchema },
  handler: async ({ body, auth: { organizationId }, params: { id } }) => {
    const product = await putProduct(id, organizationId, body);
    return Result.ok(product);
  },
});
