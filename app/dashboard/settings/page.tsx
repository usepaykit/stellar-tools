"use client";

import * as React from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { TextAreaField, TextField } from "@/components/input-picker";
import {
  type PhoneNumber,
  PhoneNumberPicker,
} from "@/components/phone-number-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import {
  UnderlineTabs,
  UnderlineTabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from "@/components/underline-tabs";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import {
  Calendar,
  Camera,
  ChevronRight,
  ExternalLink,
  Loader2,
  Lock,
  Mail,
  Plus,
  Save,
  User,
} from "lucide-react";
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

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "developer" | "viewer";
  avatar: string | null;
  joinedAt: Date;
  status: "active" | "pending";
  expiresAt?: Date;
  createdAt?: Date;
};

const mockTeamMembers: TeamMember[] = [
  {
    id: "tm_1",
    name: "John Doe",
    email: "john@example.com",
    role: "owner",
    avatar: null,
    joinedAt: new Date("2024-01-15"),
    status: "active",
  },
  {
    id: "tm_2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "admin",
    avatar: null,
    joinedAt: new Date("2024-01-20"),
    status: "active",
  },
  {
    id: "tm_3",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "developer",
    avatar: null,
    joinedAt: new Date("2024-02-01"),
    status: "active",
  },
];

const mockPendingInvites: TeamMember[] = [
  {
    id: "inv_1",
    name: "Alice",
    email: "alice@example.com",
    role: "viewer",
    avatar: null,
    joinedAt: new Date("2024-11-15"),
    status: "pending",
    expiresAt: new Date("2024-12-31"),
    createdAt: new Date("2024-11-15"),
  },
];

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
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    )
    .refine(
      (slug) => !slug.startsWith("-") && !slug.endsWith("-"),
      "Slug cannot start or end with a hyphen"
    )
    .trim(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

const inviteMemberSchema = z.object({
  email: z.email(),
  role: z.enum(["owner", "admin", "developer", "viewer"]),
});

type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;

const updateRoleSchema = z.object({
  role: z.enum(["owner", "admin", "developer", "viewer"]),
});

type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState("profile");
  const [teamTab, setTeamTab] = React.useState<"members" | "pending">(
    "members"
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [organizationLogoPreview, setOrganizationLogoPreview] = React.useState<
    string | null
  >(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  const [isUpdateRoleModalOpen, setIsUpdateRoleModalOpen] = React.useState(false);
  const [selectedMemberForRoleUpdate, setSelectedMemberForRoleUpdate] = React.useState<TeamMember | null>(null);

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

  const inviteMemberForm = RHF.useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "viewer",
    },
  });

  const updateRoleForm = RHF.useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      role: "viewer",
    },
  });

  // Generate slug from name
  const watchedOrgName = organizationForm.watch("name");
  React.useEffect(() => {
    if (watchedOrgName) {
      const generatedSlug = watchedOrgName
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
      organizationForm.setValue("slug", generatedSlug);
    }
  }, [watchedOrgName, organizationForm]);

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

  const handleOrganizationLogoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

  const handleRemoveMember = (memberId: string) => {
    toast.success(`Remove member ${memberId} functionality coming soon`);
  };

  const handleResendInvite = (inviteId: string) => {
    toast.success(`Resend invite ${inviteId} functionality coming soon`);
  };

  const handleCancelInvite = (inviteId: string) => {
    toast.success(`Cancel invite ${inviteId} functionality coming soon`);
  };

  const handleUpdateRole = React.useCallback((member: TeamMember) => {
    setSelectedMemberForRoleUpdate(member);
    updateRoleForm.reset({
      role: member.role,
    });
    setIsUpdateRoleModalOpen(true);
  }, [updateRoleForm]);

  const onUpdateRoleSubmit = async (data: UpdateRoleFormData) => {
    if (!selectedMemberForRoleUpdate) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Updating role:", {
        memberId: selectedMemberForRoleUpdate.id,
        email: selectedMemberForRoleUpdate.email,
        newRole: data.role,
      });
      toast.success("Role updated successfully", {
        description: `${selectedMemberForRoleUpdate.email}'s role has been updated to ${data.role}`,
      } as Parameters<typeof toast.success>[1]);
      updateRoleForm.reset();
      setIsUpdateRoleModalOpen(false);
      setSelectedMemberForRoleUpdate(null);
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update role", {
        description: "Please try again later",
      } as Parameters<typeof toast.error>[1]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when update role modal closes
  React.useEffect(() => {
    if (!isUpdateRoleModalOpen) {
      updateRoleForm.reset();
      setSelectedMemberForRoleUpdate(null);
      setIsSubmitting(false);
    }
  }, [isUpdateRoleModalOpen, updateRoleForm]);

  const onInviteMemberSubmit = async (data: InviteMemberFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Inviting team member:", data);
      toast.success("Invitation sent successfully", {
        description: `An invitation has been sent to ${data.email}`,
      } as Parameters<typeof toast.success>[1]);
      inviteMemberForm.reset();
      setIsInviteModalOpen(false);
      // Optionally switch to pending tab
      setTeamTab("pending");
    } catch (error) {
      console.error("Failed to send invitation:", error);
      toast.error("Failed to send invitation", {
        description: "Please try again later",
      } as Parameters<typeof toast.error>[1]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isInviteModalOpen) {
      inviteMemberForm.reset();
      setIsSubmitting(false);
    }
  }, [isInviteModalOpen, inviteMemberForm]);

  // Team table columns
  const teamColumns: ColumnDef<TeamMember>[] = React.useMemo(() => [
    {
      accessorKey: "member",
      header: "Member",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-3">
            {member.status === "pending" ? (
              <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                <Mail className="text-muted-foreground h-5 w-5" />
              </div>
            ) : (
              <Avatar>
                <AvatarImage
                  src={member.avatar || undefined}
                  className="object-cover"
                />
                <AvatarFallback>
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="font-medium">{member.name || member.email}</p>
            </div>
          </div>
        );
      },
      size: 250,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        return (
          <p className="text-muted-foreground text-sm">{row.original.email}</p>
        );
      },
      size: 200,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge
            variant={
              role === "owner"
                ? "default"
                : role === "admin"
                  ? "secondary"
                  : "outline"
            }
            className={
              role === "owner"
                ? "border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                : ""
            }
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        );
      },
      size: 120,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant="outline"
            className="border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
          >
            <User className="mr-1 h-3 w-3" />
            {status === "active" ? "Active" : "Pending"}
          </Badge>
        );
      },
      size: 120,
    },
    {
      accessorKey: "joinedAt",
      header: teamTab === "pending" ? "Invited" : "Joined",
      cell: ({ row }) => {
        const member = row.original;
        if (member.status === "pending" && member.createdAt) {
          return (
            <p className="text-muted-foreground text-sm">
              {moment(member.createdAt).format("MMM D, YYYY")}
            </p>
          );
        }
        if (member.status === "active") {
          return (
            <p className="text-muted-foreground text-sm">
              {moment(member.joinedAt).format("MMM D, YYYY")}
            </p>
          );
        }
        return <span className="text-muted-foreground text-sm">—</span>;
      },
      size: 150,
    },
    ...(teamTab === "pending"
      ? [
          {
            accessorKey: "expiresAt",
            header: "Expires",
            cell: ({ row }) => {
              const member = row.original;
              if (member.status === "pending" && member.expiresAt) {
                return (
                  <p className="text-muted-foreground text-sm">
                    {moment(member.expiresAt).format("MMM D, YYYY")}
                  </p>
                );
              }
              return <span className="text-muted-foreground text-sm">—</span>;
            },
            size: 150,
          } as ColumnDef<TeamMember>,
        ]
      : []),
  ], [teamTab]);

  // Filter data based on active tab
  const teamTableData = React.useMemo(() => {
    if (teamTab === "members") {
      return mockTeamMembers;
    }
    return mockPendingInvites;
  }, [teamTab]);

  // Table actions
  const teamTableActions: TableAction<TeamMember>[] = React.useMemo(() => {
    if (teamTab === "members") {
      return [
        {
          label: "Update Role",
          onClick: (member: TeamMember) => handleUpdateRole(member),
        },
        {
          label: "Remove",
          onClick: (member: TeamMember) => {
            if (member.role !== "owner") {
              handleRemoveMember(member.id);
            }
          },
          variant: "destructive" as const,
        },
      ];
    }
    return [
      {
        label: "Update Role",
        onClick: (invite: TeamMember) => handleUpdateRole(invite),
      },
      {
        label: "Resend",
        onClick: (invite: TeamMember) => handleResendInvite(invite.id),
      },
      {
        label: "Cancel",
        onClick: (invite: TeamMember) => handleCancelInvite(invite.id),
        variant: "destructive" as const,
      },
    ];
  }, [teamTab, handleUpdateRole]);

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-6 p-4 sm:p-6">
            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard">Dashboard</Link>
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

            {/* Settings Tabs */}
            <UnderlineTabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <UnderlineTabsList>
                <UnderlineTabsTrigger value="profile">
                  Profile
                </UnderlineTabsTrigger>
                <UnderlineTabsTrigger value="organization">
                  Organization
                </UnderlineTabsTrigger>
                <UnderlineTabsTrigger value="team">Team</UnderlineTabsTrigger>
                <UnderlineTabsTrigger value="api">
                  API Keys
                </UnderlineTabsTrigger>
              </UnderlineTabsList>

              {/* Profile Tab */}
              <UnderlineTabsContent value="profile" className="mt-6 space-y-6">
                {/* Profile Information Section */}
                <Card className="shadow-none">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-6">
                      <div className="relative">
                        <Avatar className="h-20 w-20">
                          <AvatarImage
                            src={avatarPreview || mockUser.avatar || undefined}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-lg">
                            {mockUser.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
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
                          <CardTitle className="text-xl">
                            Profile Information
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Update your personal information and how others see
                            you on Stellar Tools.
                          </CardDescription>
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Joined{" "}
                            {moment(mockUser.joinedAt).format("MMM D, YYYY")}
                          </span>
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
                    <form
                      onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                      className="space-y-6"
                    >
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
                          <PhoneNumberPicker
                            id="phone-number"
                            label="Phone Number"
                            value={
                              field.value || { number: "", countryCode: "US" }
                            }
                            onChange={field.onChange}
                            error={error?.message || null}
                            disabled={isSubmitting}
                            groupClassName="w-full shadow-none"
                          />
                        )}
                      />

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="email"
                            className="flex items-center gap-2"
                          >
                            <Mail className="h-4 w-4" />
                            Email Address
                          </Label>
                          <Badge variant="secondary" className="text-xs">
                            Read-only
                          </Badge>
                        </div>
                        <div className="relative">
                          <TextField
                            id="email"
                            label=""
                            value={mockUser.email}
                            onChange={() => {}}
                            disabled
                            error={null}
                            className="w-full pr-10 shadow-none"
                          />
                          <Lock className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Email cannot be changed for security reasons. Contact
                          support if needed.
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="gap-2 shadow-none"
                        >
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
              <UnderlineTabsContent
                value="organization"
                className="mt-6 space-y-6"
              >
                {/* Organization Information Section */}
                <Card className="shadow-none">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-6">
                      <div className="relative">
                        <Avatar className="h-20 w-20">
                          <AvatarImage
                            src={
                              organizationLogoPreview ||
                              mockOrganization.logo ||
                              undefined
                            }
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
                          <CardTitle className="text-xl">
                            Organization Information
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Update your organization details and branding
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                    <CardDescription>
                      Update your organization name, slug, and description
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={organizationForm.handleSubmit(
                        onOrganizationSubmit
                      )}
                      className="space-y-6"
                    >
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
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="gap-2 shadow-none"
                        >
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

              {/* Team Tab */}
              <UnderlineTabsContent value="team" className="mt-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">Team Members</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Manage your team members and their permissions
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm">
                      {mockTeamMembers.length + mockPendingInvites.length} total
                      members
                    </Badge>
                    <Button
                      onClick={() => setIsInviteModalOpen(true)}
                      className="gap-2 shadow-none"
                    >
                      <Plus className="h-4 w-4" />
                      Invite Member
                    </Button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-border flex gap-1 border-b">
                  <button
                    type="button"
                    onClick={() => setTeamTab("members")}
                    className={cn(
                      "text-muted-foreground hover:text-foreground flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-medium transition-colors",
                      teamTab === "members"
                        ? "border-primary text-foreground"
                        : "border-transparent"
                    )}
                  >
                    <User className="h-4 w-4" />
                    Members ({mockTeamMembers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeamTab("pending")}
                    className={cn(
                      "text-muted-foreground hover:text-foreground flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-medium transition-colors",
                      teamTab === "pending"
                        ? "border-primary text-foreground"
                        : "border-transparent"
                    )}
                  >
                    <Mail className="h-4 w-4" />
                    Pending ({mockPendingInvites.length})
                  </button>
                </div>

                {/* Table Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {teamTab === "members"
                        ? "Active Members"
                        : "Pending Invitations"}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {teamTab === "members"
                        ? `${mockTeamMembers.length} team member${mockTeamMembers.length !== 1 ? "s" : ""}`
                        : `${mockPendingInvites.length} pending invitation${mockPendingInvites.length !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>

                {/* Table */}
                {teamTableData.length > 0 ? (
                  <div className="[&_tr:hover]:bg-muted/50 [&_th]:text-muted-foreground [&_table]:bg-transparent [&_tbody]:bg-transparent [&_td]:py-4 [&_th]:pb-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_thead]:bg-transparent [&_tr]:border-b [&>div]:bg-transparent [&>div>div]:rounded-none [&>div>div]:border-0 [&>div>div]:shadow-none">
                    <DataTable
                      columns={teamColumns}
                      data={teamTableData}
                      actions={teamTableActions}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
                    <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                      <User className="text-muted-foreground h-8 w-8" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">
                      {teamTab === "members"
                        ? "No active members"
                        : "No pending invitations"}
                    </h3>
                    <p className="text-muted-foreground text-center text-sm">
                      {teamTab === "members"
                        ? "No team members have been added yet."
                        : "All team members have accepted their invitations"}
                    </p>
                  </div>
                )}
              </UnderlineTabsContent>

              {/* API & Webhooks Tab */}
              <UnderlineTabsContent value="api" className="mt-6 space-y-6">
                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>
                      Manage your API keys for authenticating requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground text-sm">
                        Create and manage API keys to authenticate your requests
                        to the Stellar Tools API.
                      </p>
                      <Link href="/dashboard/api-keys">
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
                    <CardDescription>
                      Configure webhook destinations for event notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground text-sm">
                        Set up webhooks to receive real-time notifications about
                        events in your account.
                      </p>
                      <Link href="/dashboard/webhooks">
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

      {/* Invite Member Modal */}
      <FullScreenModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        title="Invite Team Member"
        description="Send an invitation to add a new member to your organization"
        size="small"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsInviteModalOpen(false)}
              disabled={isSubmitting}
              className="shadow-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() =>
                inviteMemberForm.handleSubmit(onInviteMemberSubmit)()
              }
              disabled={isSubmitting}
              className="gap-2 shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </div>
        }
      >
        <form
          onSubmit={inviteMemberForm.handleSubmit(onInviteMemberSubmit)}
          className="space-y-6"
        >
          <RHF.Controller
            control={inviteMemberForm.control}
            name="email"
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                id="invite-email"
                label="Email Address"
                type="email"
                placeholder="colleague@example.com"
                error={error?.message || null}
                className="w-full shadow-none"
              />
            )}
          />

          <RHF.Controller
            control={inviteMemberForm.control}
            name="role"
            render={({ field, fieldState: { error } }) => (
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                {error && (
                  <p className="text-destructive text-sm" role="alert">
                    {error.message}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Choose the permission level for this team member
                </p>
              </div>
            )}
          />
        </form>
      </FullScreenModal>

      {/* Update Role Modal */}
      <FullScreenModal
        open={isUpdateRoleModalOpen}
        onOpenChange={setIsUpdateRoleModalOpen}
        title="Update Role"
        description={
          selectedMemberForRoleUpdate
            ? `Change the role for ${selectedMemberForRoleUpdate.email}`
            : "Change the role for this team member"
        }
        size="small"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsUpdateRoleModalOpen(false)}
              disabled={isSubmitting}
              className="shadow-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() =>
                updateRoleForm.handleSubmit(onUpdateRoleSubmit)()
              }
              disabled={isSubmitting}
              className="gap-2 shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Role"
              )}
            </Button>
          </div>
        }
      >
        <form
          onSubmit={updateRoleForm.handleSubmit(onUpdateRoleSubmit)}
          className="space-y-6"
        >
          <RHF.Controller
            control={updateRoleForm.control}
            name="role"
            render={({ field, fieldState: { error } }) => (
              <div className="space-y-2">
                <Label htmlFor="update-role">Role</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="update-role" className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                {error && (
                  <p className="text-destructive text-sm" role="alert">
                    {error.message}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Choose the permission level for this team member
                </p>
              </div>
            )}
          />
        </form>
      </FullScreenModal>
    </div>
  );
}
