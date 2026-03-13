import { resolveApiKeyOrAuthorizationToken } from "@/actions/apikey";
import { retrieveCustomerWallet } from "@/actions/customers";
import { putSubscription, retrieveSubscription } from "@/actions/subscription";
import { triggerWebhooks } from "@/actions/webhook";
import { SorobanContractApi } from "@/integrations/soroban-contract";
import { computeDiff } from "@/lib/utils";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;

  const apiKey = req.headers.get("x-api-key");
  const authToken = req.headers.get("x-auth-token");
  const portalToken = req.headers.get("x-portal-token");

  if (!apiKey && !authToken && !portalToken) {
    return NextResponse.json({ error: "API key or Auth Token is required" }, { status: 400 });
  }

  const result = await Result.andThenAsync(validateSchema(Schema.string(id), id), async (id) => {
    const [subscription, { organizationId, environment }] = await Promise.all([
      retrieveSubscription(id),
      resolveApiKeyOrAuthorizationToken(apiKey, authToken, portalToken),
    ]);

    const customerWallet = await retrieveCustomerWallet(subscription.customerId, { id: subscription.customerWalletId });

    if (!customerWallet?.address) return Result.err(new Error("Customer wallet not found"));

    const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);
    await api.resumeSubscription(customerWallet.address, subscription.productId);

    const updatedSubscription = await putSubscription(
      id,
      { status: "active", pausedAt: null },
      organizationId,
      environment
    );

    await triggerWebhooks(
      "subscription.updated",
      { id: subscription.id, ...computeDiff(subscription, updatedSubscription) },
      organizationId,
      environment
    );

    return Result.ok(updatedSubscription);
  });

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ data: result.value });
};
