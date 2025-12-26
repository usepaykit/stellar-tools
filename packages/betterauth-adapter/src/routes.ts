import { StellarTools } from "@stellartools/core";
import { APIError, GenericEndpointContext, z } from "better-auth";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";

import { StellarToolsBetterAuthOptions } from "./types";

export const retrieveOrCreateCustomer = async (
  ctx: GenericEndpointContext
): Promise<string> => {
  const session = ctx.context.session;

  if (!session?.user) {
    throw new APIError("UNAUTHORIZED");
  }

  const user = await ctx.context.adapter.findOne<{ stellarCustomerId: string }>(
    {
      model: "user",
      where: [{ field: "id", value: session.user.id }],
    }
  );

  if (user?.stellarCustomerId) return user.stellarCustomerId;

  const stellar = new StellarTools({ apiKey: ctx.context.config.apiKey });

  const result = await stellar.customers.create({
    email: session.user.email,
    name: session.user.name,
    appMetadata: { source: "betterauth-adapter" },
  });

  if (!result.ok) {
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: "Failed to create customer",
    });
  }

  await ctx.context.adapter.update({
    model: "user",
    where: [{ field: "id", value: session.user.id }],
    update: { stellarCustomerId: result.value!.id },
  });

  return result.value!.id;
};

// -- CUSTOMERS --

export const createCustomer = (options: StellarToolsBetterAuthOptions) => {
  return createAuthEndpoint(
    "/stellar/customer/create",
    {
      method: "POST",
      metadata: {
        openapi: {
          operationId: "createCustomer",
          summary: "Create a customer",
          description: "Create a customer for a user",
          tags: ["stellar", "customer"],
        },
      },
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const session = ctx.context.session;
      if (!session?.user) {
        throw new APIError("UNAUTHORIZED");
      }

      const stellar = new StellarTools({ apiKey: options.apiKey });

      const result = await stellar.customers.create({
        email: session.user.email,
        name: session.user.name,
        appMetadata: { source: "betterauth-adapter" },
      });

      if (!result.ok) {
        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: result.error.message,
        });
      }

      await ctx.context.adapter.update({
        model: "user",
        where: [{ field: "id", value: session.user.id }],
        update: { stellarCustomerId: result.value!.id },
      });

      return ctx.json(result.value!);
    }
  );
};

export const retrieveCustomer = (options: StellarToolsBetterAuthOptions) => {
  return createAuthEndpoint(
    "/stellar/customer/retrieve",
    {
      method: "GET",
      metadata: {
        openapi: {
          operationId: "retrieveCustomer",
          summary: "Retrieve a customer",
          description: "Retrieve a customer for a user",
          tags: ["stellar", "customer"],
        },
      },
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const session = ctx.context.session;

      if (!session?.user) throw new APIError("UNAUTHORIZED");

      const stellar = new StellarTools({ apiKey: options.apiKey });
      const customerId = session.user.stellarCustomerId as string;

      const result = await stellar.customers.retrieve(customerId);

      if (!result.ok) {
        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: result.error.message,
        });
      }

      return ctx.json(result.value!);
    }
  );
};

export const updateCustomer = (options: StellarToolsBetterAuthOptions) => {
  return createAuthEndpoint(
    "/stellar/customer/update",
    {
      method: "POST",
      body: z.object({
        email: z.email().optional(),
        name: z.string().optional(),
        phone: z.string().optional(),
        appMetadata: z.record(z.string(), z.unknown()).optional(),
      }),
      metadata: {
        openapi: {
          operationId: "updateCustomer",
          summary: "Update a customer",
          description: "Update a customer for a user",
          tags: ["stellar", "customer"],
        },
      },
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const session = ctx.context.session;

      if (!session?.user) throw new APIError("UNAUTHORIZED");

      const stellar = new StellarTools({ apiKey: options.apiKey });
      const customerId = session.user.stellarCustomerId as string;
      const email = ctx.body.email;
      const name = ctx.body.name;
      const phone = ctx.body.phone;
      const appMetadata = ctx.body.appMetadata;

      const result = await stellar.customers.update(customerId, {
        ...(email && { email }),
        ...(name && { name }),
        ...(phone && { phone }),
        ...(appMetadata && { appMetadata }),
      });

      if (!result.ok) {
        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: result.error.message,
        });
      }

      return ctx.json(result.value!);
    }
  );
};

// -- SUBSCRIPTIONS --

