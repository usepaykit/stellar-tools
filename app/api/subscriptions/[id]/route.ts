import { resolveApiKey } from "@/actions/apikey";
import {
  deleteSubscription,
  putSubscription,
  retrieveSubscription,
} from "@/actions/subscription";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateSubscriptionSchema = z.object({
  status: z.enum(["active", "past_due", "canceled", "paused"]).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  currentPeriodStart: z.coerce.date().optional(),
  currentPeriodEnd: z.coerce.date().optional(),
  nextBillingDate: z.coerce.date().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const GET = async (
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

    const subscription = await retrieveSubscription(id, organizationId);

    return NextResponse.json({ data: subscription });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to retrieve subscription" },
      { status: 404 }
    );
  }
};

export const PUT = async (
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

    const { error, data } = updateSubscriptionSchema.safeParse(
      await req.json()
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { organizationId } = await resolveApiKey(apiKey);

    const subscription = await putSubscription(id, organizationId, data);

    return NextResponse.json({ data: subscription });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
};

export const DELETE = async (
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

    await deleteSubscription(id, organizationId);

    return NextResponse.json({ data: { deleted: true } });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 }
    );
  }
};
