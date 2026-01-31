import { putCheckout, retrieveCheckout } from "@/actions/checkout";
import { resolveOrgContext } from "@/actions/organization";
import { postPayment } from "@/actions/payment";
import { triggerWebhooks } from "@/actions/webhook";
import { networkEnum, productTypeEnum } from "@/constant/schema.client";
import { JWT } from "@/integrations/jwt";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { ApiClient, Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const POST = async (req: NextRequest) => {
  const result = await Result.andThenAsync(
    validateSchema(
      Schema.object({
        txHash: Schema.string(),
        checkoutId: Schema.string(),
        organizationId: Schema.string(),
        environment: Schema.enum(networkEnum),
        productType: Schema.enum(productTypeEnum),
      }),
      await req.json()
    ),
    async (data) => {
      const { organizationId, environment } = await resolveOrgContext(data.organizationId, data.environment);
      const stellar = new StellarCoreApi(environment);
      const txResult = await stellar.retrieveTx(data.txHash);

      const checkout = await retrieveCheckout(data.checkoutId, organizationId, environment);

      if (!checkout) return Result.err(new Error("Checkout not found"));

      const paymentOp = (await stellar.retrievePayment(data.txHash)).value?.records.find((op) => op.type_i === 1);

      if (txResult.isErr()) return Result.err(new Error(txResult.error.message));

      if (!txResult.value) return Result.err(new Error("Transaction not found"));

      if (!txResult.value.successful) {
        await Promise.all([
          putCheckout(data.checkoutId, { status: "failed" }, organizationId, environment),
          postPayment(
            {
              checkoutId: data.checkoutId,
              customerId: checkout.customerId ?? null,
              amount: parseInt(paymentOp?.amount || "0"),
              transactionHash: data.txHash,
              status: "failed",
            },
            organizationId,
            environment
          ),
          triggerWebhooks("payment.failed", { checkoutId: data.checkoutId }, organizationId, environment),
        ]);

        return Result.err(new Error("Transaction was not successful on Stellar network"));
      }

      if (!paymentOp) return Result.err(new Error("Payment operation not found in transaction"));

      const amountInStroops = parseInt(paymentOp.amount || "0");

      const createSubscriptionHandler = async () => {
        if (!checkout.productId) return Result.err(new Error("Product ID is required for subscription"));

        const accessToken = await new JWT().sign({ orgId: organizationId, environment }, "1h");

        const api = new ApiClient({
          baseUrl: process.env.NEXT_PUBLIC_APP_URL!,
          headers: { "x-session-token": accessToken },
        });

        const period =
          checkout.subscriptionData &&
          "periodStart" in checkout.subscriptionData &&
          "periodEnd" in checkout.subscriptionData
            ? {
                from: new Date(checkout.subscriptionData.periodStart),
                to: new Date(checkout.subscriptionData.periodEnd),
              }
            : null;

        if (!period) return Result.err(new Error("Period is required for subscription"));

        const result = await api.post<{ id: string; success: boolean }>("/api/subscriptions", {
          body: JSON.stringify({
            customerIds: [checkout.customerId],
            productId: checkout.productId,
            period,
            cancelAtPeriodEnd: checkout.subscriptionData?.cancelAtPeriodEnd ?? false,
          }),
        });

        return Result.ok(result);
      };

      await Promise.all([
        putCheckout(data.checkoutId, { status: "completed", updatedAt: new Date() }, organizationId, environment),
        postPayment(
          {
            checkoutId: checkout.id,
            customerId: checkout.customerId ?? null,
            amount: amountInStroops,
            transactionHash: data.txHash,
            status: "confirmed",
          },
          organizationId,
          environment
        ),
        ...(data.productType === "subscription" ? [createSubscriptionHandler()] : []),
      ]);

      return Result.ok({});
    }
  );

  if (result.isErr()) return NextResponse.json({ success: false, error: result.error?.message }, { status: 400 });

  return NextResponse.json({ success: true });
};
