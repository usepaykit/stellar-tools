"use client";

import * as React from "react";

import {
  postOrganization,
  retrieveOrganizations,
  setCurrentOrganization,
} from "@/actions/organization";
import {
  FileUploadPicker,
  type FileWithPreview,
} from "@/components/file-upload-picker";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { TextAreaField, TextField } from "@/components/input-picker";
import {
  PhoneNumber,
  PhoneNumberPicker,
} from "@/components/phone-number-picker";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useOrgQuery } from "@/hooks/use-org-query";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Building2, ChevronRight, Plus, Users } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type { FileRejection } from "react-dropzone";
import * as RHF from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import { z } from "zod";

export default function SelectOrganizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showCreate = searchParams.get("create") === "true";
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(
    showCreate ? true : false
  );

  const { data: organizations, isLoading } = useOrgQuery(
    ["organizations"],
    () => retrieveOrganizations()
  );

  const hasOrganizations = !!(organizations && organizations.length > 0);

  const handleSelectOrg = React.useCallback(
    async (orgId: string) => {
      await setCurrentOrganization(orgId);
      router.push("/dashboard");
    },
    [router]
  );

  if (isLoading) return <LoadingSkeleton />;

  return (
    <>
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Select Organization
            </h1>
            <p className="text-muted-foreground mt-2">
              Choose an organization to continue
            </p>
          </div>

          <div className="space-y-4">
            {organizations?.map((org) => (
              <div
                key={org.id}
                className="hover:bg-accent/50 group flex cursor-pointer items-center gap-4 rounded-lg p-4 transition-all"
                onClick={() => handleSelectOrg(org.id)}
              >
                <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                  {org.logoUrl ? (
                    <Image
                      src={org.logoUrl}
                      alt={org.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <Building2 className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{org.name}</h3>
                  <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{org.memberCount} members</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="capitalize">{org.role}</span>
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground h-5 w-5" />
              </div>
            ))}

            <div
              className="hover:bg-accent/50 group flex cursor-pointer items-center gap-4 rounded-lg border-2 border-dashed p-4 transition-all"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                <Plus className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Create New Organization</h3>
                <p className="text-muted-foreground text-sm">
                  Start a new workspace
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateOrganizationModal
        open={isCreateModalOpen}
        onOpenChange={(open) => setIsCreateModalOpen(open)}
        hasOrganizations={hasOrganizations}
      />
    </>
  );
}

const LoadingSkeleton = () => {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Select Organization
          </h1>
          <p className="text-muted-foreground mt-2">
            Choose an organization to continue
          </p>
        </div>

        <div className="w-full space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton className="mb-2 h-5 w-40" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// -- CREATE ORGANIZATION  --

const createOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.object({
    number: z.string(),
    countryCode: z.string(),
  }),
  description: z.string().optional(),
  physicalAddress: z.string().optional(),
  supportEmail: z.email(),
  twitterHandle: z
    .string()
    .regex(/^@?[a-zA-Z0-9_]{1,15}$/, "Please enter a valid Twitter handle"),
  githubHandle: z
    .string()
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}[a-zA-Z0-9]$/,
      "Please enter a valid GitHub username"
    ),
  logo: z.custom<FileWithPreview[]>((val) => {
    if (!Array.isArray(val)) return false;
    return val.every((item) => item instanceof File);
  }),
});

type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>;

