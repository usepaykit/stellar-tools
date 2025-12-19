"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Google } from "@/components/icon";
import { TextField } from "@/components/input-picker";
import { toast } from "@/components/ui/toast";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import Link from "next/link";
import Image from "next/image";

const signInSchema = z.object({
  email: z.email().toLowerCase(),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean(),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignIn() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsSubmitting(true);

    try {
      console.log("Sign-in attempt:", {
        email: data.email,
        rememberMe: data.rememberMe,
        timestamp: new Date().toISOString(),
      });
      toast.success("Signed in successfully");
    } catch (error) {
      console.error("Sign-in error:", error);
      toast.error("Sign-in failed", {
        description:
          error instanceof Error
            ? error.message
            : "Invalid email or password. Please try again.",
      } as Parameters<typeof toast.error>[1]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log("Google sign-in initiated");
      toast.info("Google sign-in", {
        description: "Redirecting to Google authentication...",
      } as Parameters<typeof toast.info>[1]);
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Google sign-in failed");
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
                    <h4 className="text-sm font-semibold text-white mb-1">
                      Cloud-Native
                    </h4>
                    <p className="text-sm text-white/60 leading-relaxed">
                      Unified dashboard to deploy, monitor, and scale—zero
                      infrastructure overhead.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">
                      Global Infrastructure
                    </h4>
                    <p className="text-sm text-white/60 leading-relaxed">
                      99.9% uptime with enterprise-grade security by default.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            {/* Subtle border accent */}
            <div className="absolute -top-px left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

            <div className="pt-8 space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-white tracking-wide">
                  Trusted Cloud Platform
                </h3>
              </div>
              <p className="text-sm text-white/70 leading-relaxed max-w-md font-light">
                Trusted by BetterAuth, Medusa, Shopify, and thousands of
                applications worldwide.
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
              Sign in to your account
            </h2>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={handleGoogleSignIn}
            className="flex items-center w-full gap-2.5 px-10 py-2.5 border rounded-lg transition-colors shadow-none hover:bg-muted"
          >
            <Google className="w-5 h-5" />
            <span className="text-sm font-semibold text-foreground">
              Continue with Google
            </span>
          </Button>

          <div className="flex items-center my-6 w-full">
            <Separator className="flex-1" />
            <span className="px-4 text-sm text-muted-foreground whitespace-nowrap">
              or continue with email
            </span>
            <Separator className="flex-1" />
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
                  className="shadow-none w-full"
                  error={error?.message}
                />
              )}
            />
          </div>

          <div className="space-y-2 w-full">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold">
                Password
              </Label>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-semibold underline hover:text-foreground transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState: { error } }) => (
                <div className="space-y-1.5">
                  <InputGroup
                    className="shadow-none w-full"
                    aria-invalid={error ? "true" : "false"}
                  >
                    <InputGroupInput
                      {...field}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="shadow-none"
                    />
                    <InputGroupAddon align="inline-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-transparent shadow-none"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
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

          <div className="w-full">
            <Controller
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember-me"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label
                    htmlFor="remember-me"
                    className="text-sm font-semibold cursor-pointer"
                  >
                    Remember me
                  </Label>
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
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>

          <div className="my-6 w-full">
            <p className="text-center text-sm text-muted-foreground">
              By continuing you agree to our{" "}
              <Link
                href="/terms"
                className="underline hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </div>

          <div className="text-center w-full">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-semibold underline hover:text-foreground transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
