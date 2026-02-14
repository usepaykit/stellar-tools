import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { putProduct } from "@/actions/product";
import { getCorsHeaders } from "@/constant";
import { Result, validateSchema, updateProductSchema} from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";


export const OPTIONS = (req: NextRequest) =>
  new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin")) });

export const PUT = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const apiKey = req.headers.get("x-api-key");
  const sessionToken = req.headers.get("x-session-token");
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (!apiKey && !sessionToken) {
    return NextResponse.json({ error: "API key or session token is required" }, { status: 400, headers: corsHeaders });
  }

  const { id } = await context.params;

  const result = await Result.andThenAsync(validateSchema(updateProductSchema, await req.json()), async (data) => {
    const { organizationId } = await resolveApiKeyOrSessionToken(apiKey, sessionToken);
    const product = await putProduct(id, organizationId, data as Parameters<typeof putProduct>[2]);
    return Result.ok(product);
  });

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400, headers: corsHeaders });
  }

  return NextResponse.json({ data: result.value }, { headers: corsHeaders });
};
