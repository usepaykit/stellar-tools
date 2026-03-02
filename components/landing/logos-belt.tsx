import React from "react";

import Image from "next/image";

const integrations = [
  { name: "AI SDK (Vercel)", logo: "/images/integrations/aisdk.jpg" },
  { name: "BetterAuth", logo: "/images/integrations/better-auth.png" },
  { name: "MedusaJS", logo: "/images/integrations/medusa.svg" },
  { name: "UploadThing", logo: "/images/integrations/uploadthing.png" },
  { name: "Stellar / XLM", logo: "/images/integrations/stellar-official.png" },
  { name: "Clerk", logo: "/images/integrations/clerk.png" },
];

export default function LogosBelt() {
  return (
    <div className="border-border bg-secondary border-t border-b px-6 py-8 sm:px-10">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-5">
        <div className="text-muted-foreground text-[13px] font-medium tracking-widest uppercase">
          Integrates with tools you already use
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-10">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="bg-card border-border text-muted-foreground flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold"
            >
              <Image
                src={integration.logo}
                alt={`${integration.name} logo`}
                width={16}
                height={16}
                className="h-4 w-4 rounded-full object-contain"
              />
              {integration.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
