import { resolveApiKeyOrAuthorizationToken } from "@/actions/apikey";
import { retrieveCustomerWallet } from "@/actions/customers";
import { putSubscription, retrieveSubscription } from "@/actions/subscription";
import { SorobanContractApi } from "@/integrations/soroban-contract";
import { Result, z as Schema, updateSubscriptionSchema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;

  const apiKey = req.headers.get("x-api-key");
  const authToken = req.headers.get("x-auth-token");
  const portalToken = req.headers.get("x-portal-token");

  if (!apiKey && !authToken && !portalToken) {
    return NextResponse.json({ error: "API key or Auth Token is required" }, { status: 400 });
  }

  const result = await Result.andThenAsync(validateSchema(Schema.string(), id), async (id) => {
    const { environment } = await resolveApiKeyOrAuthorizationToken(apiKey, authToken, portalToken);
    const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);

    const subscription = await retrieveSubscription(id);
    const customerWallet = await retrieveCustomerWallet(subscription.customerId, { id: subscription.customerWalletId });

    if (!customerWallet?.address) {
      return Result.err(new Error("Customer wallet not found"));
    }

    const onchainSubscription = await api.getSubscription(customerWallet.address, subscription.productId);

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
  const authToken = req.headers.get("x-auth-token");
  const portalToken = req.headers.get("x-portal-token");

  if (!apiKey && !authToken && !portalToken) {
    return NextResponse.json({ error: "API key or Auth Token is required" }, { status: 400 });
  }

  const result = await Result.andThenAsync(
    validateSchema(updateSubscriptionSchema, await req.json()),
    async ({ metadata, cancelAtPeriodEnd }) => {
      const { environment, organizationId } = await resolveApiKeyOrAuthorizationToken(apiKey, authToken, portalToken);
      const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);

      const subscription = await retrieveSubscription(id);
      const customerWallet = await retrieveCustomerWallet(subscription.customerId, {
        id: subscription.customerWalletId,
      });

      if (!customerWallet?.address) return Result.err(new Error("Customer wallet not found"));

      let cancellationResult: Result<string, Error> | null = null;

      if (cancelAtPeriodEnd) {
        cancellationResult = await api.cancelSubscription(customerWallet.address, subscription.productId);
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
