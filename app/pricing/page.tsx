"use client";

import { AuroraBackground } from "@/components/aurora-background";
import FooterSection from "@/components/landing/footer-section";
import SubscriptionCalc from "@/components/landing/subscription-calc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/ui/navbar";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const pricingTiers = [
  {
    name: "Free",
    subtitle: "No credit card required",
    price: "Free forever",
    description:
      "Capped at 1M monthly events. The basics to get started, including up to 5 saved reports and 10K monthly session replays.",
    cta: "Sign Up",
    ctaVariant: "outline" as const,
  },
  {
    name: "Growth",
    subtitle: "Make your competition sweat",
    price: "Starts at $0",
    description:
      "1M monthly events free and $0.28 per 1K events after (volume discounts available). Unlimited reports, 20K monthly session replays free, cohorts, and more.",
    cta: "Start for Free",
    ctaVariant: "default" as const,
    showCalculateLink: true,
    highlighted: true,
  },
  {
    name: "Enterprise",
    subtitle: "Self-serve answers at scale",
    price: "Let's chat",
    description:
      "Unlimited monthly events. Advanced analytics, comprehensive data governance and security, premium support, and more.",
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
  },
];

const data = [
  {
    url: "https://image.pngaaa.com/868/3708868-middle.png",
    alt: "Trusted user",
    width: 40,
    height: 40,
  },
  {
    url: "https://image.pngaaa.com/104/3298104-small.png",
    alt: "Trusted user",
    width: 40,
    height: 40,
  },
  {
    url: "https://image.pngaaa.com/39/7602039-small.png",
    alt: "Trusted user",
    width: 40,
    height: 40,
  },
  {
    url: "https://image.pngaaa.com/69/3298069-small.png",
    alt: "Trusted user",
    width: 40,
    height: 40,
  },
  {
    url: "https://image.pngaaa.com/24/2517024-small.png",
    alt: "Trusted user",
    width: 40,
    height: 40,
  },
];

export default function PricingPage() {
  return (
    <AuroraBackground>
      <div className="bg-background min-h-screen scroll-smooth">
        <Header />

        <main className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="flex -space-x-3">
                {data.map((item, i) => (
                  <Image
                    key={i}
                    src={item.url}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    className="border-background rounded-full border-2 object-cover shadow-sm"
                  />
                ))}
              </div>
              <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium">
                Trusted by developers worldwide
              </Badge>
            </div>
            <h1 className="from-foreground to-foreground/70 mb-6 bg-linear-to-b bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
              Simple, transparent pricing
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Accept Stellar payments with ease. Start free, pay only for what you use. No hidden
              fees, no surprises.
            </p>
          </div>

          <div className="mb-32 grid gap-6 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={cn(
                  "dark:bg-card relative flex flex-col bg-white",
                  tier.highlighted && "border-primary/20 border-2"
                )}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="mb-1 text-2xl font-bold">{tier.name}</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    {tier.subtitle}
                  </CardDescription>
                  <div className="mt-6">
                    <div className="text-3xl font-bold">{tier.price}</div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 pb-6">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {tier.description}
                  </p>
                </CardContent>

                <CardFooter className="flex-col gap-3 pt-0">
                  <div className="flex w-full items-center gap-3">
                    <Button variant={tier.ctaVariant} className="flex-1" size="lg">
                      {tier.cta}
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                    {tier.showCalculateLink && (
                      <Link
                        href="#calculator"
                        className="text-muted-foreground hover:text-foreground text-sm underline transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          document
                            .getElementById("calculator")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Calculate pricing
                      </Link>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div id="calculator">
            <SubscriptionCalc />
          </div>
        </main>
        <FooterSection />
      </div>
    </AuroraBackground>
  );
}
