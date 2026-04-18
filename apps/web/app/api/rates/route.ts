import { Result, z as Schema } from "@stellartools/core";
import { retrieveAssets } from "@stellartools/web/actions";
import { PriceFeedApi } from "@stellartools/web/integrations";
import { apiHandler, createOptionsHandler } from "@stellartools/web/lib";

export const OPTIONS = createOptionsHandler();

export const GET = apiHandler({
  auth: ["session"],
  schema: { query: Schema.object({ asset: Schema.string(), issuer: Schema.string() }) },
  handler: async ({ query: { asset: assetCode, issuer: assetIssuer }, auth: { environment } }) => {
    const [asset] = await retrieveAssets({ code: assetCode, issuer: assetIssuer }, environment);

    const feed = new PriceFeedApi();
    const [assetUsd, fiatRates] = await Promise.all([feed.getAssetUsdPrice(asset.metadata ?? {}), feed.getFiatRates()]);

    return Result.ok({ assetUsd, fiatRates });
  },
  headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
});
