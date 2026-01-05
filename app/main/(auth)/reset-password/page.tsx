"use client";

import React from "react";

import { resetPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const updatePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export default function UpdatePassword() {
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { mutateAsync: resetPasswordAction, isPending } = useMutation({
    mutationFn: async (data: UpdatePasswordFormData) => {
      if (!token) throw new Error("Invalid reset link");

      return await resetPassword(token, data.newPassword);
    },
    onSuccess: () => {
      toast.success("Password updated successfully");
      router.push("/signin");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-black lg:flex">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-br from-black via-gray-950 to-black" />
          <div className="bg-primary/5 absolute top-0 right-0 h-1/2 w-1/2 blur-3xl" />
          <div className="bg-primary/3 absolute bottom-0 left-0 h-1/2 w-1/2 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
        </div>

        <div className="relative z-10 flex w-full flex-col justify-between p-16">
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="relative inline-block">
                <div className="bg-primary/5 absolute -inset-4 rounded-2xl opacity-50 blur-2xl" />
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
                <h1 className="text-6xl leading-[1.1] font-bold tracking-[-0.02em] text-white">
                  Stellar Tools
                </h1>
                <div className="from-primary/50 h-px w-16 bg-linear-to-r to-transparent" />
              </div>
            </div>

            <div className="max-w-lg space-y-6">
              <p className="text-lg leading-relaxed font-light tracking-wide text-white/80">
                The cloud platform for managing Stellar payment SDKs.
                Centralized control with enterprise reliability.
              </p>

              <div className="flex flex-col gap-4 pt-2">
                <div className="group flex items-start gap-4">
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-white">
                      Cloud-Native
                    </h4>
                    <p className="text-sm leading-relaxed text-white/60">
                      Unified dashboard to deploy, monitor, and scale—zero
                      infrastructure overhead.
                    </p>
                  </div>
                </div>

                <div className="group flex items-start gap-4">
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-white">
                      Global Infrastructure
                    </h4>
                    <p className="text-sm leading-relaxed text-white/60">
                      99.9% uptime with enterprise-grade security by default.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-px right-0 left-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

            <div className="space-y-4 pt-8">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold tracking-wide text-white">
                  Trusted Cloud Platform
                </h3>
              </div>
              <p className="max-w-md text-sm leading-relaxed font-light text-white/70">
                Trusted by BetterAuth, Medusa, Shopify, and thousands of
                applications worldwide.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background relative flex flex-col justify-center">
        <form
          onSubmit={form.handleSubmit((data) => resetPasswordAction(data))}
          className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-4 px-6 py-12"
        >
          <div className="w-full space-y-2 text-center">
            <h2 className="f text-3xl tracking-tighter">
              Update your password
            </h2>
            <p className="text-muted-foreground text-sm">
              Choose a new password for your account.
            </p>
            {!token && (
              <p className="text-destructive mt-2 text-sm">
                Invalid or missing reset token. Please request a new password
                reset link.
              </p>
            )}
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-semibold">
              New Password
            </Label>
            <Controller
              control={form.control}
              name="newPassword"
              render={({ field, fieldState: { error } }) => (
                <div className="space-y-1.5">
                  <InputGroup
                    className="w-full shadow-none"
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
                        className="h-6 w-6 shadow-none hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={
                          showNewPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showNewPassword ? (
                          <EyeOff className="text-muted-foreground h-4 w-4" />
                        ) : (
                          <Eye className="text-muted-foreground h-4 w-4" />
                        )}
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                  {error?.message && (
                    <p className="text-destructive text-sm">{error.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold">
              Confirm New Password
            </Label>
            <Controller
              control={form.control}
              name="confirmPassword"
              render={({ field, fieldState: { error } }) => (
                <div className="space-y-1.5">
                  <InputGroup
                    className="w-full shadow-none"
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
                        className="h-6 w-6 shadow-none hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="text-muted-foreground h-4 w-4" />
                        ) : (
                          <Eye className="text-muted-foreground h-4 w-4" />
                        )}
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                  {error?.message && (
                    <p className="text-destructive text-sm">{error.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-md font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:ring-4"
            disabled={isPending}
            isLoading={isPending}
          >
            {isPending ? "Updating password..." : "Update password"}
          </Button>

          <div className="my-6 w-full">
            <p className="text-muted-foreground text-center text-sm">
              Remember your password?{" "}
              <Link
                href="/signin"
                className="hover:text-foreground font-semibold underline transition-colors"
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
