import { retrieveCheckoutAndCustomer } from "@/actions/checkout";
import { GatingCheck, retrievePlan, validateLimits } from "@/actions/plan";
import { getCorsHeaders, subscriptionIntervals } from "@/constant";
import { Network } from "@/constant/schema.client";
import { payments as paymentsSchema, subscriptions as subscriptionsSchema } from "@/db";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { NextRequest, NextResponse } from "next/server";

export const OPTIONS = (req: NextRequest) =>
  new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin")) });

export const GET = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

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
      internalPlanId,
      organizationId,
    } = await retrieveCheckoutAndCustomer(id);

    let limitError: Error | null = null;

    try {
      const plan = await retrievePlan(internalPlanId);

      const limitsArray: GatingCheck[] = [
        { domain: "payments", table: paymentsSchema, limit: plan.payments, type: "throughput" },
      ];

      if (productType === "subscription") {
        limitsArray.push({
          domain: "subscriptions",
          table: subscriptionsSchema,
          limit: plan.subscriptions,
          type: "capacity",
        });
      }

      await validateLimits(organizationId, environment, limitsArray);
    } catch (error) {
      limitError = error as Error;
    }

    if (limitError) return NextResponse.json({ error: limitError.message }, { headers: corsHeaders });

    const expiry = recurringPeriod ? new Date(Date.now() + subscriptionIntervals[recurringPeriod] * 864e5) : null;
    const periodEnd = expiry ? new Date(Date.now() + subscriptionIntervals[recurringPeriod] * 864e5) : null;
    const contractId = process.env.SUBSCRIPTION_CONTRACT_ID!;
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
        subscriptionData: { currentPeriodEnd: periodEnd!, contractId, productId: productId! },
      }),
    });

    if (xdrResult.isErr()) throw xdrResult.error;

    const domain = new URL(process.env.NGROK_URL!).hostname;
    const callbackUrl = `${process.env.NGROK_URL}/api/checkout/verify-callback?checkoutId=${id}`;

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

    console.log({ baseUri });

    return NextResponse.json({ uri: finalUri }, { headers: corsHeaders });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
};
