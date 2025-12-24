"use client";

import React from "react";

import { TextField } from "@/components/input-picker";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.email(),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);

    try {
      console.log("Password reset request:", {
        email: data.email,
        timestamp: new Date().toISOString(),
      });
      toast.success("Password reset link sent", {
        description:
          "Check your email for instructions to reset your password.",
      } as Parameters<typeof toast.success>[1]);
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Failed to send reset link", {
        description:
          error instanceof Error
            ? error.message
            : "Unable to send password reset link. Please try again.",
      } as Parameters<typeof toast.error>[1]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-black lg:flex">
        {/* Sophisticated gradient mesh background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-br from-black via-gray-950 to-black" />
          <div className="bg-primary/5 absolute top-0 right-0 h-1/2 w-1/2 blur-3xl" />
          <div className="bg-primary/3 absolute bottom-0 left-0 h-1/2 w-1/2 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
        </div>

        {/* Content Container with refined spacing */}
        <div className="relative z-10 flex w-full flex-col justify-between p-16">
          {/* Top Section */}
          <div className="space-y-10">
            {/* Logo Section - Premium presentation */}
            <div className="space-y-6">
              <div className="relative inline-block">
                {/* Subtle glow - not overpowering */}
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

              {/* Typography with refined hierarchy */}
              <div className="space-y-3">
                <h1 className="text-6xl leading-[1.1] font-bold tracking-[-0.02em] text-white">
                  Stellar Tools
                </h1>
                <div className="from-primary/50 h-px w-16 bg-linear-to-r to-transparent" />
              </div>
            </div>

            {/* Value Proposition - Concise and impactful */}
            <div className="max-w-lg space-y-6">
              <p className="text-lg leading-relaxed font-light tracking-wide text-white/80">
                The cloud platform for managing Stellar payment SDKs.
                Centralized control with enterprise reliability.
              </p>

              {/* Feature highlights - Minimal and elegant */}
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

          {/* Bottom Section - Refined feature showcase */}
          <div className="relative">
            {/* Subtle border accent */}
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

      {/* Right side form */}
      <div className="bg-background relative flex flex-col justify-center">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-4 px-6 py-12"
        >
          <div className="w-full space-y-2 text-center">
            <h2 className="f text-3xl tracking-tighter">Reset your password</h2>
            <p className="text-muted-foreground text-sm">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
          </div>

          <div className="w-full">
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  id="email"
                  label="Email"
                  placeholder="name@example.com"
                  className="w-full shadow-none"
                  error={error?.message}
                />
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-md font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:ring-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>

          <div className="my-6 w-full">
            <p className="text-muted-foreground text-center text-sm">
              Remember your password?{" "}
              <Link
                href="/auth/signin"
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
