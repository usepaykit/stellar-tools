"use client";

import * as React from "react";

import { AppModalProvider } from "@/components/app-modal";
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
  return (
    <QueryClientProvider client={queryClient}>
      <AppModalProvider>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </AppModalProvider>
    </QueryClientProvider>
  );
};
