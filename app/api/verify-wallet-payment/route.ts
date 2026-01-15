import { putCheckout, retrieveCheckout } from "@/actions/checkout";
import { resolveOrgContext } from "@/actions/organization";
import { postPayment } from "@/actions/payment";
import { triggerWebhooks } from "@/actions/webhook";
import { networkEnum } from "@/constant/schema.client";
import { StellarCoreApi } from "@/integrations/stellar-core";
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

    const paymentOp = (await stellar.retrievePayment(txHash)).data.records.find(
      (op) => op.type_i === 1
    );

    if (!paymentOp) {
      throw new Error("Payment operation not found in transaction");
    }

    const amountInStroops = parseInt(paymentOp.amount || "0");

    await Promise.all([
      putCheckout(
        checkoutId,
        { status: "completed", updatedAt: new Date() },
        organizationId,
        environment
      ),
      postPayment(
        {
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
      triggerWebhooks("payment.confirmed", { checkoutId }, organizationId, environment),
    ]);

    return NextResponse.json({ message: "Payment verified", success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ error: errorMessage, success: false }, { status: 500 });
  }
};
