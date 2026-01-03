"use client";

import * as React from "react";

import { getCurrentUser } from "@/actions/auth";
import {
  retrieveOrganizations,
  setCurrentOrganization,
} from "@/actions/organization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BadgeCheck,
  Bell,
  Building2,
  ChevronRight,
  ChevronsUpDown,
  Code,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Receipt,
  Repeat,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navMain = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    url: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Transactions",
    url: "/dashboard/transactions",
    icon: Receipt,
  },
  {
    title: "Customers",
    url: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "Subscriptions",
    url: "/dashboard/subscriptions",
    icon: Repeat,
  },
  {
    title: "Usage",
    url: "/dashboard/usage",
    icon: Activity,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings2,
  },
  {
    title: "Developers",
    url: "/dashboard/developers",
    icon: Code,
    items: [
      {
        title: "API Keys",
        url: "/dashboard/api-keys",
      },
      {
        title: "Webhooks",
        url: "/dashboard/webhooks",
      },
      {
        title: "Documentation",
        url: "/dashboard/documentation",
      },
    ],
  },
];

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = React.useState(false);

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => getCurrentUser(),
  });

  // Fetch organizations
  const { data: organizations, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ["sidebar-organizations"],
    queryFn: () => retrieveOrganizations(),
  });

  // Get current org from organizations list (first one as default)
  const currentOrg = React.useMemo(() => {
    if (!organizations || organizations.length === 0) return null;
    // In a real scenario, this should come from a cookie or context
    // For now, we'll use the first organization
    return organizations[0];
  }, [organizations]);

  // Get user display name and initials
  const userName = React.useMemo(() => {
    if (!user) return "Loading...";
    if (user.profile.firstName && user.profile.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    if (user.profile.firstName) {
      return user.profile.firstName;
    }
    return user.email.split("@")[0];
  }, [user]);

  const userInitials = React.useMemo(() => {
    if (!user) return "??";
    if (user.profile.firstName && user.profile.lastName) {
      return `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase();
    }
    if (user.profile.firstName) {
      return user.profile.firstName.slice(0, 2).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  }, [user]);

  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(url);
  };

  const handleSwitchOrganization = React.useCallback(
    async (orgId: string) => {
      if (!currentOrg || orgId === currentOrg.id) return;

      setIsSwitching(true);
      try {
        // Default to testnet when switching
        await setCurrentOrganization(orgId, "testnet");
        toast.success("Organization switched successfully");
        router.refresh();
      } catch (error) {
        console.error("Failed to switch organization:", error);
        toast.error("Failed to switch organization");
      } finally {
        setIsSwitching(false);
      }
    },
    [currentOrg, router]
  );

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    disabled={isSwitching}
                  >
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg">
                      {currentOrg?.logoUrl ? (
                        <Image
                          src={currentOrg.logoUrl}
                          alt={currentOrg.name}
                          width={32}
                          height={32}
                          className="size-full object-cover"
                        />
                      ) : (
                        <Building2 className="size-4" />
                      )}
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {currentOrg?.name || "Loading..."}
                      </span>
                      <span className="truncate text-xs capitalize">
                        {currentOrg?.role || "Member"}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-muted-foreground text-xs">
                    Organizations
                  </DropdownMenuLabel>
                  {isLoadingOrgs ? (
                    <DropdownMenuItem disabled className="gap-2 p-2">
                      <div className="flex size-6 items-center justify-center">
                        <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                      </div>
                      Loading organizations...
                    </DropdownMenuItem>
                  ) : organizations && organizations.length > 0 ? (
                    organizations.map((org) => (
                      <DropdownMenuItem
                        key={org.id}
                        onClick={() => handleSwitchOrganization(org.id)}
                        className="gap-2 p-2"
                        disabled={isSwitching}
                      >
                        <div className="flex size-6 items-center justify-center overflow-hidden rounded-sm border">
                          {org.logoUrl ? (
                            <Image
                              src={org.logoUrl}
                              alt={org.name}
                              width={24}
                              height={24}
                              className="size-full object-cover"
                            />
                          ) : (
                            <Building2 className="size-4 shrink-0" />
                          )}
                        </div>
                        <div className="flex flex-1 flex-col">
                          <span className="truncate">{org.name}</span>
                          <span className="text-muted-foreground text-xs capitalize">
                            {org.role}
                          </span>
                        </div>
                        {currentOrg && org.id === currentOrg.id && (
                          <DropdownMenuShortcut>✓</DropdownMenuShortcut>
                        )}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled className="gap-2 p-2">
                      No organizations found
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="gap-2 p-2">
                    <Link href="/select-organization?create=true">
                      <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                        <Plus className="size-4" />
                      </div>
                      <div className="text-muted-foreground font-medium">
                        Create organization
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {navMain.map((item) => {
                const itemActive = isActive(item.url);
                if (item.items && item.items.length > 0) {
                  const hasActiveSubItem = item.items.some((subItem) =>
                    isActive(subItem.url)
                  );
                  return (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={hasActiveSubItem}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={itemActive || hasActiveSubItem}
                            className={cn(
                              itemActive || hasActiveSubItem
                                ? "text-primary hover:bg-sidebar-accent data-[active=true]:text-primary bg-transparent data-[active=true]:bg-transparent"
                                : ""
                            )}
                          >
                            {item.icon && (
                              <item.icon
                                className={cn(
                                  itemActive || hasActiveSubItem
                                    ? "text-primary"
                                    : ""
                                )}
                              />
                            )}
                            <span
                              className={cn(
                                itemActive || hasActiveSubItem
                                  ? "text-primary font-medium"
                                  : ""
                              )}
                            >
                              {item.title}
                            </span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => {
                              const subItemActive = isActive(subItem.url);
                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={subItemActive}
                                    className={cn(
                                      subItemActive
                                        ? "text-primary hover:bg-sidebar-accent data-[active=true]:text-primary bg-transparent data-[active=true]:bg-transparent"
                                        : ""
                                    )}
                                  >
                                    <a href={subItem.url}>
                                      <span
                                        className={cn(
                                          subItemActive
                                            ? "text-primary font-medium"
                                            : ""
                                        )}
                                      >
                                        {subItem.title}
                                      </span>
                                    </a>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={itemActive}
                    >
                      <a href={item.url}>
                        {item.icon && (
                          <item.icon
                            className={cn(itemActive ? "text-primary" : "")}
                          />
                        )}
                        <span
                          className={cn(
                            itemActive ? "text-primary font-medium" : ""
                          )}
                        >
                          {item.title}
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={user?.profile.avatarUrl || undefined}
                        alt={userName}
                      />
                      <AvatarFallback className="rounded-lg">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{userName}</span>
                      <span className="truncate text-xs">
                        {user?.email || ""}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={user?.profile.avatarUrl || undefined}
                          alt={userName}
                        />
                        <AvatarFallback className="rounded-lg">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {userName}
                        </span>
                        <span className="truncate text-xs">
                          {user?.email || ""}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="gap-2">
                      <Sparkles className="size-4" />
                      Upgrade to Pro
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="gap-2">
                      <Link href="/dashboard/settings">
                        <BadgeCheck className="size-4" />
                        Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <Bell className="size-4" />
                      Notifications
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="gap-2">
                    <Link href="/auth/signout">
                      <LogOut className="size-4" />
                      Log out
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      {children}
    </SidebarProvider>
  );
}
