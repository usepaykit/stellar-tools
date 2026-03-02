"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getCurrentUser, signOut } from "@/actions/auth";
import { AppModal } from "@/components/app-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { CirclePlus, LogOut, Monitor, Moon, Sun } from "@aliimam/icons";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Paykit } from "../icon";

const NAV_LINKS = [
  { href: "#features", label: "Products" },
  { href: "#integrations", label: "Integrations" },
  { href: "#developers", label: "Developers" },
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  const { data: user, isLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  });

  const isAuthenticated = !!user;

  const userName = user?.profile.firstName
    ? `${user.profile.firstName} ${user.profile.lastName || ""}`.trim()
    : user?.email.split("@")[0] || "User";

  const userInitials = (user?.profile.firstName?.[0] || user?.email?.[0] || "?").toUpperCase();

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      router.push("/signin");
      AppModal.close();
    } catch (error) {
      toast.error("Failed to log out");
      console.error("Logout error:", error);
    }
  }, [router]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-300",
        scrolled ? "border-border bg-background/90" : "bg-background/90 border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Paykit className="size-8" />
          <span className="text-muted-foreground">/</span>
          <Image
            src="/images/logo-light.png"
            alt="Stellar Tools logo"
            width={32}
            height={32}
            className="size-8 rounded-md object-contain"
          />
          <span className="font-rosemary text-lg font-semibold">StellarTools</span>
        </Link>

        {/* Navigation Links */}
        <ul className="hidden list-none gap-8 md:flex">
          <li>
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground text-[14.5px] font-medium no-underline transition-colors"
            >
              Products
            </Link>
          </li>
          <li>
            <Link
              href="#integrations"
              className="text-muted-foreground hover:text-foreground text-[14.5px] font-medium no-underline transition-colors"
            >
              Integrations
            </Link>
          </li>
          <li>
            <Link
              href="#developers"
              className="text-muted-foreground hover:text-foreground text-[14.5px] font-medium no-underline transition-colors"
            >
              Developers
            </Link>
          </li>
          <li>
            <Link
              href="/docs"
              className="text-muted-foreground hover:text-foreground text-[14.5px] font-medium no-underline transition-colors"
            >
              Docs
            </Link>
          </li>
          <li>
            <Link
              href="/pricing"
              className="text-muted-foreground hover:text-foreground text-[14.5px] font-medium no-underline transition-colors"
            >
              Pricing
            </Link>
          </li>
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
          ) : isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer border">
                    <AvatarImage src={user?.profile.avatarUrl || ""} alt={userName} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-70 rounded-xl p-3" align="end">
                  <div className="p-2">
                    <h1 className="font-semibold">{userName}</h1>
                    <p className="text-muted-foreground text-sm">{user?.email}</p>
                  </div>
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="py-3" asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="py-3" asChild>
                      <Link href="/settings">Account Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="justify-between py-3" asChild>
                      <Link href="/select-organization?create=true">
                        Create Teams <CirclePlus strokeWidth={2} />
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="-mx-3" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="justify-between py-3">
                      Theme <ThemeSwitcher />
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="-mx-3" />
                  <DropdownMenuItem
                    className="text-destructive justify-between py-3"
                    onClick={() =>
                      AppModal.open({
                        title: "Log out",
                        description:
                          "Are you sure you want to log out? You'll need to sign in again to access your account.",
                        content: (
                          <div className="py-4">
                            <p className="text-muted-foreground text-sm">
                              This will end your current session and you&apos;ll be redirected to the sign in page.
                            </p>
                          </div>
                        ),
                        size: "small",
                        showCloseButton: true,
                        primaryButton: { children: "Log out", variant: "destructive", onClick: handleLogout },
                        secondaryButton: { children: "Cancel" },
                      })
                    }
                  >
                    Logout <LogOut strokeWidth={2} />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-4 py-2 text-[14.5px] font-medium no-underline transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/create"
                className="bg-primary text-primary-foreground rounded-[9px] px-5 py-2 text-[14.5px] font-semibold no-underline transition-all hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(91,79,255,0.35)]"
              >
                Start for free →
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const themes = [
  {
    key: "system",
    icon: Monitor,
    label: "System theme",
  },
  {
    key: "light",
    icon: Sun,
    label: "Light theme",
  },
  {
    key: "dark",
    icon: Moon,
    label: "Dark theme",
  },
];

export type ThemeSwitcherProps = {
  value?: "light" | "dark" | "system";
  onChange?: (theme: "light" | "dark" | "system") => void;
  defaultValue?: "light" | "dark" | "system";
  className?: string;
};

const ThemeSwitcher = ({ className }: ThemeSwitcherProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const handleThemeClick = useCallback(
    (themeKey: "light" | "dark" | "system") => {
      setTheme(themeKey);
    },
    [setTheme]
  );

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className={cn("bg-background ring-border relative isolate flex h-7 rounded-full p-1 ring-1", className)}>
      {themes.map(({ key, icon: Icon, label }) => {
        const isActive = theme === key;

        return (
          <button
            aria-label={label}
            className="relative h-5 w-6 rounded-full"
            key={key}
            onClick={() => handleThemeClick(key as "light" | "dark" | "system")}
            type="button"
          >
            {isActive && <div className="bg-secondary absolute inset-0 rounded-full" />}
            <Icon
              className={cn("relative z-10 m-auto h-3.5 w-3.5", isActive ? "text-foreground" : "text-muted-foreground")}
            />
          </button>
        );
      })}
    </div>
  );
};
