import { resolveApiKey } from "@/actions/apikey";
import { retrieveAsset } from "@/actions/asset";
import { retrieveOrganization } from "@/actions/organization";
import { retrievePayment } from "@/actions/payment";
import { postRefund } from "@/actions/refund";
import { Refund } from "@/db";
import { Stellar } from "@/stellar";
import { schemaFor } from "@/types";
import * as StellarSDK from "@stellar/stellar-sdk";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const postRefundSchema = schemaFor<Partial<Refund>>()(
  z.object({
    paymentId: z.string(),
    customerId: z.string(),
    assetId: z.string(),
    amount: z.number(),
    reason: z.string().optional(),
    metadata: z.record(z.string(), z.any()).default({}),
    publicKey: z.string(),
  })
);

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { error, data } = postRefundSchema.safeParse(await req.json());

  if (error) return NextResponse.json({ error }, { status: 400 });

  const { organizationId, environment } = await resolveApiKey(apiKey);

  const [payment, organization, asset] = await Promise.all([
    retrievePayment(data.paymentId, organizationId),
    retrieveOrganization(organizationId),
    retrieveAsset(data.assetId),
  ]);

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  if (payment.environment !== environment) {
    return NextResponse.json(
      { error: "Payment environment does not match organization environment" },
      { status: 400 }
    );
  }

  const stellarAccount = organization?.stellarAccounts?.[environment];

  if (!stellarAccount) {
    return NextResponse.json(
      { error: "Stellar account is not set, please contact support" },
      { status: 400 }
    );
  }

  const horizonServer =
    environment == "testnet"
      ? new StellarSDK.Horizon.Server(process.env.STELLAR_TESTNET_HORIZON_URL!)
      : new StellarSDK.Horizon.Server(process.env.STELLAR_MAINNET_HORIZON_URL!);

  const networkPassphrase =
    environment == "testnet"
      ? StellarSDK.Networks.TESTNET
      : StellarSDK.Networks.PUBLIC;

  const stellar = new Stellar(horizonServer, networkPassphrase);

  const refundResult = await stellar.sendAssetPayment(
    stellarAccount.secret_key,
    data.publicKey,
    asset.code,
    asset.issuer || "",
    (data.amount / 10_000_000).toString() // Convert stroops to XLM,
  );

  if (refundResult.error) {
    return NextResponse.json({ error: refundResult.error }, { status: 500 });
  }

  const refund = await postRefund({
    ...data,
    transactionHash: refundResult.data?.hash,
    organizationId,
    environment,
  });

  return NextResponse.json({ data: refund });
};
