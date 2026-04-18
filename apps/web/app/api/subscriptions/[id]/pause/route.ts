import { Result, z as Schema } from "@stellartools/core";
import { putSubscription, retrieveCustomerWallets, retrieveSubscription } from "@stellartools/web/actions";
import { pauseSubscription as pauseSorobanSubscription } from "@stellartools/web/integrations";
import { apiHandler, createOptionsHandler } from "@stellartools/web/lib";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: ["session", "apikey"],
  schema: { params: Schema.object({ id: Schema.string() }) },
  handler: async ({ params: { id }, auth: { organizationId, environment } }) => {
    const subscription = await retrieveSubscription(id, organizationId, environment);

    const [customerWallet] = await retrieveCustomerWallets(
      subscription.customerId,
      { id: subscription.customerWalletId },
      organizationId,
      environment
    );

    if (!customerWallet?.address) throw new Error("Customer wallet not found");

    const pauseResult = await pauseSorobanSubscription(
      environment,
      customerWallet.address,
      subscription.customerId,
      subscription.productId
    );

    if (pauseResult.isErr()) return Result.err(pauseResult.error);

    return await putSubscription(id, { status: "paused", pausedAt: new Date() }, organizationId, environment).then(
      (_) => Result.ok({ success: true })
    );
  },
});
