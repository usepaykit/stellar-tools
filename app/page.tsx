"use client";

import { Header } from "@/components/ui/navbar";
import { HeroBackground } from "@/components/landing/hero-background";
import HeroSection from "@/components/landing/hero-section";
import { File, Search, Settings } from "lucide-react"

import { AppConnectionWidget } from "@/components/landing/app-connection-wdget";


export default function Home() {
  return (
    
    <HeroBackground>

    <div className="min-h-screen bg-background scroll-smooth">
      <Header />

      {/* Main Content */}
      <HeroSection />
     <AppConnectionWidget />
    </div>
    </HeroBackground>
  );
}
