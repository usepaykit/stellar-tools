import { postCustomers, retrieveCustomers } from "@/actions/customers";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { Result, z as Schema, createCustomerSchema } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: ["session", "apikey", "app"],
  schema: { body: Schema.array(createCustomerSchema) },
  requiredAppScope: "write:customers",
  handler: async ({ body, auth: { organizationId, environment }, req }) => {
    const arrayBody = Array.isArray(body) ? body : [body];
    const source = req.headers.get("x-source") ?? "API";

    const response = await postCustomers(
      arrayBody.map((customer) => ({
        name: customer.name,
        email: customer.email,
        phone: customer.phone ?? null,
        image: customer.image ?? null,
        metadata: customer.metadata ?? null,
      })),
      organizationId,
      environment,
      { source }
    );

    return Result.ok(response);
  },
});

export const GET = apiHandler({
  auth: ["session", "apikey", "app"],
  requiredAppScope: "read:customers",
  schema: {},
  handler: async ({ auth: { organizationId, environment } }) => {
    const customers = await retrieveCustomers(undefined, { withWallets: true }, organizationId, environment);
    return Result.ok(customers);
  },
});
