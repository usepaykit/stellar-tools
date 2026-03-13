import { resolveApiKeyOrAuthorizationToken } from "@/actions/apikey";
import { createCustomerPortalSession } from "@/actions/customers";
import { getCorsHeaders } from "@/constant";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const OPTIONS = (req: NextRequest) => {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin")) });
};

export const POST = async (req: NextRequest, context: { params: Promise<{ customerId: string }> }) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  const apiKey = req.headers.get("x-api-key") ?? "";
  const authToken = req.headers.get("x-auth-token") ?? "";

  if (!apiKey && !authToken) {
    return NextResponse.json({ error: "API key or Auth Token is required" }, { status: 400, headers: corsHeaders });
  }

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ customerId: Schema.string() }), await context.params),
    async ({ customerId }) => {
      const { organizationId, environment } = await resolveApiKeyOrAuthorizationToken(apiKey, authToken);
      const { session, url } = await createCustomerPortalSession(customerId, organizationId, environment);
      return Result.ok({ url, token: session.token, expiresAt: session.expiresAt });
    }
  );

  if (result.isErr()) return NextResponse.json({ error: result.error }, { status: 400, headers: corsHeaders });
  return NextResponse.json({ data: result.value }, { headers: corsHeaders });
};
