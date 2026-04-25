"use client";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { useOrgContext } from "@/hooks/use-org-query";
import { cn } from "@/lib/utils";

export const DashboardSidebarInset = ({ children }: { children: React.ReactNode }) => {
  const { data: orgContext } = useOrgContext();
  const isTestMode = orgContext?.environment === "testnet";

  return (
    <SidebarInset className={cn(isTestMode && "mt-8", "overflow-x-hidden transition-all duration-300")}>
      <DashboardHeader />
      {children}
    </SidebarInset>
  );
};
