"use client";

import * as React from "react";

import { postApiKey, retrieveApiKeys } from "@/actions/apikey";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, type TableAction } from "@/components/data-table";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { TextField } from "@/components/input-picker";
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
import { toast } from "@/components/ui/toast";
import { ApiKey } from "@/db";
import { useCopy } from "@/hooks/use-copy";
import { useInvalidateOrgQuery, useOrgQuery } from "@/hooks/use-org-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Copy, ExternalLink, Info, Plus } from "lucide-react";
import { nanoid } from "nanoid";
import Link from "next/link";
import * as RHF from "react-hook-form";
import { z } from "zod";

const apiKeySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
});

type ApiKeyFormData = z.infer<typeof apiKeySchema>;

export default function ApiKeysPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [createdApiKey, setCreatedApiKey] = React.useState<string | null>(null);

  const { data: apiKeys = [], isLoading } = useOrgQuery(["apiKeys"], () =>
    retrieveApiKeys()
  );

  const { handleCopy } = useCopy();

  const columns: ColumnDef<ApiKey>[] = [
    {
      accessorKey: "name",
      header: "NAME",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.name}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "token",
      header: "API KEY",
      cell: () => {
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">••••••••••••••••</span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "scope",
      header: "SCOPE",
      cell: ({ row }) => {
        const scope = row.original.scope;
        return (
          <div className="flex items-center gap-1.5">
            {scope && scope.length > 0 ? (
              <span className="text-sm">{scope.join(", ")}</span>
            ) : (
              <>
                <span className="text-sm">None</span>
                <Info className="text-muted-foreground h-3.5 w-3.5" />
              </>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "isRevoked",
      header: "STATUS",
      cell: ({ row }) => {
        const isRevoked = row.original.isRevoked;
        return (
          <Badge
            variant="outline"
            className={
              isRevoked
                ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
                : "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
            }
          >
            {isRevoked ? "Revoked" : "Active"}
          </Badge>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "lastUsedAt",
      header: "LAST USED",
      cell: ({ row }) => {
        const date = row.original.lastUsedAt;
        if (!date)
          return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <span className="text-sm">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "createdAt",
      header: "CREATED",
      cell: ({ row }) => {
        const date = row.original.createdAt;
        return (
          <span className="text-sm">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        );
      },
      enableSorting: true,
    },
  ];

  const actions: TableAction<ApiKey>[] = [
    {
      label: "Copy API key ID",
      onClick: (key) => {
        handleCopy({ text: key.id, message: "API key ID copied to clipboard" });
      },
    },
    {
      label: "Rotate key",
      onClick: (key) => {
        console.log("Rotate key:", key.id);
      },
    },
    {
      label: "Edit key",
      onClick: (key) => {
        console.log("Edit key:", key.id);
      },
    },
    {
      label: "Manage scope",
      onClick: (key) => {
        console.log("Manage scope:", key.id);
      },
    },
    {
      label: "View request logs",
      onClick: (key) => {
        console.log("View request logs:", key.id);
      },
    },
    {
      label: "Delete key",
      onClick: (key) => {
        console.log("Delete key:", key.id);
      },
      variant: "destructive",
    },
  ];

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-8 p-6">
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
                  <BreadcrumbPage>API keys</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">API keys</h1>
              </div>
              <Link
                href="#"
                className="text-primary flex items-center gap-1 text-sm hover:underline"
              >
                Learn more about API authentication
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">Standard keys</h2>
                  <p className="text-muted-foreground text-sm">
                    Use these keys for server-side requests to the Stellar Tools
                    API.{" "}
                    <Link href="#" className="text-primary hover:underline">
                      Learn more
                    </Link>
                    .
                  </p>
                </div>
                <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create secret key
                </Button>
              </div>

              <DataTable
                columns={columns}
                data={apiKeys}
                actions={actions}
                isLoading={isLoading}
              />
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>

      <ApiKeyModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        createdApiKey={createdApiKey}
        onApiKeyCreated={setCreatedApiKey}
      />
    </div>
  );
}

// --- Modal Component ---

function ApiKeyModal({
  open,
  onOpenChange,
  createdApiKey,
  onApiKeyCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createdApiKey: string | null;
  onApiKeyCreated: (key: string | null) => void;
}) {
  const { handleCopy } = useCopy();

  const invalidateOrgQuery = useInvalidateOrgQuery();

  const form = RHF.useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: "",
    },
  });

  const handleCopyKey = async () => {
    if (createdApiKey) {
      await handleCopy({
        text: createdApiKey,
        message: "API key copied to clipboard",
      });
    }
  };

  const createApiKeyMutation = useMutation({
    mutationFn: async (data: ApiKeyFormData) => {
      const token = `stKey_${nanoid(32)}`;

      return await postApiKey({
        name: data.name,
        scope: ["*"],
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: null,
        token,
        lastUsedAt: null,
      });
    },
    onSuccess: (apiKey) => {
      invalidateOrgQuery(["apiKeys"]);
      onApiKeyCreated(apiKey.token);
      toast.success("API key created");
    },
    onError: () => {
      toast.error("Failed to create API key");
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (!createApiKeyMutation.isPending) {
        form.reset();
        onApiKeyCreated(null);
      }
    }
    onOpenChange(newOpen);
  };

  const handleContinue = () => {
    form.reset();
    onApiKeyCreated(null);
    onOpenChange(false);
  };

  return (
    <FullScreenModal
      open={open}
      onOpenChange={handleOpenChange}
      title={createdApiKey ? "API key created" : "Create secret key"}
      description={
        createdApiKey
          ? "Make sure to copy your API key now. You won't be able to see it again!"
          : "Create a key that unlocks full API access, enabling extensive interaction with your account."
      }
      size="small"
      showCloseButton={true}
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          {createdApiKey ? (
            <Button onClick={handleContinue}>Continue</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={createApiKeyMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit((data) => {
                  createApiKeyMutation.mutate(data);
                })}
                disabled={createApiKeyMutation.isPending}
                isLoading={createApiKeyMutation.isPending}
              >
                {createApiKeyMutation.isPending ? "Creating..." : "Create key"}
              </Button>
            </>
          )}
        </div>
      }
    >
      {createdApiKey ? (
        <div className="space-y-4">
          <div className="bg-muted/50 border-border rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Important:</strong> Make sure
              to copy your API key now. You won’t be able to see it again!
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Your API key</label>
            <div className="flex items-center gap-2">
              <div className="bg-muted border-border flex-1 rounded-md border p-3">
                <code className="font-mono text-sm break-all">
                  {createdApiKey}
                </code>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyKey}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Click the copy button to copy your API key to the clipboard.
            </p>
          </div>
        </div>
      ) : (
        <form
          onSubmit={form.handleSubmit((data) => {
            createApiKeyMutation.mutate(data);
          })}
          className="space-y-6"
          id="api-key-form"
        >
          <RHF.Controller
            control={form.control}
            name="name"
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                id="name"
                label="Name"
                helpText="Give your API key a descriptive name to help you identify it later."
                error={error?.message}
                placeholder="e.g., Production API Key"
                className="shadow-none"
              />
            )}
          />

          <div className="bg-muted/50 border-border rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Note:</strong> API keys have
              full API access. Make sure to keep your secret keys secure and
              never expose them in client-side code.
            </p>
          </div>
        </form>
      )}
    </FullScreenModal>
  );
}
