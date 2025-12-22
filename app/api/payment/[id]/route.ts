import { resolveApiKey } from "@/actions/apikey";
import { refreshTxStatus, retrievePayment } from "@/actions/payment";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const getSchema = z.object({
  poll: z.boolean().default(false),
});

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { organizationId, environment } = await resolveApiKey(apiKey);

  const { poll } = getSchema.parse(await req.json());

  const payment = await retrievePayment(id, organizationId);

  if (poll && payment.status === "pending") {
    await refreshTxStatus(
      id,
      payment.transactionHash,
      organizationId,
      environment
    );
  }

  return NextResponse.json({ data: payment });
};
