import { Result, z as Schema } from "@stellartools/core";
import { putSubscription, retrieveCustomerWallets, retrieveSubscription } from "@stellartools/web/actions";
import { cancelSubscription as cancelSorobanSubscription } from "@stellartools/web/integrations";
import { apiHandler, createOptionsHandler } from "@stellartools/web/lib";
import { all } from "better-all";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: ["session", "apikey"],
  schema: { params: Schema.object({ id: Schema.string() }) },
  handler: async ({ params: { id }, auth: { organizationId, environment } }) => {
    const { subscription, customerWallet } = await all({
      subscription: async () => retrieveSubscription(id, organizationId, environment),
      async customerWallet() {
        const subscription = await this.$.subscription;
        return await retrieveCustomerWallets(
          subscription.customerId,
          { id: subscription.customerWalletId },
          organizationId,
          environment
        ).then(([w]) => w ?? null);
      },
    });

    if (!customerWallet?.address) throw new Error("Customer wallet not found");

    const cancellationResult = await cancelSorobanSubscription(
      environment,
      customerWallet.address,
      subscription.customerId,
      subscription.productId
    );

    if (cancellationResult.isErr()) return Result.err(cancellationResult.error);

    return await putSubscription(
      id,
      { canceledAt: new Date(), cancelAtPeriodEnd: true },
      organizationId,
      environment
    ).then((_) => Result.ok({ success: true }));
  },
});
