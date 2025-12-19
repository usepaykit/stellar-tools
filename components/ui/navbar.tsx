"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";

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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { CirclePlus, LogOut, Monitor, Moon, Sun } from "@aliimam/icons";
import axios from "axios";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";

import { AiApps, GitHub, Paykit, ShoppingCart, WebApps } from "../icon";

const cloud: {
  title: string;
  logoUrl: string;
  href: string;
  description: string;
}[] = [
  {
    title: "AI SDK",
    href: "https://ai-sdk.dev/",
    logoUrl: "/images/integrations/aisdk.jpg",
    description: "Unified SDK for integrating AI models in TypeScript.",
  },
  {
    title: "Better Auth",
    href: "https://www.better-auth.com/",
    logoUrl: "/images/integrations/better-auth.png",
    description: "Simple, secure authentication and session management.",
  },
  {
    title: "Shopify",
    href: "https://shopify.dev/",
    logoUrl: "/images/integrations/shopify.png",
    description: "Connect your app with Shopify’s e-commerce platform.",
  },
  {
    title: "Medus",
    href: "https://www.medusajs.com/",
    logoUrl: "/images/integrations/medusa.svg",
    description: "Headless commerce backend for custom online stores.",
  },
  {
    title: "UploadThing",
    href: "https://uploadthing.com/",
    logoUrl: "/images/integrations/uploadthing.png",
    description: "Secure, easy file upload service for web apps.",
  },
  {
    title: "PayloadCms",
    href: "https://payloadcms.com/",
    logoUrl: "/images/integrations/payloadcms.png",
    description: "Developer-friendly headless CMS and API backend.",
  },
];

