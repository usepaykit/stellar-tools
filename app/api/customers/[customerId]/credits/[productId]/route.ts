import { resolveApiKey } from "@/actions/apikey";
import { retrieveCreditBalance } from "@/actions/credit";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ customerId: string; productId: string }> }
) => {
  const { customerId, productId } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { organizationId } = await resolveApiKey(apiKey);

  try {
    const creditBalance = await retrieveCreditBalance(
      customerId,
      productId,
      organizationId
    );

    return NextResponse.json({ data: creditBalance });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
  }
};
