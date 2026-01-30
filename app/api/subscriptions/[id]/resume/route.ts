import { resolveApiKey } from "@/actions/apikey";
import { putSubscription, retrieveSubscription } from "@/actions/subscription";
import { triggerWebhooks } from "@/actions/webhook";
import { SorobanContractApi } from "@/integrations/soroban-contract";
import { computeDiff } from "@/lib/utils";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ customerAddress: Schema.string(), productId: Schema.string() }), await req.json()),
    async ({ customerAddress, productId }) => {
      const [subscription, { organizationId, environment }] = await Promise.all([
        retrieveSubscription(id),
        resolveApiKey(apiKey),
      ]);

      const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);
      await api.resumeSubscription(customerAddress, productId);
      const updatedSubscription = await putSubscription(
        id,
        { status: "active", pausedAt: null },
        organizationId,
        environment
      );
      await triggerWebhooks(
        "subscription.updated",
        { id: subscription.id, changes: computeDiff(subscription, updatedSubscription) },
        organizationId,
        environment
      );
      return Result.ok(updatedSubscription);
    }
  );

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ data: result.value });
};
