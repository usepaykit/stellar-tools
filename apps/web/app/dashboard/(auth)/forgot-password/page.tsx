"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, TextField, toast } from "@stellartools/ui";
import { forgotPassword } from "@stellartools/web/actions";
import { useAuth } from "@stellartools/web/hooks";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { AuthLayout } from "../_shared";

const schema = z.object({ email: z.email() });

export default function ForgotPassword() {
  const { error, setDismissedError } = useAuth();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const mutation = useMutation({
    mutationFn: (email: string) => forgotPassword(email),
    onSuccess: () => toast.success("Reset link sent to your email"),
    onError: () => toast.error("Failed to send reset link"),
  });

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a link."
      error={error}
      onDismissError={() => setDismissedError(true)}
      isPending={mutation.isPending}
      onSubmit={form.handleSubmit((d) => mutation.mutate(d.email))}
      alternateLink={
        <p className="text-muted-foreground text-sm">
          Remember your password?{" "}
          <Link href="/signin" className="hover:text-foreground font-semibold underline">
            Sign in
          </Link>
        </p>
      }
    >
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            id="email"
            label="Email"
            placeholder="name@example.com"
            error={fieldState.error?.message}
          />
        )}
      />
      <Button type="submit" className="w-full font-semibold" isLoading={mutation.isPending}>
        Send reset link
      </Button>
    </AuthLayout>
  );
}
