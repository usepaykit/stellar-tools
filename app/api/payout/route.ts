import { retrieveAsset } from "@/actions/asset";
import { getOrgFeeRateBps } from "@/actions/billing";
import { retrieveOrganizationIdAndSecret } from "@/actions/organization";
import { postPayout, putPayout } from "@/actions/payout";
import { EncryptionApi } from "@/integrations/encryption";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { BPS_DENOMINATOR } from "@/lib/pricing";
import { generateResourceId } from "@/lib/utils";
import { Result, z as Schema } from "@stellartools/core";
import { waitUntil } from "@vercel/functions";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: ["session"],
  schema: {
    body: Schema.object({
      amount: Schema.number(),
      walletAddress: Schema.string().nullable(),
      stringifiedBankAccount: Schema.string().nullable(),
      memo: Schema.string().optional(),
      assetId: Schema.string(),
      txHash: Schema.string().nullable(),
    }),
  },
  handler: async ({ body, auth: { organizationId, environment } }) => {
    const { secret } = await retrieveOrganizationIdAndSecret(organizationId, environment);

    if (!secret) throw new Error("Invalid stellar secret");

    const api = new StellarCoreApi(environment);
    const secretKey = new EncryptionApi().decrypt(secret.encrypted);

    const asset = await retrieveAsset({ id: body.assetId }, environment);

    const keeperKey = process.env.KEEPER_PUBLIC_KEY;

    const rateBps = await getOrgFeeRateBps(organizationId);
    const feeAmount = Math.round((body.amount * rateBps) / BPS_DENOMINATOR);
    const netAmount = body.amount - feeAmount;

    const payoutId = generateResourceId("pay", organizationId, 25);

    const [payoutResult, feeResult] = await Promise.all([
      body.walletAddress
        ? api.sendAssetPayment(
            secretKey,
            body.walletAddress,
            asset.code,
            asset.issuer!,
            body.amount.toString(),
            body.memo
          )
        : Promise.resolve(Result.ok(null)),
      feeAmount > 0 && keeperKey
        ? api.sendAssetPayment(secretKey, keeperKey, asset.code, asset.issuer!, feeAmount.toString())
        : Promise.resolve(Result.ok(null)),
    ]);

    if (payoutResult.isErr()) {
      await putPayout(payoutId, { status: "failed", completedAt: new Date() });
      return Result.err(payoutResult.error);
    }

    await putPayout(payoutId, {
      status: "succeeded",
      transactionHash: payoutResult.value?.hash,
      completedAt: new Date(),
    });

    console.dir({ feeResult }, { depth: 100 });

    const payout = await postPayout(
      {
        id: payoutId,
        status: "pending",
        amount: netAmount,
        walletAddress: body.walletAddress,
        memo: body.memo ?? null,
        metadata: null,
        transactionHash: body.txHash,
        withdrawalReceiptUrl: null,
        completedAt: null,
        asset: body.assetId,
        stringifiedBankAccount: body.stringifiedBankAccount,
      },
      organizationId,
      environment
    );

    const runSideEffects = async () => {};

    waitUntil(runSideEffects());

    return Result.ok(payout);
  },
});
