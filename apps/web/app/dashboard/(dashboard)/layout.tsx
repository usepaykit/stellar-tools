import { getCurrentOrganization, getCurrentUser } from "@stellartools/web/actions";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/signin");

  const currentOrg = await getCurrentOrganization();

  if (!currentOrg) redirect("/select-organization");

  return <>{children}</>;
}
