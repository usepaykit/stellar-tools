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

  const isTestMode = currentOrg?.environment === "testnet";

  return (
    <>
      <EnvironmentToggle currentEnvironment={"mainnet"} />

      <div
        className={cn(
          "transition-all duration-300",
          isTestMode ? "pt-[52px]" : ""
        )}
      >
        {children}
      </div>
    </>
  );
}
