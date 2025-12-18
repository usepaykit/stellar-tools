import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import * as z from "zod";
import type { StellarOptions } from "./types";

export const createPayment = (options: StellarOptions) => {
  return createAuthEndpoint(
    "/stellar/payment/create",
    {
      method: "POST",
      body: z.object({
        amount: z.string(),
        asset: z.string().default("XLM"),
        successUrl: z.string(),
      }),
      use: [sessionMiddleware],
    },
    async (ctx) => {
      const { user } = ctx.context.session;

      // Create pending payment record
      const payment = await ctx.context.adapter.create<{ id: string }>({
        model: "payment",
        data: {
          userId: user.id,
          amount: ctx.body.amount,
          asset: ctx.body.asset,
          status: "pending",
        },
      });

      // Use SDK's built-in payment page or custom URL
      const paymentUrl = new URL(`${ctx.context.baseURL}/stellar/pay`);

      paymentUrl.searchParams.set("paymentId", payment.id);
      paymentUrl.searchParams.set("amount", ctx.body.amount);
      paymentUrl.searchParams.set("asset", ctx.body.asset);
      paymentUrl.searchParams.set("destination", options.merchantPublicKey);
      paymentUrl.searchParams.set("successUrl", ctx.body.successUrl);

      return ctx.json({
        url: paymentUrl.toString(),
        redirect: true, // Signal to client to redirect
        paymentId: payment.id,
      });
    }
  );
};
