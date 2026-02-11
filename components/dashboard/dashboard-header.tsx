"use client";

import { EnvironmentToggle } from "@/components/environment-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useOrgContext } from "@/hooks/use-org-query";
import { Info } from "lucide-react";

export default function DashboardHeader() {
  const { data: orgContext } = useOrgContext();
  const currentEnvironment = orgContext?.environment;
  const isTestMode = currentEnvironment === "testnet";

  return (
    <header>
      {isTestMode && (
        <div className="bg-primary border-border border-b px-6 py-1">
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
      )}
      <div className="container flex h-14 items-center justify-between gap-4 px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-4">
          {currentEnvironment && <EnvironmentToggle currentEnvironment={currentEnvironment} />}
        </div>
      </div>
    </header>
  );
}

DashboardHeader.displayName = "DashboardHeader";
