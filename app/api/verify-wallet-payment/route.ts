import { putCheckout, retrieveCheckout } from "@/actions/checkout";
import { withEvent } from "@/actions/event";
import { resolveOrgContext } from "@/actions/organization";
import { postPayment } from "@/actions/payment";
import { triggerWebhooks } from "@/actions/webhook";
import { networkEnum } from "@/constant/schema.client";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const postWebhookSchema = z.object({
  txHash: z.string(),
  checkoutId: z.string(),
  orgId: z.string(),
  env: z.enum(networkEnum),
});

export const POST = async (req: NextRequest) => {
  const { txHash, checkoutId, orgId, env } = postWebhookSchema.parse(await req.json());
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  try {
    const stellar = new StellarCoreApi(environment);
    const txResult = await stellar.retrieveTx(txHash);

    if (txResult.error || !txResult.data) {
      throw new Error(txResult.error || "Transaction not found");
    }

    const transaction = txResult.data;

    if (!transaction.successful) {
      await Promise.all([
        putCheckout(checkoutId, { status: "failed" }, organizationId, environment),
        triggerWebhooks("payment.failed", { checkoutId }, organizationId, environment),
      ]);

      throw new Error("Transaction was not successful on blockchain");
    }

    const checkout = await retrieveCheckout(checkoutId, organizationId, environment);

    if (!checkout) {
      throw new Error("Checkout not found");
    }

    const paymentOp = (await stellar.retrievePayment(txHash)).data.records.find((op) => op.type_i === 1);

    if (!paymentOp) {
      throw new Error("Payment operation not found in transaction");
    }

    const amountInStroops = parseInt(paymentOp.amount || "0");

    await withEvent(
      async () => {
        const paymentId = `pay_${nanoid(25)}`;
        const resolvedPromises = await Promise.allSettled([
          putCheckout(checkoutId, { status: "completed", updatedAt: new Date() }, organizationId, environment),
          postPayment(
            {
              id: paymentId,
              checkoutId: checkout.id,
              customerId: checkout.customerId ?? null,
              amount: amountInStroops,
              transactionHash: txHash,
              status: "confirmed",
              createdAt: new Date(transaction.created_at),
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
          txHash,
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

    return NextResponse.json({ message: "Payment verified", success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ error: errorMessage, success: false }, { status: 500 });
  }
};
