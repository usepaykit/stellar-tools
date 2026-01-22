import { resolveApiKey } from "@/actions/apikey";
import { listSubscriptions, postSubscriptionsBulk } from "@/actions/subscription";
import { createSubscriptionSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const getSubscriptionsSchema = z.object({
  customerId: z.string(),
});

export const POST = async (req: NextRequest) => {
  try {
    const apiKey = req.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    const { error, data } = createSubscriptionSchema.safeParse(await req.json());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { environment, organizationId } = await resolveApiKey(apiKey);

    const subscription = await postSubscriptionsBulk(
      {
        customerIds: data.customerIds,
        productId: data.productId,
        period: data.period,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
      },
      organizationId,
      environment
    );

    return NextResponse.json({ data: subscription });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
};

export const GET = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);

  const { error, data } = getSubscriptionsSchema.safeParse({
    customerId: searchParams.get("customerId"),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { environment } = await resolveApiKey(apiKey);

  try {
    const subscriptions = await listSubscriptions(data.customerId, environment);

    return NextResponse.json({ data: subscriptions });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to list subscriptions";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};
