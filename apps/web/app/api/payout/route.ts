import { Result, z as Schema } from "@stellartools/core";
import {
  getOrgFeeRateBps,
  postPayout,
  putPayout,
  retrieveAssets,
  retrieveOrganizationIdAndSecret,
} from "@stellartools/web/actions";
import { decrypt, sendAssetPayment } from "@stellartools/web/integrations";
import { BPS_DENOMINATOR, apiHandler, createOptionsHandler, generateResourceId } from "@stellartools/web/lib";
import { waitUntil } from "@vercel/functions";
import { all } from "better-all";

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
    const { secret, asset } = await all({
      secret: async () => {
        const { secret: s } = await retrieveOrganizationIdAndSecret(organizationId, environment);
        if (!s) throw new Error("Merchant keys not configured, please contact support");
        return s;
      },
      asset: async () => {
        const [a] = await retrieveAssets({ id: body.assetId }, environment);
        if (!a) throw new Error("Asset not found");
        return a;
      },
    });

    const secretKey = decrypt(secret.encrypted);

    const keeperKey = process.env.KEEPER_PUBLIC_KEY;

    const rateBps = await getOrgFeeRateBps(organizationId);
    const feeAmount = Math.round((body.amount * rateBps) / BPS_DENOMINATOR);
    const netAmount = body.amount - feeAmount;

    const payoutId = generateResourceId("pay", organizationId, 20);

    const [payoutResult, feeResult] = await Promise.all([
      body.walletAddress
        ? sendAssetPayment(
            secretKey,
            body.walletAddress,
            asset.code,
            asset.issuer!,
            body.amount.toString(),
            environment,
            body.memo
          )
        : Promise.resolve(Result.ok(null)),
      feeAmount > 0 && keeperKey
        ? sendAssetPayment(
            secretKey,
            keeperKey,
            asset.code,
            asset.issuer!,
            feeAmount.toString(),
            environment,
            body.memo
          )
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
