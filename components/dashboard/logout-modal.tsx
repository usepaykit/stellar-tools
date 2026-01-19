"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/actions/auth";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

interface LogoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LogoutModal({ open, onOpenChange }: LogoutModalProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = React.useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success("Logged out successfully");
      router.push("/signin");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to log out");
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [router, onOpenChange]);

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title="Log out"
      description="Are you sure you want to log out? You'll need to sign in again to access your account."
      size="small"
      showCloseButton={true}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoggingOut}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut} isLoading={isLoggingOut}>
            {isLoggingOut ? "Logging out..." : "Log out"}
          </Button>
        </div>
      }
    >
      <div className="py-4">
        <p className="text-muted-foreground text-sm">
          This will end your current session and you&apos;ll be redirected to the sign in page.
        </p>
      </div>
    </FullScreenModal>
  );
}
