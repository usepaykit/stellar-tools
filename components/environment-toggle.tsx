"use client";

import * as React from "react";

import { Network } from "@/db";
import { Info } from "lucide-react";

interface EnvironmentToggleProps {
  currentEnvironment: Network;
}

export function EnvironmentToggle({ currentEnvironment }: EnvironmentToggleProps) {
  const [isLiveMode, setIsLiveMode] = React.useState(currentEnvironment === "mainnet");

  React.useEffect(() => {
    setIsLiveMode(currentEnvironment === "mainnet");
  }, [currentEnvironment]);

  if (isLiveMode) return null;

  return (
    <div className="bg-primary border-border border-b px-6 py-2.5">
      <div className="container flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          <Info className="text-muted h-4 w-4" />
          <span className="text-accent text-sm">
            You are in <span className="font-medium">Test mode</span>
          </span>
        </div>

        <div />
      </div>
    </div>
  );
}
