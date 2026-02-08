import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { putSubscription, retrieveSubscription } from "@/actions/subscription";
import { SorobanContractApi } from "@/integrations/soroban-contract";
import { Result, z as Schema, updateSubscriptionSchema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

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
    validateSchema(updateSubscriptionSchema, await req.json()),
    async ({ metadata, cancelAtPeriodEnd }) => {
      const { environment, organizationId } = await resolveApiKeyOrSessionToken(apiKey);
      const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);

      const subscription = await retrieveSubscription(id);
      const walletAddress = ""; // todo: get wallet address from customer

      let cancellationResult: Result<string, Error> | null = null;

      if (cancelAtPeriodEnd) {
        cancellationResult = await api.cancelSubscription(walletAddress, subscription.productId);
      }

      if (cancellationResult?.isErr()) return Result.err(cancellationResult.error);

      const updatedSubscription = await putSubscription(
        id,
        {
          ...(cancelAtPeriodEnd !== undefined && { cancelAtPeriodEnd }),
          ...(metadata && { metadata: { ...(subscription.metadata ?? {}), ...metadata } }),
        },
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
