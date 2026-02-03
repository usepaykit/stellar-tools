import { resolveOrgContext } from "@/actions/organization";
import { verifyAndProcessPayment } from "@/actions/payment";
import { networkEnum, productTypeEnum } from "@/constant/schema.client";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const handler = async (req: NextRequest) => {
  const result = await Result.andThenAsync(
    validateSchema(
      Schema.object({
        txHash: Schema.string(),
        checkoutId: Schema.string(),
        organizationId: Schema.string(),
        environment: Schema.enum(networkEnum),
        productType: Schema.enum(productTypeEnum),
      }),
      await req.json()
    ),
    async (data) => {
      const { organizationId, environment } = await resolveOrgContext(data.organizationId, data.environment);

      await verifyAndProcessPayment(data.txHash, data.checkoutId, environment, organizationId, data.productType);

      return Result.ok({});
    }
  );

  if (result.isErr()) return NextResponse.json({ success: false, error: result.error?.message }, { status: 400 });

  return NextResponse.json({ success: true });
};

export { handler as POST, handler as GET };
