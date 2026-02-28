import { AppModalProvider } from "@/components/app-modal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppModalProvider>{children}</AppModalProvider>;
}
