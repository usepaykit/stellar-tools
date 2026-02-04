import { resolveOrgContext } from "@/actions/organization";
import { verifyAndProcessPayment } from "@/actions/payment";
import { networkEnum, productTypeEnum } from "@/constant/schema.client";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const handler = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  console.log({ searchParams: Object.fromEntries(searchParams) });

  // 1. Log the incoming method and query immediately
  console.log(`[Webhook] ${req.method} request received`);

  console.dir({ req }, { depth: 100 });

  // 2. Extract Data
  // Wallets typically send 'transaction_id' (GET) or 'xdr' (POST)
  let body: any = {};
  if (req.method === "POST") {
    try {
      body = await req.json();
    } catch (e) {
      // If not JSON, it might be form-encoded or just a raw XDR string
      const text = await req.text();
      console.log("[Webhook] Raw body text:", text);
    }
  }

  const input = {
    // Map LOBSTR/Standard params to our internal keys
    txHash: searchParams.get("transaction_id") || body.transaction_id || body.txHash,
    signedXdr: body.xdr || searchParams.get("xdr"), // Some wallets send the full signed XDR
    checkoutId: searchParams.get("checkoutId") || body.checkoutId,
    organizationId: searchParams.get("organizationId") || body.organizationId,
    environment: searchParams.get("environment") || body.environment,
    productType: searchParams.get("productType") || body.productType,
  };

  console.log("[Webhook] Parsed Input:", input);

  // 3. Validation and Processing
  const result = await Result.andThenAsync(
    validateSchema(
      Schema.object({
        txHash: Schema.string().optional(),
        signedXdr: Schema.string().optional(),
        checkoutId: Schema.string(),
        organizationId: Schema.string(),
        environment: Schema.enum(networkEnum),
        productType: Schema.enum(productTypeEnum),
      }),
      input
    ),
    async (data) => {
      const { organizationId, environment } = await resolveOrgContext(data.organizationId, data.environment);
      const stellar = new StellarCoreApi(environment);

      let finalHash = data.txHash;

      // If the wallet sent a signed XDR instead of submitting it themselves, WE submit it
      if (!finalHash && data.signedXdr) {
        const submission = await stellar.submitSignedTransaction(data.signedXdr);
        if (submission.isErr()) throw new Error(submission.error?.message);
        finalHash = submission.value?.hash;
      }

      if (!finalHash) throw new Error("No transaction hash or XDR provided");

      return Result.ok(
        await verifyAndProcessPayment(finalHash, data.checkoutId, environment, organizationId, data.productType)
      );
    }
  );

  if (result.isErr()) {
    console.error("[Webhook] Error:", result.error?.message);
    return NextResponse.json({ success: false, error: result.error?.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
};

export { handler as POST, handler as GET, handler as PUT, handler as DELETE };
