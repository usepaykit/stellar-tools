"use client";

import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export interface FullScreenModalProps
  extends
    MixinProps<"dialog", React.ComponentProps<typeof DialogContent>>,
    MixinProps<"scrollArea", React.ComponentProps<typeof ScrollArea>> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  animationConfig?: {
    initialScale?: number;
    stiffness?: number;
    damping?: number;
    duration?: number;
  };
  showCloseButton?: boolean;
}

/**
 * FullScreenModal - A reusable full-screen modal component with smooth animations
 *
 * @example
 * ```tsx
 * <FullScreenModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Configure destination"
 *   description="Tell Stripe where to send events..."
 *   footer={<Button>Save</Button>}
 * >
 *   <YourContent />
 * </FullScreenModal>
 * ```
 */
export const FullScreenModal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  animationConfig = {},
  showCloseButton = false,
  ...mixProps
}: FullScreenModalProps) => {
  const { dialog, scrollArea } = splitProps(mixProps, "dialog", "scrollArea");

  const {
    initialScale = 0.8,
    stiffness = 300,
    damping = 30,
    duration = 0.3,
  } = animationConfig;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogContent
            {...dialog}
            className={cn(
              "m-0 h-full max-h-screen w-full max-w-none gap-0 rounded-none p-0",
              "sm:h-full sm:w-full sm:max-w-none",
              "top-0! left-0! translate-x-0! translate-y-0!",
              "grid-rows-none!",
              dialog.className
            )}
            showCloseButton={showCloseButton}
          >
            <motion.div
              initial={{ scale: initialScale, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: initialScale, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness,
                damping,
                duration,
              }}
              className="bg-background flex h-full w-full flex-col"
            >
              {/* Header */}
              <DialogHeader className="shrink-0 border-b px-6 pt-8 pb-6">
                <DialogTitle className="text-3xl font-bold">
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className="mt-2 text-base">
                    {description}
                  </DialogDescription>
                )}
              </DialogHeader>

              {/* Content - Scrollable */}
              <ScrollArea
                className={cn(" flex-1", scrollArea.className)}
              >
                <div className="px-6 py-6 h-[200px]">{children}</div>
              </ScrollArea>

              {/* Footer - Sticky */}
              {footer && (
                <DialogFooter className="bg-background sticky bottom-0 z-10 shrink-0 border-t px-6 py-4">
                  {footer}
                </DialogFooter>
              )}
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
};
