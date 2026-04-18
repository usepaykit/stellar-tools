import { Result, z as Schema, createRefundSchema } from "@stellartools/core";
import { postRefund, retrieveOrganizationIdAndSecret, retrievePayments } from "@stellartools/web/actions";
import { decrypt, isValidPublicKey, sendAssetPayment } from "@stellartools/web/integrations";
import { apiHandler, createOptionsHandler, generateResourceId } from "@stellartools/web/lib";
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
    const secretKey = decrypt(secret.encrypted);

    const isValidPublicKeyResult = isValidPublicKey(walletAddress ?? payment?.wallets?.address);

    if (isValidPublicKeyResult.isErr()) throw new Error(isValidPublicKeyResult.error.message);

    const res = await sendAssetPayment(
      secretKey,
      payment.wallets!.address,
      payment.asset!.code,
      payment.asset!.issuer!,
      String(payment.amount),
      environment,
      refundId
    );

    const refund = await postRefund(
      {
        id: refundId,
        paymentId,
        reason,
        metadata,
        status: res.isOk() ? "succeeded" : "failed",
        receiverWalletAddress: payment.wallets!.address,
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
