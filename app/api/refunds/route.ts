import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { retrieveAsset } from "@/actions/asset";
import { EventTrigger, WebhookTrigger, withEvent } from "@/actions/event";
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
    const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey, sessionToken);
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

    const result = await withEvent(
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
            status: "succeeded",
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
      (refund) => {
        let events: EventTrigger<typeof refund>[] = [];
        let webhooksTriggers: WebhookTrigger<typeof refund>[] = [];

        if (refund.isErr()) {
          webhooksTriggers.push({
            event: "refund.failed",
            map: (refund) => ({
              error: refund.isErr() ? refund.error.message : undefined,
              success: false,
              timestamp: new Date(),
              paymentId: data.paymentId,
              amount: data.amount,
            }),
          });
        }

        if (refund.isOk()) {
          events.push({
            type: "refund::created",
            map: (refund) => {
              if (refund.isErr()) return {};
              const { amount, paymentId, customerId, id } = refund.value;
              return {
                customerId: customerId!,
                data: { amount, paymentId, id },
              };
            },
          });
          webhooksTriggers.push({
            event: "refund.succeeded",
            map: (refund) => {
              if (refund.isErr()) return {};
              const { amount, paymentId, customerId, id } = refund.value;
              return { amount, paymentId, customerId, id };
            },
          });
        }

        return { events, webhooks: { organizationId, environment, triggers: webhooksTriggers } };
      }
    );

    return Result.ok(result);
  });

  if (result.isErr()) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json(result.value);
};
