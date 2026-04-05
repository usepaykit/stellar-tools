import { retrieveCustomerWallets } from "@/actions/customers";
import { putSubscription, retrieveSubscription } from "@/actions/subscription";
import { SorobanContractApi } from "@/integrations/soroban-contract";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { Result, z as Schema, updateSubscriptionSchema } from "@stellartools/core";
import { all } from "better-all";

export const OPTIONS = createOptionsHandler();

export const GET = apiHandler({
  auth: ["session", "apikey", "portal"],
  schema: { params: Schema.object({ id: Schema.string() }) },
  handler: async ({ params: { id }, auth: { organizationId, environment } }) => {
    const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);
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

    if (!customerWallet?.address) {
      return Result.err(new Error("Customer wallet not found"));
    }

    const onchainSubscription = await api.getSubscription(customerWallet.address, subscription.productId);

    if (!onchainSubscription) return Result.err(new Error("Subscription not found"));

    return Result.ok({ ...subscription, ...onchainSubscription });
  },
});

export const PUT = apiHandler({
  auth: ["session", "apikey", "portal"],
  schema: { body: updateSubscriptionSchema, params: Schema.object({ id: Schema.string() }) },
  handler: async ({ body: { metadata, cancelAtPeriodEnd }, params: { id }, auth: { organizationId, environment } }) => {
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

    if (!customerWallet?.address) return Result.err(new Error("Customer wallet not found"));

    const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);

    let cancellationResult: Awaited<ReturnType<typeof api.cancelSubscription>> | null = null;

    if (cancelAtPeriodEnd) {
      cancellationResult = await api.cancelSubscription(customerWallet.address, subscription.productId);
    }

    if (cancellationResult?.isErr()) return Result.err(cancellationResult.error);

    const updatedSubscription = await putSubscription(
      id,
      {
        ...(cancelAtPeriodEnd && { cancelAtPeriodEnd }),
        ...(metadata && { metadata: { ...(subscription.metadata ?? {}), ...metadata } }),
      },
      organizationId,
      environment
    );

    return Result.ok(updatedSubscription);
  },
});
