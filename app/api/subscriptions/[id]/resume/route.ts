import { retrieveCustomerWallet } from "@/actions/customers";
import { putSubscription, retrieveSubscription } from "@/actions/subscription";
import { SorobanContractApi } from "@/integrations/soroban-contract";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { Result, z as Schema } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: true,
  schema: { params: Schema.object({ id: Schema.string() }) },
  handler: async ({ params: { id }, auth: { organizationId, environment } }) => {
    const subscription = await retrieveSubscription(id);

    const customerWallet = await retrieveCustomerWallet(subscription.customerId, { id: subscription.customerWalletId });

    if (!customerWallet?.address) throw new Error("Customer wallet not found");

    const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);
    await api.resumeSubscription(customerWallet.address, subscription.productId);

    return await putSubscription(id, { status: "active", pausedAt: null }, organizationId, environment).then(Result.ok);
  },
});
