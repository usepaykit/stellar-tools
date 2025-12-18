import {
  APIError,
  createAuthEndpoint,
  sessionMiddleware,
} from "better-auth/api";
import * as z from "zod";
import type { StellarOptions } from "./types";
import { tryCatchAsync } from "./utils";

export const createCustomer = (options: StellarOptions) => {
  return createAuthEndpoint(
    "/customers/create",
    {
      method: "POST",
    },
    async ({ json }) => {
      // todo: cloud integrations, save to customers and return id

      return json({ id: crypto.randomUUID() });
    }
  );
};

export const retrieveCustomer = (options: StellarOptions) => {
  return createAuthEndpoint(
    "/customers/retrieve",
    {
      method: "GET",
      use: [sessionMiddleware],
    },
    async ({ json }) => {
      // todo: cloud integrations, retrieve customer from customers and return id

      return json({ id: crypto.randomUUID() });
    }
  );
};

export const updateCustomer = (options: StellarOptions) => {
  return createAuthEndpoint(
    "/customers/update",
    {
      method: "POST",
      use: [sessionMiddleware],
    },
    async ({ json }) => {
      // todo: cloud integrations, update customer in customers and return id

      return json({ id: crypto.randomUUID() });
    }
  );
};
export const createPayment = (options: StellarOptions) => {
  return createAuthEndpoint(
    "/payments/create",
    {
      method: "POST",
      body: z.object({
        product_id: z.string(),
        asset: z.enum(["XLM", "USDC"]).default("XLM"),
        success_url: z.string(),
      }),
      use: [sessionMiddleware],
    },
    async ({ context, body, json }) => {
      const session = context.session;
      const userId = session?.user?.id || "guest";

      // todo: cloud integrations, save to checkout sessions and return url

      await context.adapter.create({
        model: "payment",
        data: {
          userId: userId,
          product_id: body.product_id,
          asset_code: body.asset,
          status: "pending",
        },
      });

      return json({
        id: crypto.randomUUID(),
        payment_url: new URL(context.baseURL).toString(),
      });
    }
  );
};

export const verifyPayment = (options: StellarOptions) => {
  return createAuthEndpoint(
    "/payments/verify",
    {
      method: "POST",
      body: z.object({
        txHash: z.string(),
        memo: z.string(),
      }),
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { txHash, memo } = ctx.body;
      const { horizonServer } = options;

      const [tx, txError] = await tryCatchAsync(
        horizonServer.transactions().transaction(txHash).call()
      );

      if (txError) {
        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: "Failed to get transaction",
        });
      }

      if (tx.memo !== memo) {
        throw new APIError("BAD_REQUEST", { message: "Memo mismatch" });
      }

      const operations = await tx.operations();

      const paymentOp = operations.records.find(
        (op) => op.type === "payment" && op.to === options.merchantPublicKey
      );

      if (!paymentOp) {
        throw new APIError("BAD_REQUEST", {
          message: "Payment not found in TX",
        });
      }

      await ctx.context.adapter.update({
        model: "payment",
        where: [{ field: "id", operator: "eq", value: paymentOp.id }],
        update: {
          status: "success",
          txHash: txHash,
        },
      });

      if (options.onPaymentVerified) {
        await options.onPaymentVerified({ payment: paymentOp, tx }, ctx);
      }

      return ctx.json({ success: true });
    }
  );
};

export const createSubscription = (options: StellarOptions) => {
  return createAuthEndpoint(
    "/subscriptions/create",
    {
      method: "POST",
      body: z.object({
        plan: z.string(),
      }),
      use: [sessionMiddleware],
    },
    async (ctx) => {
      // todo: cloud integrations
      return ctx.json({
        id: crypto.randomUUID(),
        payment_url: new URL(`${ctx.context.baseURL}/stellar/pay`).toString(),
      });
    }
  );
};

export const cancelSubscription = (options: StellarOptions) => {
  return createAuthEndpoint(
    "/subscriptions/cancel",
    {
      method: "POST",
      body: z.object({ subscriptionId: z.string() }),
      use: [sessionMiddleware],
    },
    async (ctx) => {
      // todo: cloud integrations
      return ctx.json({ success: true });
    }
  );
};

export const retrieveSubscription = (options: StellarOptions) => {
  return createAuthEndpoint(
    "/subscriptions/retrieve",
    {
      method: "GET",
      use: [sessionMiddleware],
    },
    async (ctx) => {
      // todo: cloud integrations
      return ctx.json({ subscription: null });
    }
  );
};
