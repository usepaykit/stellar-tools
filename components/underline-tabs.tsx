"use client";

import * as React from "react";

import { MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "@/lib/utils";
import {
  Tabs as TabsPrimitive,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export interface UnderlineTabsProps
  extends React.ComponentProps<typeof TabsPrimitive>,
    MixinProps<"list", React.ComponentProps<typeof TabsList>>,
    MixinProps<"trigger", React.ComponentProps<typeof TabsTrigger>>,
    MixinProps<"content", React.ComponentProps<typeof TabsContent>> {
  children: React.ReactNode;
}

const UnderlineTabsList = React.forwardRef<
  React.ElementRef<typeof TabsList>,
  React.ComponentProps<typeof TabsList>
>(({ className, ...props }, ref) => {
  return (
    <TabsList
      ref={ref}
      className={cn(
        "bg-transparent border-b border-border rounded-none p-0 gap-0 h-auto",
        className
      )}
      {...props}
    />
  );
});
UnderlineTabsList.displayName = "UnderlineTabsList";

const UnderlineTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsTrigger>,
  React.ComponentProps<typeof TabsTrigger>
>(({ className, ...props }, ref) => {
  return (
    <TabsTrigger
      ref={ref}
      className={cn(
        "bg-transparent border-0 rounded-none px-4 py-2 text-muted-foreground",
        "data-[state=active]:text-primary data-[state=active]:bg-transparent",
        "data-[state=active]:border-b-2 data-[state=active]:border-primary",
        "data-[state=active]:shadow-none relative",
        "hover:text-foreground transition-colors",
        className
      )}
      {...props}
    />
  );
});
UnderlineTabsTrigger.displayName = "UnderlineTabsTrigger";

const UnderlineTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsContent>,
  React.ComponentProps<typeof TabsContent>
>(({ className, ...props }, ref) => {
  return (
    <TabsContent
      ref={ref}
      className={className}
      {...props}
    />
  );
});
UnderlineTabsContent.displayName = "UnderlineTabsContent";

export function UnderlineTabs({
  children,
  className,
  ...mixProps
}: UnderlineTabsProps) {
  const { list, trigger, content, rest } = splitProps(
    mixProps,
    "list",
    "trigger",
    "content"
  );

  // Clone children and apply mixin props
  const enhancedChildren = React.useMemo(() => {
    return React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;

      const childProps = child.props as { className?: string } & Record<string, unknown>;

      // Handle TabsList
      if (child.type === TabsList || (child.type as { displayName?: string })?.displayName === "UnderlineTabsList") {
        return React.cloneElement(child, {
          ...list,
          className: cn(
            "bg-transparent border-b border-border rounded-none p-0 gap-0 h-auto",
            list.className,
            childProps.className as string | undefined
          ),
        } as React.ComponentProps<typeof TabsList>);
      }

      // Handle TabsTrigger
      if (child.type === TabsTrigger || (child.type as { displayName?: string })?.displayName === "UnderlineTabsTrigger") {
        return React.cloneElement(child, {
          ...trigger,
          className: cn(
            "bg-transparent border-0 rounded-none px-4 py-2 text-muted-foreground",
            "data-[state=active]:text-primary data-[state=active]:bg-transparent",
            "data-[state=active]:border-b-2 data-[state=active]:border-primary",
            "data-[state=active]:shadow-none relative",
            "hover:text-foreground transition-colors",
            trigger.className,
            childProps.className as string | undefined
          ),
        } as React.ComponentProps<typeof TabsTrigger>);
      }

      // Handle TabsContent
      if (child.type === TabsContent || (child.type as { displayName?: string })?.displayName === "UnderlineTabsContent") {
        return React.cloneElement(child, {
          ...content,
          className: cn(content.className, childProps.className as string | undefined),
        } as React.ComponentProps<typeof TabsContent>);
      }

      return child;
    });
  }, [children, list, trigger, content]);

  return (
    <TabsPrimitive {...rest} className={cn("w-full", className)}>
      {enhancedChildren}
    </TabsPrimitive>
  );
}

// Export sub-components for convenience
UnderlineTabs.List = UnderlineTabsList;
UnderlineTabs.Trigger = UnderlineTabsTrigger;
UnderlineTabs.Content = UnderlineTabsContent;

