"use client";

import * as React from "react";

import { switchEnvironment } from "@/actions/organization";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { Network } from "@/db";
import { useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";

interface EnvironmentToggleProps {
  currentEnvironment: Network;
}

export function EnvironmentToggle({ currentEnvironment }: EnvironmentToggleProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLiveMode, setIsLiveMode] = React.useState(currentEnvironment === "mainnet");

  const [isPending, setIsPending] = React.useState(false);

  const handleToggle = React.useCallback(
    async (checked: boolean) => {
      setIsPending(true);
      const newEnvironment: Network = checked ? "mainnet" : "testnet";

      try {
        await switchEnvironment(newEnvironment);
        await queryClient.invalidateQueries({ queryKey: ["org-context"] });
        setIsLiveMode(newEnvironment === "mainnet");
        toast.success(`Switched to ${checked ? "Live" : "Test"} mode successfully`);
        router.refresh();
      } catch {
        toast.error("Failed to switch environment");
      } finally {
        setIsPending(false);
      }
    },
    [router, queryClient]
  );

  React.useEffect(() => {
    setIsLiveMode(currentEnvironment === "mainnet");
  }, [currentEnvironment]);

  if (isLiveMode) return null;

  return (
    <div className="bg-muted/50 border-border border-b px-6 py-2.5">
      <div className="container flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          <Info className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-sm">
            You are in <span className="font-medium">Test mode</span>
          </span>
          <Badge variant="outline" className="font-normal">
            Test
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Enable Live Mode</span>
          <Switch
            checked={isLiveMode}
            onCheckedChange={handleToggle}
            disabled={isPending}
            aria-label="Toggle between test and live mode"
          />
        </div>
      </div>
    </div>
  );
}
