import { AppModalProvider } from "@stellartools/ui";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppModalProvider>{children}</AppModalProvider>;
}
