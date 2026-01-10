import { resolveApiKey } from "@/actions/apikey";
import {
  postCreditTransaction,
  putCreditBalance,
  retrieveCreditBalance,
} from "@/actions/credit";
import { retrieveProduct } from "@/actions/product";
import { calculateCredits } from "@/lib/credit-calculator";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const transactionSchema = z.object({
  amount: z.number(),
  type: z.enum(["deduct", "refund", "grant"]),
  reason: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  dryRun: z.boolean().optional(), // for credit checks only.
});

export const POST = async (
  req: NextRequest,
  context: { params: Promise<{ customerId: string; productId: string }> }
) => {
  try {
    const { customerId, productId } = await context.params;

    const apiKey = req.headers.get("x-api-key");

    if (!apiKey) throw new Error("API key is required");

    const { error, data } = transactionSchema.safeParse(await req.json());

    if (error) throw new Error(`Invalid parameters: ${error.message}`);

    const { organizationId } = await resolveApiKey(apiKey);

    const product = await retrieveProduct(productId, organizationId);

    const creditBalance = await retrieveCreditBalance(
      customerId,
      productId,
      organizationId
    );

    if (!creditBalance) throw new Error("Invalid Meter Configuration");

    const creditsToProcess = calculateCredits({
      rawAmount: data.amount,
      unitDivisor: product.unitDivisor,
      unitsPerCredit: product.unitsPerCredit,
    });

    if (data.dryRun) {
      return NextResponse.json({
        isSufficient: creditsToProcess <= creditBalance.balance,
      });
    }

    const balanceBefore = creditBalance.balance;
    let balanceAfter = balanceBefore;
    let newConsumed = creditBalance.consumed;
    let newGranted = creditBalance.granted;

    switch (data.type) {
      case "deduct":
        if (balanceBefore < creditsToProcess) {
          throw new Error("Insufficient credits");
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
