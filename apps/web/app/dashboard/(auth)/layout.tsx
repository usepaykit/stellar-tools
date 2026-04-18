import { getCurrentUser } from "@stellartools/web/actions";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (user) redirect("/");

  return <div>{children}</div>;
}
