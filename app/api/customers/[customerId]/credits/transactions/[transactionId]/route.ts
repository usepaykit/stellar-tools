import { resolveApiKey } from "@/actions/apikey";
import { retrieveCreditTransaction } from "@/actions/credit";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ customerId: string; transactionId: string }> }
) => {
  try {
    const { transactionId } = await context.params;

    const apiKey = req.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const { organizationId } = await resolveApiKey(apiKey);

    const transaction = await retrieveCreditTransaction(
      transactionId,
      organizationId
    );

    return NextResponse.json({ data: transaction });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
  }
};
