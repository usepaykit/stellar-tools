import { Result, z as Schema, updateCustomerSchema } from "@stellartools/core";
import { deleteCustomer, putCustomer, retrieveCustomers } from "@stellartools/web/actions";
import { apiHandler, createOptionsHandler } from "@stellartools/web/lib";

export const OPTIONS = createOptionsHandler();

const paramsSchema = Schema.object({ customerId: Schema.string() });

export const GET = apiHandler({
  auth: ["session", "apikey"],
  schema: { params: paramsSchema },
  handler: async ({ params, auth }) => {
    const [customer] = await retrieveCustomers(
      { id: params.customerId },
      { withWallets: true },
      auth.organizationId,
      auth.environment
    );
    return Result.ok(customer);
  },
});

export const PUT = apiHandler({
  auth: ["session", "apikey", "portal"],
  schema: {
    params: paramsSchema,
    body: updateCustomerSchema,
  },
  handler: async ({ params, body, auth, req }) => {
    const source = req.headers.get("x-source");
    const customer = await putCustomer(params.customerId, body, auth.organizationId, auth.environment, {
      ...(source && { source }),
    });
    return Result.ok(customer);
  },
});

export const DELETE = apiHandler({
  auth: ["session", "apikey"],
  schema: { params: paramsSchema },
  handler: async ({ params, auth }) => {
    await deleteCustomer(params.customerId, auth.organizationId, auth.environment);
    return Result.ok(null);
  },
});
