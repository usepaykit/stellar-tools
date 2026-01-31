import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { refreshTxStatus, retrievePayment } from "@/actions/payment";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) return NextResponse.json({ error: "API key is required" }, { status: 400 });

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ verifyOnChain: Schema.boolean().optional().default(false) }), await req.json()),
    async ({ verifyOnChain }) => {
      const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey);
      const payment = await retrievePayment(id, organizationId, environment);
      if (verifyOnChain && payment.status === "pending") {
        await refreshTxStatus(id, payment.transactionHash, organizationId, environment);
      }

      return Result.ok(payment);
    }
  );

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
};
