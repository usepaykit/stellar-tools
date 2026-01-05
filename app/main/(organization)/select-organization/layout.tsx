import * as React from "react";

import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function SelectOrganizationLayout({
  children,
}: React.PropsWithChildren) {
  const user = await getCurrentUser();

  if (!user) redirect("/signin");

  return <>{children}</>;
}
