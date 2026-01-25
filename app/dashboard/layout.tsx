import { getCurrentUser } from "@/actions/auth";
import { getCurrentOrganization } from "@/actions/organization";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/signin");

  // Check if we're on the select-organization page to prevent redirect loop
  const headersList = await headers();
  const pathname = headersList.get("x-pathname");
  
  if (pathname === "/select-organization") {
    return <>{children}</>;
  }

  const currentOrg = await getCurrentOrganization();

  if (!currentOrg) redirect("/select-organization");

  return <>{children}</>;
}
