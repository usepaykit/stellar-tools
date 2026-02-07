import { retrieveCheckoutAndCustomer } from "@/actions/checkout";
import { subscriptionIntervals } from "@/constant";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("initiating subscription");
    const { id } = await params;

    const checkout = await retrieveCheckoutAndCustomer(id);

    const stellar = new StellarCoreApi(checkout.environment);

    if (!checkout) return NextResponse.json({ error: "Checkout not found" }, { status: 404 });

    // 1. READ BODY ONCE
    let body: any;
    try {
      body = await req.json();
      console.log("[SEP-7] Initiate ping from wallet:", body);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = await Result.andThenAsync(
      validateSchema(Schema.object({ account: Schema.string() }), body),
      async ({ account }) => {
        const {
          environment,
          merchantPublicKey,
          productType,
          productId,
          recurringPeriod,
          finalAmount,
          assetCode,
          assetIssuer,
        } = checkout;

        const expiry = checkout.recurringPeriod
          ? new Date(Date.now() + subscriptionIntervals[checkout.recurringPeriod] * 864e5)
          : null;

        const periodEnd = expiry ? new Date(Date.now() + subscriptionIntervals[recurringPeriod] * 864e5) : null;

        const xdrResult = await stellar.buildPaymentXDR({
          customerAddress: "GA5OJOBKLD4MJEZ6SE7FCNDXKHUQAEOKPDXAZTURGNTXL6BJHPMIC6BW",
          merchantAddress: merchantPublicKey,
          amount: finalAmount,
          memo: id,
          network: environment,
          assetCode,
          assetIssuer,
          checkoutExpiresAt: checkout.expiresAt,
          ...(productType == "subscription" && {
            subscriptionData: {
              currentPeriodEnd: periodEnd!,
              contractId: process.env.SUBSCRIPTION_CONTRACT_ID!,
              productId: productId!,
            },
          }),
        });

        if (xdrResult.isErr()) throw xdrResult.error;

        return Result.ok({ xdr: xdrResult.value });
      }
    );

    if (result.isErr()) throw new Error(result.error.message);

    const callbackUrl = new URL(`/api/checkout/verify-callback`, process.env.NEXT_PUBLIC_API_URL!);
    callbackUrl.searchParams.set("checkoutId", id);
    return NextResponse.json(
      {
        xdr: result.value!.xdr,
        network_passphrase: stellar.getNetworkPassphrase(checkout.environment),
        callback: `url:${callbackUrl.toString()}`,
      },
      {
        headers: {
          "ngrok-skip-browser-warning": "true", // CRITICAL for wallets to skip ngrok HTML ads
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[SEP-7 Error]:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      console.error("[SEP-7 Error]:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }
}
