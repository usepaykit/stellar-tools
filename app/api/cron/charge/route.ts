import { retrieveDueSubscriptions } from "@/actions/subscription";
import { SorobanContractApi } from "@/integrations/soroban-contract";

export const GET = async () => {
  const api = new SorobanContractApi("mainnet", process.env.KEEPER_SECRET!);

  const subs = await retrieveDueSubscriptions();

  for (const sub of subs) {
    const walletAddress = sub.customer.walletAddresses?.[0]?.address;

    if (!walletAddress) continue;

    // todo: better infrasture for handling wallets based on the one that approved the contract.
    const result = await api.charge(walletAddress, sub.subscription.productId);

    result
      .map((txHash) => {
        console.log(`Charge successful: ${txHash}`);
        // Send Webhook...
      })
      .mapErr((e) => {
        console.error(`Charge failed for ${sub.id}: ${e.message}`);
        // Mark as past_due...
      });
  }
};
