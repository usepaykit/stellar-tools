"use client";

import * as React from "react";

import { accountValidator } from "@/actions/auth";
import { Google } from "@/components/icon";
import Logo from "@/components/logo";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Eye, EyeOff, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const signInSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type SignInFormData = z.infer<typeof signInSchema>;

export const AuthErrorAlert = ({ error, onDismissError }: { error?: string | null; onDismissError: () => void }) => {
  if (!error) return null;

  return (
    <div className="border-destructive/50 bg-destructive/10 w-full rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1 space-y-1">
          <h3 className="text-destructive text-sm font-semibold">Authentication Error</h3>
          <p className="text-destructive/90 text-sm">An error occured during authentication. Please try again.</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismissError}
          className="text-destructive/70 hover:text-destructive shrink-0 transition-colors"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function SignIn() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [dismissedError, setDismissedError] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirect = searchParams?.get("redirect") ?? "/";
  const error = searchParams?.get("error");

  React.useEffect(() => {
    if (dismissedError && error) {
      const newSearchParams = new URLSearchParams(searchParams?.toString());
      newSearchParams.delete("error");
      router.replace(`/signin?${newSearchParams.toString()}`);
      setDismissedError(false);
    }
  }, [dismissedError, error, router, searchParams]);

  const signinMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return await accountValidator(data.email, { provider: "local", sub: data.password }, "SIGN_IN", undefined, {
        intent: "SIGN_IN",
      });
    },
    onSuccess: () => {
      toast.success("Logged in successfully");
      router.push("/");
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Sign-in failed");
    },
  });
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    signinMutation.mutate(data);
  };

  const handleGoogleSignIn = React.useCallback(async () => {
    const authUrlDomain = "https://accounts.google.com/o/oauth2/v2/auth";

    const authUrlParams = {
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirect_uri: `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-callback`,
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
      <div className="bg-foreground hidden flex-col justify-between overflow-hidden p-16 lg:flex">
        <div className="space-y-8">
          <Logo
            width={150}
            height={40}
            className="object-contain"
            priority
          />

          <h1 className="text-background mb-6 text-4xl leading-[1.1] font-extrabold tracking-normal">
            The financial infrastructure
            <br />
            for the
            <span className="text-primary ml-2">Stellar economy.</span>
          </h1>

          <div className="text-background/70 max-w-xs text-sm">
            Accept payments, manage subscriptions, and withdraw to local currency, all on the Stellar network.
          </div>
        </div>
        <p className="text-background/70 text-sm">
          © {new Date().getFullYear()} StellarTools ·{" "}
          <Link href="/terms" className="underline hover:opacity-80">
            Terms
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="underline hover:opacity-80">
            Privacy
          </Link>
        </p>
      </div>

      <div className="bg-background relative flex flex-col justify-center">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-4 px-6 py-12"
        >
          <div className="w-full space-y-1 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm">Sign in to your StellarTools account</p>
          </div>

          <AuthErrorAlert error={error} onDismissError={() => setDismissedError(true)} />

          <Button
            type="button"
            variant="ghost"
            onClick={handleGoogleSignIn}
            className="hover:bg-muted flex w-full cursor-pointer items-center gap-2.5 rounded-lg border px-10 py-2.5 shadow-none transition-colors"
            disabled={signinMutation.isPending}
          >
            <Google className="h-5 w-5" />
            <span className="text-foreground text-sm font-semibold">Continue with Google</span>
          </Button>

          <div className="my-6 flex w-full items-center">
            <Separator className="flex-1" />
            <span className="text-muted-foreground px-4 text-sm whitespace-nowrap">or continue with email</span>
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
                  className="w-full shadow-none"
                  error={error?.message}
                />
              )}
            />
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="hover:text-foreground text-sm font-semibold underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState: { error } }) => (
                <div className="space-y-1.5">
                  <InputGroup className="w-full shadow-none  dark:border-border ">
                    <InputGroupInput
                      {...field}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={"•".repeat(8)}
                      className="shadow-none"
                      aria-invalid={!!error}
                    />
                    <InputGroupAddon align="inline-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shadow-none hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="text-muted-foreground h-4 w-4" />
                        ) : (
                          <Eye className="text-muted-foreground h-4 w-4" />
                        )}
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                  {error?.message && <p className="text-destructive text-sm">{error.message}</p>}
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
                  <Checkbox id="remember-me" checked={field.value} onCheckedChange={field.onChange} />
                  <Label htmlFor="remember-me" className="cursor-pointer text-sm font-semibold">
                    Remember me
                  </Label>
                </div>
              )}
            />
          </div>
          <Button
            type="submit"
            className="w-full rounded-md font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:ring-4"
            disabled={signinMutation.isPending}
            isLoading={signinMutation.isPending}
          >
            {signinMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>

          <div className="my-6 w-full">
            <p className="text-muted-foreground text-center text-sm">
              By continuing you agree to our{" "}
              <Link href="/terms" className="hover:text-foreground underline transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="hover:text-foreground underline transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>

          <div className="w-full text-center">
            <p className="text-muted-foreground text-sm">
              Don’t have an account?{" "}
              <Link href="/signup" className="hover:text-foreground font-semibold underline transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
