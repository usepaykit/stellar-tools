import { retrieveCustomerWallets } from "@/actions/customers";
import { putSubscription, retrieveSubscription } from "@/actions/subscription";
import { SorobanContractApi } from "@/integrations/soroban-contract";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { Result, z as Schema } from "@stellartools/core";
import { all } from "better-all";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: ["session", "apikey", "portal"],
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

    const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);

    const result = await api.resumeSubscription(customerWallet.address, subscription.productId);
    if (result.isErr()) return Result.err(new Error("Failed to resume subscription: " + result.error.message));

    return await putSubscription(id, { status: "active", pausedAt: null }, organizationId, environment).then(Result.ok);
  },
});
