import { GenericEndpointContext, z } from "better-auth";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";

import { BillingConfig } from "./types";
import { getContext, unwrap } from "./utils";

export const retrieveOrCreateCustomer = async (ctx: GenericEndpointContext): Promise<string> => {
  const { user, stellar, adapter } = getContext(ctx, { apiKey: ctx.context.config.apiKey });

  const dbUser = await adapter.findOne<{ stellarCustomerId: string }>({
    model: "user",
    where: [{ field: "id", value: user.id }],
  });

  if (dbUser?.stellarCustomerId) return dbUser.stellarCustomerId;

  const customer = unwrap(
    await stellar.customers.create({
      email: user.email,
      name: user.name,
      metadata: { source: "betterauth-adapter" },
    })
  );

  await adapter.update({
    model: "user",
    where: [{ field: "id", value: user.id }],
    update: { stellarCustomerId: customer.id },
  });

  return customer.id;
};

// -- CUSTOMERS --

export const createCustomer = (options: BillingConfig) =>
  createAuthEndpoint("/stellar/customer/create", { method: "POST", use: [sessionMiddleware] }, async (ctx) => {
    const customerId = await retrieveOrCreateCustomer(ctx);
    const { stellar } = getContext(ctx, options);
    const result = unwrap(await stellar.customers.retrieve(customerId));

    options?.onCustomerCreated?.(result);
    return ctx.json(result);
  });

export const retrieveCustomer = (options: BillingConfig) =>
  createAuthEndpoint("/stellar/customer/retrieve", { method: "GET", use: [sessionMiddleware] }, async (ctx) => {
    const { user, stellar } = getContext(ctx, options);
    return ctx.json(unwrap(await stellar.customers.retrieve(user.stellarCustomerId as string)));
  });

export const updateCustomer = (options: BillingConfig) =>
  createAuthEndpoint(
    "/stellar/customer/update",
    {
      method: "POST",
      body: z.object({
        email: z.email().optional(),
        name: z.string().optional(),
        phone: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { user, stellar } = getContext(ctx, options);
      return ctx.json(unwrap(await stellar.customers.update(user.stellarCustomerId, ctx.body)));
    }
  );

// -- SUBSCRIPTIONS --

export const createSubscription = (options: BillingConfig) =>
  createAuthEndpoint(
    "/stellar/subscription/create",
    {
      method: "POST",
      body: z.object({
        productId: z.string(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        cancelAtPeriodEnd: z.boolean(),
        period: z.object({ from: z.coerce.date(), to: z.coerce.date() }),
      }),
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const customerId = await retrieveOrCreateCustomer(ctx);
      const { stellar } = getContext(ctx, options);
      const sub = unwrap(await stellar.subscriptions.create({ customerIds: [customerId], ...ctx.body }));

      options?.onSubscriptionCreated?.(sub);

      return ctx.json(sub);
    }
  );

export const listSubscriptions = (options: BillingConfig) =>
  createAuthEndpoint("/stellar/subscription/list", { method: "GET", use: [sessionMiddleware] }, async (ctx) => {
    const { user, stellar } = getContext(ctx, options);
    return ctx.json(unwrap(await stellar.subscriptions.list(user.stellarCustomerId)));
  });

// -- REFUNDS --

const DEFAULT_CREDITS_LOW_THRESHOLD = 10;

export const consumeCredits = (options: BillingConfig) =>
  createAuthEndpoint(
    "/stellar/credits/consume",
    {
      method: "POST",
      body: z.object({
        productId: z.string(),
        rawAmount: z.number(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const customerId = await retrieveOrCreateCustomer(ctx);
      const { stellar } = getContext(ctx, options);

      // Use "BAD_REQUEST" for consumption failures (e.g., insufficient balance)
      const result = unwrap(
        await stellar.credits.consume(customerId, {
          ...ctx.body,
          reason: "deduct",
          metadata: { ...ctx.body.metadata, source: "betterauth-adapter" },
        })
      );

      if (options.onCreditsLow && result.balance <= (options.creditLowThreshold ?? DEFAULT_CREDITS_LOW_THRESHOLD)) {
        await options.onCreditsLow({ ...result, customerId });
      }

      return ctx.json(result);
    }
  );

export const getTransactions = (options: BillingConfig) =>
  createAuthEndpoint(
    "/stellar/credits/transactions",
    {
      method: "GET",
      query: z.object({
        productId: z.string(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      }),
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const customerId = await retrieveOrCreateCustomer(ctx);
      const { stellar } = getContext(ctx, options);

      // ctx.query already contains productId, limit, and offset
      const result = unwrap(await stellar.credits.getTransactions(customerId, ctx.query));

      return ctx.json(result);
    }
  );
// -- REFUNDS --

export const createRefund = (options: BillingConfig) =>
  createAuthEndpoint(
    "/stellar/refund/create",
    {
      method: "POST",
      body: z.object({
        paymentId: z.string(),
        amount: z.number(),
        reason: z.string(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        receiverPublicKey: z.string(),
      }),
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { stellar } = getContext(ctx, options);
      return ctx.json(
        unwrap(
          await stellar.refunds.create({
            ...ctx.body,
            metadata: { ...ctx.body.metadata, source: "betterauth-adapter" },
          })
        )
      );
    }
  );
