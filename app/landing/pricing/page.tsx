import * as React from "react";

import { retrievePlans } from "@/actions/plan";
import { PricingGrid } from "@/app/landing/pricing/pricing-grid";
import { AuroraBackground } from "@/components/aurora-background";
import { FooterSection } from "@/components/landing/footer-section";
import { Header } from "@/components/ui/navbar";
import { Plan as PlanSchema } from "@/db";

const enterprise: PlanSchema = {
  id: "enterprise",
  name: "Enterprise",
  description: "For large teams with custom needs",
  billingEvents: -1,
  customers: -1,
  subscriptions: -1,
  usageRecords: -1,
  payments: -1,
  organizations: -1,
  products: -1,
  isCustom: true,
  monthlyAmountUsdCents: -1,
  yearlyAmountUsdCents: -1,
  paymentMethods: null,
  metadata: null,
};

const PricingContent = async () => {
  const plans = await retrievePlans();
  const rows: PlanSchema[] = [enterprise, ...plans].sort((a, b) => {
    const ac = a.customers;
    const bc = b.customers;
    if (ac === -1 && bc === -1) return 0;
    if (ac === -1) return 1;
    if (bc === -1) return -1;
    return ac - bc;
  });

  return (
    <>
      <div className="mb-16 text-center">
        <h1 className="from-foreground to-foreground/70 mb-4 bg-linear-to-b bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
          Simple, transparent pricing
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Accept Stellar payments with ease. Start free, pay only for what you use. No hidden fees, no surprises.
        </p>
      </div>

      <PricingGrid plans={rows} />
    </>
  );
};

export default async function PricingPage() {
  return (
    <AuroraBackground>
      <div className="bg-background min-h-screen scroll-smooth">
        <Header />

        <main className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <React.Suspense fallback={<PricingLoadingFallback />}>
            <PricingContent />
          </React.Suspense>
        </main>
        <FooterSection />
      </div>
    </AuroraBackground>
  );
}

function PricingLoadingFallback() {
  return (
    <>
      <div className="mb-16 text-center">
        <div className="bg-muted/50 mx-auto mb-4 h-12 w-96 max-w-full animate-pulse rounded-md" />
        <div className="bg-muted/50 mx-auto h-5 w-md max-w-full animate-pulse rounded-md" />
      </div>
      <div className="mb-10 flex justify-center">
        <div className="bg-muted/50 h-10 w-64 animate-pulse rounded-lg" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted/30 h-[380px] animate-pulse rounded-xl" />
        ))}
      </div>
    </>
  );
}
