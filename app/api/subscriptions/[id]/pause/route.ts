import { resolveApiKeyOrAuthorizationToken } from "@/actions/apikey";
import { putSubscription, retrieveSubscription } from "@/actions/subscription";
import { triggerWebhooks } from "@/actions/webhook";
import { SorobanContractApi } from "@/integrations/soroban-contract";
import { computeDiff } from "@/lib/utils";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

/**
 * todo: frontend
 * const handlePause = async () => {
  setIsLoading(true);
  try {
    // 1. Request the XDR from your server
    const { xdr } = await apiClient.post("/api/subscriptions/pause", {
      body: JSON.stringify({ 
        customerAddress: userAddress, 
        productId: "pro_plan" 
      })
    });

    // 2. Open the user's wallet (LOBSTR/Freight) to sign
    const walletKit = StellarWalletsKitApi.getInstance();
    const { signedTxXdr } = await walletKit.signTransaction(xdr, {
      network: StellarSDK.Networks.TESTNET,
      address: userAddress,
    });

    // 3. Submit the signed transaction to the network
    const stellarCore = new StellarCoreApi("testnet");
    const submitResult = await stellarCore.submitSignedTransaction(signedTxXdr);

    if (submitResult.data) {
      toast.success("Subscription Paused on-chain!");
      // 4. Update your local Postgres state
      await updateSubscriptionInPostgres(subId, { status: 'paused' });
    }
  } catch (e) {
    toast.error("Failed to pause subscription");
  } finally {
    setIsLoading(false);
  }
};
 */

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
        resolveApiKeyOrAuthorizationToken(apiKey),
      ]);

      const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);
      await api.pauseSubscription(customerAddress, productId);
      const updatedSubscription = await putSubscription(
        id,
        { status: "paused", pausedAt: new Date() },
        organizationId,
        environment
      );
      await triggerWebhooks(
        "subscription.updated",
        { id: subscription.id, changes: computeDiff(subscription, updatedSubscription) },
        organizationId,
        environment
      );
      return Result.ok(subscription);
    }
  );

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ data: result.value });
};
