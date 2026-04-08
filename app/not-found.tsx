"use client";

import { AuroraBackground } from "@/components/aurora-background";
import Logo from "@/components/logo";
import Link from "next/link";

export default function NotFound() {
  return (
    <AuroraBackground>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-8 px-6">
        <Logo width={120} height={40} className="" priority />
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Not found</h1>
          <p className="text-muted-foreground max-w-xs text-sm">The page you seek has drifted beyond the horizon.</p>
          <p className="text-muted-foreground/80 max-w-xs text-xs italic">
            Even the best explorers take a wrong turn now and then.
          </p>
        </div>

        <Link
          className="text-primary hover:text-primary/80 text-sm underline"
          href={process.env.NEXT_PUBLIC_APP_URL ?? "http://www.stellartools.dev"}
        >
          Go home
        </Link>
      </div>
    </AuroraBackground>
  );
}
