"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Bell,
  HelpCircle,
  LayoutGrid,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { X } from "lucide-react";

interface NavIconButtonProps {
  icon: React.ReactNode;
  notificationCount?: number;
  notificationColor?: string;
  "aria-label": string;
  onClick?: () => void;
  className?: string;
}

function NavIconButton({
  icon,
  notificationCount,
  notificationColor = "bg-primary",
  "aria-label": ariaLabel,
  onClick,
  className,
}: NavIconButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "bg-muted/50 hover:bg-muted relative rounded-md transition-colors",
        className
      )}
    >
      {icon}
      {notificationCount !== undefined && notificationCount > 0 && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 size-2 rounded-full",
            notificationColor
          )}
          aria-label={`${notificationCount} notifications`}
        />
      )}
    </Button>
  );
}

export default function DashboardHeader() {
  return (
    <header>
      <div className="container flex h-14 items-center justify-between gap-4 px-4">
        {/* Search Bar */}
        <SidebarTrigger className="-ml-1" />
        <div className="relative max-w-md flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search"
            className="bg-muted/50 border-input focus-visible:ring-ring/50 h-9 w-full pl-9 shadow-none"
            aria-label="Search"
          />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Web Apps Icon with Notification */}
          <NavIconButton
            icon={
              <div className="flex size-5 items-center justify-center">
                <span className="text-primary text-sm font-semibold">W</span>
              </div>
            }
            notificationCount={1}
            notificationColor="bg-blue-500"
            aria-label="Web apps"
          />

          {/* Create/Add Grid Icon */}
          <NavIconButton
            icon={<LayoutGrid className="size-4" />}
            aria-label="Create new"
          />

          {/* Help Icon */}
          <NavIconButton
            icon={<HelpCircle className="size-4" />}
            aria-label="Help and support"
          />

          {/* Notifications Bell */}
          <NavIconButton
            icon={<Bell className="size-4" />}
            notificationCount={1}
            notificationColor="bg-blue-500"
            aria-label="Notifications"
          />

          {/* Settings Icon */}
          <NavIconButton
            icon={<Settings className="size-4" />}
            aria-label="Settings"
          />

          {/* Primary Action Button */}
          <Button
            size="icon"
            className="bg-primary text-primary-foreground hover:bg-primary/90 size-9 rounded-full shadow-sm"
            aria-label="Add new item"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

DashboardHeader.displayName = "DashboardHeader";
