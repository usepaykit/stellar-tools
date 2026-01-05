import * as React from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout powered by Stellar",
};

export default function CheckoutLayout({ children }: React.PropsWithChildren) {
  return children;
}
