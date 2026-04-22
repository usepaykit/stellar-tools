import { getCurrentUser } from "@/actions/auth";
import { getCurrentOrganization } from "@/actions/organization";
import { PluginLauncher } from "@/components/dashboard/plugin-launcher";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/signin");

  const currentOrg = await getCurrentOrganization();

  if (!currentOrg) redirect("/select-organization");

  return (
    <div className={cn(process.env.NEXT_PUBLIC_SHOW_MARKETPLACE_LAUNCHER === "true" ? "mr-8" : "")}>
      {children}
      <PluginLauncher />
    </div>
  );
}
