"use client";

import * as React from "react";

import { getCurrentUser } from "@/actions/auth";
import { putTeamInvite, retrieveTeamInvite, retrieveTeamInviteByOrg } from "@/actions/team-invite";
import { postTeamMember } from "@/actions/team-member";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { cn, getInitials } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const StatusLayout = ({ children, icon: Icon, iconClass }: any) => (
  <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
    <div className="flex w-full max-w-md flex-col items-center space-y-6">
      {Icon && (
        <div className={cn("flex h-16 w-16 items-center justify-center rounded-full", iconClass)}>
          <Icon className="h-8 w-8" />
        </div>
      )}
      {children}
    </div>
  </div>
);

const InviteSkeleton = () => (
  <StatusLayout>
    <Card className="w-full shadow-none">
      <CardHeader className="space-y-4 text-center">
        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="mx-auto h-6 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  </StatusLayout>
);

function JoinTeamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org");
  const inviteId = searchParams.get("invite");
  const hideSignup = searchParams.get("signedUp") === "true";

  const { data: invite, isLoading } = useQuery({
    queryKey: ["team-invite", orgId, inviteId],
    queryFn: () => retrieveTeamInviteByOrg(orgId!, inviteId!),
    enabled: !!orgId && !!inviteId,
  });

  const {
    mutate: joinTeam,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: async () => {
      const user = await getCurrentUser();
      if (!user) return router.push(`/signin?redirect=/join?org=${orgId}`);

      const fullInvite = await retrieveTeamInvite(invite!.id, orgId!);

      if (fullInvite?.status === "accepted") {
        throw new Error("You have already accepted this invitation");
      }

      if (fullInvite?.email !== user.email) throw new Error("Invite email mismatch");

      await Promise.all([
        postTeamMember({
          accountId: user.id,
          organizationId: orgId!,
          role: invite!.role,
          metadata: null,
        }),
        putTeamInvite(invite!.id, { status: "accepted" }),
      ]);
    },
    onSuccess: () => {
      toast.success(`Joined ${invite?.organizationName}`);
      router.push("/select-organization");
    },
    onError: (err: any) => toast.error("Failed to join", { description: err.message }),
  });

  if (isLoading) return <InviteSkeleton />;

  if (!invite && !isLoading) {
    return (
      <StatusLayout icon={Mail} iconClass="bg-primary/10 text-primary">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Invitation Not Found</h1>
          <p className="text-muted-foreground text-sm">Contact your admin for a new invite.</p>
        </div>
      </StatusLayout>
    );
  }

  if (isSuccess)
    return (
      <StatusLayout icon={Check} iconClass="bg-primary/10 text-primary">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">You’re all set!</h1>
          <p className="text-muted-foreground text-sm">Joined {invite?.organizationName}. Redirecting...</p>
        </div>
      </StatusLayout>
    );

  if (invite?.expiresAt && new Date(invite.expiresAt) < new Date())
    return (
      <StatusLayout icon={Mail} iconClass="bg-destructive/10 text-destructive">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Invitation Expired</h1>
          <p className="text-muted-foreground text-sm">Contact your admin for a new invite.</p>
        </div>
        <Button onClick={() => router.push("/signin")} className="w-full">
          Sign In
        </Button>
      </StatusLayout>
    );

  return (
    <StatusLayout>
      <Card className="w-full shadow-none">
        <CardHeader className="space-y-4 text-center">
          <Avatar className="mx-auto h-16 w-16">
            <AvatarImage src={invite?.organizationLogo ?? ""} className="object-cover" />
            <AvatarFallback>{getInitials(invite?.organizationName ?? "")}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h2 className="text-xl">You’ve been invited!</h2>
            <CardDescription>
              <span className="font-semibold">{invite?.inviterName}</span> invited you to join{" "}
              <span className="font-semibold">{invite?.organizationName}</span>
            </CardDescription>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {invite?.role}
            </Badge>
            <span className="text-muted-foreground text-xs">role</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center text-xs">
            By joining, you agree to become a member with {invite?.role} access.
          </p>
          <Button onClick={() => joinTeam()} className="w-full" isLoading={isPending} disabled={isPending}>
            Accept Invitation
          </Button>
        </CardContent>
      </Card>

      {!hideSignup && (
        <p className="text-muted-foreground text-xs">
          Don’t have an account?{" "}
          <button
            onClick={() => router.push(`/auth/signup?redirect=/join?org=${orgId}`)}
            className="hover:text-foreground font-semibold underline"
          >
            Sign up
          </button>
        </p>
      )}
    </StatusLayout>
  );
}

export default function JoinTeamPage() {
  return (
    <React.Suspense fallback={<InviteSkeleton />}>
      <JoinTeamContent />
    </React.Suspense>
  );
}
