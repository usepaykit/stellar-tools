import { resolveApiKey } from "@/actions/apikey";
import {
  postCreditTransaction,
  putCreditBalance,
  retrieveCreditBalance,
} from "@/actions/credit";
import { retrieveProduct } from "@/actions/product";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const transactionSchema = z.object({
  amount: z.number(),
  type: z.enum(["deduct", "refund", "grant"]),
  reason: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const POST = async (
  req: NextRequest,
  context: { params: Promise<{ customerId: string; productId: string }> }
) => {
  const { customerId, productId } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { error, data } = transactionSchema.safeParse(await req.json());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { organizationId } = await resolveApiKey(apiKey);

  try {
    const product = await retrieveProduct(productId, organizationId);

    const creditBalance = await retrieveCreditBalance(
      customerId,
      productId,
      organizationId
    );

    if (!creditBalance) {
      return NextResponse.json(
        { error: "Credit balance not found" },
        { status: 404 }
      );
    }

    // Calculate credits based on product config
    const units = product.unitDivisor
      ? data.amount / product.unitDivisor
      : data.amount;

    const creditsToProcess = Math.ceil(units / (product.unitsPerCredit || 1));

    const balanceBefore = creditBalance.balance;
    let balanceAfter = balanceBefore;
    let newConsumed = creditBalance.consumed;
    let newGranted = creditBalance.granted;

    switch (data.type) {
      case "deduct":
        if (balanceBefore < creditsToProcess) {
          return NextResponse.json(
            { error: "Insufficient credits" },
            { status: 400 }
          );
        }
        balanceAfter = balanceBefore - creditsToProcess;
        newConsumed = creditBalance.consumed + creditsToProcess;
        break;

      case "refund":
        balanceAfter = balanceBefore + creditsToProcess;
        newConsumed = Math.max(0, creditBalance.consumed - creditsToProcess);
        break;

      case "grant":
        balanceAfter = balanceBefore + creditsToProcess;
        newGranted = creditBalance.granted + creditsToProcess;
        break;
    }

    const [transaction, updatedBalance] = await Promise.all([
      postCreditTransaction({
        organizationId,
        customerId,
        productId,
        balanceId: creditBalance.id,
        amount: creditsToProcess,
        balanceBefore,
        balanceAfter,
        type: data.type,
        reason: data.reason,
        metadata: data.metadata,
      }),
      putCreditBalance(creditBalance.id, {
        balance: balanceAfter,
        consumed: newConsumed,
        granted: newGranted,
      }),
    ]);

    return NextResponse.json({
      data: { ...updatedBalance, transaction },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
};
