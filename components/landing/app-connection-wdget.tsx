"use client";

import RadialOrbitalTimeline from "./radial-orbital-timeline";

const integrationData = [
  {
    id: 1,
    title: "BetterAuth",
    description:
      "Simple, secure authentication with built-in Stellar payment support.",
    category: "Authentication",
    logo: "/images/integrations/better-auth.png",
    relatedIds: [2, 3],
    status: "available" as const,
    adoption: 95,
  },
  {
    id: 2,
    title: "Medusa",
    description:
      "Headless commerce backend with native Stellar payment integration.",
    category: "E-commerce",
    logo: "/images/integrations/medusa.svg",
    relatedIds: [1, 4],
    status: "available" as const,
    adoption: 88,
  },
  {
    id: 3,
    title: "AI SDK",
    description:
      "AI model integration with metered billing powered by Stellar credits.",
    category: "AI/ML",
    logo: "/images/integrations/aisdk.jpg",
    relatedIds: [1, 5],
    status: "available" as const,
    adoption: 75,
  },
  {
    id: 4,
    title: "Shopify",
    description:
      "E-commerce platform integration for Stellar blockchain payments.",
    category: "E-commerce",
    logo: "/images/integrations/shopify.png",
    relatedIds: [2, 6],
    status: "available" as const,
    adoption: 82,
  },
  {
    id: 5,
    title: "UploadThing",
    description:
      "File upload service with usage-based billing via Stellar credits.",
    category: "Storage",
    logo: "/images/integrations/uploadthing.png",
    relatedIds: [3, 6],
    status: "available" as const,
    adoption: 70,
  },
  {
    id: 6,
    title: "PayloadCMS",
    description: "Headless CMS with Stellar payment gateway integration.",
    category: "CMS",
    logo: "/images/integrations/payloadcms.png",
    relatedIds: [4, 5],
    status: "available" as const,
    adoption: 65,
  },
];

export function AppConnectionWidget() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-foreground mb-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Platform Integrations
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Seamlessly integrate Stellar payments with your favorite platforms
              and tools.
            </p>
          </div>
          <RadialOrbitalTimeline timelineData={integrationData} />
        </div>
      </div>
    </section>
  );
}
