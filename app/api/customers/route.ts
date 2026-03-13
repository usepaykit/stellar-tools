import { postCustomers, retrieveCustomers } from "@/actions/customers";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { Result, createCustomerSchema } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: true,
  schema: { body: createCustomerSchema },
  handler: async ({ body, auth: { organizationId, environment }, req }) => {
    const arrayBody = Array.isArray(body) ? body : [body];
    const source = req.headers.get("x-source") ?? "API";

    return await postCustomers(
      arrayBody.map((customer) => ({
        name: customer.name,
        email: customer.email,
        phone: customer.phone ?? null,
        image: customer.image ?? null,
        metadata: customer.metadata ?? null,
        wallets: customer.wallets ?? [],
      })),
      organizationId,
      environment,
      { source }
    ).then(Result.ok);
  },
});

export const GET = apiHandler({
  auth: true,
  schema: {},
  handler: async ({ auth: { organizationId, environment } }) => {
    const customers = await retrieveCustomers(undefined, { withWallets: true }, organizationId, environment);
    return Result.ok(customers);
  },
});
