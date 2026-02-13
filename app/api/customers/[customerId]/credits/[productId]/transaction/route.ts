import { resolveApiKeyOrAuthorizationToken } from "@/actions/apikey";
import { postCreditTransaction, putCreditBalance, retrieveCreditBalance } from "@/actions/credit";
import { retrieveProduct } from "@/actions/product";
import { calculateCredits } from "@/lib/credit-calculator";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (
  req: NextRequest,
  context: { params: Promise<{ customerId: string; productId: string }> }
) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) return NextResponse.json({ error: "API key is required" }, { status: 400 });

  const { customerId, productId } = await context.params;

  const result = await Result.andThenAsync(
    validateSchema(
      Schema.object({
        amount: Schema.number(),
        type: Schema.enum(["deduct", "refund", "grant"]),
        reason: Schema.string().optional(),
        metadata: Schema.record(Schema.string(), Schema.any()).optional(),
        dryRun: Schema.boolean().optional(),
      }),
      await req.json()
    ),
    async ({ amount, type, reason, metadata, dryRun }): Promise<Result<{ isSufficient: boolean }, Error>> => {
      const { organizationId, environment, entitlements } = await resolveApiKeyOrAuthorizationToken(apiKey);

      const [product, creditBalance] = await Promise.all([
        retrieveProduct(productId, organizationId),
        retrieveCreditBalance(customerId, productId, organizationId),
      ]);

      if (!creditBalance) return Result.err(new Error("Invalid Meter Configuration"));

      const creditsToProcess = calculateCredits({
        rawAmount: amount,
        unitDivisor: product.unitDivisor,
        unitsPerCredit: product.unitsPerCredit,
      });

      if (dryRun) {
        return Result.ok({
          isSufficient: creditsToProcess <= creditBalance.balance,
          transaction: null,
          balance: creditBalance,
        });
      }

      const balanceBefore = creditBalance.balance;
      let balanceAfter = balanceBefore;
      let newConsumed = creditBalance.consumed;
      let newGranted = creditBalance.granted;

      switch (type) {
        case "deduct":
          if (balanceBefore < creditsToProcess) {
            return Result.err(new Error("Insufficient credits"));
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
        postCreditTransaction(
          {
            customerId,
            productId,
            balanceId: creditBalance.id,
            amount: creditsToProcess,
            balanceBefore,
            balanceAfter,
            type,
            reason: reason ?? null,
            metadata: metadata ?? null,
          },
          organizationId,
          environment
        ),
        putCreditBalance(creditBalance.id, { balance: balanceAfter, consumed: newConsumed, granted: newGranted }),
      ]);

      return Result.ok({
        isSufficient: creditsToProcess <= creditBalance.balance,
        transaction,
        balance: updatedBalance,
      });
    }
  );

  if (result.isErr()) return NextResponse.json({ error: result.error });

  return NextResponse.json(result);
};
