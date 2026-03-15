import { retrieveAsset } from "@/actions/asset";
import { retrieveOrganizationIdAndSecret } from "@/actions/organization";
import { retrievePayment } from "@/actions/payment";
import { postRefund } from "@/actions/refund";
import { EncryptionApi } from "@/integrations/encryption";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { generateResourceId } from "@/lib/utils";
import { createRefundSchema } from "@stellartools/core";
import { Result } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: ["session", "apikey"],
  schema: { body: createRefundSchema },
  handler: async ({ body, auth: { organizationId, environment } }) => {
    const { paymentId, assetId, amount, receiverPublicKey, customerId, reason, metadata } = body;
    const [payment, asset] = await Promise.all([
      retrievePayment(paymentId, organizationId, environment),
      retrieveAsset({ id: assetId }, environment),
    ]);

    if (!payment) throw new Error("Payment not found");

    if (!asset) throw new Error("Asset not found");

    if (payment.environment !== environment) throw new Error("Invalid state");

    const { secret } = await retrieveOrganizationIdAndSecret(organizationId, environment);

    if (!secret) throw new Error("Organization keys not configured, please contact support");

    const stellar = new StellarCoreApi(environment);

    const refundId = generateResourceId("rf", paymentId, 15);
    const secretKey = new EncryptionApi().decrypt(secret.encrypted);

    const refundResult = await stellar.sendAssetPayment(
      secretKey,
      receiverPublicKey,
      asset.code,
      asset.issuer!,
      String(amount),
      refundId
    );

    const refund = await postRefund(
      {
        id: refundId,
        status: refundResult.isOk() ? "succeeded" : "failed",
        receiverPublicKey,
        metadata,
        customerId,
        paymentId,
        amount,
        reason,
        assetCode: asset.code,
      },
      organizationId,
      environment,
      { errorMessage: refundResult.isErr() ? refundResult.error.message : undefined }
    );

    return Result.ok(refund);
  },
});
