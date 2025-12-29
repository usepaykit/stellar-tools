import React from "react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import createGlobe from "cobe";
import { motion } from "framer-motion";
import { Code2, Play } from "lucide-react";
import Image from "next/image";

export default function WidgetSection() {
  const features = [
    {
      title: "Real-time Transaction Dashboard",
      description:
        "Monitor all your payments, subscriptions, and credit transactions in one unified dashboard with live updates.",
      skeleton: <SkeletonOne />,
      className: "col-span-1 lg:col-span-4 border-b lg:border-r border-border",
    },
    {
      title: "Platform Integrations",
      description:
        "Seamlessly integrate with BetterAuth, Medusa, AI SDK, UploadThing, and more with our ready-to-use adapters.",
      skeleton: <SkeletonTwo />,
      className: "border-b col-span-1 lg:col-span-2 border-border",
    },
    {
      title: "Developer Documentation",
      description:
        "Get started in minutes with comprehensive guides, code examples, and interactive API documentation.",
      skeleton: <SkeletonThree />,
      className: "col-span-1 lg:col-span-3 lg:border-r border-border",
    },
    {
      title: "Global Stellar Network",
      description:
        "Leverage the Stellar blockchain network for fast, low-cost payments that work anywhere in the world.",
      skeleton: <SkeletonFour />,
      className: "col-span-1 lg:col-span-3 border-b lg:border-none",
    },
  ];
  return (
    <div className="relative z-20 mx-auto max-w-7xl py-10 lg:py-40">
      <div className="px-8">
        <h4 className="text-foreground mx-auto max-w-5xl text-center text-3xl font-medium tracking-tight lg:text-5xl lg:leading-tight">
          Flexible Payment Infrastructure
        </h4>

        <p className="text-muted-foreground mx-auto my-4 max-w-2xl text-center text-sm font-normal lg:text-base">
          Metered billing, subscriptions, one-time payments, and credit systems.
          All the APIs you need for crypto payments.
        </p>
      </div>

      <div className="relative">
        <div className="border-border mt-12 grid grid-cols-1 rounded-md lg:grid-cols-6 xl:border">
          {features.map((feature) => (
            <FeatureCard key={feature.title} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="h-full w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn(`relative overflow-hidden p-4 sm:p-8`, className)}>
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="text-foreground mx-auto max-w-5xl text-left text-xl tracking-tight md:text-2xl md:leading-snug">
      {children}
    </p>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p
      className={cn(
        "mx-auto max-w-4xl text-left text-sm md:text-base",
        "text-muted-foreground text-center font-normal",
        "mx-0 my-2 max-w-sm text-left md:text-sm"
      )}
    >
      {children}
    </p>
  );
};

export const SkeletonOne = () => {
  return (
    <div className="relative flex h-full gap-10 px-2 py-8">
      <div className="bg-card group border-border mx-auto h-full w-full rounded-lg border p-5 shadow-2xl">
        <div className="flex h-full w-full flex-1 flex-col space-y-3">
          {/* Mock Dashboard UI */}
          <div className="mb-4 flex items-center justify-between">
            <div className="bg-muted h-4 w-32 rounded"></div>
            <div className="bg-muted h-4 w-20 rounded"></div>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="bg-muted/50 h-16 rounded"></div>
            <div className="bg-muted/50 h-16 rounded"></div>
            <div className="bg-muted/50 h-16 rounded"></div>
          </div>
          <div className="bg-muted/30 h-32 rounded"></div>
          <div className="mt-2 flex gap-2">
            <div className="bg-primary/20 h-2 w-full rounded"></div>
            <div className="bg-primary/30 h-2 w-full rounded"></div>
            <div className="bg-primary/40 h-2 w-full rounded"></div>
          </div>
        </div>
      </div>

      <div className="from-background via-background pointer-events-none absolute inset-x-0 bottom-0 z-40 h-60 w-full bg-gradient-to-t to-transparent" />
      <div className="from-background pointer-events-none absolute inset-x-0 top-0 z-40 h-60 w-full bg-gradient-to-b via-transparent to-transparent" />
    </div>
  );
};

export const SkeletonThree = () => {
  return (
    <div className="group/image relative flex h-full gap-10">
      <div className="bg-card border-border group mx-auto h-full w-full rounded-lg border p-6">
        <div className="relative flex h-full w-full flex-1 flex-col space-y-3">
          {/* Code block mockup */}
          <div className="mb-3 flex items-center gap-2">
            <Code2 className="text-muted-foreground h-4 w-4" />
            <div className="bg-muted h-3 w-24 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="bg-muted/50 h-3 w-full rounded"></div>
            <div className="bg-muted/50 h-3 w-3/4 rounded"></div>
            <div className="bg-primary/20 h-3 w-full rounded"></div>
            <div className="bg-muted/50 h-3 w-5/6 rounded"></div>
            <div className="bg-primary/20 h-3 w-full rounded"></div>
            <div className="bg-muted/50 h-3 w-4/5 rounded"></div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Play className="text-primary h-5 w-5" />
            <div className="bg-primary/30 h-2 w-16 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to generate random rotations (called outside render)
const generateRotations = (count: number): number[] =>
  Array.from({ length: count }, () => Math.random() * 20 - 10);

export const SkeletonTwo = () => {
  // Platform integration logos with actual images - separate arrays for each row
  const topRowPlatforms = [
    {
      name: "BetterAuth",
      logo: "/images/integrations/better-auth.png",
    },
    {
      name: "Medusa",
      logo: "/images/integrations/medusa.svg",
    },
    {
      name: "AI SDK",
      logo: "/images/integrations/aisdk.jpg",
    },
    {
      name: "UploadThing",
      logo: "/images/integrations/uploadthing.png",
    },
  ];

  const bottomRowPlatforms = [
    {
      name: "Shopify",
      logo: "/images/integrations/shopify.png",
    },
    {
      name: "PayloadCMS",
      logo: "/images/integrations/payloadcms.png",
    },
    {
      name: "Clerk",
      logo: "/images/integrations/clerk.png",
    },
  ];

  // Generate rotations once using useState with lazy initializer to avoid calling Math.random during render
  const [firstRowRotations] = useState(() =>
    generateRotations(topRowPlatforms.length)
  );
  const [secondRowRotations] = useState(() =>
    generateRotations(bottomRowPlatforms.length)
  );

  const cardVariants = {
    whileHover: {
      scale: 1.05,
      rotate: 0,
      zIndex: 100,
    },
    whileTap: {
      scale: 1.05,
      rotate: 0,
      zIndex: 100,
    },
  };
  return (
    <div className="relative flex h-full flex-col items-start gap-10 overflow-hidden p-8">
      <div className="-ml-20 flex flex-row">
        {topRowPlatforms.map((platform, idx) => (
          <motion.div
            variants={cardVariants}
            key={"platforms-first" + idx}
            style={{
              rotate: firstRowRotations[idx],
            }}
            whileHover="whileHover"
            whileTap="whileTap"
            className="bg-card border-border mt-4 -mr-4 shrink-0 overflow-hidden rounded-xl border p-3 shadow-sm"
          >
            <div className="bg-background flex h-16 w-16 items-center justify-center rounded-lg p-2 md:h-24 md:w-24">
              <Image
                src={platform.logo}
                alt={platform.name}
                width={80}
                height={80}
                className="h-full w-full rounded object-contain"
              />
            </div>
            <p className="text-foreground mt-2 text-center text-xs font-medium md:text-sm">
              {platform.name}
            </p>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-row">
        {bottomRowPlatforms.map((platform, idx) => (
          <motion.div
            key={"platforms-second" + idx}
            style={{
              rotate: secondRowRotations[idx],
            }}
            variants={cardVariants}
            whileHover="whileHover"
            whileTap="whileTap"
            className="bg-card border-border mt-4 -mr-4 shrink-0 overflow-hidden rounded-xl border p-3 shadow-sm"
          >
            <div className="bg-background flex h-16 w-16 items-center justify-center rounded-lg p-2 md:h-24 md:w-24">
              <Image
                src={platform.logo}
                alt={platform.name}
                width={80}
                height={80}
                className="h-full w-full rounded object-contain"
              />
            </div>
            <p className="text-foreground mt-2 text-center text-xs font-medium md:text-sm">
              {platform.name}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="from-background pointer-events-none absolute inset-y-0 left-0 z-100 h-full w-20 bg-gradient-to-r to-transparent" />
      <div className="from-background pointer-events-none absolute inset-y-0 right-0 z-100 h-full w-20 bg-gradient-to-l to-transparent" />
    </div>
  );
};

export const SkeletonFour = () => {
  return (
    <div className="relative mt-10 flex h-60 flex-col items-center bg-transparent md:h-60">
      <Globe className="absolute -right-10 -bottom-80 md:-right-10 md:-bottom-72" />
    </div>
  );
};

export const Globe = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        // Stellar network locations - major nodes and exchanges
        { location: [37.7749, -122.4194], size: 0.05 }, // San Francisco
        { location: [40.7128, -74.006], size: 0.08 }, // New York
        { location: [51.5074, -0.1278], size: 0.06 }, // London
        { location: [35.6762, 139.6503], size: 0.05 }, // Tokyo
        { location: [-33.8688, 151.2093], size: 0.04 }, // Sydney
        { location: [52.52, 13.405], size: 0.04 }, // Berlin
      ],
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.
        state.phi = phi;
        phi += 0.01;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 600, height: 600, maxWidth: "100%", aspectRatio: 1 }}
      className={className}
    />
  );
};