const CreateOrganizationModal = ({
  open,
  onOpenChange,
  hasOrganizations,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasOrganizations: boolean;
}) => {
  const router = useRouter();
  const [logoFiles, setLogoFiles] = React.useState<FileWithPreview[]>([]);

  const form = RHF.useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      phoneNumber: { number: "", countryCode: "US" },
      description: "",
      logo: [],
    },
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: CreateOrganizationFormData) => {
      // In a real implementation, you'd upload the logo and get the URL
      const logoUrl = logoFiles[0]?.preview || null;

      const org = await postOrganization({
        name: data.name,
        phoneNumber: data.phoneNumber?.number || null,
        description: data.description || null,
        logoUrl,
        settings: null,
        stellarAccounts: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: null,
        address: null,
        socialLinks: null,
      });

      return org;
    },
    onSuccess: async (org) => {
      toast.success("Organization created successfully");
      // Set the new org as selected
      await setCurrentOrganization(org.id);
      form.reset();
      setLogoFiles([]);
      onOpenChange(false);
      router.push("/dashboard");
    },
    onError: () => {
      toast.error("Failed to create organization");
    },
  });

  const handleLogoChange = (files: FileWithPreview[]) => {
    form.setValue("logo", files);
  };

  const handleLogoRejected = (rejections: FileRejection[]) => {
    const firstError = rejections[0]?.errors[0];
    if (firstError) {
      toast.error(firstError.message || "Failed to upload logo");
    }
  };

  useHotkeys(
    "mod+enter",
    (e) => {
      e.preventDefault();
      form.handleSubmit((data) => createOrgMutation.mutateAsync(data))();
    },
    {
      enabled: open && !createOrgMutation.isPending,
      enableOnFormTags: ["input", "textarea"],
    },
    [open, createOrgMutation.isPending, form]
  );

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create Organization"
      description="Set up your workspace to get started"
      size="full"
      showCloseButton={hasOrganizations}
      footer={
        <div className="flex w-full items-center justify-between">
          <div />

          <div className="flex gap-2">
            {hasOrganizations && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={createOrgMutation.isPending}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              onClick={() =>
                form.handleSubmit((data) => createOrgMutation.mutateAsync(data))
              }
              disabled={createOrgMutation.isPending}
              isLoading={createOrgMutation.isPending}
              className="gap-2"
            >
              {createOrgMutation.isPending
                ? "Creating..."
                : "Create Organization"}
            </Button>
          </div>
        </div>
      }
    >
      <form
        onSubmit={form.handleSubmit((data) =>
          createOrgMutation.mutateAsync(data)
        )}
        className="grid h-full w-full gap-8 lg:grid-cols-2"
        noValidate
      >
        <div className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-semibold">Basic Information</h3>
            <div className="space-y-5">
              <RHF.Controller
                control={form.control}
                name="logo"
                render={({ field, fieldState: { error } }) => (
                  <FileUploadPicker
                    label="Organization Logo"
                    id="organization-logo"
                    value={field.value || []}
                    onFilesChange={(files) => {
                      field.onChange(files);
                      handleLogoChange(files);
                    }}
                    onFilesRejected={handleLogoRejected}
                    placeholder="Drag & drop your logo here, or click to select"
                    description="PNG, JPG up to 5MB"
                    disabled={createOrgMutation.isPending}
                    dropzoneAccept={{
                      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                    }}
                    dropzoneMaxSize={5 * 1024 * 1024}
                    dropzoneMultiple={false}
                    enableTransformation
                    targetFormat="image/png"
                    error={error?.message}
                  />
                )}
              />

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
                    error={error?.message}
                    labelClassName="text-sm font-medium"
                    required
                    className="w-full shadow-none"
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
                    error={error?.message}
                    className="w-full shadow-none"
                    rows={6}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Contact & Social */}
        <div className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-semibold">Contact Details</h3>
            <div className="space-y-5">
              <RHF.Controller
                control={form.control}
                name="phoneNumber"
                render={({ field, fieldState: { error } }) => {
                  const phoneValue: PhoneNumber = {
                    number: field.value?.number || "",
                    countryCode: field.value?.countryCode || "US",
                  };

                  return (
                    <PhoneNumberPicker
                      id={field.name}
                      label="Phone Number"
                      value={phoneValue}
                      onChange={field.onChange}
                      error={(error as any)?.number?.message}
                      disabled={createOrgMutation.isPending}
                      groupClassName="w-full shadow-none"
                    />
                  );
                }}
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
                    error={error?.message}
                    className="w-full shadow-none"
                  />
                )}
              />

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
                    error={error?.message}
                    className="w-full shadow-none"
                    rows={3}
                  />
                )}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Social Links</h3>
            <div className="space-y-5">
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
                          disabled={createOrgMutation.isPending}
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
                          disabled={createOrgMutation.isPending}
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
          </div>
        </div>
      </form>
    </FullScreenModal>
  );
};
