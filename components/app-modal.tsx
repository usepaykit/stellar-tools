"use client";

import React, { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

type ModalButtonProps = React.ComponentProps<typeof Button> & {
  children: React.ReactNode;
};

export interface AppModalOptions {
  title: string;
  description?: string;
  content: React.ReactNode;
  footer?: React.ReactNode;
  primaryButton?: ModalButtonProps;
  secondaryButton?: ModalButtonProps;
  size?: "small" | "medium" | "full";
  showCloseButton?: boolean;
}

let setGlobalState: (state: { open: boolean; config: AppModalOptions | null }) => void;

export const AppModal = {
  open: (options: AppModalOptions) => setGlobalState?.({ open: true, config: options }),
  close: () => setGlobalState?.({ open: false, config: null }),
};

interface AppModalProps extends AppModalOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AppModalUI = ({
  open,
  onOpenChange,
  title,
  description,
  content,
  footer,
  size = "full",
  showCloseButton = true,
}: AppModalProps) => {
  const sizeStyles = {
    small: "m-4 h-auto max-h-[90vh] w-full max-w-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    medium: "m-4 h-auto max-h-[90vh] w-full max-w-4xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    full: "!inset-0 !top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 !m-0 !h-screen !w-screen !max-w-none sm:!max-w-none rounded-none",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogContent
            showCloseButton={showCloseButton}
            className={cn("gap-0 overflow-visible border-none bg-transparent p-0 shadow-none", sizeStyles[size])}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "bg-background flex w-full flex-col overflow-hidden rounded-lg border shadow-lg",
                size === "full" ? "h-full min-h-screen w-full rounded-none" : "h-auto"
              )}
            >
              <DialogHeader className="shrink-0 border-b px-6 py-6 sm:py-8">
                <DialogTitle className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</DialogTitle>
                {description && <DialogDescription className="text-base">{description}</DialogDescription>}
              </DialogHeader>

              <div
                className={cn(
                  "flex min-h-0 flex-1 flex-col overflow-hidden",
                  size !== "full" && "max-h-[60vh]"
                )}
              >
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-6">{content}</div>
              </div>

              {footer && <DialogFooter className="bg-muted/30 shrink-0 border-t px-6 py-4">{footer}</DialogFooter>}
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export function AppModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ open: boolean; config: AppModalOptions | null }>({
    open: false,
    config: null,
  });

  useEffect(() => {
    setGlobalState = setState;
    return () => {
      setGlobalState = null as any;
    };
  }, []);

  const close = useCallback(() => setState({ open: false, config: null }), []);

  const generatedFooter =
    state.config?.footer ||
    ((state.config?.primaryButton || state.config?.secondaryButton) && (
      <div className="flex w-full justify-end gap-3">
        {state.config.secondaryButton && (
          <Button
            variant="outline"
            size="sm"
            {...state.config.secondaryButton}
            onClick={(e) => {
              state.config?.secondaryButton?.onClick?.(e);
              close();
            }}
          />
        )}
        {state.config.primaryButton && (
          <Button
            size="sm"
            {...state.config.primaryButton}
            onClick={(e) => {
              state.config?.primaryButton?.onClick?.(e);
              close();
            }}
          />
        )}
      </div>
    ));

  return (
    <>
      {children}
      {state.config && (
        <AppModalUI
          {...state.config}
          open={state.open}
          onOpenChange={(open) => !open && close()}
          footer={generatedFooter}
        />
      )}
    </>
  );
}
