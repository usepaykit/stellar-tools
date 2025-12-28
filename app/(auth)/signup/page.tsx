"use client";

import React from "react";

import { accountValidator } from "@/actions/auth";
import { Google } from "@/components/icon";
import { TextField } from "@/components/input-picker";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const signUpSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(3, "Name must be at least 3 characters"),
  email: z.email(),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [showPassword, setShowPassword] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const signupMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
    }) => {
      const [firstName, lastName] = data.name.split(" ");

      return await accountValidator(
        data.email.toLowerCase(),
        {
          provider: "local",
          sub: data.password,
        },
        "SIGN_UP",
        { firstName, lastName, avatarUrl: undefined },
        { intent: "SIGN_UP" }
      );
    },
    onSuccess: () => {
      toast.success("Account created successfully");
      router.push("/select-organization");
    },
    onError: (error: Error) => {
      toast.error("Sign-up failed", {
        id: "signup-error",
        description: error.message,
      });
    },
  });
  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: SignUpFormData) => {
    signupMutation.mutate(data);
  };

  const handleGoogleSignIn = React.useCallback(async () => {
    const authUrlDomain = "https://accounts.google.com/o/oauth2/v2/auth";

    const authUrlParams = {
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-callback`,
      response_type: "code",
      scope: "openid profile email",
      access_type: "offline",
      prompt: "consent",
      state: btoa(JSON.stringify({ intent: "SIGN_IN", redirect })),
    };

    const authUrl = `${authUrlDomain}?${new URLSearchParams(authUrlParams as Record<string, string>)}`;
    router.push(authUrl);
  }, [router, redirect]);

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
            <h2 className="f text-3xl tracking-tighter">Create your account</h2>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={handleGoogleSignIn}
            className="hover:bg-muted flex w-full cursor-pointer items-center gap-2.5 rounded-lg border px-10 py-2.5 shadow-none transition-colors"
            disabled={signupMutation.isPending}
          >
            <Google className="h-5 w-5" />
            <span className="text-foreground text-sm font-semibold">
              Continue with Google
            </span>
          </Button>

          <div className="my-6 flex w-full items-center">
            <Separator className="flex-1" />
            <span className="text-muted-foreground px-4 text-sm whitespace-nowrap">
              or continue with email
            </span>
            <Separator className="flex-1" />
          </div>

          <div className="w-full">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  id="name"
                  label="Name"
                  type="text"
                  placeholder="John Doe"
                  className="w-full shadow-none"
                  error={error?.message}
                />
              )}
            />
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

          <div className="w-full space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold">
              Password
            </Label>
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState: { error } }) => (
                <div className="space-y-1.5">
                  <InputGroup
                    className="w-full shadow-none"
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
                        className="h-6 w-6 shadow-none hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
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

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full rounded-md font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:ring-4"
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign up"
            )}
          </Button>

          <div className="my-6 w-full">
            <p className="text-muted-foreground text-center text-sm">
              By continuing you agree to our{" "}
              <Link
                href="/terms"
                className="hover:text-foreground underline transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="hover:text-foreground underline transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Sign In Link */}
          <div className="w-full text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
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
