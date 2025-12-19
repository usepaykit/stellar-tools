import { SidebarInset } from "@/components/ui/sidebar";

import DashboardHeader from '@/components/dashboard/dashboard-header';


export function DashboardSidebarInset({ children }: { children: React.ReactNode }) {
	return (
		<SidebarInset className="overflow-x-hidden">
            <DashboardHeader />

			{children}
		</SidebarInset>
	);
}