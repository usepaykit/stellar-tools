import { putCheckout, retrieveCheckout } from "@/actions/checkout";
import { withEvent } from "@/actions/event";
import { resolveOrgContext } from "@/actions/organization";
import { postPayment } from "@/actions/payment";
import { triggerWebhooks } from "@/actions/webhook";
import { networkEnum } from "@/constant/schema.client";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { nanoid } from "nanoid";
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
      }),
      await req.json()
    ),
    async (data): Promise<Result<any, Error>> => {
      const { organizationId, environment } = await resolveOrgContext(data.organizationId, data.environment);
      const stellar = new StellarCoreApi(environment);
      const txResult = await stellar.retrieveTx(data.txHash);

      if (txResult.isErr()) return Result.err(new Error(txResult.error.message));

      if (!txResult.value) return Result.err(new Error("Transaction not found"));

      if (!txResult.value.successful) {
        await Promise.all([
          putCheckout(data.checkoutId, { status: "failed" }, organizationId, environment),
          triggerWebhooks("payment.failed", { checkoutId: data.checkoutId }, organizationId, environment),
        ]);

        return Result.err(new Error("Transaction was not successful on Stellar network"));
      }

      const checkout = await retrieveCheckout(data.checkoutId, organizationId, environment);

      if (!checkout) return Result.err(new Error("Checkout not found"));

      const paymentOp = (await stellar.retrievePayment(data.txHash)).value?.records.find((op) => op.type_i === 1);

      if (!paymentOp) return Result.err(new Error("Payment operation not found in transaction"));

      const amountInStroops = parseInt(paymentOp.amount || "0");

      await withEvent(
        async () => {
          const paymentId = `pay_${nanoid(25)}`;
          const resolvedPromises = await Promise.allSettled([
            putCheckout(data.checkoutId, { status: "completed", updatedAt: new Date() }, organizationId, environment),
            postPayment(
              {
                id: paymentId,
                checkoutId: checkout.id,
                customerId: checkout.customerId ?? null,
                amount: amountInStroops,
                transactionHash: data.txHash,
                status: "confirmed",
                createdAt: new Date(txResult.value!.created_at),
                updatedAt: new Date(),
              },
              organizationId,
              environment
            ),
          ]);

          const errors = resolvedPromises.map((result) => (result.status === "rejected" ? result.reason : null));

          if (errors.length > 0) return { error: errors.join(", ") };

          return {
            paymentId,
            amount: amountInStroops,
            txHash: data.txHash,
            checkoutId: checkout.id,
            customerId: checkout.customerId ?? null,
          };
        },
        {
          type: "payment::completed",
          map: ({ amount, txHash, checkoutId, customerId, paymentId }) => ({
            customerId: customerId ?? undefined,
            data: { amount, txHash, checkoutId, paymentId },
          }),
        },
        {
          events: ["payment.confirmed", "payment.failed"],
          organizationId,
          environment,
          payload: (result) => {
            if (result?.error) {
              return { error: result?.error, success: false, timestamp: new Date() };
            }

            return {
              paymentId: result?.paymentId,
              amount: result?.amount,
              txHash: result?.txHash,
              checkoutId: result?.checkoutId,
              customerId: result?.customerId,
            };
          },
        }
      );

      return Result.ok(result);
    }
  );

  if (result.isErr()) return NextResponse.json({ success: false, error: result.error?.message }, { status: 400 });

  return NextResponse.json({ success: true });
};
