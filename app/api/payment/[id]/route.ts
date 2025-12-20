import { resolveApiKey } from "@/actions/apikey";
import { putPayment, retrievePayment } from "@/actions/payment";
import { Stellar } from "@/stellar";
import * as StellarSDK from "@stellar/stellar-sdk";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, params: { id: string }) => {
  const { id } = params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { organizationId, environment } = await resolveApiKey(apiKey);

  const payment = await retrievePayment(id, organizationId);

  // Refresh payment status, mostly needed by adapters to get the latest status.
  if (payment.transactionHash && payment.status === "pending") {
    const horizonServer =
      environment == "testnet"
        ? new StellarSDK.Horizon.Server(
            process.env.STELLAR_TESTNET_HORIZON_URL!
          )
        : new StellarSDK.Horizon.Server(
            process.env.STELLAR_MAINNET_HORIZON_URL!
          );

    const networkPassphrase =
      environment == "testnet"
        ? StellarSDK.Networks.TESTNET
        : StellarSDK.Networks.PUBLIC;

    const stellar = new Stellar(horizonServer, networkPassphrase);

    const txResult = await stellar.retrievePayment(payment.transactionHash);

    if (txResult.error) {
      return NextResponse.json({ error: txResult.error }, { status: 500 });
    }

    if (txResult.data?.successful) {
      putPayment(id, organizationId, { status: "confirmed" });
    } else if (txResult.error) {
      putPayment(id, organizationId, { status: "failed" });
    }
  }

  return NextResponse.json({ data: payment });
};
