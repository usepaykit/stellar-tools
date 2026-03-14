"use client";

import * as React from "react";

import { useCookieState } from "@/hooks/use-cookie-state";
import { useOrgContext } from "@/hooks/use-org-query";
import { ApiClient } from "@stellartools/core";
import { useQueries } from "@tanstack/react-query";

export type AssetSpec = { code: string; issuer: string };

export type AssetRatesResult = {
  rateMap: Record<string, number>;
  fiatRates: Record<string, number> | null;
  selectedCurrency: string;
  isLoading: boolean;
  toLocal: (amount: number, assetCode: string) => number;
  formatLocal: (amount: number) => string;
};

export function useAssetRates(assets: AssetSpec[]): AssetRatesResult {
  const { data: org } = useOrgContext();
  const [selectedCurrency] = useCookieState("dashboard_currency", "USD");

  const queries = useQueries({
    queries: assets.map((asset) => ({
      queryKey: ["rates", asset.code, asset.issuer],
      queryFn: async () => {
        if (!org) throw new Error("No organization found");

        const api = new ApiClient({
          baseUrl: process.env.NEXT_PUBLIC_API_URL!,
          headers: { "x-auth-token": org.token },
        });

        const rates = await api.get<{ data: { assetUsd: number; fiatRates: Record<string, number> } }>(
          `/rates?asset=${encodeURIComponent(asset.code)}&issuer=${encodeURIComponent(asset.issuer)}`
        );

        if (!rates.isOk()) throw new Error(rates.error.message);

        return { ...rates.value.data, code: asset.code };
      },
      enabled: !!org?.token,
      staleTime: 5 * 60 * 1000,
      refetchInterval: 5 * 60 * 1000,
    })),
  });

  const rateMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of queries) {
      if (q.data) {
        map[q.data.code] = (q.data.assetUsd ?? 1) * (q.data.fiatRates?.[selectedCurrency] ?? 1);
      }
    }
    return map;
  }, [queries, selectedCurrency]);

  const fiatRates = queries.find((q) => q.data)?.data?.fiatRates ?? null;
  const isLoading = queries.some((q) => q.isLoading);

  const toLocal = React.useCallback(
    (amount: number, assetCode: string) => amount * (rateMap[assetCode] ?? 1),
    [rateMap]
  );

  const formatLocal = React.useCallback(
    (amount: number) => {
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: selectedCurrency,
          minimumFractionDigits: 2,
        }).format(amount);
      } catch {
        return `${selectedCurrency} ${amount.toFixed(2)}`;
      }
    },
    [selectedCurrency]
  );

  return { rateMap, fiatRates, selectedCurrency, isLoading, toLocal, formatLocal };
}
