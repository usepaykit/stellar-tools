"use client";

import { AppConnectionWidget } from "@/components/landing/app-connection-wdget";
import FeaturesSection from "@/components/landing/features-section";
import FooterSection from "@/components/landing/footer-section";
import { HeroBackground } from "@/components/landing/hero-background";
import HeroSection from "@/components/landing/hero-section";
import WidgetSection from "@/components/landing/widget";
import { Header } from "@/components/ui/navbar";

export default function Home() {
  return (
    <HeroBackground>
      <div className="bg-background min-h-screen scroll-smooth">
        <Header />

        {/* Main Content */}
        <HeroSection />
        <WidgetSection />
        <AppConnectionWidget />
        <FeaturesSection />
        <FooterSection />
      </div>
    </HeroBackground>
  );
}
