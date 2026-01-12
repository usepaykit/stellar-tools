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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UnderlineTabs,
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from "@/components/underline-tabs";
import { useCopy } from "@/hooks/use-copy";
import { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  ChevronRight,
  Copy,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  User,
  Package,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
      className: "border-muted bg-muted/50 text-foreground",
      label: "Granted",
      icon: TrendingUp,
    },
    consumed: {
      className: "border-muted bg-muted/50 text-foreground",
      label: "Consumed",
      icon: TrendingDown,
    },
    revoked: {
      className: "border-muted bg-muted/50 text-foreground",
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
      onClick={() => handleCopy({ text, message: "Copied to clipboard" })}
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
    header: "Transaction",
    cell: ({ row }) => {
      const record = row.original;
      const isPositive = record.amount > 0;
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <StatusBadge status={record.status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {record.amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original.customer;
      if (!customer) {
        return (
          <div className="flex items-center gap-3">
            <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <User className="text-muted-foreground h-5 w-5" />
            </div>
            <span className="text-muted-foreground text-sm">—</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {customer.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium truncate">
              {customer.name}
            </span>
            <span className="text-muted-foreground text-xs truncate">
              {customer.email}
            </span>
          </div>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "product",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original.product;
      if (!product) {
        return (
          <div className="flex items-center gap-3">
            <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Package className="text-muted-foreground h-5 w-5" />
            </div>
            <span className="text-muted-foreground text-sm">—</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <Package className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium">{product.name}</span>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => {
      const reason = row.original.reason;
      return (
        <div className="max-w-[200px]">
          <span className="text-muted-foreground text-sm line-clamp-2">
            {reason || "—"}
          </span>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => {
      const record = row.original;
      const balanceChange = record.balanceAfter - record.balanceBefore;
      return (
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              {record.balanceBefore.toLocaleString()}
            </span>
            <ArrowRight className="text-muted-foreground h-3 w-3" />
            <span className="text-sm font-semibold">
              {record.balanceAfter.toLocaleString()}
            </span>
          </div>
          {balanceChange !== 0 && (
            <span className="text-muted-foreground text-xs">
              {balanceChange.toLocaleString()}
            </span>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "createdAt",
    header: "Date & Time",
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
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

  const filteredRecords = React.useMemo(() => {
    let records = mockUsageRecords;

    if (statusFilter && statusFilter !== "all") {
      records = records.filter((record) => record.status === statusFilter);
    }

    return records;
  }, [statusFilter]);

  const usageMeter = React.useMemo(() => {
    const sortedRecords = [...mockUsageRecords].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    let totalGranted = 0;
    let totalConsumed = 0;

    sortedRecords.forEach((record) => {
      if (record.amount > 0) {
        totalGranted += record.amount;
      } else {
        totalConsumed += Math.abs(record.amount);
      }
    });

    const currentBalance =
      sortedRecords.length > 0
        ? sortedRecords[sortedRecords.length - 1].balanceAfter
        : 0;

    const remaining = currentBalance;
    const usagePercentage =
      totalGranted > 0 ? (totalConsumed / totalGranted) * 100 : 0;

    return {
      granted: totalGranted,
      consumed: totalConsumed,
      remaining,
      usagePercentage: Math.min(usagePercentage, 100),
    };
  }, []);

  const formatJSON = (obj: object) => {
    return JSON.stringify(obj, null, 2);
  };

  const renderDetail = (record: UsageRecord) => {
    return (
      <div className="flex h-full flex-col">
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

        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
          <LogDetailSection title="Balance Information">
            <div className="space-y-3">
              <LogDetailItem
                label="Amount"
                value={record.amount.toLocaleString()}
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

            {/* Usage Meter */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="shadow-none">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Consumed
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">
                        {usageMeter.consumed.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      of {usageMeter.granted.toLocaleString()} granted
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-none">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Remaining Balance
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">
                        {usageMeter.remaining.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Available to use
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-none">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Usage Percentage
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="bg-muted h-3 flex-1 overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{
                            width: `${usageMeter.usagePercentage}%`,
                          }}
                        />
                      </div>
                      <span className="text-lg font-bold">
                        {usageMeter.usagePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {usageMeter.granted - usageMeter.consumed > 0
                        ? `${(
                            usageMeter.granted - usageMeter.consumed
                          ).toLocaleString()} remaining`
                        : "Fully consumed"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="shadow-none">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Total Records
                    </p>
                    <p className="text-xl font-bold">
                      {filteredRecords.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-none">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Granted
                    </p>
                    <p className="text-xl font-bold">
                      {
                        filteredRecords.filter((r) => r.status === "granted")
                          .length
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-none">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Consumed
                    </p>
                    <p className="text-xl font-bold">
                      {
                        filteredRecords.filter((r) => r.status === "consumed")
                          .length
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-none">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Revoked
                    </p>
                    <p className="text-xl font-bold">
                      {
                        filteredRecords.filter((r) => r.status === "revoked")
                          .length
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
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
              <Button variant="outline" size="sm" className="gap-2 shadow-none">
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
