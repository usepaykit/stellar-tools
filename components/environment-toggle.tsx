"use client";

import * as React from "react";

import { switchEnvironment } from "@/actions/organization";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { Network } from "@/db";
import { useOrgContext } from "@/hooks/use-org-query";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface EnvironmentToggleProps {
  currentEnvironment: Network;
}

export function EnvironmentToggle({ currentEnvironment }: EnvironmentToggleProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLiveMode, setIsLiveMode] = React.useState(currentEnvironment === "mainnet");
  const [isSwitching, setIsSwitching] = React.useState(false);

  React.useEffect(() => {
    setIsLiveMode(currentEnvironment === "mainnet");
  }, [currentEnvironment]);

  const handleToggle = async (checked: boolean) => {
    setIsSwitching(true);
    const newEnv: Network = checked ? "mainnet" : "testnet";
    try {
      await switchEnvironment(newEnv);
      await queryClient.invalidateQueries({ queryKey: ["org-context"] });
      toast.success(`Switched to ${checked ? "Live" : "Test"} mode`);
      router.refresh();
    } catch {
      toast.error("Failed to switch environment");
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Switch
        checked={isLiveMode}
        onCheckedChange={handleToggle}
        disabled={isSwitching}
        className="h-5 w-9 [&>span]:size-4"
      />
      <span className="text-muted-foreground text-xs">{isLiveMode ? "Live" : "Sandbox data"}</span>
    </div>
  );
}
