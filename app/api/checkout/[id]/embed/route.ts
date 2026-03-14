import { getCheckoutPaymentDetails } from "@/actions/checkout";
import { FileUploadApi } from "@/integrations/file-upload";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { generateResourceId } from "@/lib/utils";
import { CheckoutEmbedDetails } from "@stellartools/core";
import { Result, z as Schema } from "@stellartools/core";
import QRCode from "qrcode";

const paramsSchema = Schema.object({ id: Schema.string() });

export const OPTIONS = createOptionsHandler();

export const GET = apiHandler({
  auth: ["session", "apikey"],
  schema: { params: paramsSchema },
  handler: async ({ params: { id }, auth: { environment, organizationId } }) => {
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
  },
});
