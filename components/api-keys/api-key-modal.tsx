"use client";

import React from "react";

import { FullScreenModal } from "@/components/fullscreen-modal";
import { TextField } from "@/components/input-picker";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as RHF from "react-hook-form";
import { z } from "zod";

const apiKeySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  ipRestrictions: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value || value.trim() === "") return true;
        const ips = value.split(",").map((ip) => ip.trim());
        const ipRegex =
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ips.every((ip) => ipRegex.test(ip));
      },
      {
        message: "Please enter valid IP addresses separated by commas",
      }
    ),
});

type ApiKeyFormData = z.infer<typeof apiKeySchema>;

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "restricted" | "standard";
  onSuccess?: () => void;
}

export function ApiKeyModal({
  open,
  onOpenChange,
  type,
  onSuccess,
}: ApiKeyModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = RHF.useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: "",
      ipRestrictions: "",
    },
  });

  const onSubmit = async (data: ApiKeyFormData) => {
    setIsSubmitting(true);
    try {
      // Parse IP restrictions
      const ipRestrictions =
        data.ipRestrictions && data.ipRestrictions.trim() !== ""
          ? data.ipRestrictions
              .split(",")
              .map((ip) => ip.trim())
              .filter((ip) => ip !== "")
          : undefined;

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Creating API key:", {
        name: data.name,
        type,
        ipRestrictions,
      });

      toast.success("API key created", {
        description: `Your ${type} key "${data.name}" has been created successfully.`,
      } as Parameters<typeof toast.success>[1]);

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create API key", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      } as Parameters<typeof toast.error>[1]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <FullScreenModal
      open={open}
      onOpenChange={handleOpenChange}
      title={type === "restricted" ? "Create restricted key" : "Create secret key"}
      description={
        type === "restricted"
          ? "Create a key with specific access limits and permissions for greater security."
          : "Create a key that unlocks full API access, enabling extensive interaction with your account."
      }
      size="small"
      showCloseButton={true}
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create key"
            )}
          </Button>
        </div>
      }
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        id="api-key-form"
      >
        <TextField
          id="name"
          label="Name"
          value={form.watch("name")}
          onChange={(value) => form.setValue("name", value)}
          error={form.formState.errors.name?.message}
          helpText="Give your API key a descriptive name to help you identify it later."
          placeholder="e.g., Production API Key"
          required
          className="shadow-none"
        />

        {type === "restricted" && (
          <TextField
            id="ipRestrictions"
            label="IP Restrictions"
            value={form.watch("ipRestrictions") || ""}
            onChange={(value) => form.setValue("ipRestrictions", value)}
            error={form.formState.errors.ipRestrictions?.message}
            helpText="Optionally restrict this key to specific IP addresses. Enter IP addresses separated by commas (e.g., 192.168.1.1, 10.0.0.1)."
            placeholder="192.168.1.1, 10.0.0.1"
            className="shadow-none"
          />
        )}

        {type === "standard" && (
          <div className="bg-muted/50 border-border rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Note:</strong> Standard keys
              have full API access. Make sure to keep your secret keys secure
              and never expose them in client-side code.
            </p>
          </div>
        )}
      </form>
    </FullScreenModal>
  );
}

