import { StellarTools } from "@stellartools/core";
import type { BetterAuthOptions, BetterAuthPlugin, GenericEndpointContext, User } from "better-auth";

import * as routes from "./routes";
import { pluginSchema } from "./schema";
import type { BillingConfig } from "./types";

async function syncUserWithStellar(user: User, ctx: GenericEndpointContext<BetterAuthOptions>, options: BillingConfig) {
  const logger = ctx.context.logger;
  const client = new StellarTools({ apiKey: options.apiKey });

  const existing = await client.customers.list({ email: user.email });
  let customerId = existing.length > 0 && existing[0]?.id;
  let customerData = existing.length > 0 ? existing[0] : null;

  if (!customerId) {
    const created = await client.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        ...(user.image ? { image: user.image } : {}),
        ...(ctx.context.session?.session?.id ? { initialSessionId: ctx.context?.session?.session?.id } : {}),
      },
      wallets: [],
      source: "BetterAuth Adapter",
    });

    customerId = created.id;
    customerData = created;
  }

  await ctx.context.internalAdapter.updateUser(user.id, { stellarCustomerId: customerId });
  await options.onCustomerCreated?.(customerData!);

  logger.info(`Stellar: Linked customer ${customerId} to user ${user.id}`);
}

type RouteFactories = typeof routes;
type EndpointsFromRoutes<T> = {
  [K in keyof T]: T[K] extends (options: BillingConfig) => infer R ? R : never;
};

export const createBilling = (options: BillingConfig) => {
  const endpoints = Object.fromEntries(
    Object.entries(routes).map(([key, factory]) => [key, factory(options)])
  ) as EndpointsFromRoutes<RouteFactories>;

  return {
    id: "stellar-tools",
    endpoints,
    schema: pluginSchema,
    init: async () => ({
      options: {
        databaseHooks: {
          user: {
            create: {
              after: async (user, ctx) => {
                const shouldSync = ctx && options.createCustomerOnSignUp && !user.stellarCustomerId;
                if (shouldSync) await syncUserWithStellar(user, ctx, options);
              },
            },
          },
        },
      },
    }),
    options,
  } satisfies BetterAuthPlugin;
};

export type BillingPlugin = ReturnType<typeof createBilling>;
