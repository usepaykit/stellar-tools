import { CheckoutProvider } from "@stellartools/web/contexts";

import CheckoutUI from "./checkout-ui";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <CheckoutProvider checkoutId={id}>
      <CheckoutUI />
    </CheckoutProvider>
  );
}
