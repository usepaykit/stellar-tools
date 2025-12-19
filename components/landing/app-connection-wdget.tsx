"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Feature {
  id: string;
  name: string;
  image: string;
}

const features: Feature[] = [
  {
    id: "better-auth",
    name: "BetterAuth",
    image: "/images/integrations/better-auth.png",
  },
  {
    id: "clerk",
    name: "Clerk",
    image: "/images/integrations/clerk.png",
  },
  {
    id: "medusa",
    name: "Medusa",
    image: "/images/integrations/medusa.jpeg",
  },
  {
    id: "shopify",
    name: "Shopify",
    image: "/images/integrations/shopify.png",
  },
  {
    id: "payloadcms",
    name: "PayloadCMS",
    image: "/images/integrations/payloadcms.png",
  },
  {
    id: "wordpress",
    name: "WordPress",
    image: "/images/integrations/wordpress.png",
  },
];

export function AppConnectionWidget() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="relative flex min-h-[600px] flex-col items-center justify-center">
            {/* Central Logo Hub */}
            <div className="relative z-20 mb-20 sm:mb-24">
              <div className="relative">
                {/* Glow effect */}
                <div className="bg-primary/30 absolute inset-0 animate-pulse rounded-2xl blur-3xl" />
                <div className="bg-primary/20 absolute inset-0 rounded-2xl blur-2xl" />
                <div className="bg-primary/10 absolute inset-0 rounded-2xl blur-xl" />

                {/* Logo container */}
                <div className="border-primary/40 bg-card relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 shadow-2xl backdrop-blur-sm sm:h-28 sm:w-28">
                  <Image
                    src={"/images/logo-light.png"}
                    alt="Stellar Tools Logo"
                    width={112}
                    height={112}
                    className="h-full w-full object-contain p-3"
                  />
                </div>
              </div>
              <p className="text-foreground mt-4 text-center text-lg font-semibold">
                Stellar Tools
              </p>
            </div>

            {/* Features Grid with connecting lines */}
            <div className="relative w-full max-w-4xl">
              {/* Connecting Lines Container */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{ top: "-280px" }}
              >
                <svg
                  className="h-full w-full"
                  style={{ minHeight: "600px" }}
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    {/* Animated gradient for lines */}
                    <linearGradient
                      id="lineGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity="0.8"
                      >
                        <animate
                          attributeName="stop-opacity"
                          values="0.8;1;0.8"
                          dur="3s"
                          repeatCount="indefinite"
                        />
                      </stop>
                      <stop
                        offset="100%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity="0.3"
                      >
                        <animate
                          attributeName="stop-opacity"
                          values="0.3;0.5;0.3"
                          dur="3s"
                          repeatCount="indefinite"
                        />
                      </stop>
                    </linearGradient>

                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Lines connecting FROM center TO each integration */}
                  {/* Top row - left */}
                  <path
                    d="M 50% 280 Q 20% 380 16.66% 480"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    fill="none"
                    filter="url(#glow)"
                    className="opacity-80"
                  />
                  {/* Top row - center */}
                  <path
                    d="M 50% 280 L 50% 480"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    fill="none"
                    filter="url(#glow)"
                    className="opacity-80"
                  />
                  {/* Top row - right */}
                  <path
                    d="M 50% 280 Q 80% 380 83.33% 480"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    fill="none"
                    filter="url(#glow)"
                    className="opacity-80"
                  />
                  {/* Bottom row - left */}
                  <path
                    d="M 50% 280 Q 25% 400 16.66% 580"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    fill="none"
                    filter="url(#glow)"
                    className="opacity-80"
                  />
                  {/* Bottom row - center */}
                  <path
                    d="M 50% 280 L 50% 580"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    fill="none"
                    filter="url(#glow)"
                    className="opacity-80"
                  />
                  {/* Bottom row - right */}
                  <path
                    d="M 50% 280 Q 75% 400 83.33% 580"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    fill="none"
                    filter="url(#glow)"
                    className="opacity-80"
                  />

                  {/* Connection dots at center */}
                  <circle
                    cx="50%"
                    cy="280"
                    r="4"
                    fill="hsl(var(--primary))"
                    opacity="0.8"
                  >
                    <animate
                      attributeName="r"
                      values="4;6;4"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.8;1;0.8"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              </div>

              {/* Features */}
              <div className="relative z-10 grid grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
                {features.map((feature) => {
                  return (
                    <div
                      key={feature.id}
                      className="flex flex-col items-center"
                    >
                      <div className="group relative">
                        {/* Hover glow effect */}
                        <div className="bg-primary/0 group-hover:bg-primary/20 absolute inset-0 rounded-2xl blur-xl transition-all duration-300" />

                        {/* Connection point indicator */}
                        <div className="bg-primary/60 shadow-primary/50 absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full shadow-lg">
                          <div className="bg-primary absolute inset-0 animate-ping rounded-full" />
                        </div>

                        {/* Image container */}
                        <div
                          className={cn(
                            "border-border/60 bg-card relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 shadow-xl backdrop-blur-sm transition-all duration-300 sm:h-20 sm:w-20 lg:h-24 lg:w-24",
                            "group-hover:border-primary/50 group-hover:shadow-primary/20 group-hover:scale-105 group-hover:shadow-2xl"
                          )}
                        >
                          <Image
                            src={feature.image || "/placeholder.svg"}
                            alt={feature.name}
                            width={96}
                            height={96}
                            className="h-full w-full object-contain p-2.5 transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                      </div>
                      <p className="text-foreground/90 mt-4 text-center text-sm font-medium sm:text-base">
                        {feature.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
