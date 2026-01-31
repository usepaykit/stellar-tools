import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { putSubscription, retrieveSubscription } from "@/actions/subscription";
import { triggerWebhooks } from "@/actions/webhook";
import { subscriptionStatusEnum } from "@/constant/schema.client";
import { SorobanContractApi } from "@/integrations/soroban-contract";
import { computeDiff } from "@/lib/utils";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const GET = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const result = await Result.andThenAsync(validateSchema(Schema.string(), id), async (id) => {
    const { environment } = await resolveApiKeyOrSessionToken(apiKey);
    const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);

    const subscription = await retrieveSubscription(id);
    const walletAddress = ""; // todo: get wallet address from customer

    const onchainSubscription = await api.getSubscription(walletAddress, subscription.productId);

    if (!onchainSubscription) return Result.err(new Error("Subscription not found"));

    return Result.ok(subscription);
  });

  if (result.isErr()) {
    if (result.error instanceof Error) {
      return NextResponse.json({ error: result.error.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to retrieve subscription" }, { status: 404 });
  }

  return NextResponse.json({ data: result.value });
};

export const PUT = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const result = await Result.andThenAsync(
    validateSchema(
      Schema.object({
        status: z.enum(subscriptionStatusEnum).optional(),
        periodEnd: z.coerce.date().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      }),
      await req.json()
    ),
    async ({ status, periodEnd, metadata }) => {
      const { environment, organizationId } = await resolveApiKeyOrSessionToken(apiKey);
      const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);

      const subscription = await retrieveSubscription(id);
      const walletAddress = ""; // todo: get wallet address from customer

      const result = await api.updateSubscription(
        walletAddress,
        subscription.productId,
        status ?? null,
        periodEnd && subscription.currentPeriodStart
          ? Math.floor((periodEnd.getTime() - new Date(subscription.currentPeriodStart).getTime()) / 1000)
          : null,
        periodEnd ? Math.floor(periodEnd.getTime() / 1000) : null
      );

      if (result.isErr()) return Result.err(result.error);

      const updatedSubscription = await putSubscription(
        id,
        {
          ...(status && { status }),
          ...(periodEnd && { currentPeriodEnd: periodEnd }),
          ...(metadata && { metadata: { ...(subscription.metadata ?? {}), ...metadata } }),
        },
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
    return NextResponse.json({ error: result.error.message }, { status: 404 });
  }

  return NextResponse.json({ data: result.value });
};
