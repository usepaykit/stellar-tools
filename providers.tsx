"use client";

import * as React from "react";

import { StellarWalletsKitApi } from "@/integrations/stellar-wallets-kit";
import { Networks } from "@stellar/stellar-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const stellarWalletsKit = StellarWalletsKitApi.getInstance();

  React.useEffect(() => {
    stellarWalletsKit.init({
      network: Networks.TESTNET, // todo: make this configurable from checkout
    });

    return () => {
      stellarWalletsKit.disconnect();
    };
  }, [stellarWalletsKit]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
