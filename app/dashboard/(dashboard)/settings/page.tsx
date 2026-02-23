"use client";

import * as React from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { type PhoneNumber, PhoneNumberField } from "@/components/phone-number-field";
import { TextAreaField, TextField } from "@/components/text-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { toast } from "@/components/ui/toast";
import {
  UnderlineTabs,
  UnderlineTabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from "@/components/underline-tabs";
import { getInitials } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Camera, ChevronRight, ExternalLink, Loader2, Save } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import * as RHF from "react-hook-form";
import { z } from "zod";

// Mock data
const mockUser = {
  id: "user_123",
  name: "Prince Ajuzie",
  email: "princeajuzie1@gmail.com",
  phoneNumber: { number: "1234567890", countryCode: "US" } as PhoneNumber,
  avatar: null,
  joinedAt: new Date("2024-12-01"),
};

const mockOrganization = {
  id: "org_123",
  name: "Acme Inc",
  slug: "acme-inc",
  description: "A leading payment processing company",
  logo: null,
  createdAt: new Date("2024-01-15"),
};

// Schemas
const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  phoneNumber: z
    .object({
      number: z.string(),
      countryCode: z.string(),
    })
    .optional()
    .nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

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
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .refine((slug) => !slug.startsWith("-") && !slug.endsWith("-"), "Slug cannot start or end with a hyphen")
    .trim(),
  description: z.string().max(500, "Description must be less than 500 characters").optional().or(z.literal("")),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState("profile");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [organizationLogoPreview, setOrganizationLogoPreview] = React.useState<string | null>(null);

  const profileForm = RHF.useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: mockUser.name,
      phoneNumber: mockUser.phoneNumber || { number: "", countryCode: "US" },
    },
  });

  const organizationForm = RHF.useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: mockOrganization.name,
      slug: mockOrganization.slug,
      description: mockOrganization.description || "",
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Profile updated:", data);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onOrganizationSubmit = async (data: OrganizationFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Organization updated:", data);
      toast.success("Organization settings updated successfully");
    } catch (error) {
      console.error("Failed to update organization:", error);
      toast.error("Failed to update organization settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success("Avatar updated successfully");
    }
  };

  const handleOrganizationLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrganizationLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success("Organization logo updated successfully");
    }
  };

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

              {/* Profile Tab */}
              <UnderlineTabsContent value="profile" className="mt-6 space-y-6">
                <Card className="shadow-none">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-6">
                      <div className="relative">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={avatarPreview || mockUser.avatar || undefined} className="object-cover" />
                          <AvatarFallback className="text-lg">{getInitials(mockUser.name)}</AvatarFallback>
                        </Avatar>
                        <label
                          htmlFor="avatar-upload"
                          className="bg-primary text-primary-foreground border-background hover:bg-primary/90 absolute right-0 bottom-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-2 shadow-sm transition-colors"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                        </label>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <CardTitle className="text-xl">Profile Information</CardTitle>
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {moment(mockUser.joinedAt).format("MMM D, YYYY")}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Basic Information Section */}
                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Your core profile details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
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

                      <RHF.Controller
                        control={profileForm.control}
                        name="phoneNumber"
                        render={({ field, fieldState: { error } }) => (
                          <PhoneNumberField
                            id="phone-number"
                            label="Phone Number"
                            value={field.value || { number: "", countryCode: "US" }}
                            onChange={field.onChange}
                            error={error?.message || null}
                            disabled={isSubmitting}
                            groupClassName="w-full shadow-none"
                          />
                        )}
                      />

                      <div className="space-y-2">
                        <TextField
                          id="email"
                          label="Email Address"
                          value={mockUser.email}
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
                              <Loader2 className="h-4 w-4 animate-spin" />
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
              </UnderlineTabsContent>

              {/* Organization Tab */}
              <UnderlineTabsContent value="organization" className="mt-6 space-y-6">
                {/* Organization Information Section */}
                <Card className="shadow-none">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-6">
                      <div className="relative">
                        <Avatar className="h-20 w-20">
                          <AvatarImage
                            src={organizationLogoPreview || mockOrganization.logo || undefined}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-lg">
                            {mockOrganization.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <label
                          htmlFor="organization-logo-upload"
                          className="bg-primary text-primary-foreground border-background hover:bg-primary/90 absolute right-0 bottom-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-2 shadow-sm transition-colors"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <input
                            id="organization-logo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleOrganizationLogoChange}
                          />
                        </label>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <CardTitle className="text-xl">Organization Information</CardTitle>
                          <CardDescription className="mt-1">
                            Update your organization details and branding.
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                    <CardDescription>Update your organization name, slug, and description</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={organizationForm.handleSubmit(onOrganizationSubmit)} className="space-y-6">
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
                        name="slug"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            id="organization-slug"
                            label="Organization Slug"
                            value={field.value}
                            onChange={() => {}} // Disabled - read-only
                            placeholder="acme-inc"
                            error={error?.message || null}
                            className="font-mono text-sm shadow-none"
                            disabled
                            helpText="This will be used for your subdomain and cannot be changed later."
                          />
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
                        <Button type="submit" disabled={isSubmitting} className="gap-2 shadow-none">
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
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
