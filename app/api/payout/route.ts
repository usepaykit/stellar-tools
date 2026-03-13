import { resolveApiKeyOrAuthorizationToken } from "@/actions/apikey";
import { retrieveAsset } from "@/actions/asset";
import { getOrgFeeRateBps } from "@/actions/billing";
import { retrieveOrganizationIdAndSecret } from "@/actions/organization";
import { postPayout, putPayout } from "@/actions/payout";
import { getCorsHeaders } from "@/constant";
import { EncryptionApi } from "@/integrations/encryption";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { BPS_DENOMINATOR } from "@/lib/pricing";
import { generateResourceId } from "@/lib/utils";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { waitUntil } from "@vercel/functions";
import { NextRequest, NextResponse } from "next/server";

export const OPTIONS = (req: NextRequest) =>
  new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin")) });

export const POST = async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const authToken = req.headers.get("x-auth-token");
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey && !authToken) {
    return NextResponse.json({ error: "API Key or Auth Token is required" }, { status: 400, headers: corsHeaders });
  }

  if (!authToken) return NextResponse.json({ error: "Auth Token is required" }, { status: 400, headers: corsHeaders });

  const result = await Result.andThenAsync(
    validateSchema(
      Schema.object({
        amount: Schema.number(),
        walletAddress: Schema.string(),
        memo: Schema.string().optional(),
        assetId: Schema.string(),
      }),
      await req.json()
    ),
    async (data) => {
      const { organizationId, environment } = await resolveApiKeyOrAuthorizationToken("dummy-api-key", authToken); // resolves org from session token
      const { secret } = await retrieveOrganizationIdAndSecret(organizationId, environment);

      if (!secret) return Result.err("Invalid stellar secret");

      const rateBps = await getOrgFeeRateBps(organizationId);
      const feeAmount = Math.round((data.amount * rateBps) / BPS_DENOMINATOR);
      const netAmount = data.amount - feeAmount;

      const payoutId = generateResourceId("pay", organizationId, 25);

      const payout = await postPayout(
        {
          id: payoutId,
          status: "pending",
          amount: netAmount,
          walletAddress: data.walletAddress,
          memo: data.memo ?? null,
          metadata: null,
          transactionHash: "---",
          completedAt: null,
          asset: data.assetId,
        },
        organizationId,
        environment
      );

      const runSideEffects = async () => {
        const api = new StellarCoreApi(environment);
        const secretKey = new EncryptionApi().decrypt(secret.encrypted);

        const asset = await retrieveAsset(data.assetId);

        const keeperKey = process.env.KEEPER_PUBLIC_KEY;

        const [payoutResult, feeResult] = await Promise.all([
          api.sendAssetPayment(
            secretKey,
            data.walletAddress,
            asset.code,
            asset.issuer!,
            netAmount.toString(),
            data.memo
          ),
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

        return feeResult;
      };

      waitUntil(runSideEffects());

      return Result.ok(payout);
    }
  );

  if (result.isErr()) return NextResponse.json({ error: result.error }, { status: 400, headers: corsHeaders });

  return NextResponse.json({ data: result.value }, { headers: corsHeaders });
};
