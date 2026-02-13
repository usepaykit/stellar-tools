import { resolveApiKeyOrAuthorizationToken } from "@/actions/apikey";
import { retrieveCreditBalance } from "@/actions/credit";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ customerId: string; productId: string }> }
) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) return NextResponse.json({ error: "API key is required" }, { status: 400 });

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ customerId: Schema.string(), productId: Schema.string() }), context.params),
    async ({ customerId, productId }) => {
      const { organizationId } = await resolveApiKeyOrAuthorizationToken(apiKey);
      const creditBalance = await retrieveCreditBalance(customerId, productId, organizationId);
      return Result.ok(creditBalance);
    }
  );

  if (result.isErr()) return NextResponse.json({ error: result.error.message }, { status: 400 });

  return NextResponse.json({ data: result.value });
};
