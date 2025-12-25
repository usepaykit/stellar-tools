import { resolveApiKey } from "@/actions/apikey";
import { putSubscription } from "@/actions/subscription";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;

    const apiKey = req.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const { organizationId } = await resolveApiKey(apiKey);

    const subscription = await putSubscription(id, organizationId, {
      status: "active",
      pausedAt: null,
    });

    return NextResponse.json({ data: subscription });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to resume subscription" },
      { status: 500 }
    );
  }
};
