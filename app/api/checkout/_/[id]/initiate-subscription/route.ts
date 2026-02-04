import { Network, networkEnum } from "@/constant/schema.client";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

const buildSubscriptionXDRSchema = Schema.object({
  merchantAddress: Schema.string(),
  network: Schema.enum(networkEnum),
  productId: Schema.string(),
  amount: Schema.string(),
  periodEnd: Schema.string(),
  assetCode: Schema.string(),
  assetIssuer: Schema.string(),
});

export async function POST(req: NextRequest) {
  console.log("initiating subscription");
  const searchParams = validateSchema(buildSubscriptionXDRSchema, Object.fromEntries(req.nextUrl.searchParams));

  if (searchParams.isErr()) throw new Error(searchParams.error.message);

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ account: Schema.string() }), await req.json()),
    async ({ account }) => {
      const { merchantAddress, network, productId, amount, periodEnd, assetCode, assetIssuer } = searchParams.value;

      console.log(merchantAddress, network, productId, amount, periodEnd, assetCode, assetIssuer);
      const stellar = new StellarCoreApi(network as Network);

      const contractId = await stellar.retrieveAssetContractId(assetCode, assetIssuer);

      const xdr = await stellar.buildSubscriptionXDR({
        customerAddress: account,
        merchantAddress: merchantAddress,
        amount: parseInt(amount),
        tokenContractId: contractId,
        engineContractId: process.env.SUBSCRIPTION_CONTRACT_ID!,
        productId: productId,
        network: network as Network,
        currentPeriodEnd: new Date(periodEnd),
      });

      return Result.ok({ xdr });
    }
  );

  if (result.isErr()) throw new Error(result.error.message);

  return NextResponse.json(result.value?.xdr);
}
