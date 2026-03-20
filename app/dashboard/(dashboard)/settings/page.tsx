"use client";

import * as React from "react";

import { putAccount } from "@/actions/account";
import { getCurrentUser } from "@/actions/auth";
import { putOrganization, retrieveOrganization } from "@/actions/organization";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { FileUpload, type FileWithPreview } from "@/components/file-upload";
import {
  PhoneNumber,
  PhoneNumberField,
  phoneNumberFromString,
  phoneNumberSchema,
} from "@/components/phone-number-field";
import { Spinner } from "@/components/spinner";
import { TextAreaField, TextField } from "@/components/text-field";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  UnderlineTabs,
  UnderlineTabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from "@/components/underline-tabs";
import { useCookieState } from "@/hooks/use-cookie-state";
import { useOrgContext } from "@/hooks/use-org-query";
import { fileFromUrl } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, ChevronRight, ExternalLink, Save } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import * as RHF from "react-hook-form";
import { z as Schema } from "zod";

const profileSchema = Schema.object({
  name: Schema.string().min(1, "Name is required").trim(),
  avatar: Schema.custom<FileWithPreview>((val) => val instanceof File).nullable(),
});

type ProfileFormData = Schema.infer<typeof profileSchema>;

const organizationSchema = Schema.object({
  id: Schema.string(),
  name: Schema.string().min(1, "Name is required").trim(),
  phoneNumber: phoneNumberSchema.optional().nullable(),
  description: Schema.string().optional(),
  logo: Schema.custom<FileWithPreview>((val) => val instanceof File).nullable(),
});

type OrganizationFormData = Schema.infer<typeof organizationSchema>;

type User = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

type Organization = Awaited<ReturnType<typeof retrieveOrganization>>;

