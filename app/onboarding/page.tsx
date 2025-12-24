"use client";

import * as React from "react";

import {
  FileUploadPicker,
  type FileWithPreview,
} from "@/components/file-upload-picker";
import { TextAreaField, TextField } from "@/components/input-picker";
import { PhoneNumberPicker } from "@/components/phone-number-picker";
import { TagInputPicker } from "@/components/tag-input-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { FileRejection } from "react-dropzone";
import * as RHF from "react-hook-form";
import { z } from "zod";

const organizationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
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
  phoneNumber: z
    .object({
      number: z.string(),
      countryCode: z.string(),
    })
    .optional()
    .nullable(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  physicalAddress: z
    .string()
    .max(500, "Address must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  supportEmail: z.email().optional(),
  twitterHandle: z
    .string()
    .regex(/^@?[a-zA-Z0-9_]{1,15}$/, "Please enter a valid Twitter handle")
    .optional()
    .or(z.literal("")),
  githubHandle: z
    .string()
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}[a-zA-Z0-9]$/,
      "Please enter a valid GitHub username"
    )
    .optional(),
  logo: z
    .array(z.any())
    .max(1, "Only one logo can be uploaded")
    .default([])
    .optional(),
  agreedToTerms: z
    .boolean()
    .refine((val) => val === true, "You must agree to the terms to continue"),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

const teamInviteSchema = z.object({
  emails: z
    .array(z.string().email("Please enter a valid email address"))
    .min(0)
    .default([])
    .optional(),
});

