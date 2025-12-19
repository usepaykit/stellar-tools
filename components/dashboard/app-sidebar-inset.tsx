import DashboardHeader from "@/components/dashboard/dashboard-header";
import { SidebarInset } from "@/components/ui/sidebar";

export function DashboardSidebarInset({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarInset className="overflow-x-hidden">
      <DashboardHeader />

      {children}
    </SidebarInset>
  );
}
