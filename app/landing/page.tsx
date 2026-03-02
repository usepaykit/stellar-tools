"use client";

import { AuroraBackground } from "@/components/aurora-background";
import { AppConnectionWidget } from "@/components/landing/app-connection-wdget";
import CheckoutSection from "@/components/landing/checkout-section";
import CTASection from "@/components/landing/cta-section";
import DevelopersSection from "@/components/landing/developers-section";
import { FooterSection } from "@/components/landing/footer-section";
import HeroSection from "@/components/landing/hero-section";
import HowItWorks from "@/components/landing/how-it-works";
import LogosBelt from "@/components/landing/logos-belt";
import PayoutsSection from "@/components/landing/payouts-section";
import StatsSection from "@/components/landing/stats-section";
import SubscriptionsSection from "@/components/landing/subscriptions-section";
import TestimonialsSection from "@/components/landing/testimonials-section";
import WidgetSection from "@/components/landing/widget";
import { Header } from "@/components/ui/navbar";

export default function Home() {
  return (
    <AuroraBackground>
      <div className="bg-background min-h-screen scroll-smooth">
        <Header />

        <HeroSection />
        <LogosBelt />

        <WidgetSection />
        <HowItWorks />
        <CheckoutSection />
        <StatsSection />
        <AppConnectionWidget />
        <PayoutsSection />
        <DevelopersSection />
        <SubscriptionsSection />
        <TestimonialsSection />
        <CTASection />
        <FooterSection />
      </div>
    </AuroraBackground>
  );
}
