"use server";

import { putCheckout, retrieveCheckoutAndCustomer } from "@/actions/checkout";
import { postPayment } from "@/actions/payment";
import { subscriptionIntervals } from "@/constant";
import { db } from "@/db";
import { checkouts } from "@/db";
import { SorobanContractApi } from "@/integrations/soroban-contract";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { generateResourceId } from "@/lib/utils";
import { eq } from "drizzle-orm";

import { postSubscriptionsBulk } from "./subscription";

/**
 * Builds a prepared (simulated) Soroban `approve` transaction XDR for the customer to sign.
 * This grants the subscription engine contract permission to charge the customer's token balance.
 * Returns the XDR string that the wallet must sign.
 */
export async function prepareSubscriptionApproval(
  checkoutId: string,
  customerAddress: string
): Promise<{ xdr: string; periodStart: string; periodEnd: string } | { error: string }> {
  try {
    const checkout = await retrieveCheckoutAndCustomer(checkoutId);

    if (checkout.productType !== "subscription") {
      return { error: "Not a subscription checkout" };
    }

    if (!checkout.assetCode) {
      return { error: "Asset not configured for this checkout" };
    }

    const stellar = new StellarCoreApi(checkout.environment);
    const tokenContractId = await stellar.retrieveAssetContractId(
      checkout.assetCode,
      checkout.assetIssuer ?? undefined
    );

    const durationDays = subscriptionIntervals[checkout.recurringPeriod as keyof typeof subscriptionIntervals] ?? 30;
    const durationSeconds = durationDays * 86400;
    const amountStroops = BigInt(Math.round(checkout.finalAmount * 1e7));

    const periodStart = new Date();
    const periodEnd = new Date(Date.now() + durationDays * 864e5);

    // Approve 120 periods worth of allowance so recurring charges work without re-approval
    const totalAllowance = amountStroops * BigInt(120);

    const engine = new SorobanContractApi(checkout.environment, process.env.KEEPER_SECRET!);
    const xdrResult = await engine.buildApprovalXdr({
      customerAddress,
      tokenContractId,
      amount: totalAllowance,
    });

    if (xdrResult.isErr()) return { error: xdrResult.error.message };

    // Persist period info + customer address so finalizeSubscriptionCheckout can read them
    await db
      .update(checkouts)
      .set({
        subscriptionData: {
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          customerAddress,
        } as any,
        updatedAt: new Date(),
      })
      .where(eq(checkouts.id, checkoutId));

    return {
      xdr: xdrResult.value,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    };
  } catch (e: any) {
    return { error: e.message ?? "Failed to prepare approval" };
  }
}

/**
 * Submits the customer-signed approval tx, then calls `start` on the subscription engine
 * (backend-signed), which executes the first payment via transfer_from.
 * Finally records the payment + subscription and marks the checkout complete.
 */
export async function finalizeSubscriptionCheckout(
  checkoutId: string,
  signedApprovalXDR: string,
  customerAddress: string
): Promise<{ success: boolean; error?: string }> {
  const checkout = await retrieveCheckoutAndCustomer(checkoutId);

  if (checkout.status !== "open") {
    return { success: false, error: "Checkout is not open" };
  }

  if (checkout.productType !== "subscription") {
    return { success: false, error: "Not a subscription checkout" };
  }

  if (!checkout.assetCode || !checkout.productId || !checkout.merchantPublicKey) {
    return { success: false, error: "Missing required checkout data" };
  }

  const sd = checkout.subscriptionData;
  if (!sd?.periodStart || !sd?.periodEnd) {
    return { success: false, error: "Period data missing — call prepareSubscriptionApproval first" };
  }

  try {
    const stellar = new StellarCoreApi(checkout.environment);
    const tokenContractId = await stellar.retrieveAssetContractId(
      checkout.assetCode,
      checkout.assetIssuer ?? undefined
    );

    const durationDays = subscriptionIntervals[checkout.recurringPeriod as keyof typeof subscriptionIntervals] ?? 30;
    const durationSeconds = durationDays * 86400;
    const amountStroops = BigInt(Math.round(checkout.finalAmount * 1e7));

    const engine = new SorobanContractApi(checkout.environment, process.env.KEEPER_SECRET!);

    // Step 1: Submit the customer-signed approval transaction
    const approvalResult = await engine.submitSignedSorobanTransaction(signedApprovalXDR);
    if (approvalResult.isErr()) {
      return { success: false, error: `Approval failed: ${approvalResult.error.message}` };
    }

    // Step 2: Backend calls `start` — engine does transfer_from for the first payment
    const startResult = await engine.startSubscription({
      customerAddress,
      merchantAddress: checkout.merchantPublicKey,
      tokenContractId,
      productId: checkout.productId,
      amountStroops,
      durationSeconds,
    });

    if (startResult.isErr()) {
      return { success: false, error: `Subscription start failed: ${startResult.error.message}` };
    }

    const { hash } = startResult.value;

    // Step 3: Record the payment, subscription, and mark checkout complete in parallel
    const periodStart = new Date(sd.periodStart);
    const periodEnd = new Date(sd.periodEnd);

    const subscriptionId = generateResourceId("sub", checkout.organizationId, 20);

    await Promise.all([
      postPayment(
        {
          customerId: checkout.customerId,
          checkoutId,
          amount: checkout.finalAmount,
          transactionHash: hash,
          status: "confirmed",
          metadata: null,
          assetId: checkout.assetId,
          subscriptionId,
        },
        checkout.organizationId,
        checkout.environment,
        { assetId: checkout.assetId ?? undefined, assetCode: checkout.assetCode }
      ),
      putCheckout(
        checkoutId,
        { status: "completed", updatedAt: new Date() },
        checkout.organizationId,
        checkout.environment
      ),
    ]);

    // Step 4: Create the subscription record
    if (checkout.customerId) {
      await postSubscriptionsBulk({
        id: subscriptionId,
        customerIds: [checkout.customerId],
        productId: checkout.productId,
        period: { from: periodStart, to: periodEnd },
        cancelAtPeriodEnd: false,
        metadata: null,
      });
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message ?? "Subscription finalization failed" };
  }
}