export const createSubscription = (options: StellarToolsBetterAuthOptions) => {
  return createAuthEndpoint(
    "/stellar/subscription/create",
    {
      method: "POST",
      body: z.object({
        productId: z.string(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
      metadata: {
        openapi: {
          operationId: "createSubscription",
          summary: "Create a subscription",
          description: "Create a subscription for a customer",
          tags: ["stellar", "subscription"],
        },
      },
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const customerId = await retrieveOrCreateCustomer(ctx);
      const stellar = new StellarTools({ apiKey: options.apiKey });

      const result = await stellar.subscriptions.create({
        customerId,
        productId: ctx.body.productId,
        metadata: ctx.body.metadata,
      });

      if (!result.ok) {
        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: result.error.message,
        });
      }

      return ctx.json(result.value!);
    }
  );
};

export const retrieveSubscription = (
  options: StellarToolsBetterAuthOptions
) => {
  return createAuthEndpoint(
    "/stellar/subscription/retrieve",
    {
      method: "GET",
      metadata: {
        openapi: {
          operationId: "retrieveSubscription",
          summary: "Retrieve a subscription",
          description: "Retrieve a subscription for a customer",
          tags: ["stellar", "subscription"],
        },
      },
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const session = ctx.context.session;

      if (!session?.user) {
        throw new APIError("UNAUTHORIZED");
      }

      const stellar = new StellarTools({ apiKey: options.apiKey });

      const result = await stellar.subscriptions.retrieve(
        session.user.stellarCustomerId as string
      );

      return ctx.json(result.value!);
    }
  );
};

export const listSubscriptions = (options: StellarToolsBetterAuthOptions) => {
  return createAuthEndpoint(
    "/stellar/subscription/list",
    {
      method: "GET",
      metadata: {
        openapi: {
          operationId: "listSubscriptions",
          summary: "List subscriptions",
          description: "List subscriptions for a customer",
          tags: ["stellar", "subscription"],
        },
      },
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const session = ctx.context.session;

      if (!session?.user) {
        throw new APIError("UNAUTHORIZED");
      }

      const stellar = new StellarTools({ apiKey: options.apiKey });
      const customerId = session.user.stellarCustomerId as string;

      const result = await stellar.subscriptions.list(customerId);

      if (!result.ok) {
        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: result.error.message,
        });
      }

      return ctx.json(result.value!);
    }
  );
};

export const pauseSubscription = (options: StellarToolsBetterAuthOptions) => {
  return createAuthEndpoint(
    "/stellar/subscription/pause",
    {
      method: "POST",
      body: z.object({
        subscriptionId: z.string(),
      }),
      metadata: {
        openapi: {
          operationId: "pauseSubscription",
          summary: "Pause a subscription",
          description: "Pause a subscription for a customer",
          tags: ["stellar", "subscription"],
        },
      },
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const session = ctx.context.session;

      if (!session?.user) {
        throw new APIError("UNAUTHORIZED");
      }

      const stellar = new StellarTools({ apiKey: options.apiKey });
      const subscriptionId = ctx.body.subscriptionId;

      const result = await stellar.subscriptions.pause(subscriptionId);

      if (!result.ok) {
        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: result.error.message,
        });
      }

      return ctx.json(result.value!);
    }
  );
};

export const resumeSubscription = (options: StellarToolsBetterAuthOptions) => {
  return createAuthEndpoint(
    "/stellar/subscription/resume",
    {
      method: "POST",
      body: z.object({
        subscriptionId: z.string(),
      }),
      metadata: {
        openapi: {
          operationId: "resumeSubscription",
          summary: "Resume a subscription",
          description: "Resume a subscription for a customer",
          tags: ["stellar", "subscription"],
        },
      },
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const session = ctx.context.session;

      if (!session?.user) {
        throw new APIError("UNAUTHORIZED");
      }

      const stellar = new StellarTools({ apiKey: options.apiKey });
      const subscriptionId = ctx.body.subscriptionId;

      const result = await stellar.subscriptions.resume(subscriptionId);

      if (!result.ok) {
        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: result.error.message,
        });
      }

      return ctx.json(result.value!);
    }
  );
};

export const updateSubscription = (options: StellarToolsBetterAuthOptions) => {
  return createAuthEndpoint(
    "/stellar/subscription/update",
    {
      method: "POST",
      body: z.object({
        subscriptionId: z.string(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        cancelAtPeriodEnd: z.boolean().optional(),
        nextBillingDate: z.string().optional(),
      }),
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const session = ctx.context.session;

      if (!session?.user) {
        throw new APIError("UNAUTHORIZED");
      }

      const stellar = new StellarTools({ apiKey: options.apiKey });
      const subscriptionId = ctx.body.subscriptionId;
      const metadata = ctx.body.metadata;
      const cancelAtPeriodEnd = ctx.body.cancelAtPeriodEnd;
      const nextBillingDate = ctx.body.nextBillingDate;

      const result = await stellar.subscriptions.update(subscriptionId, {
        ...(metadata && { metadata }),
        ...(cancelAtPeriodEnd && { cancelAtPeriodEnd }),
        ...(nextBillingDate && { nextBillingDate }),
      });

      if (!result.ok) {
        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: result.error.message,
        });
      }

      return ctx.json(result.value!);
    }
  );
};

