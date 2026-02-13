import { retrieveCheckouts } from "@/actions/checkout";
import { postPayment, sweepAndProcessPayment } from "@/actions/payment";
import { putSubscription, retrieveDueSubscriptions } from "@/actions/subscription";
import { Network } from "@/db";
import { SorobanContractApi } from "@/integrations/soroban-contract";
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
    return [this.sweepOpenCheckouts(), this.chargeDueSubscriptions()];
  }

  private sweepOpenCheckouts() {
    return this.client.createFunction(
      {
        id: "sweep-open-checkouts",
        name: "Sweep Open Checkouts Every 5 Seconds",
      },
      { cron: "* * * * *" }, // Every minute
      async ({ step }) => {
        console.log("Sweeping open checkouts");
        const checkouts = await step.run("fetch-open-checkouts", async () => {
          return await retrieveCheckouts(undefined, undefined, { status: "open" }, true);
        });

        console.log({ checkouts });

        const results = await step.run("process-payments", async () => {
          return await Promise.allSettled(
            checkouts.map((checkout) =>
              sweepAndProcessPayment(checkout.id).catch((error) => ({
                checkoutId: checkout.id,
                error: error.message,
              }))
            )
          );
        });

        const succeeded = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;

        return {
          total: checkouts.length,
          succeeded,
          failed,
          timestamp: new Date().toISOString(),
        };
      }
    );
  }

  private chargeDueSubscriptions() {
    return this.client.createFunction(
      {
        id: "charge-due-subscriptions",
        name: "Charge Due Subscriptions",
      },
      { cron: "0 * * * *" }, // Every hour
      async ({ step }) => {
        const subs = await step.run("fetch-due-subscriptions", () => retrieveDueSubscriptions());

        const results = await step.run("process-charges", async () => {
          const keeperSecret = process.env.KEEPER_SECRET;
          if (!keeperSecret) return { processed: 0, succeeded: 0, failed: 0 };

          let succeeded = 0;
          let failed = 0;

          for (const sub of subs) {
            const walletAddress = sub.wallet.address;
            if (!walletAddress) continue;

            const env = sub.subscription.environment as Network;
            const api = new SorobanContractApi(env, keeperSecret);
            const result = await api.charge(walletAddress, sub.subscription.productId);

            if (result.isErr()) {
              failed += 1;
              continue;
            }

            const paymentEvent = result.value.events.find((e) => e.topic === "sub_pay");
            if (!paymentEvent) {
              failed += 1;
              continue;
            }

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
              failed += 1;
              continue;
            }

            await Promise.all([
              putSubscription(
                sub.subscription.id,
                {
                  status: "active",
                  currentPeriodEnd: new Date(paymentEvent.data.periodEnd),
                },
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
            succeeded += 1;
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
