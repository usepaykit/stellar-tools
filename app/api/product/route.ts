import { postProduct } from "@/actions/product";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { xlmToStroops } from "@/lib/utils";
import { Result, createProductSchema } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: ["session", "apikey", "app"],
  requiredAppScope: "write:products",
  schema: { body: createProductSchema },
  handler: async ({ body, auth: { organizationId, environment } }) => {
    const productData: Parameters<typeof postProduct>[0] = {
      name: body.name,
      description: body.description ?? null,
      images: body.images,
      type: body.type,
      assetId: body.assetId,
      status: "active" as const,
      metadata: body.metadata,
      priceAmount: Number(xlmToStroops(body.priceAmount.toString())),
      recurringPeriod: body.recurringPeriod ?? null,
      unit: body.unit ?? null,
      unitDivisor: body.unitDivisor ?? null,
      unitsPerCredit: body.unitsPerCredit ?? null,
      creditsGranted: body.creditsGranted ?? null,
      creditExpiryDays: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const response = await postProduct(productData, organizationId, environment);

    return Result.ok(response);
  },
});
