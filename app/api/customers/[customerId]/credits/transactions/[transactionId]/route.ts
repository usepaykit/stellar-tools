import { resolveApiKeyOrAuthorizationToken } from "@/actions/apikey";
import { retrieveCreditTransaction } from "@/actions/credit";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ customerId: string; transactionId: string }> }
) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) return NextResponse.json({ error: "API key is required" }, { status: 400 });

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ transactionId: Schema.string() }), context.params),
    async ({ transactionId }) => {
      const { organizationId } = await resolveApiKeyOrAuthorizationToken(apiKey);

      const transaction = await retrieveCreditTransaction(transactionId, organizationId);

      return Result.ok(transaction);
    }
  );

  if (result.isErr()) return NextResponse.json({ error: result.error.message }, { status: 400 });

  return NextResponse.json({ data: result.value });
};
