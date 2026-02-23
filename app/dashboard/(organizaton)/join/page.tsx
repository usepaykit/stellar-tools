"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Users } from "lucide-react";
import Link from "next/link";

export default function JoinTeamPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-none">
        <CardHeader className="space-y-4 text-center">
          <div className="bg-muted mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <Users className="text-muted-foreground h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Team invitations unavailable</h1>
            <CardDescription>
              Team and invite features are currently disabled. You can still create and use your own organizations.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/select-organization">Go to organizations</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/signin">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
