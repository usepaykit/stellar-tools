"use client";

import { AuroraBackground, StellarTools } from "@stellartools/ui";

export default function NotFound() {
  return (
    <AuroraBackground>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-8 px-6">
        <StellarTools width={70} height={70} className="text-foreground" />
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Not found</h1>
          <p className="text-muted-foreground max-w-xs text-sm">The page you seek has drifted beyond the horizon.</p>
          <p className="text-muted-foreground/80 max-w-xs text-xs italic">
            Even the best explorers take a wrong turn now and then.
          </p>
        </div>
      </div>
    </AuroraBackground>
  );
}