export const cancelSubscription = (options: StellarToolsBetterAuthOptions) => {
  return createAuthEndpoint(
    "/stellar/subscription/cancel",
    {
      method: "POST",
      body: z.object({
        subscriptionId: z.string(),
      }),
      metadata: {
        openapi: {
          operationId: "cancelSubscription",
          summary: "Cancel a subscription",
          description: "Cancel a subscription for a customer",
          tags: ["stellar", "subscription"],
        },
      },
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const session = ctx.context.session;
      if (!session?.user) {
        throw new APIError("UNAUTHORIZED");
      }

      const stellar = new StellarTools({ apiKey: options.apiKey });
      const subscriptionId = ctx.body.subscriptionId;

      const result = await stellar.subscriptions.cancel(subscriptionId);

      if (!result.ok) {
        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: result.error.message,
        });
      }

      return ctx.json(result.value!);
    }
  );
};

// -- REFUNDS --

export const checkCredits = (options: StellarToolsBetterAuthOptions) => {
  return createAuthEndpoint(
    "/stellar/credits/check",
    {
      method: "POST",
      body: z.object({
        productId: z.string(),
        rawAmount: z.number(),
      }),
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const customerId = await retrieveOrCreateCustomer(ctx);
      const stellar = new StellarTools({ apiKey: options.apiKey });

      const result = await stellar.credits.check(customerId, {
        productId: ctx.body.productId,
        rawAmount: ctx.body.rawAmount,
      });

      if (!result.ok) {
        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: result.error.message,
        });
      }

      return ctx.json({ status: result.value });
    }
  );
};

const DEFAULT_CREDITS_LOW_THRESHOLD = 10;

export const consumeCredits = (options: StellarToolsBetterAuthOptions) => {
  return createAuthEndpoint(
    "/stellar/credits/consume",
    {
      method: "POST",
      body: z.object({
        productId: z.string(),
        rawAmount: z.number(),
        reason: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
      metadata: {
        openapi: {
          operationId: "checkCredits",
          summary: "Check credits",
          description: "Check credits for a customer",
          tags: ["stellar", "credits"],
        },
      },
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const customerId = await retrieveOrCreateCustomer(ctx);
      const stellar = new StellarTools({ apiKey: options.apiKey });

      const result = await stellar.credits.consume(customerId, {
        productId: ctx.body.productId,
        rawAmount: ctx.body.rawAmount,
        reason: ctx.body.reason ?? "Consumed",
        metadata: { ...ctx.body.metadata, source: "betterauth-adapter" },
      });

      if (!result.ok) {
        throw new APIError("BAD_REQUEST", {
          message: result.error.message,
        });
      }

      if (
        options.onCreditsLow &&
        result.value!.balance <=
          (options.creditLowThreshold ?? DEFAULT_CREDITS_LOW_THRESHOLD)
      ) {
        await options.onCreditsLow({ ...result.value!, customerId });
      }

      return ctx.json(result.value!);
    }
  );
};

export const getTransactions = (options: StellarToolsBetterAuthOptions) => {
  return createAuthEndpoint(
    "/stellar/credits/transactions",
    {
      method: "GET",
      query: z.object({
        productId: z.string(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      }),
      metadata: {
        openapi: {
          operationId: "getTransactions",
          summary: "Get transactions",
          description: "Get transactions for a customer",
          tags: ["stellar", "credits"],
        },
      },
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const customerId = await retrieveOrCreateCustomer(ctx);
      const stellar = new StellarTools({ apiKey: options.apiKey });

      const result = await stellar.credits.getTransactions(customerId, {
        productId: ctx.query.productId,
        limit: ctx.query.limit,
        offset: ctx.query.offset,
      });

      if (!result.ok) {
        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: result.error.message,
        });
      }

      return ctx.json(result.value!);
    }
  );
};

// -- REFUNDS --

export const createRefund = (options: StellarToolsBetterAuthOptions) => {
  return createAuthEndpoint(
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
      metadata: {
        openapi: {
          operationId: "createRefund",
          summary: "Create a refund",
          description: "Create a refund for a payment",
          tags: ["stellar", "refund"],
        },
      },
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const session = ctx.context.session;

      if (!session?.user) {
        throw new APIError("UNAUTHORIZED");
      }

      const stellar = new StellarTools({ apiKey: options.apiKey });
      const paymentId = ctx.body.paymentId;
      const amount = ctx.body.amount;
      const reason = ctx.body.reason;
      const metadata = ctx.body.metadata;
      const receiverPublicKey = ctx.body.receiverPublicKey;

      const result = await stellar.refunds.create({
        paymentId,
        amount,
        reason,
        metadata: { ...metadata, source: "betterauth-adapter" },
        receiverPublicKey,
      });

      if (!result.ok) {
        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: result.error.message,
        });
      }

      return ctx.json(result.value!);
    }
  );
};
