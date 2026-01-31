import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { retrieveAsset } from "@/actions/asset";
import { withEvent } from "@/actions/event";
import { retrieveOrganizationIdAndSecret } from "@/actions/organization";
import { retrievePayment } from "@/actions/payment";
import { postRefund } from "@/actions/refund";
import { EncryptionApi } from "@/integrations/encryption";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { createRefundSchema, validateSchema } from "@stellartools/core";
import { Result } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");
  const sessionToken = req.headers.get("x-session-token");

  if (!apiKey && !sessionToken) {
    return NextResponse.json({ error: "API key or session token is required" }, { status: 400 });
  }

  const result = await Result.andThenAsync(validateSchema(createRefundSchema, await req.json()), async (data) => {
    const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey!, sessionToken ?? undefined);
    const [payment, asset] = await Promise.all([
      retrievePayment(data.paymentId, organizationId, environment),
      retrieveAsset(data.assetId),
    ]);

    if (!payment) return Result.err("Payment not found");

    if (!asset) return Result.err("Asset not found");

    if (payment.environment !== environment) return Result.err("Invalid state");

    const { secret } = await retrieveOrganizationIdAndSecret(organizationId, environment);

    if (!secret) return Result.err("Invalid stellar secret");

    const stellar = new StellarCoreApi(environment);

    const txMemo = JSON.stringify({ checkoutId: payment.checkoutId, amount: data.amount });
    const secretKey = new EncryptionApi().decrypt(secret.encrypted);

    const refund = await withEvent(
      async () => {
        const refundResult = await stellar.sendAssetPayment(
          secretKey,
          data.receiverPublicKey,
          asset.code,
          asset.issuer || "",
          (data.amount / 10_000_000).toString(), // Convert stroops to XLM,
          txMemo
        );

        if (refundResult.isErr()) return Result.err(refundResult.error);

        const refund = await postRefund(
          {
            ...data,
            status: "pending",
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

        return Result.ok(refund);
      },
      undefined,
      {
        events: ["refund.failed", "refund.created", "refund.succeeded"],
        organizationId,
        environment,
        payload: (refund) => {
          if (refund.isErr())
            return {
              error: refund.error,
              success: false,
              timestamp: new Date(),
              paymentId: data.paymentId,
              amount: data.amount,
            };

          return {
            id: refund?.value?.id,
            timestamp: new Date(),
            paymentId: data.paymentId,
            amount: data.amount,
            success: true,
          };
        },
      }
    );

    return Result.ok(refund);
  });

  return NextResponse.json(result);
};
