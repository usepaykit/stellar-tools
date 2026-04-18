import { Result, createProductSchema } from "@stellartools/core";
import { postProduct } from "@stellartools/web/actions";
import { apiHandler, createOptionsHandler } from "@stellartools/web/lib";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: ["session", "apikey"],
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
      priceAmount: body.priceAmount,
      recurringPeriod: body.recurringPeriod ?? null,
      unit: body.unit ?? null,
      unitDivisor: body.unitDivisor ?? null,
      unitsPerCredit: body.unitsPerCredit ?? null,
      creditsGranted: body.creditsGranted ?? null,
      creditExpiryDays: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await postProduct(productData, organizationId, environment).then(Result.ok);
  },
});
