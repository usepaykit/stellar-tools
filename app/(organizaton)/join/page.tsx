"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { getInitials } from "@/lib/utils";
import { Check, Loader2, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const mockInvitation = {
  organizationName: "Acme Inc",
  organizationLogo: null,
  inviterName: "John Doe",
  inviterEmail: "john@example.com",
  role: "developer",
  expiresAt: new Date("2024-12-31"),
};

function JoinTeamPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAccepted, setIsAccepted] = React.useState(false);

  const token = searchParams.get("org");
  const hideSignup = searchParams.get("signedUp") === "true";

  const onSubmit = async () => {
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Joining team:", {
        token,
        organization: mockInvitation.organizationName,
      });

      toast.success("Successfully joined the team!", {
        description: `Welcome to ${mockInvitation.organizationName}`,
      } as Parameters<typeof toast.success>[1]);

      setIsAccepted(true);

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Failed to join team:", error);
      toast.error("Failed to join team", {
        description: "Please try again later",
      } as Parameters<typeof toast.error>[1]);
      setIsSubmitting(false);
    }
  };

  const isExpired = false;

  if (isAccepted) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex w-full max-w-md flex-col items-center space-y-6">
          <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
            <Check className="text-primary h-8 w-8" />
          </div>
          <div className="space-y-2 text-center">
            <h1 className="text-foreground text-2xl font-semibold">
              You&’re all set!
            </h1>
            <p className="text-muted-foreground text-sm">
              You&’ve successfully joined {mockInvitation.organizationName}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex w-full max-w-md flex-col items-center space-y-6">
          <div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
            <Mail className="text-destructive h-8 w-8" />
          </div>
          <div className="space-y-2 text-center">
            <h1 className="text-foreground text-2xl font-semibold">
              Invitation Expired
            </h1>
            <p className="text-muted-foreground text-sm">
              This invitation has expired. Please contact the team administrator
              for a new invitation.
            </p>
          </div>
          <Button
            onClick={() => router.push("/signin")}
            className="w-full shadow-none"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center space-y-6">
        {/* Invitation Card */}
        <Card className="w-full shadow-none">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={mockInvitation.organizationLogo || undefined}
                  className="object-cover"
                />
                <AvatarFallback className="text-lg">
                  {getInitials(mockInvitation.organizationName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl">You&’ve been invited!</h2>
              <CardDescription>
                <span className="font-semibold">
                  {mockInvitation.inviterName}
                </span>{" "}
                has invited you to join{" "}
                <span className="font-semibold">
                  {mockInvitation.organizationName}
                </span>
              </CardDescription>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {mockInvitation.role.charAt(0).toUpperCase() +
                  mockInvitation.role.slice(1)}
              </Badge>
              <span className="text-muted-foreground text-xs">role</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs">
                  By joining, you agree to become a member of this organization
                  and will have access based on your assigned role.
                </p>
              </div>

              <Button
                type="button"
                onClick={onSubmit}
                className="w-full shadow-none"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {!hideSignup && (
          <div className="w-full text-center">
            <p className="text-muted-foreground text-xs">
              Don&’t have an account?{" "}
              <button
                onClick={() => {
                  const signupUrl = token
                    ? `/auth/signup?joinorg=${token}`
                    : "/auth/signup";
                  router.push(signupUrl);
                }}
                className="hover:text-foreground font-semibold underline transition-colors"
              >
                Sign up
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoinTeamPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <JoinTeamPageContent />
    </React.Suspense>
  );
}
