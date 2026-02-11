import * as React from "react";

import { PaymentMethod } from "@/constant";
import { AccountBillingCycle } from "@/constant/schema.client";
import { useCookieState } from "@/hooks/use-cookie-state";
import { ApiClient } from "@stellartools/core";

export interface CheckoutSessionParams {
  price_key: string;
  source: string;
  method: PaymentMethod;
  plan_id: string;
  metadata?: Record<string, string>;
  billing_cycle?: AccountBillingCycle;
}

export function useCheckout() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [, setLastCheckoutAttempt] = useCookieState<CheckoutSessionParams | null>("last_checkout_attempt", null, {
    expires: 1,
    path: "/",
  });

  const startCheckout = async ({
    billing_cycle = "monthly",
    ...forwardedParams
  }: CheckoutSessionParams): Promise<{ url: string | null; error: Error | null }> => {
    try {
      setIsLoading(true);

      const api = new ApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL!, headers: {} });

      const response = await api.post<unknown>("/checkout", {
        ...forwardedParams,
        billing_cycle,
      });

      if (!response.isOk()) {
        return {
          url: null,
          error: new Error(response.error.message),
        };
      }

      const data = response.value as { url: string | null };

      if (data && "url" in data) {
        setLastCheckoutAttempt({ ...forwardedParams, billing_cycle });
        return { url: data.url, error: null };
      }

      throw new Error("No URL found in response");
    } catch (error) {
      console.error("Checkout error:", error);
      throw new Error("Failed to create checkout session");
    } finally {
      setIsLoading(false);
    }
  };

  return { startCheckout, isLoading };
}
