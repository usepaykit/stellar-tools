import { resolveApiKeyOrAuthorizationToken } from "@/actions/apikey";
import { postProduct } from "@/actions/product";
import { getCorsHeaders } from "@/constant";
import { Result, createProductSchema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const OPTIONS = (req: NextRequest) =>
  new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin")) });

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");
  const authToken = req.headers.get("x-auth-token");
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (!apiKey && !authToken) {
    return NextResponse.json({ error: "API Key or Auth Token is required" }, { status: 400, headers: corsHeaders });
  }

  const body = await req.json();

  const result = await Result.andThenAsync(validateSchema(createProductSchema, body), async (data) => {
    const { organizationId, environment, entitlements } = await resolveApiKeyOrAuthorizationToken(apiKey, authToken);

    const productData: Parameters<typeof postProduct>[0] = {
      name: data.name,
      description: data.description ?? null,
      images: data.images,
      type: data.type,
      assetId: data.assetId,
      status: "active" as const,
      metadata: data.metadata,
      priceAmount: data.priceAmount,
      recurringPeriod: data.recurringPeriod ?? null,
      unit: data.unit ?? null,
      unitDivisor: data.unitDivisor ?? null,
      unitsPerCredit: data.unitsPerCredit ?? null,
      creditsGranted: data.creditsGranted ?? null,
      creditExpiryDays: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await postProduct(productData, organizationId, environment, {
      productCount: entitlements.products,
    }).then(Result.ok);
  });

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400, headers: corsHeaders });
  }

  return NextResponse.json({ data: result.value }, { headers: corsHeaders });
};