const ProfileTabContent = ({ user }: { user: User }) => {
  const queryClient = useQueryClient();

  const profileForm = RHF.useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: `${user.profile?.firstName} ${user.profile?.lastName}`.trim() || "",
      avatar: undefined,
    },
  });

  const [imageLoading, setImageLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user.profile?.avatarUrl) return;

    setImageLoading(true);

    let revoked = false;
    fileFromUrl(user.profile.avatarUrl, "avatar.png")
      .then((file) => {
        if (revoked) return;
        const withPreview = Object.assign(file, { preview: URL.createObjectURL(file) }) as FileWithPreview;
        profileForm.setValue("avatar", withPreview);
      })
      .finally(() => {
        setImageLoading(false);
      });

    return () => {
      revoked = true;
      const current = profileForm.getValues("avatar");
      if (current?.preview) URL.revokeObjectURL(current.preview);
    };
  }, [user.profile?.avatarUrl]);

  const { mutate: updateProfile, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const formdata = new FormData();

      const file = data.avatar;

      if (file instanceof File) formdata.set("avatar", file);

      await putAccount(
        user.id,
        {
          profile: {
            firstName: data.name.split(" ")[0] ?? undefined,
            lastName: data.name.split(" ").slice(1).join(" ") ?? undefined,
          },
        },
        { formDataWithFiles: formdata }
      );
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["current-user"] });
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    },
  });

  const avatar = profileForm.watch("avatar");

  return (
    <>
      <Card className="shadow-none">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <FileUpload
              label={null}
              value={avatar ? [avatar] : undefined}
              onFilesChange={(files) => profileForm.setValue("avatar", files[0])}
              disabled={isSubmitting}
              dropzoneAccept={{ "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] }}
              dropzoneMaxSize={5 * 1024 * 1024}
              dropzoneMultiple={false}
              isLoading={imageLoading}
              enableTransformation
              targetFormat="image/png"
              error={profileForm.formState.errors.avatar?.message}
              placeholder=""
              description=""
              shape="circle"
              className="w-fit"
            />

            <div className="flex-1 space-y-2">
              <CardTitle className="text-xl">Profile Information</CardTitle>
              {user.createdAt && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {moment(user.createdAt).format("MMM D, YYYY")}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit((data) => updateProfile(data))} className="space-y-6">
            <RHF.Controller
              control={profileForm.control}
              name="name"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  id="full-name"
                  label="Full Name"
                  error={error?.message || null}
                  className="w-full shadow-none"
                />
              )}
            />

            <div className="space-y-2">
              <TextField
                id="email"
                label="Email Address"
                value={user.email}
                onChange={() => {}}
                disabled
                error={null}
                className="w-full pr-10 shadow-none"
              />
              <p className="text-muted-foreground text-xs">
                Email cannot be changed for security reasons. Contact support if needed.
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="gap-2 shadow-none">
                {isSubmitting ? (
                  <>
                    <Spinner strokeColor="text-primary" size={25} />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

const OrganizationTabContent = ({ organization }: { organization: Organization }) => {
  const queryClient = useQueryClient();
  const { data: orgContext } = useOrgContext();
  const [imageLoading, setImageLoading] = React.useState(false);

  const organizationForm = RHF.useForm({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      id: organization.id,
      name: organization.name,
      description: organization.description ?? "",
      logo: undefined,
      phoneNumber: organization.phoneNumber ? phoneNumberFromString(organization.phoneNumber) : undefined,
    },
  });

  const { mutate: updateOrganization, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: OrganizationFormData) => {
      if (!orgContext?.id) return;

      const formData = new FormData();
      if (data.logo instanceof File) formData.set("logo", data.logo);

      await putOrganization(
        orgContext.id,
        { name: data.name, description: data.description || null },
        { formDataWithFiles: formData }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", orgContext?.id] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["org-context"] });
      toast.success("Organization settings updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update organization:", error);
      toast.error("Failed to update organization settings");
    },
  });

  const logo = organizationForm.watch("logo");

  React.useEffect(() => {
    if (!organization.logoUrl) return;

    setImageLoading(true);

    let revoked = false;
    fileFromUrl(organization.logoUrl, "logo.png")
      .then((file) => {
        if (revoked) return;
        const withPreview = Object.assign(file, { preview: URL.createObjectURL(file) }) as FileWithPreview;
        organizationForm.setValue("logo", withPreview);
      })
      .finally(() => {
        setImageLoading(false);
      });

    return () => {
      revoked = true;
      const current = organizationForm.getValues("logo");
      if (current?.preview) URL.revokeObjectURL(current.preview);
    };
  }, [organization.logoUrl]);

  return (
    <>
      <Card className="shadow-none">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <FileUpload
              label={null}
              value={logo ? [logo] : undefined}
              onFilesChange={(files) => organizationForm.setValue("logo", files[0])}
              disabled={isSubmitting}
              dropzoneAccept={{ "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] }}
              dropzoneMaxSize={5 * 1024 * 1024}
              dropzoneMultiple={false}
              enableTransformation
              targetFormat="image/png"
              shape="circle"
              className="w-fit"
              isLoading={imageLoading}
            />

            <div className="flex-1 space-y-2">
              <CardTitle className="text-xl">Organization Information</CardTitle>
              <CardDescription className="mt-1">Update your organization details and branding.</CardDescription>
              {organization.createdAt && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Created {moment(organization.createdAt).format("MMM D, YYYY")}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Update your organization name and description</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={organizationForm.handleSubmit((data) => updateOrganization(data))} className="space-y-6">
            <RHF.Controller
              control={organizationForm.control}
              name="name"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  id="organization-name"
                  label="Organization Name"
                  error={error?.message || null}
                  className="w-full shadow-none"
                />
              )}
            />

            <RHF.Controller
              control={organizationForm.control}
              name="phoneNumber"
              render={({ field, fieldState: { error } }) => (
                <PhoneNumberField
                  id="phone-number"
                  label="Phone Number"
                  value={field.value as PhoneNumber}
                  onChange={field.onChange}
                  error={error?.message || null}
                  disabled={isSubmitting}
                  groupClassName="w-full shadow-none"
                />
              )}
            />

            <RHF.Controller
              name="id"
              control={organizationForm.control}
              render={({ field, fieldState: { error } }) => (
                <TextField {...field} label="Organization ID" error={error?.message} id={field.name} disabled />
              )}
            />

            <RHF.Controller
              control={organizationForm.control}
              name="description"
              render={({ field, fieldState: { error } }) => (
                <TextAreaField
                  {...field}
                  value={field.value || ""}
                  id="organization-description"
                  label="Description"
                  placeholder="Tell us about your organization..."
                  error={error?.message || null}
                  className="w-full shadow-none"
                />
              )}
            />

            <div className="flex justify-end">
              <Button isLoading={isSubmitting} type="submit" disabled={isSubmitting} className="gap-2 shadow-none">
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useCookieState("settings_tab", "profile");
  const { data: orgContext } = useOrgContext();

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  });

  const { data: organization, isLoading: isLoadingOrg } = useQuery({
    queryKey: ["organization", orgContext?.id],
    queryFn: () => retrieveOrganization(orgContext!.id),
    enabled: !!orgContext?.id,
  });

  if (!user && !isLoadingUser) return null;

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-6 p-4 sm:p-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <UnderlineTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <UnderlineTabsList>
                <UnderlineTabsTrigger value="profile">Profile</UnderlineTabsTrigger>
                <UnderlineTabsTrigger value="organization">Organization</UnderlineTabsTrigger>
                <UnderlineTabsTrigger value="api">API Keys</UnderlineTabsTrigger>
              </UnderlineTabsList>

              <UnderlineTabsContent value="profile" className="mt-6 space-y-6">
                {user ? (
                  <ProfileTabContent key={user.id} user={user} />
                ) : (
                  <div className="space-y-6">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-64 w-full rounded-lg" />
                  </div>
                )}
              </UnderlineTabsContent>

              <UnderlineTabsContent value="organization" className="mt-6 space-y-6">
                {organization ? (
                  <OrganizationTabContent key={organization.id} organization={organization} />
                ) : isLoadingOrg ? (
                  <div className="space-y-6">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-64 w-full rounded-lg" />
                  </div>
                ) : null}
              </UnderlineTabsContent>

              <UnderlineTabsContent value="api" className="mt-6 space-y-6">
                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>Manage your API keys for authenticating requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground text-sm">
                        Create and manage API keys to authenticate your requests to the Stellar Tools API.
                      </p>
                      <Link href="/api-keys">
                        <Button variant="outline" className="gap-2 shadow-none">
                          Manage API Keys
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle>Webhooks</CardTitle>
                    <CardDescription>Configure webhook destinations for event notifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground text-sm">
                        Set up webhooks to receive real-time notifications about events in your account.
                      </p>
                      <Link href="/webhooks">
                        <Button variant="outline" className="gap-2 shadow-none">
                          Manage Webhooks
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </UnderlineTabsContent>
            </UnderlineTabs>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
    </div>
  );
}
