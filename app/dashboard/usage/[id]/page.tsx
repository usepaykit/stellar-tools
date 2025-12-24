"use client";

import * as React from "react";

import { CodeBlock } from "@/components/code-block";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import {
  LogDetailItem,
  LogDetailSection,
  LogPicker,
} from "@/components/log-picker";
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
  UnderlineTabs,
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from "@/components/underline-tabs";
import { ColumnDef } from "@tanstack/react-table";
import {
  ChevronRight,
  Copy,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useCopy } from "@/hooks/use-copy";

type UsageRecordStatus = "granted" | "consumed" | "revoked";

type UsageRecord = {
  id: string;
  organizationId: string;
  customerId: string;
  productId: string;
  balanceId: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason?: string;
  metadata?: object;
  createdAt: Date;
  status: UsageRecordStatus;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  product?: {
    id: string;
    name: string;
  };
};

const mockUsageRecords: UsageRecord[] = [
  {
    id: "usage_1",
    organizationId: "org_1",
    customerId: "cus_1",
    productId: "prod_1",
    balanceId: "bal_1",
    amount: 1000,
    balanceBefore: 0,
    balanceAfter: 1000,
    reason: "Initial grant",
    metadata: { source: "admin", note: "Welcome bonus" },
    createdAt: new Date("2024-12-22T10:30:00"),
    status: "granted",
    customer: {
      id: "cus_1",
      name: "John Doe",
      email: "john.doe@example.com",
    },
    product: {
      id: "prod_1",
      name: "Premium Plan",
    },
  },
  {
    id: "usage_2",
    organizationId: "org_1",
    customerId: "cus_1",
    productId: "prod_1",
    balanceId: "bal_1",
    amount: -250,
    balanceBefore: 1000,
    balanceAfter: 750,
    reason: "API call consumption",
    metadata: { endpoint: "/api/v1/chat", tokens: 250 },
    createdAt: new Date("2024-12-22T11:15:00"),
    status: "consumed",
    customer: {
      id: "cus_1",
      name: "John Doe",
      email: "john.doe@example.com",
    },
    product: {
      id: "prod_1",
      name: "Premium Plan",
    },
  },
  {
    id: "usage_3",
    organizationId: "org_1",
    customerId: "cus_1",
    productId: "prod_1",
    balanceId: "bal_1",
    amount: -150,
    balanceBefore: 750,
    balanceAfter: 600,
    reason: "API call consumption",
    metadata: { endpoint: "/api/v1/image", tokens: 150 },
    createdAt: new Date("2024-12-22T12:00:00"),
    status: "consumed",
    customer: {
      id: "cus_1",
      name: "John Doe",
      email: "john.doe@example.com",
    },
    product: {
      id: "prod_1",
      name: "Premium Plan",
    },
  },
  {
    id: "usage_4",
    organizationId: "org_1",
    customerId: "cus_1",
    productId: "prod_1",
    balanceId: "bal_1",
    amount: 500,
    balanceBefore: 600,
    balanceAfter: 1100,
    reason: "Top-up purchase",
    metadata: { paymentId: "pay_123", transactionHash: "abc123..." },
    createdAt: new Date("2024-12-22T14:30:00"),
    status: "granted",
    customer: {
      id: "cus_1",
      name: "John Doe",
      email: "john.doe@example.com",
    },
    product: {
      id: "prod_1",
      name: "Premium Plan",
    },
  },
  {
    id: "usage_5",
    organizationId: "org_1",
    customerId: "cus_1",
    productId: "prod_1",
    balanceId: "bal_1",
    amount: -100,
    balanceBefore: 1100,
    balanceAfter: 1000,
    reason: "Revoked by admin",
    metadata: { adminId: "admin_1", reason: "Policy violation" },
    createdAt: new Date("2024-12-22T16:00:00"),
    status: "revoked",
    customer: {
      id: "cus_1",
      name: "John Doe",
      email: "john.doe@example.com",
    },
    product: {
      id: "prod_1",
      name: "Premium Plan",
    },
  },
];

const StatusBadge = ({ status }: { status: UsageRecordStatus }) => {
  const variants = {
    granted: {
      className:
        "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400",
      label: "Granted",
      icon: TrendingUp,
    },
    consumed: {
      className:
        "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
      label: "Consumed",
      icon: TrendingDown,
    },
    revoked: {
      className:
        "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
      label: "Revoked",
      icon: TrendingDown,
    },
  };

  const variant = variants[status];
  const Icon = variant.icon;

  return (
    <Badge variant="outline" className={`gap-1.5 ${variant.className}`}>
      <Icon className="h-3 w-3" />
      {variant.label}
    </Badge>
  );
};

