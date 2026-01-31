import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { listSubscriptions, postSubscriptionsBulk } from "@/actions/subscription";
import { createSubscriptionSchema } from "@stellartools/core";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) return NextResponse.json({ error: "API key is required" }, { status: 400 });

  const result = await Result.andThenAsync(validateSchema(createSubscriptionSchema, await req.json()), async (data) => {
    const { environment, organizationId } = await resolveApiKeyOrSessionToken(apiKey);
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
    return Result.ok(subscription);
  });

  if (result.isErr()) return NextResponse.json({ error: result.error.message }, { status: 400 });

  return NextResponse.json({ data: result });
};

export const GET = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) return NextResponse.json({ error: "API key is required" }, { status: 400 });

  const { searchParams } = new URL(req.url);

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ customerId: Schema.string() }), { customerId: searchParams.get("customerId") }),
    async (data) => {
      const { environment } = await resolveApiKeyOrSessionToken(apiKey);
      const subscriptions = await listSubscriptions(data.customerId, environment);
      return Result.ok(subscriptions);
    }
  );

  if (result.isErr()) return NextResponse.json({ error: result.error.message }, { status: 400 });

  return NextResponse.json({ data: result.value });
};
