import { StellarTools } from "@stellartools/core";
import type { BetterAuthPlugin, Endpoint } from "better-auth";

import * as routes from "./routes";
import { pluginSchema } from "./schema";
import type { StellarToolsBetterAuthOptions } from "./types";

async function syncUserWithStellar(user: any, ctx: any, options: StellarToolsBetterAuthOptions) {
  const logger = ctx.context.logger;
  const client = new StellarTools({ apiKey: options.apiKey });

  const existing = await client.customers.list({ email: user.email });
  let customerId = existing.isOk() && existing.value[0]?.id;
  let customerData = existing.isOk() ? existing.value[0] : null;

  if (!customerId) {
    const created = await client.customers.create({
      email: user.email,
      name: user.name,
      metadata: { source: "betterauth-plugin" },
    });

    if (created.isErr()) {
      return logger.error(`Stellar Sync Failed: ${created.error.message}`);
    }

    customerId = created.value.id;
    customerData = created.value;
  }

  await ctx.context.internalAdapter.updateUser(user.id, { stellarCustomerId: customerId });
  await options.onCustomerCreated?.(customerData!);

  logger.info(`Stellar: Linked customer ${customerId} to user ${user.id}`);
}

export const stellarTools = (options: StellarToolsBetterAuthOptions) => {
  return {
    id: "stellar-tools",
    endpoints: Object.fromEntries(Object.entries(routes).map(([key, value]) => [key, value(options as any)])) as Record<
      string,
      Endpoint
    >,
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

export type StellarToolsAdapter = ReturnType<typeof stellarTools>;
