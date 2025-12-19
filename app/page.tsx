"use client";

import { AppConnectionWidget } from "@/components/landing/app-connection-wdget";
import { HeroBackground } from "@/components/landing/hero-background";
import HeroSection from "@/components/landing/hero-section";
import { Header } from "@/components/ui/navbar";
import { File, Search, Settings } from "lucide-react";

export default function Home() {
  return (
    <HeroBackground>
      <div className="bg-background min-h-screen scroll-smooth">
        <Header />

        {/* Main Content */}
        <HeroSection />
        <AppConnectionWidget />
      </div>
    </HeroBackground>
  );
}
