import { retrieveCustomerWallets } from "@/actions/customers";
import { putSubscription, retrieveSubscription } from "@/actions/subscription";
import { SorobanContractApi } from "@/integrations/soroban-contract";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { Result, z as Schema } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: ["session", "apikey"],
  schema: { params: Schema.object({ id: Schema.string() }) },
  handler: async ({ params: { id }, auth: { organizationId, environment } }) => {
    const subscription = await retrieveSubscription(id);

    const [customerWallet] = await retrieveCustomerWallets(subscription.customerId, {
      id: subscription.customerWalletId,
    });

    if (!customerWallet?.address) throw new Error("Customer wallet not found");

    const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);
    const response = await api.pauseSubscription(customerWallet.address, subscription.productId);

    console.log({ response });
    
    return await putSubscription(id, { status: "paused", pausedAt: new Date() }, organizationId, environment).then(
      Result.ok
    );
  },
});
