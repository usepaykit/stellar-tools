import { retrieveCustomers } from "@/actions/customers";
import { retrieveProduct } from "@/actions/product";
import { listSubscriptions, postSubscriptionsBulk } from "@/actions/subscription";
import { SorobanContractApi } from "@/integrations/soroban-contract";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { createSubscriptionSchema } from "@stellartools/core";
import { Result, z as Schema } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: ["session", "apikey"],
  schema: { body: createSubscriptionSchema },
  handler: async ({ body, auth: { organizationId, environment }, authToken }) => {
    const [customers, product] = await Promise.all([
      retrieveCustomers(
        body.customerIds.map((id) => ({ id })),
        { withWallets: true },
        organizationId,
        environment
      ),
      retrieveProduct(body.productId, organizationId),
    ]);

    if (product.type !== "subscription") throw new Error("Product must be a subscription type");

    const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);
    const successfulCustomerIds: string[] = [];
    const failedLogs: string[] = [];

    for (const customer of customers) {
      const wallet = customer.wallets?.[0];
      const customerAddress = wallet?.address;

      if (!customerAddress) {
        failedLogs.push(`Customer ${customer.id}: Missing wallet.`);
        continue;
      }

      const onChainResult = await api.createSubscription({
        customerAddress,
        productId: body.productId,
        amount: product.priceAmount,
        periodStart: Math.floor(body.period.from.getTime() / 1000),
        periodEnd: Math.floor(body.period.to.getTime() / 1000),
      });

      if (onChainResult.isOk()) {
        successfulCustomerIds.push(customer.id);
      } else {
        failedLogs.push(`Customer ${customer.id}: ${onChainResult.error.message}`);
      }
    }

    if (successfulCustomerIds.length === 0) {
      throw new Error(`All transactions failed: ${failedLogs.join(" | ")}`);
    }

    await postSubscriptionsBulk(
      {
        customerIds: successfulCustomerIds,
        productId: body.productId,
        period: body.period,
        cancelAtPeriodEnd: body.cancelAtPeriodEnd ?? false,
      },
      organizationId,
      environment
    );

    return Result.ok({
      success: successfulCustomerIds,
      failed: failedLogs,
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
