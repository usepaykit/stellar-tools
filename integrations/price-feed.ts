import type { AssetMetadata } from "@/db/schema";
import { createCache } from "@/lib/cache";

const priceCache = createCache<number>();
const fiatCache = createCache<Record<string, number>>();

const PRICE_TTL = 1 * 60 * 1000; // 1 min
const FIAT_TTL = 2 * 60 * 1000; // 2 min

export class PriceFeedApi {
  /**
   * USD price for 1 human-readable unit of the asset.
   * Pricing strategy is driven entirely by the asset's metadata:
   *   usdPeg  → 1.0
   *   fiatPeg → 1 / fiatRates[fiatPeg]  (e.g. EURC → 1 / EUR_rate)
   *   coingeckoId → live CoinGecko price
   *   otherwise → 0 (unknown/unlisted asset)
   */
  async getAssetUsdPrice(metadata: AssetMetadata): Promise<number> {
    if (metadata.usdPeg) return 1;

    if (metadata.fiatPeg) {
      const rates = await this.getFiatRates();
      const rate = rates[metadata.fiatPeg];
      return rate ? 1 / rate : 0;
    }

    if (metadata.coingeckoId) {
      const id = metadata.coingeckoId;
      const cached = priceCache.get(id);
      if (cached !== undefined) return cached;

      const price = await this.fetchCoinGeckoPrice(id);
      priceCache.set(id, price, PRICE_TTL);
      return price;
    }

    return 0;
  }

  /** USD-to-fiat rates for all currencies from open.er-api.com (160+ currencies). */
  async getFiatRates(): Promise<Record<string, number>> {
    const cached = fiatCache.get("rates");
    if (cached !== undefined) return cached;

    const rates = await this.fetchFiatRates();
    fiatCache.set("rates", rates, FIAT_TTL);
    return rates;
  }

  private async fetchCoinGeckoPrice(geckoId: string): Promise<number> {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data[geckoId]?.usd ?? 0;
  }

  private async fetchFiatRates(): Promise<Record<string, number>> {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return (data.rates as Record<string, number>) ?? {};
  }
}
