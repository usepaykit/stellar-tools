import { retrieveCheckoutAndCustomer } from "@/actions/checkout";
import { Network, networkEnum } from "@/constant/schema.client";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

// Standard CORS headers for this resource
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const OPTIONS = () => new NextResponse(null, { status: 204, headers: CORS_HEADERS });

export const GET = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;
    const environment = req.nextUrl.searchParams.get("environment") as Network;
    const stellar = new StellarCoreApi(environment);

    const {
      finalAmount,
      assetCode,
      merchantPublicKey,
      assetIssuer,
      productId,
      expiresAt,
      productType,
      recurringPeriod,
    } = await retrieveCheckoutAndCustomer(id);

    const intervals: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };
    const expiry = recurringPeriod ? new Date(Date.now() + intervals[recurringPeriod] * 864e5) : null;
    const periodEnd = expiry ? new Date(Date.now() + intervals[recurringPeriod] * 864e5) : null;

    const xdrResult = await stellar.buildPaymentXDR({
      customerAddress: "GA5OJOBKLD4MJEZ6SE7FCNDXKHUQAEOKPDXAZTURGNTXL6BJHPMIC6BW",
      merchantAddress: merchantPublicKey,
      amount: finalAmount,
      memo: id,
      network: environment,
      assetCode,
      assetIssuer,
      checkoutExpiresAt: expiresAt,
      ...(productType == "subscription" && {
        subscriptionData: {
          currentPeriodEnd: periodEnd!,
          contractId: process.env.SUBSCRIPTION_CONTRACT_ID!,
          productId: productId!,
        },
      }),
    });

    if (xdrResult.isErr()) throw xdrResult.error;

    const domain = new URL(process.env.NEXT_PUBLIC_TUNNEL_URL!).hostname;
    const callbackUrl = `${process.env.NEXT_PUBLIC_TUNNEL_URL}/api/checkout/verify-callback?checkoutId=${id}`;

    // Use the PAY operation instead of TX
    const baseUri =
      `web+stellar:tx` +
      `?callback=${encodeURIComponent("url:" + callbackUrl)}` +
      `&msg=${encodeURIComponent("Pay " + finalAmount + " " + (assetCode || "XLM"))}` +
      `&network_passphrase=${encodeURIComponent(stellar.getNetworkPassphrase(environment))}` +
      `&origin_domain=${encodeURIComponent(domain)}` +
      `&xdr=${encodeURIComponent(xdrResult.value)}`;

    // Sign the URI
    const signature = stellar.signURI(baseUri);
    const finalUri = `${baseUri}&signature=${encodeURIComponent(signature)}`;

    return NextResponse.json({ uri: finalUri }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
};
