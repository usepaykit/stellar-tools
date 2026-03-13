import { retrieveCheckoutAndCustomer } from "@/actions/checkout";
import { sweepAndProcessPayment } from "@/actions/payment";
import { getCorsHeaders } from "@/constant";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { NextRequest, NextResponse } from "next/server";

export const OPTIONS = (req: NextRequest) =>
  new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin")) });

export const POST = async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const checkoutId = req.nextUrl.searchParams.get("checkoutId");

  if (!checkoutId) {
    return NextResponse.json({ error: "Missing checkoutId" }, { status: 400, headers: corsHeaders });
  }

  try {
    let xdr: string | null = null;
    try {
      const body = await req.json();
      xdr = body?.xdr ?? null;
    } catch {
      // body may be empty
    }

    if (xdr) {
      const checkout = await retrieveCheckoutAndCustomer(checkoutId);
      const stellar = new StellarCoreApi(checkout.environment);
      // Submit if not already on the ledger — ignore duplicate submission errors
      await stellar.submitSignedTransaction(xdr).catch(() => {});
    }

    await sweepAndProcessPayment(checkoutId);

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
};