const CopyButton = ({ text, label }: { text: string; label?: string }) => {
    const { copied, handleCopy } = useCopy();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="h-8 w-8"
      onClick={() => handleCopy({text, message: "Copied to clipboard"})}
      title={label || "Copy to clipboard"}
    >
      {copied ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
};

const columns: ColumnDef<UsageRecord>[] = [
  {
    accessorKey: "status",
    header: () => null,
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex w-full items-center justify-between">
          <StatusBadge status={record.status} />
          <div className="flex flex-col items-end">
            <span className={`text-foreground font-normal`}>
              {record.amount > 0 ? "+" : ""}
              {record.amount.toLocaleString()}
            </span>
          </div>
        </div>
      );
    },
  },

  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => {
      const reason = row.original.reason;
      return (
        <span className="text-muted-foreground text-sm">{reason || "—"}</span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "balanceAfter",
    header: "Balance",
    cell: ({ row }) => {
      const balance = row.original.balanceAfter;
      return (
        <span className="text-sm font-medium">{balance.toLocaleString()}</span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return (
        <div className="flex flex-col">
          <span className="text-sm">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="text-muted-foreground text-xs">
            {date.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>
      );
    },
    enableSorting: true,
  },
];

export default function UsageDetailPage() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Filter records based on status
  const filteredRecords = React.useMemo(() => {
    let records = mockUsageRecords;

    if (statusFilter && statusFilter !== "all") {
      records = records.filter((record) => record.status === statusFilter);
    }

    return records;
  }, [statusFilter]);

  const formatJSON = (obj: object) => {
    return JSON.stringify(obj, null, 2);
  };

  const renderDetail = (record: UsageRecord) => {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-border mb-4 flex items-start justify-between border-b pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Usage Record</h3>
            <p className="text-muted-foreground text-sm">
              {record.status === "granted"
                ? "Credit granted"
                : record.status === "consumed"
                  ? "Credit consumed"
                  : "Credit revoked"}
            </p>
          </div>
          <StatusBadge status={record.status} />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
          {/* Balance Information */}
          <LogDetailSection title="Balance Information">
            <div className="space-y-3">
              <LogDetailItem
                label="Amount"
                value={
                  <span
                    className={
                      record.amount > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {record.amount > 0 ? "+" : ""}
                    {record.amount.toLocaleString()}
                  </span>
                }
              />
              <LogDetailItem
                label="Balance Before"
                value={record.balanceBefore.toLocaleString()}
              />
              <LogDetailItem
                label="Balance After"
                value={record.balanceAfter.toLocaleString()}
              />
              <div className="flex items-center justify-between">
                <LogDetailItem label="Balance ID" value={record.balanceId} />
                <CopyButton text={record.balanceId} label="Copy balance ID" />
              </div>
            </div>
          </LogDetailSection>

          {/* Customer Information */}
          <LogDetailSection title="Customer Information">
            <div className="space-y-3">
              {record.customer ? (
                <>
                  <div className="flex items-center justify-between">
                    <LogDetailItem
                      label="Customer"
                      value={
                        <Link
                          href={`/dashboard/customers/${record.customerId}`}
                          className="text-primary hover:underline"
                        >
                          {record.customer.name}
                        </Link>
                      }
                    />
                    <CopyButton
                      text={record.customerId}
                      label="Copy customer ID"
                    />
                  </div>
                  <LogDetailItem label="Email" value={record.customer.email} />
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No customer data
                </p>
              )}
            </div>
          </LogDetailSection>

          {/* Product Information */}
          <LogDetailSection title="Product Information">
            <div className="space-y-3">
              {record.product ? (
                <div className="flex items-center justify-between">
                  <LogDetailItem
                    label="Product"
                    value={
                      <Link
                        href={`/dashboard/products/${record.productId}`}
                        className="text-primary hover:underline"
                      >
                        {record.product.name}
                      </Link>
                    }
                  />
                  <CopyButton text={record.productId} label="Copy product ID" />
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No product data</p>
              )}
            </div>
          </LogDetailSection>

          {/* Record Details */}
          <LogDetailSection title="Record Details">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <LogDetailItem label="Usage ID" value={record.id} />
                <CopyButton text={record.id} label="Copy usage ID" />
              </div>
              <LogDetailItem
                label="Created at"
                value={record.createdAt.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              />
              {record.reason && (
                <LogDetailItem label="Reason" value={record.reason} />
              )}
            </div>
          </LogDetailSection>

          {/* Metadata Section */}
          {record.metadata && (
            <LogDetailSection title="Metadata">
              <CodeBlock
                language="json"
                showCopyButton={true}
                maxHeight="300px"
              >
                {formatJSON(record.metadata)}
              </CodeBlock>
            </LogDetailSection>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-6 p-6">
            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard/usage">Usage</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>Records</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Usage Records
                </h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  View usage history and balance changes
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between gap-4">
              <UnderlineTabs
                value={statusFilter}
                onValueChange={setStatusFilter}
                className="w-auto"
              >
                <UnderlineTabsList>
                  <UnderlineTabsTrigger value="all">All</UnderlineTabsTrigger>
                  <UnderlineTabsTrigger value="granted">
                    Granted
                  </UnderlineTabsTrigger>
                  <UnderlineTabsTrigger value="consumed">
                    Consumed
                  </UnderlineTabsTrigger>
                  <UnderlineTabsTrigger value="revoked">
                    Revoked
                  </UnderlineTabsTrigger>
                </UnderlineTabsList>
              </UnderlineTabs>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {/* Log Picker */}
            <div className="h-[calc(100vh-400px)] min-h-[600px]">
              <LogPicker
                data={filteredRecords}
                columns={columns}
                renderDetail={renderDetail}
                detailPanelWidth={500}
                emptyMessage="No usage records found"
                className="h-full"
              />
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
    </div>
  );
}
