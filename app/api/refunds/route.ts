import { retrieveAsset } from "@/actions/asset";
import { EventTrigger, WebhookTrigger, withEvent } from "@/actions/event";
import { retrieveOrganizationIdAndSecret } from "@/actions/organization";
import { retrievePayment } from "@/actions/payment";
import { postRefund } from "@/actions/refund";
import { EncryptionApi } from "@/integrations/encryption";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { createRefundSchema } from "@stellartools/core";
import { Result } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: true,
  schema: { body: createRefundSchema },
  handler: async ({ body, auth: { organizationId, environment } }) => {
    const [payment, asset] = await Promise.all([
      retrievePayment(body.paymentId, organizationId, environment),
      retrieveAsset(body.assetId),
    ]);

    if (!payment) throw new Error("Payment not found");

    if (!asset) throw new Error("Asset not found");

    if (payment.environment !== environment) throw new Error("Invalid state");

    const { secret } = await retrieveOrganizationIdAndSecret(organizationId, environment);

    if (!secret) throw new Error("Invalid stellar secret");

    const stellar = new StellarCoreApi(environment);

    const txMemo = JSON.stringify({ checkoutId: payment.checkoutId, amount: body.amount });
    const secretKey = new EncryptionApi().decrypt(secret.encrypted);

    const result = await withEvent(
      async () => {
        const refundResult = await stellar.sendAssetPayment(
          secretKey,
          body.receiverPublicKey,
          asset.code,
          asset.issuer || "",
          (body.amount / 10_000_000).toString(), // Convert stroops to XLM,
          txMemo
        );

        if (refundResult.isErr()) return Result.err(refundResult.error);

        const refund = await postRefund(
          {
            ...body,
            status: "succeeded",
            receiverPublicKey: body.receiverPublicKey,
            metadata: body.metadata ?? {},
            customerId: body.customerId,
            paymentId: body.paymentId,
            amount: body.amount,
            reason: body.reason ?? null,
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
              paymentId: body.paymentId,
              amount: body.amount,
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
  },
});
