"use client";

import { useEffect, useState } from "react";

import { CheckMark, Error, Info, Warning } from "@/components/icon";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToastT, toast as sonnerToast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Resolve the actual theme (handle system theme)
  const resolvedTheme = mounted
    ? (theme === "system" ? systemTheme : theme) || "light"
    : "light";

  return (
    <Sonner
      theme={resolvedTheme as "light" | "dark"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-none group-[.toaster]:rounded-lg group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:min-h-[56px] group-[.toaster]:flex group-[.toaster]:items-center group-[.toaster]:gap-3 group-[.toaster]:w-full group-[.toaster]:max-w-md group-[.toaster]:backdrop-blur-sm",
          description:
            "group-[.toast]:text-muted-foreground group-[.toast]:text-sm group-[.toast]:leading-relaxed",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:transition-colors",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:transition-colors",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:border-0 group-[.toast]:text-muted-foreground group-[.toast]:hover:text-foreground group-[.toast]:hover:bg-accent/50 group-[.toast]:opacity-70 group-[.toast]:hover:opacity-100 group-[.toast]:transition-all group-[.toast]:rounded-md group-[.toast]:size-6 group-[.toast]:flex group-[.toast]:items-center group-[.toast]:justify-center",
        },
      }}
      {...props}
    />
  );
};

export const toast = {
  success: (message: string, options?: Omit<ToastT, "message" | "id">) => {
    return sonnerToast.success(message, {
      ...options,
      icon: (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
          <CheckMark className="text-primary size-6" />
        </div>
      ),
      className: options?.className,
    });
  },
  error: (message: string, options?: Omit<ToastT, "message" | "id">) => {
    return sonnerToast.error(message, {
      ...options,
      icon: (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
          <Error className="text-destructive size-6" />
        </div>
      ),
      className: options?.className,
    });
  },
  info: (message: string, options?: Omit<ToastT, "message" | "id">) => {
    return sonnerToast.info(message, {
      ...options,
      icon: (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
          <Info className="text-primary size-6" />
        </div>
      ),
      className: options?.className,
    });
  },
  warning: (message: string, options?: Omit<ToastT, "message" | "id">) => {
    return sonnerToast.warning(message, {
      ...options,
      icon: (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
          <Warning className="size-6 text-orange-500" />
        </div>
      ),
      className: options?.className,
    });
  },
  message: (message: string, options?: Omit<ToastT, "message" | "id">) => {
    return sonnerToast(message, {
      ...options,
      className: cn("border-border bg-card", options?.className),
    });
  },
};

export { Toaster };
