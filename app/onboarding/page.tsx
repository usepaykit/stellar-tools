"use client";

import * as React from "react";

import { TextField } from "@/components/input-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as RHF from "react-hook-form";
import { z } from "zod";

const organizationSchema = z.object({
  name: z.string().min(1).min(2).max(50).trim(),
  slug: z
    .string()
    .min(1)
    .min(2)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    )
    .refine(
      (slug) => !slug.startsWith("-") && !slug.endsWith("-"),
      "Slug cannot start or end with a hyphen"
    )
    .trim(),
  agreedToTerms: z
    .boolean()
    .refine((val) => val === true, "You must agree to the terms to continue"),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

export default function CreateOrganization() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = RHF.useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { name: "", slug: "", agreedToTerms: false },
  });

  const onSubmit = async (data: OrganizationFormData) => {
    setIsSubmitting(true);

    try {
      console.log("Creating Organization:", {
        name: data.name,
        slug: data.slug,
      });

      toast.success("Organization created successfully!", {
        description: "Redirecting to your dashboard...",
      } as Parameters<typeof toast.success>[1]);

      router.push(`/onboarding/${data.slug}`);
    } catch (error) {
      console.error("Failed to create organization:", error);
      toast.error("Failed to create organization", {
        description: "Please try again later",
      } as Parameters<typeof toast.error>[1]);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-[440px] flex-col items-center">
        <div className="mb-8 transition-opacity duration-300">
          <Image
            src="/images/logo-light.png"
            alt="Stellar Tools logo"
            width={80}
            height={80}
            className="rounded-md object-contain"
            priority
          />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-foreground mb-2 text-3xl font-semibold tracking-tight">
            Let&apos;s get you started
          </h1>
          <p className="text-muted-foreground text-lg">
            You&apos;ll be up and running in no time
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-6"
          noValidate
        >
          <Card className="border-none shadow-none">
            <CardContent className="space-y-5 pt-1">
              <RHF.Controller
                control={form.control}
                name="name"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    id={field.name}
                    label="Organization Name"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Acme Inc."
                    error={error?.message || null}
                    labelClassName="text-sm font-medium"
                  />
                )}
              />

              <RHF.Controller
                control={form.control}
                name="slug"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    id={field.name}
                    label="Organization Slug"
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(
                        e
                          .trim()
                          .toLowerCase()
                          .normalize("NFKD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-z0-9\s-]/g, "")
                          .replace(/\s+/g, "-")
                          .replace(/-+/g, "-")
                          .replace(/^-+|-+$/g, "")
                      )
                    }
                    placeholder="acme-inc"
                    error={error?.message || null}
                    className="font-mono text-sm shadow-none"
                    labelClassName="text-sm font-medium"
                  />
                )}
              />
            </CardContent>
          </Card>

          <RHF.Controller
            control={form.control}
            name="agreedToTerms"
            render={({ field, fieldState: { error } }) => (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border-none p-4 transition-colors"
                )}
              >
                <div className="flex h-6 items-center pt-0.5">
                  <Checkbox
                    id="terms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className={cn(
                      "h-5 w-5 border transition-all",
                      error ? "border-destructive" : "border-primary",
                      "text-primary focus:ring-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    )}
                    disabled={isSubmitting}
                    aria-invalid={error ? "true" : "false"}
                    aria-describedby={error ? "terms-error" : undefined}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor="terms"
                    className="text-foreground block cursor-pointer text-sm leading-relaxed"
                    id="terms-label"
                  >
                    I understand the restrictions above and agree to{" "}
                    <span className="text-primary font-medium hover:underline">
                      Stellar Tools&apos;s terms
                    </span>
                  </label>
                  {error && (
                    <p
                      id="terms-error"
                      className="text-destructive animate-fade-in mt-1 flex items-center gap-1.5 text-sm"
                      role="alert"
                    >
                      {error.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Organization"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
