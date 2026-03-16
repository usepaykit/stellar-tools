import { retrieveCustomers } from "@/actions/customers";
import { retrieveProducts } from "@/actions/product";
import { listSubscriptions, postSubscriptionsBulk } from "@/actions/subscription";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { generateResourceId } from "@/lib/utils";
import { createSubscriptionSchema } from "@stellartools/core";
import { Result, z as Schema } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: ["session"],
  schema: { body: createSubscriptionSchema },
  handler: async ({ body, auth: { organizationId, environment } }) => {
    const subscriptionId = generateResourceId("sub", organizationId, 20);

    const [customers, product] = await Promise.all([
      retrieveCustomers(
        body.customerIds.map((id) => ({ id })),
        { withWallets: true },
        organizationId,
        environment
      ),
      retrieveProducts(organizationId, environment, body.productId).then(([{ product }]) => product),
    ]);

    if (product.type !== "subscription") throw new Error("Product must be a subscription type");

    // For subscriptions created via classic Stellar payment (SEP-7/QR flow),
    // on-chain state is managed through the checkout wallet-pay flow (approve → start).
    // Here we only create the database subscription records after the payment is confirmed.
    const customerIds = customers.filter((c) => c.wallets?.[0]?.address).map((c) => c.id);

    if (customerIds.length === 0) {
      throw new Error("No customers with wallets found");
    }

    await postSubscriptionsBulk(
      {
        id: subscriptionId,
        customerIds,
        productId: body.productId,
        period: body.period,
        cancelAtPeriodEnd: body.cancelAtPeriodEnd ?? false,
        metadata: null,
      },
      organizationId,
      environment
    );

    return Result.ok({
      success: customerIds,
      failed: [],
      productId: body.productId,
      period: body.period,
      totalRequested: body.customerIds?.length,
    });
  },
});

export const GET = apiHandler({
  auth: ["session", "apikey"],
  schema: { query: Schema.object({ customerId: Schema.string() }) },
  handler: async ({ query: { customerId }, auth: { environment } }) => {
    return await listSubscriptions(customerId, environment).then(Result.ok);
  },
});
