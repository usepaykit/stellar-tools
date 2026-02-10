import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { postProduct } from "@/actions/product";
import { Result, createProductSchema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");
  const sessionToken = req.headers.get("x-session-token");

  if (!apiKey && !sessionToken) {
    return NextResponse.json({ error: "API key or session token is required" }, { status: 400 });
  }

  const result = await Result.andThenAsync(validateSchema(createProductSchema, await req.json()), async (data) => {
    const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey, sessionToken);

    const formData = await req.formData();

    const productData: Parameters<typeof postProduct>[0] = {
      name: data.name,
      description: data.description ?? null,
      images: [],
      type: data.type,
      assetId: data.assetId,
      status: "active" as const,
      metadata: {},
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

    return await postProduct(productData, formData, organizationId, environment).then(Result.ok);
  });

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
};
