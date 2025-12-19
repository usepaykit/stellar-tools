"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import Link from "next/link";
import Image from "next/image";

const updatePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(1, "New password is required")
    .min(8, "New password must be at least 8 characters")
    .regex(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/,
      "New password must contain at least one uppercase letter, one number, and one special character"
    ),
  confirmPassword: z
    .string()
    .min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export default function UpdatePassword() {
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: UpdatePasswordFormData) => {
    setIsSubmitting(true);
    console.log(data);

    try {
      console.log("Password update request:", {
        timestamp: new Date().toISOString(),
      });
      toast.success("Password updated successfully", {
        description: "Your password has been changed successfully.",
      } as Parameters<typeof toast.success>[1]);
    } catch (error) {
      console.error("Password update error:", error);
      toast.error("Failed to update password", {
        description:
          error instanceof Error
            ? error.message
            : "Unable to update password. Please try again.",
      } as Parameters<typeof toast.error>[1]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden lg:flex bg-black overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-br from-black via-gray-950 to-black" />
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/3 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full p-16">
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="relative inline-block">
                <div className="absolute -inset-4 rounded-2xl bg-primary/5 blur-2xl opacity-50 " />
                <Image
                  src="/images/logo-dark.png"
                  alt="Stellar Tools"
                  width={150}
                  height={1}
                  className="object-contain p-5"
                  priority
                />
              </div>

              <div className="space-y-3">
                <h1 className="text-6xl font-bold tracking-[-0.02em] text-white leading-[1.1]">
                  Stellar Tools
                </h1>
                <div className="h-px w-16 bg-linear-to-r from-primary/50 to-transparent" />
              </div>
            </div>

            <div className="space-y-6 max-w-lg">
              <p className="text-lg text-white/80 leading-relaxed font-light tracking-wide">
                The cloud platform for managing Stellar payment SDKs. 
                Centralized control with enterprise reliability.
              </p>

              <div className="flex flex-col gap-4 pt-2">
                <div className="flex items-start gap-4 group">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Cloud-Native</h4>
                    <p className="text-sm text-white/60 leading-relaxed">
                      Unified dashboard to deploy, monitor, and scale—zero infrastructure overhead.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Global Infrastructure</h4>
                    <p className="text-sm text-white/60 leading-relaxed">
                      99.9% uptime with enterprise-grade security by default.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-px left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="pt-8 space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-white tracking-wide">
                  Trusted Cloud Platform
                </h3>
              </div>
              <p className="text-sm text-white/70 leading-relaxed max-w-md font-light">
                Trusted by BetterAuth, Medusa, Shopify, and thousands of applications worldwide.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col justify-center bg-background">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col items-center justify-center px-6 py-12 w-full max-w-md mx-auto space-y-4"
        >
          <div className="space-y-2 text-center w-full">
            <h2 className="text-3xl f tracking-tighter">
              Update your password
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose a new password for your account.
            </p>
          </div>

          <div className="space-y-2 w-full">
            <Label htmlFor="newPassword" className="text-sm font-semibold">
              New Password
            </Label>
            <Controller
              control={form.control}
              name="newPassword"
              render={({ field, fieldState: { error } }) => (
                <div className="space-y-1.5">
                  <InputGroup
                    className="shadow-none w-full"
                    aria-invalid={error ? "true" : "false"}
                  >
                    <InputGroupInput
                      {...field}
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="shadow-none"
                    />
                    <InputGroupAddon align="inline-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-transparent shadow-none"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                  {error?.message && (
                    <p className="text-sm text-destructive">{error.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="space-y-2 w-full">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold">
              Confirm New Password
            </Label>
            <Controller
              control={form.control}
              name="confirmPassword"
              render={({ field, fieldState: { error } }) => (
                <div className="space-y-1.5">
                  <InputGroup
                    className="shadow-none w-full"
                    aria-invalid={error ? "true" : "false"}
                  >
                    <InputGroupInput
                      {...field}
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="shadow-none"
                    />
                    <InputGroupAddon align="inline-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-transparent shadow-none"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                  {error?.message && (
                    <p className="text-sm text-destructive">{error.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full font-semibold rounded-md transition-all duration-300 hover:scale-[1.02] focus:ring-4 hover:shadow-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating password...
              </>
            ) : (
              "Update password"
            )}
          </Button>

          <div className="my-6 w-full">
            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link
                href="/auth/signin"
                className="font-semibold underline hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

