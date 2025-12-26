import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user?.isOnboarded) {
    return redirect("/dashboard");
  }

  return <div>{children}</div>;
}
