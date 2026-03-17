"use client";

import { EnvironmentToggle, TestModeBanner } from "@/components/environment-toggle";
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
       <TestModeBanner />
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