const cases: {
  title: string;
  href: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>> | React.JSX.Element;
}[] = [
  {
    title: "Al Apps",
    href: "#",
    description: "Deploy at the speed of Al",
    icon: AiApps,
  },
  {
    title: "Composable Commerce",
    href: "#",
    description: "Power storefronts that convert",
    icon: ShoppingCart,
  },

  {
    title: "Web Apps",
    href: "#",
    description: "Ship features, not infrastructure",
    icon: WebApps,
  },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [starsNumber, setStarsNumber] = useState<number>(0);
  const isAuthenticated = false;
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async function fetchGithubRepoStars() {
      try {
        const response = await axios.get(
          "https://api.github.com/repos/usepaykit/stellar-tools"
        );
        if (!mounted) return;
        setStarsNumber(response.data.stargazers_count);
        console.log("Stars count:", response.data.stargazers_count);
      } catch (error) {
        console.error("Failed to fetch GitHub stars", error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);
  return (
    <div
      className={`bg-background transition-border sticky top-0 z-50 flex h-16 w-full items-center justify-between px-4 duration-300 ${
        scrolled ? "border-b" : "border-b-0"
      }`}
    >
      {" "}
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <div className="flex h-14 justify-center">
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
            <span className="font-rosemary text-lg font-semibold">
              Stellar Tools
            </span>
          </Link>
          <NavigationMenu className="ml-8 hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "text-muted-foreground h-7.5 rounded-full font-normal"
                  )}
                >
                  Products
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background pt-3">
                  <ul className="w-[300px]">
                    <div>
                      <span className="text-muted-foreground p-4">
                        Adapters
                      </span>
                      {cloud.map((component) => (
                        <ListItem
                          key={component.title}
                          title={component.title}
                          href={component.href}
                          logoUrl={component.logoUrl}
                        >
                          {component.description}
                        </ListItem>
                      ))}
                    </div>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "text-muted-foreground h-7.5 rounded-full font-normal"
                  )}
                >
                  Solutions
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background pt-3">
                  <ul className="w-[300px]">
                    <div>
                      <span className="text-muted-foreground p-4">
                        Use Cases
                      </span>
                      {cases.map((component) => (
                        <ListItem
                          key={component.title}
                          title={component.title}
                          href={component.href}
                          icon={component.icon}
                        >
                          {component.description}
                        </ListItem>
                      ))}
                    </div>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "text-muted-foreground h-7.5 rounded-full font-normal"
                  )}
                >
                  <Link href="#">Docs</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "text-muted-foreground h-7.5 rounded-full font-normal"
                  )}
                >
                  <Link href="#">Pricing</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex gap-2">
          {isAuthenticated ? (
            <>
              <Button variant={"outline"} size={"sm"}>
                Contact
              </Button>
              <Button variant={"outline"} size={"sm"}>
                Dashboard
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                size={"sm"}
                variant={"ghost"}
                className="flex items-center gap-2"
              >
                <a
                  href="https://github.com/usepaykit/stellar-tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <GitHub color="black" />
                  {/* <span className="text-xs font-medium">
                    {starsNumber} Stars
                  </span> */}
                </a>
              </Button>
              <Button
                variant={"secondary"}
                size={"sm"}
                className="shadow-buttons-inverted shadow-md"
              >
                Docs
              </Button>
              <Button variant={"default"} size={"sm"}>
                <Link href="/dashboard/create">Get Started</Link>
              </Button>
            </>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="border">
              <AvatarImage
                src="https://raw.githubusercontent.com/aliimam-in/templates/refs/heads/main/apps/vercel/public/ali.jpg"
                alt="Ali Imam"
              />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-70 rounded-xl p-3" align="end">
            <div className="p-2">
              <h1 className="font-semibold">Ali Imam</h1>
              <p className="text-muted-foreground text-sm">
                contact@aliimam.in
              </p>
            </div>
            <DropdownMenuGroup>
              <DropdownMenuItem className="py-3">Dadhboard</DropdownMenuItem>
              <DropdownMenuItem className="py-3">
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="justify-between py-3">
                Create Taems <CirclePlus strokeWidth={2} />
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="-mx-3" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="justify-between py-3">
                Theme <ThemeSwitcher />
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="-mx-3" />

            <DropdownMenuItem className="justify-between py-3">
              Logout <LogOut strokeWidth={2} />
            </DropdownMenuItem>
            <DropdownMenuSeparator className="-mx-3" />
            <DropdownMenuItem className="pt-3">
              <Button className="w-full">Upgrade to Pro</Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ListItem({
  title,
  icon,
  logoUrl,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string;
  icon?:
    | React.ComponentType<React.SVGProps<SVGSVGElement>>
    | React.ReactElement;
  logoUrl?: string;
}) {
  let IconElement: React.ReactNode = null;
  if (icon) {
    if (React.isValidElement(icon)) {
      IconElement = icon;
    } else if (typeof icon === "function") {
      IconElement = React.createElement(
        icon as React.ComponentType<React.SVGProps<SVGSVGElement>>,
        { className: "size-6" }
      );
    }
  }

  return (
    <li {...props}>
      <NavigationMenuLink asChild className="w-fit hover:bg-transparent">
        <Link href={href} target="_blank" rel="noreferrer">
          <div className="flex items-start gap-3 rounded p-2">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${title} logo`}
                width={24}
                height={24}
                className="size-6 rounded-full object-contain"
              />
            ) : IconElement ? (
              <div className="icon-container rounded-sm border p-2">
                {IconElement}
              </div>
            ) : null}
            <div className="text-container">
              <div className="text-sm leading-none font-medium">{title}</div>
              <p className="text-muted-foreground line-clamp-2 pt-1 text-xs leading-snug">
                {children}
              </p>
            </div>
          </div>
        </Link>
      </NavigationMenuLink>
      <style jsx>{`
        li:hover .icon-container {
          background-color: var(--foreground);
          color: var(--background);
          transform: scale(1.05);
          transition: all 0.2s ease;
        }
        li:hover .text-container .text-sm {
          color: var(--foreground);
          transition: color 0.2s ease;
        }
        li:hover .text-container p {
          color: var(--foreground);
          transition: color 0.2s ease;
        }
      `}</style>
    </li>
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
    <div
      className={cn(
        "bg-background ring-border relative isolate flex h-7 rounded-full p-1 ring-1",
        className
      )}
    >
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
            {isActive && (
              <div className="bg-secondary absolute inset-0 rounded-full" />
            )}
            <Icon
              className={cn(
                "relative z-10 m-auto h-3.5 w-3.5",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
