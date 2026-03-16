import * as React from "react";

import { PricingCalc } from "@/app/landing/pricing/pricing-calc";
import { AuroraBackground } from "@/components/aurora-background";
import { FooterSection } from "@/components/landing/footer-section";
import { Header } from "@/components/ui/navbar";

export default function PricingPage() {
  return (
    <AuroraBackground className="bg-background min-h-screen scroll-smooth">
      <Header />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Pay for what you process
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg leading-relaxed">
            No seat fees, no monthly plans. A small percentage of payment volume, with the first $10k free.
          </p>
        </div>

        <PricingCalc />
      </div>

      <FooterSection />
    </AuroraBackground>
  );
}
