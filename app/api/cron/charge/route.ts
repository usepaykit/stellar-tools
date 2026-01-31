import { postPayment } from "@/actions/payment";
import { putSubscription, retrieveDueSubscriptions } from "@/actions/subscription";
import { SorobanContractApi } from "@/integrations/soroban-contract";

export const GET = async () => {
  const api = new SorobanContractApi("mainnet", process.env.KEEPER_SECRET!);

  const subs = await retrieveDueSubscriptions();

  for (const sub of subs) {
    const walletAddress = sub.customer.walletAddresses?.[0]?.address;

    if (!walletAddress) continue;

    const result = await api.charge(walletAddress, sub.subscription.productId);

    if (result.isErr()) continue;

    const findEventByTopic = (events: typeof result.value.events, topic: string) => {
      return events.find((event) => event.topic === topic);
    };

    const paymentEvent = findEventByTopic(result.value.events, "sub_pay");

    if (!paymentEvent) continue;

    if (!paymentEvent.success) {
      await postPayment(
        {
          checkoutId: null,
          customerId: sub.customer.id,
          amount: parseInt(paymentEvent.data.amount),
          transactionHash: result.value.hash,
          status: "failed",
        },
        sub.subscription.organizationId,
        sub.subscription.environment
      );
      continue;
    }

    await Promise.all([
      putSubscription(
        sub.subscription.id,
        { status: "active", currentPeriodEnd: new Date(paymentEvent.data.periodEnd) },
        sub.subscription.organizationId,
        sub.subscription.environment
      ),
      postPayment(
        {
          checkoutId: null,
          customerId: sub.customer.id,
          amount: parseInt(paymentEvent.data.amount),
          transactionHash: result.value.hash,
          status: "confirmed",
        },
        sub.subscription.organizationId,
        sub.subscription.environment
      ),
    ]);
  }
};
