import { runAtomic } from "@/actions/event";
import { postPayment } from "@/actions/payment";
import { putSubscription, retrieveDueSubscriptions } from "@/actions/subscription";
import { rawDb } from "@/db";
import {
  cancelSubscription as cancelSorobanSubscription,
  chargeSubscription as chargeSorobanSubscription,
} from "@/integrations/soroban-contract";
import { xlmToStroops } from "@/lib/utils";
import { EventSchemas, Inngest } from "inngest";

type Events = {
  "cron/sweep-checkouts": {
    data: {};
    name: "cron/sweep-checkouts";
  };
  "cron/charge-subscriptions": {
    data: {};
    name: "cron/charge-subscriptions";
  };
};

export class CronJobApi {
  private client: Inngest<{ id: "stellartools"; schemas: EventSchemas<Events> }>;

  constructor() {
    this.client = new Inngest({
      id: "stellartools",
      eventKey: process.env.INNGEST_EVENT_KEY,
      schemas: new EventSchemas().fromRecord<Events>(),
    });
  }

  getClient() {
    return this.client;
  }

  getFunctions() {
    return [this.chargeDueSubscriptions()];
  }

  private chargeDueSubscriptions() {
    return this.client.createFunction(
      {
        id: "charge-due-subscriptions",
        name: "Charge Due Subscriptions",
      },
      { cron: "*/5 * * * *" },
      async ({ step }) => {
        const subs = await step.run("fetch-due-subscriptions", () => retrieveDueSubscriptions());

        const results = await step.run("process-charges", async () => {
          const keeperSecret = process.env.KEEPER_SECRET;

          if (!keeperSecret) return { processed: 0, succeeded: 0, failed: 0 };

          let succeeded = 0;
          let failed = 0;

          for (const sub of subs) {
            const {
              subscription: { organizationId, environment, id: subscriptionId, productId },
              wallet: { address: walletAddress },
            } = sub;

            try {
              if (sub.subscription.cancelAtPeriodEnd) {
                await runAtomic(async () => {
                  const cancellationResult = await cancelSorobanSubscription(
                    environment,
                    walletAddress,
                    sub.customer.id,
                    productId
                  );

                  if (cancellationResult.isOk()) {
                    await putSubscription(
                      subscriptionId,
                      { status: "canceled", canceledAt: new Date() },
                      organizationId,
                      environment,
                      rawDb
                    );
                  }
                });

                succeeded += 1;
                continue;
              }

              if (!walletAddress) {
                failed += 1;
                continue;
              }

              const chargeResult = await chargeSorobanSubscription(
                environment,
                walletAddress,
                sub.customer.id,
                productId
              );

              if (chargeResult.isErr()) {
                failed += 1;
                continue;
              }

              const paymentEvent = chargeResult.value.events.find((e: { topic: string }) => e.topic === "sub_pay");

              console.log("paymentEvent", paymentEvent);

              if (!paymentEvent) {
                failed += 1;
                continue;
              }

              await runAtomic(async () => {
                if (!paymentEvent.success) {
                  await postPayment(
                    {
                      checkoutId: null,
                      customerId: sub.customer.id,
                      amount: xlmToStroops(paymentEvent.data.amount),
                      transactionHash: chargeResult.value.hash,
                      status: "failed",
                      metadata: null,
                      assetId: sub.subscription.assetId,
                      subscriptionId: sub.subscription.id,
                      amountUsdCentsSnapshot: BigInt(0),
                    },
                    sub.subscription.organizationId,
                    sub.subscription.environment,
                    { customerWalletAddress: chargeResult.value.customerWalletAddress },
                    rawDb
                  );
                  throw new Error("On-chain payment failure recorded");
                }

                await putSubscription(
                  sub.subscription.id,
                  {
                    status: "active",
                    currentPeriodEnd: new Date(paymentEvent.data.periodEnd),
                  },
                  sub.subscription.organizationId,
                  sub.subscription.environment,
                  rawDb
                );

                await postPayment(
                  {
                    checkoutId: null,
                    customerId: sub.customer.id,
                    amount: xlmToStroops(paymentEvent.data.amount),
                    transactionHash: chargeResult.value.hash,
                    status: "confirmed",
                    metadata: null,
                    assetId: sub.subscription.assetId,
                    subscriptionId: sub.subscription.id,
                    amountUsdCentsSnapshot: BigInt(0),
                  },
                  sub.subscription.organizationId,
                  sub.subscription.environment,
                  { customerWalletAddress: chargeResult.value.customerWalletAddress },
                  rawDb
                );
              });

              succeeded += 1;
            } catch (err) {
              failed += 1;
              console.error(`[Atomic Process Error] Sub: ${sub.subscription.id}:`, err);
            }
          }

          return { processed: subs.length, succeeded, failed };
        });

        return {
          ...results,
          timestamp: new Date().toISOString(),
        };
      }
    );
  }

  async triggerSweep() {
    await this.client.send({
      name: "cron/sweep-checkouts",
      data: {},
    });
  }
}
