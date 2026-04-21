"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function InstallAppButton({ appName }: { appName: string }) {
  return (
    <Button
      className="shadow-none"
      onClick={() => toast.success(`${appName} — install flow coming soon`)}
    >
      Install app
    </Button>
  );
}
