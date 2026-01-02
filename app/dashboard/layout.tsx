import { getCurrentUser } from "@/actions/auth";
import { getCurrentOrganization } from "@/actions/organization";
import { EnvironmentToggle } from "@/components/environment-toggle";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/signin");

  const currentOrg = await getCurrentOrganization();

  if (!currentOrg) redirect("/select-organization");

  const environment = currentOrg.environment;

  return (
    <>
      <EnvironmentToggle currentEnvironment={environment} />

      <div
        className={cn(
          "transition-all duration-300",
          environment === "testnet" ? "pt-[52px]" : ""
        )}
      >
        {children}
      </div>
    </>
  );
}
