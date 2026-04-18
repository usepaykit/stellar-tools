"use client";

import { SidebarTrigger } from "@stellartools/ui";
import { EnvironmentToggle, TestModeBanner } from "@stellartools/web/components";
import { useOrgContext } from "@stellartools/web/hooks";

export default function DashboardHeader() {
  const { data: orgContext } = useOrgContext();
  const currentEnvironment = orgContext?.environment;
  const isTestMode = currentEnvironment === "testnet";

  return (
    <header>
      {isTestMode && <TestModeBanner />}
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
