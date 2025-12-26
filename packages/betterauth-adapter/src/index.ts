import { StellarTools } from "@stellartools/core";
import type { BetterAuthPlugin } from "better-auth";

import {
  cancelSubscription,
  checkCredits,
  consumeCredits,
  createCustomer,
  createRefund,
  createSubscription,
  getTransactions,
  listSubscriptions,
  pauseSubscription,
  resumeSubscription,
  retrieveCustomer,
  retrieveSubscription,
  updateCustomer,
  updateSubscription,
} from "./routes";
import { pluginSchema } from "./schema";
import type { StellarToolsBetterAuthOptions } from "./types";

const stellarTools = (options: StellarToolsBetterAuthOptions) => {
  return {
    id: "stellar-tools",
    endpoints: {
      createCustomer: createCustomer(options),
      retrieveCustomer: retrieveCustomer(options),
      updateCustomer: updateCustomer(options),
      createSubscription: createSubscription(options),
      retrieveSubscription: retrieveSubscription(options),
      listSubscriptions: listSubscriptions(options),
      pauseSubscription: pauseSubscription(options),
      resumeSubscription: resumeSubscription(options),
      updateSubscription: updateSubscription(options),
      cancelSubscription: cancelSubscription(options),
      checkCredits: checkCredits(options),
      consumeCredits: consumeCredits(options),
      getTransactions: getTransactions(options),
      createRefund: createRefund(options),
    },
    schema: pluginSchema,
    init: async () => ({
      options: {
        databaseHooks: {
          user: {
            create: {
              after: async (user, ctx) => {
                if (!ctx || !options.createCustomerOnSignUp) return;

                const userWithStellar = user as typeof user & {
                  stellarCustomerId?: string;
                };

                // Skip if user already has a Stellar customer ID
                if (userWithStellar.stellarCustomerId) return;

                const client = new StellarTools({ apiKey: options.apiKey });

                const existingCustomer = await client.customers.list({
                  email: user.email,
                });

                if (existingCustomer.ok) {
                  await ctx.context.internalAdapter.updateUser(user.id, {
                    stellarCustomerId: existingCustomer.value!.id,
                  });

                  await options.onCustomerCreated?.(existingCustomer.value!);

                  ctx.context.logger.info(
                    `Linked existing Stellar customer ${existingCustomer.value!.id} to user ${user.id}`
                  );

                  return;
                }

                // Create a new customer
                const newCustomer = await client.customers.create({
                  email: user.email,
                  name: user.name,
                  appMetadata: { source: "betterauth-adapter" },
                });

                if (newCustomer.ok) {
                  await ctx.context.internalAdapter.updateUser(user.id, {
                    stellarCustomerId: newCustomer.value!.id,
                  });

                  await options.onCustomerCreated?.(newCustomer.value!);

                  ctx.context.logger.info(
                    `Created new Stellar customer ${newCustomer.value!.id} for user ${user.id}`
                  );
                } else {
                  ctx.context.logger.error(
                    `Failed to create or link Stellar customer: ${newCustomer.error?.message}`
                  );
                }
              },
            },
          },
        },
      },
    }),
    options,
  } satisfies BetterAuthPlugin;
};

type StellarToolsAdapter = ReturnType<typeof stellarTools>;

export { type StellarToolsAdapter, stellarTools };
