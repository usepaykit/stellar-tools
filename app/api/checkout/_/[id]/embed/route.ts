import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { getCheckoutPaymentDetails } from "@/actions/checkout";
import { FileUploadApi } from "@/integrations/file-upload";
import { generateResourceId } from "@/lib/utils";
import { CheckoutEmbedDetails } from "@stellartools/core";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export const GET = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { id } = await params;

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ id: Schema.string() }), id),
    async ({ id }) => {
      const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey);
      const { paymentUri, ...details } = await getCheckoutPaymentDetails(id, organizationId, environment);

      const buffer = await QRCode.toBuffer(paymentUri);
      const file = new File([new Uint8Array(buffer)], `${generateResourceId("qr", organizationId, 10)}.png`, {
        type: "image/png",
      });
      const uploadResult = await new FileUploadApi().upload([file]);
      const qrCodeUrl = uploadResult?.[0] ?? null;

      const embedDetails: CheckoutEmbedDetails = {
        ...details,
        qrCodeUrl,
      };

      return Result.ok(embedDetails);
    }
  );

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
};
