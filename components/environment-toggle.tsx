"use client";

import * as React from "react";

import { switchEnvironment } from "@/actions/organization";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { Network } from "@/db";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface EnvironmentToggleProps {
  currentEnvironment: Network;
}

export function EnvironmentToggle({ currentEnvironment }: EnvironmentToggleProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isTestMode, setIsTestMode] = React.useState(currentEnvironment === "testnet");
  const [isSwitching, setIsSwitching] = React.useState(false);

  React.useEffect(() => {
    setIsTestMode(currentEnvironment === "testnet");
  }, [currentEnvironment]);

  const handleToggle = async (checked: boolean) => {
    setIsSwitching(true);
    const newEnv: Network = checked ? "testnet" : "mainnet";
    try {
      await switchEnvironment(newEnv);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["org-context"] }),
        queryClient.invalidateQueries({ queryKey: ["overview-stats"] }),
      ]);
      toast.success(`Switched to ${checked ? "Test" : "Live"} mode`);
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
        checked={isTestMode}
        onCheckedChange={handleToggle}
        disabled={isSwitching}
        className="h-5 w-9 cursor-pointer [&>span]:size-4"
      />

      <span className="text-muted-foreground text-xs">Sandbox data</span>
    </div>
  );
}
