"use client";

import * as React from "react";

import { ApiKeyModal } from "@/components/api-keys/api-key-modal";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, type TableAction } from "@/components/data-table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { truncate } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, ExternalLink, Info, Plus } from "lucide-react";
import Link from "next/link";

type ApiKeyType = "restricted" | "standard";
type ApiKey = {
  id: string;
  name: string;
  token: string;
  type: ApiKeyType;
  ipRestrictions?: string[];
  lastUsed?: Date;
  createdAt: Date;
};

const mockRestrictedKeys: ApiKey[] = [];

const mockStandardKeys: ApiKey[] = [
  {
    id: "key_1",
    name: "Publishable key",
    token:
      "stellar_pk_test_51QWaf3SF0MtsiMvyIwjRpdU5vS87ITrdRAUfy0Ny1A9R8hdw1005vlQhdZo",
    type: "standard",
    ipRestrictions: undefined,
    lastUsed: new Date("2024-12-23"),
    createdAt: new Date("2024-12-16"),
  },
  {
    id: "key_2",
    name: "Secret key",
    token:
      "stellar_sk_test_51QWaf3SF0MtsiMvyIwjRpdU5vS87ITrdRAUfy0Ny1A9R8hdw1005vlQhdZo",
    type: "standard",
    ipRestrictions: undefined,
    lastUsed: new Date("2024-12-22"),
    createdAt: new Date("2024-12-16"),
  },
  {
    id: "key_3",
    name: "Main Backend Key [Yash]",
    token:
      "stellar_sk_test_51QWaf3SF0MtsiMvyIwjRpdU5vS87ITrdRAUfy0Ny1A9R8hdw1005vlQhdZo",
    type: "standard",
    ipRestrictions: undefined,
    lastUsed: new Date("2024-12-22"),
    createdAt: new Date("2024-07-10"),
  },
  {
    id: "key_4",
    name: "Saqlain_Key_LM",
    token:
      "stellar_sk_test_51QWaf3SF0MtsiMvyIwjRpdU5vS87ITrdRAUfy0Ny1A9R8hdw1005vlQhdZo",
    type: "standard",
    ipRestrictions: undefined,
    lastUsed: new Date("2024-12-23"),
    createdAt: new Date("2024-08-25"),
  },
  {
    id: "key_5",
    name: "Saqlain_key_LM_C",
    token:
      "stellar_sk_test_51QWaf3SF0MtsiMvyIwjRpdU5vS87ITrdRAUfy0Ny1A9R8hdw1005vlQhdZo",
    type: "standard",
    ipRestrictions: undefined,
    lastUsed: new Date("2024-12-23"),
    createdAt: new Date("2024-10-09"),
  },
];

export default function ApiKeysPage() {
  const [isRestrictedModalOpen, setIsRestrictedModalOpen] =
    React.useState(false);
  const [isStandardModalOpen, setIsStandardModalOpen] = React.useState(false);

  const restrictedColumns: ColumnDef<ApiKey>[] = [
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
      header: "TOKEN",
      cell: ({ row }) => {
        const token = row.original.token;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">
              {truncate(token, { start: 1, end: 1 })}
            </span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "ipRestrictions",
      header: "IP RESTRICTIONS",
      cell: ({ row }) => {
        const restrictions = row.original.ipRestrictions;
        return (
          <div className="flex items-center gap-1.5">
            {restrictions && restrictions.length > 0 ? (
              <span className="text-sm">{restrictions.join(", ")}</span>
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
      accessorKey: "lastUsed",
      header: "LAST USED",
      cell: ({ row }) => {
        const date = row.original.lastUsed;
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

  const standardColumns: ColumnDef<ApiKey>[] = [
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
      header: "TOKEN",
      cell: ({ row }) => {
        const token = row.original.token;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">
              {truncate(token, { start: 4, end: 2, separator: "...." })}
            </span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "ipRestrictions",
      header: "IP RESTRICTIONS",
      cell: ({ row }) => {
        const restrictions = row.original.ipRestrictions;
        return (
          <div className="flex items-center gap-1.5">
            {restrictions && restrictions.length > 0 ? (
              <span className="text-sm">{restrictions.join(", ")}</span>
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
      accessorKey: "lastUsed",
      header: "LAST USED",
      cell: ({ row }) => {
        const date = row.original.lastUsed;
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

  const restrictedActions: TableAction<ApiKey>[] = [
    {
      label: "Copy API key ID",
      onClick: (key) => {
        navigator.clipboard.writeText(key.id);
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
      label: "Manage IP restrictions",
      onClick: (key) => {
        console.log("Manage IP restrictions:", key.id);
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

  const standardActions: TableAction<ApiKey>[] = [
    {
      label: "Copy API key ID",
      onClick: (key) => {
        navigator.clipboard.writeText(key.id);
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
      label: "Manage IP restrictions",
      onClick: (key) => {
        console.log("Manage IP restrictions:", key.id);
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
                  <BreadcrumbPage>API keys</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
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

            {/* Restricted Keys Section */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">Restricted keys</h2>
                  <p className="text-muted-foreground text-sm">
                    Create a key with specific access limits and permissions for
                    greater security.{" "}
                    <Link href="#" className="text-primary hover:underline">
                      Learn more
                    </Link>
                    .
                  </p>
                </div>
                <Button
                  className="gap-2"
                  onClick={() => setIsRestrictedModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create restricted key
                </Button>
              </div>

              {mockRestrictedKeys.length === 0 ? (
                <div className="border-border bg-muted/10 flex min-h-[200px] flex-col items-center justify-center rounded-lg border p-12 text-center">
                  <p className="text-muted-foreground text-sm">
                    No restricted keys
                  </p>
                </div>
              ) : (
                <DataTable
                  columns={restrictedColumns}
                  data={mockRestrictedKeys}
                  actions={restrictedActions}
                />
              )}
            </div>

            {/* Standard Keys Section */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">Standard keys</h2>
                  <p className="text-muted-foreground text-sm">
                    Create a key that unlocks full API access, enabling
                    extensive interaction with your account.{" "}
                    <Link href="#" className="text-primary hover:underline">
                      Learn more
                    </Link>
                    .
                  </p>
                </div>
                <Button
                  className="gap-2"
                  onClick={() => setIsStandardModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create secret key
                </Button>
              </div>

              <DataTable
                columns={standardColumns}
                data={mockStandardKeys}
                actions={standardActions}
              />
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>

      {/* Modals */}
      <ApiKeyModal
        open={isRestrictedModalOpen}
        onOpenChange={setIsRestrictedModalOpen}
        type="restricted"
        onSuccess={() => {
          // Refresh data or update state here
          console.log("Restricted key created successfully");
        }}
      />
      <ApiKeyModal
        open={isStandardModalOpen}
        onOpenChange={setIsStandardModalOpen}
        type="standard"
        onSuccess={() => {
          // Refresh data or update state here
          console.log("Standard key created successfully");
        }}
      />
    </div>
  );
}
