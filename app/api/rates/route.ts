import { retrieveAsset } from "@/actions/asset";
import { PriceFeedApi } from "@/integrations/price-feed";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { Result, z as Schema } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

export const GET = apiHandler({
  auth: ["session", "apikey"],
  schema: { query: Schema.object({ asset: Schema.string(), issuer: Schema.string() }) },
  handler: async ({ query: { asset: assetCode, issuer: assetIssuer }, auth: { environment } }) => {
    const asset = await retrieveAsset({ code: assetCode, issuer: assetIssuer }, environment);

    const feed = new PriceFeedApi();
    const [assetUsd, fiatRates] = await Promise.all([feed.getAssetUsdPrice(asset.metadata ?? {}), feed.getFiatRates()]);

    return Result.ok({ assetUsd, fiatRates });
  },
  headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
});
