import { resolveApiKey } from "@/actions/apikey";
import { retrieveAsset } from "@/actions/asset";
import { retrieveOrganizationIdAndSecret } from "@/actions/organization";
import { retrievePayment } from "@/actions/payment";
import { postRefund } from "@/actions/refund";
import { triggerWebhooks } from "@/actions/webhook";
import { Encryption } from "@/integrations/encryption";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { createRefundSchema, tryCatchAsync } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { error, data } = createRefundSchema.safeParse(await req.json());

  if (error) return NextResponse.json({ error }, { status: 400 });

  const { organizationId, environment } = await resolveApiKey(apiKey);

  const [payment, asset] = await Promise.all([
    retrievePayment(data.paymentId, organizationId, environment),
    retrieveAsset(data.assetId),
  ]);

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  if (payment.environment !== environment) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const { secret } = await retrieveOrganizationIdAndSecret(organizationId, environment);

  if (!secret) {
    return NextResponse.json(
      { error: "Stellar secret is not set, please contact support" },
      { status: 400 }
    );
  }

  const stellar = new StellarCoreApi(environment);

  const txMemo = JSON.stringify({
    checkoutId: payment.checkoutId,
    amount: data.amount,
  });

  const secretKey = new Encryption().decrypt(secret.encrypted, secret.version);

  const refundResult = await stellar.sendAssetPayment(
    secretKey,
    data.receiverPublicKey,
    asset.code,
    asset.issuer || "",
    (data.amount / 10_000_000).toString(), // Convert stroops to XLM,
    txMemo
  );

  if (refundResult.error) {
    await tryCatchAsync(
      triggerWebhooks(
        "refund.failed",
        {
          refund: data,
          error: refundResult.error,
        },
        organizationId,
        environment
      )
    );

    return NextResponse.json({ error: refundResult.error }, { status: 500 });
  }

  const refund = await postRefund(
    {
      ...data,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      receiverPublicKey: data.receiverPublicKey,
      metadata: data.metadata ?? {},
      customerId: data.customerId,
      paymentId: data.paymentId,
      amount: data.amount,
      reason: data.reason ?? null,
    },
    organizationId,
    environment
  );

  await tryCatchAsync(triggerWebhooks("refund.succeeded", { refund }, organizationId, environment));

  return NextResponse.json({ data: refund });
};
