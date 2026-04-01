import { retrieveOrganizationIdAndSecret } from "@/actions/organization";
import { retrievePayments } from "@/actions/payment";
import { postRefund } from "@/actions/refund";
import { EncryptionApi } from "@/integrations/encryption";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { generateResourceId } from "@/lib/utils";
import { Result, z as Schema, createRefundSchema } from "@stellartools/core";
import { all } from "better-all";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: ["session", "apikey"],
  schema: { body: createRefundSchema.extend({ walletAddress: Schema.string().optional() }) },
  handler: async ({ body: { paymentId, reason, metadata, walletAddress }, auth: { organizationId, environment } }) => {
    const { payment, secret } = await all({
      payment: async () => {
        const [p] = await retrievePayments(
          organizationId,
          environment,
          { paymentId },
          { withWallets: true, withAsset: true }
        );
        if (!p) throw new Error("Payment not found");
        if (!p.asset) throw new Error("Payment asset not found");
        if (!p.wallets?.address) throw new Error("Customer wallet address not found");
        return p;
      },
      secret: async () => {
        const { secret: s } = await retrieveOrganizationIdAndSecret(organizationId, environment);
        if (!s) throw new Error("Merchant keys not configured, please contact support");
        return s;
      },
    });

    const refundId = generateResourceId("rf", paymentId, 15);
    const secretKey = new EncryptionApi().decrypt(secret.encrypted);

    const isValidPublicKey = new StellarCoreApi(environment).isValidPublicKey(
      walletAddress ?? payment?.wallets?.address
    );

    if (isValidPublicKey.isErr()) throw new Error(isValidPublicKey.error.message);

    const res = await new StellarCoreApi(environment).sendAssetPayment(
      secretKey,
      payment.wallets!.address,
      payment.asset!.code,
      payment.asset!.issuer!,
      String(payment.amount),
      refundId
    );

    const refund = await postRefund(
      {
        id: refundId,
        paymentId,
        reason,
        metadata,
        status: res.isOk() ? "succeeded" : "failed",
        receiverPublicKey: payment.wallets!.address,
        customerId: payment.customerId,
        amount: payment.amount,
        assetCode: payment.asset!.code,
      },
      organizationId,
      environment,
      { errorMessage: res.isErr() ? res.error.message : undefined }
    );

    return Result.ok(refund);
  },
});
