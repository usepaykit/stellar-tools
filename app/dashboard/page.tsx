import React from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default function DashboardPage() {
  return (
    <div className="">
      <div className="w-full">
        <DashboardSidebar>
          <DashboardSidebarInset>
            <h1>scroll content</h1>
          </DashboardSidebarInset>
        </DashboardSidebar>
      </div>
    </div>
  );
}
