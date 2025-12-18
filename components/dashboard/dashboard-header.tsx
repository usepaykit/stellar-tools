"use client";

import { Search, LayoutGrid, Plus, HelpCircle, Bell, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";

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
        "relative rounded-md bg-muted/50 hover:bg-muted transition-colors",
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
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search"
            className="pl-9 h-9 w-full bg-muted/50 border-input focus-visible:ring-ring/50 shadow-none"
            aria-label="Search"
          />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Web Apps Icon with Notification */}
          <NavIconButton
            icon={
              <div className="flex items-center justify-center size-5">
                <span className="text-sm font-semibold text-primary">W</span>
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
            className="size-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
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