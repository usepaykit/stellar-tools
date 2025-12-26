import { resolveApiKey } from "@/actions/apikey";
import { putSubscription } from "@/actions/subscription";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { organizationId } = await resolveApiKey(apiKey);

  try {
    const subscription = await putSubscription(id, organizationId, {
      status: "canceled",
      canceledAt: new Date(),
    });

    return NextResponse.json({ data: subscription });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
};