export default function CreateOrganization() {
  const router = useRouter();
  const [step, setStep] = React.useState<"organization" | "team">(
    "organization"
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [createdOrganization, setCreatedOrganization] =
    React.useState<OrganizationFormData | null>(null);

  const form = RHF.useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      slug: "",
      phoneNumber: { number: "", countryCode: "US" },
      description: "",
      physicalAddress: "",
      supportEmail: "",
      twitterHandle: "",
      githubHandle: "",
      logo: [],
      agreedToTerms: false,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedName = form.watch("name");
  React.useEffect(() => {
    if (watchedName) {
      const generatedSlug = watchedName
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
      form.setValue("slug", generatedSlug);
    }
  }, [watchedName, form]);

  const handleLogoChange = (files: FileWithPreview[]) => {
    form.setValue("logo", files);
  };

  const handleLogoRejected = (rejections: FileRejection[]) => {
    const firstError = rejections[0]?.errors[0];
    if (firstError) {
      toast.error(firstError.message || "Failed to upload logo");
    }
  };

  const teamInviteForm = RHF.useForm({
    resolver: zodResolver(teamInviteSchema),
    defaultValues: {
      emails: [] as string[],
    },
  });

  const onSubmit = async (data: OrganizationFormData) => {
    setIsSubmitting(true);

    try {
      console.log("Creating Organization:", {
        name: data.name,
        slug: data.slug,
        phoneNumber: data.phoneNumber,
        description: data.description,
        physicalAddress: data.physicalAddress,
        supportEmail: data.supportEmail,
        twitterHandle: data.twitterHandle,
        githubHandle: data.githubHandle,
        logo: data.logo?.[0]?.name,
      });

      toast.success("Organization created successfully!", {
        description: "Now invite your team members",
      } as Parameters<typeof toast.success>[1]);

      setCreatedOrganization(data);
      setStep("team");
      setIsSubmitting(false);
    } catch (error) {
      console.error("Failed to create organization:", error);
      toast.error("Failed to create organization", {
        description: "Please try again later",
      } as Parameters<typeof toast.error>[1]);
      setIsSubmitting(false);
    }
  };

  const onTeamInviteSubmit = async (data: { emails?: string[] }) => {
    setIsSubmitting(true);

    try {
      console.log("Inviting team members:", {
        emails: data.emails,
        organizationId: createdOrganization?.slug,
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const emailCount = data.emails?.length || 0;
      toast.success("Team invitations sent!", {
        description: `${emailCount} invitation${emailCount !== 1 ? "s" : ""} sent successfully.`,
      } as Parameters<typeof toast.success>[1]);

      router.push(`/dashboard`);
    } catch (error) {
      console.error("Failed to send invitations:", error);
      toast.error("Failed to send invitations", {
        description: "Please try again later",
      } as Parameters<typeof toast.error>[1]);
      setIsSubmitting(false);
    }
  };

  const handleSkipTeamInvite = () => {
    router.push(`/onboarding/${createdOrganization?.slug}`);
  };

  if (step === "team") {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex w-full max-w-2xl flex-col items-center">
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
              Invite your team
            </h1>
            <p className="text-muted-foreground text-lg">
              Add team members to collaborate on your organization
            </p>
          </div>

          <form
            onSubmit={teamInviteForm.handleSubmit(onTeamInviteSubmit)}
            className="w-full space-y-6"
            noValidate
          >
            <Card className="border-none shadow-none">
              <CardContent className="space-y-5 pt-1">
                <RHF.Controller
                  control={teamInviteForm.control}
                  name="emails"
                  render={({ field, fieldState: { error } }) => (
                    <div className="space-y-2">
                      <Label
                        htmlFor="team-emails"
                        className="text-sm font-medium"
                      >
                        Team Member Emails
                      </Label>
                      <TagInputPicker
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="Enter email addresses (press Enter or comma to add)"
                        className="w-full"
                      />
                      {error && (
                        <p className="text-destructive text-sm" role="alert">
                          {error.message}
                        </p>
                      )}
                      <p className="text-muted-foreground text-xs">
                        Invite team members by entering their email addresses.
                        They will receive an invitation to join your
                        organization.
                      </p>
                    </div>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex w-full items-center justify-between gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkipTeamInvite}
                disabled={isSubmitting}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Skip for now
              </Button>
              <Button
                type="submit"
                className="gap-2"
                size="lg"
                disabled={
                  isSubmitting ||
                  ((teamInviteForm.watch("emails") as string[] | undefined)
                    ?.length || 0) === 0
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-2xl flex-col items-center">
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
              <div className="pb-24">
                <RHF.Controller
                  control={form.control}
                  name="logo"
                  render={({ field, fieldState: { error } }) => (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Organization Logo
                      </Label>
                      <FileUploadPicker
                        id="organization-logo"
                        value={field.value || []}
                        onFilesChange={(files) => {
                          field.onChange(files);
                          handleLogoChange(files);
                        }}
                        onFilesRejected={handleLogoRejected}
                        label="Drag & drop your logo here, or click to select"
                        description="PNG, JPG up to 5MB"
                        disabled={isSubmitting}
                        dropzoneAccept={{
                          "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                        }}
                        dropzoneMaxSize={5 * 1024 * 1024}
                        dropzoneMultiple={false}
                        className="h-40"
                      />
                      {error && (
                        <p className="text-destructive text-sm" role="alert">
                          {error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <RHF.Controller
                control={form.control}
                name="name"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    id="organization-name"
                    label="Organization Name"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Acme Inc."
                    error={error?.message || null}
                    labelClassName="text-sm font-medium"
                    required
                    className="w-full shadow-none"
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
                    onChange={() => {}} // Disabled - read-only
                    placeholder="acme-inc"
                    error={error?.message || null}
                    className="font-mono text-sm shadow-none"
                    labelClassName="text-sm font-medium"
                    disabled
                    helpText="This will be used for your subdomain and cannot be changed later."
                  />
                )}
              />

              <RHF.Controller
                control={form.control}
                name="description"
                render={({ field, fieldState: { error } }) => (
                  <TextAreaField
                    id={field.name}
                    label="Description"
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Tell us about your organization..."
                    error={error?.message || null}
                    helpText="Optional: A brief description of your organization"
                    className="w-full shadow-none"
                  />
                )}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <RHF.Controller
                  control={form.control}
                  name="phoneNumber"
                  render={({ field, fieldState: { error } }) => (
                    <PhoneNumberPicker
                      id={field.name}
                      label="Phone Number"
                      value={field.value || { number: "", countryCode: "US" }}
                      onChange={field.onChange}
                      error={error?.message || null}
                      disabled={isSubmitting}
                      groupClassName="w-full shadow-none"
                    />
                  )}
                />

                <RHF.Controller
                  control={form.control}
                  name="supportEmail"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      id={field.name}
                      label="Support Email"
                      type="email"
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="support@example.com"
                      error={error?.message || null}
                      className="mt-2 w-full shadow-none"
                    />
                  )}
                />
              </div>

              <RHF.Controller
                control={form.control}
                name="physicalAddress"
                render={({ field, fieldState: { error } }) => (
                  <TextAreaField
                    id={field.name}
                    label="Physical Address"
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="123 Main St, City, State, ZIP"
                    error={error?.message || null}
                    className="w-full shadow-none"
                  />
                )}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <RHF.Controller
                  control={form.control}
                  name="twitterHandle"
                  render={({ field, fieldState: { error } }) => {
                    const twitterPrefix = "https://twitter.com/@";
                    const twitterUsername = field.value ? `${field.value}` : "";

                    return (
                      <div className="space-y-2">
                        <Label
                          htmlFor={field.name}
                          className="text-sm font-medium"
                        >
                          Twitter Handle
                        </Label>
                        <InputGroup
                          className={cn(
                            error && "border-destructive ring-destructive/20",
                            "w-full shadow-none"
                          )}
                        >
                          <InputGroupAddon align="inline-start">
                            {twitterPrefix}
                          </InputGroupAddon>
                          <InputGroupInput
                            id={field.name}
                            type="text"
                            value={twitterUsername}
                            onChange={(e) => {
                              const value = e.target.value.replace(/^@/, "");
                              field.onChange(value || "");
                            }}
                            placeholder="username"
                            aria-invalid={error ? "true" : "false"}
                            disabled={isSubmitting}
                          />
                        </InputGroup>
                        {error && (
                          <p className="text-destructive text-sm" role="alert">
                            {error.message}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />

                <RHF.Controller
                  control={form.control}
                  name="githubHandle"
                  render={({ field, fieldState: { error } }) => {
                    const githubPrefix = "https://github.com/@";
                    const githubUsername = field.value ? `${field.value}` : "";

                    return (
                      <div className="space-y-2">
                        <Label
                          htmlFor={field.name}
                          className="text-sm font-medium"
                        >
                          GitHub Handle
                        </Label>
                        <InputGroup
                          className={cn(
                            error && "border-destructive ring-destructive/20",
                            "w-full shadow-none"
                          )}
                        >
                          <InputGroupAddon align="inline-start">
                            {githubPrefix}
                          </InputGroupAddon>
                          <InputGroupInput
                            id={field.name}
                            type="text"
                            value={githubUsername}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                            }}
                            placeholder="username"
                            aria-invalid={error ? "true" : "false"}
                            disabled={isSubmitting}
                          />
                        </InputGroup>
                        {error && (
                          <p className="text-destructive text-sm" role="alert">
                            {error.message}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
              </div>
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
