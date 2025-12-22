"use client";

import * as React from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { CodeBlock } from "@/components/code-block";
import {
  LogDetailItem,
  LogDetailSection,
  LogPicker,
} from "@/components/log-picker";
import { UnderlineTabs } from "@/components/underline-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  CheckCircle2,
  ChevronRight,
  Copy,
  RefreshCw,

  XCircle,
} from "lucide-react";
import Link from "next/link";



type WebhookLogStatus = "failed" | "succeeded";

type WebhookLog = {
  id: string;
  eventType: string;
  status: WebhookLogStatus;
  statusCode?: number;
  timestamp: Date;
  eventId: string;
  originDate: Date;
  source: string;
  apiVersion: string;
  description: string;
  response?: string;
  request: object;
  nextRetry?: string;
};


const mockWebhookLogs: WebhookLog[] = [
  {
    id: "log_1",
    eventType: "checkout.session.completed",
    status: "failed",
    statusCode: 500,
    timestamp: new Date("2024-12-22T23:56:53"),
    eventId: "evt_1ShCrASF0MtsiMvy7jNESOSz",
    originDate: new Date("2024-12-22T22:55:37"),
    source: "Automatic",
    apiVersion: "2024-11-20.acacia",
    description: "A Checkout Session was completed",
    response: undefined,
    nextRetry: "118 minutes",
    request: {
      id: "evt_1ShCrASF0MtsiMvy7jNESOSz",
      object: "event",
      api_version: "2024-11-20.acacia",
      created: 1766424316,
      data: {
        object: {
          id: "cs_live_b1GEl4Fou7z3jIF5yGf2AI6railZLHRL9r8YpS1IyUvuGUnkQyhNvwFf3C",
          object: "checkout.session",
          adaptive_pricing: { enabled: false },
          after_expiration: null,
          allow_promotion_codes: true,
          amount_subtotal: 834,
          amount_total: 0,
          automatic_tax: { enabled: false, liability: null, provider: null },
        },
      },
    },
  },
  {
    id: "log_2",
    eventType: "payment_intent.succeeded",
    status: "succeeded",
    statusCode: 200,
    timestamp: new Date("2024-12-22T23:19:46"),
    eventId: "evt_1ShCrBSF0MtsiMvy7jNESOSz",
    originDate: new Date("2024-12-22T23:19:46"),
    source: "Automatic",
    apiVersion: "2024-11-20.acacia",
    description: "A Payment Intent succeeded",
    response: "Success",
    request: {
      id: "evt_1ShCrBSF0MtsiMvy7jNESOSz",
      object: "event",
      api_version: "2024-11-20.acacia",
      created: 1766422786,
      data: {
        object: {
          id: "pi_1ShCrBSF0MtsiMvy7jNESOSz",
          object: "payment_intent",
          amount: 834,
          currency: "usd",
        },
      },
    },
  },
  {
    id: "log_3",
    eventType: "payment_intent.payment_failed",
    status: "succeeded",
    statusCode: 200,
    timestamp: new Date("2024-12-22T22:45:12"),
    eventId: "evt_1ShCrCSF0MtsiMvy7jNESOSz",
    originDate: new Date("2024-12-22T22:45:12"),
    source: "Automatic",
    apiVersion: "2024-11-20.acacia",
    description: "A Payment Intent payment failed",
    response: "Success",
    request: {
      id: "evt_1ShCrCSF0MtsiMvy7jNESOSz",
      object: "event",
      api_version: "2024-11-20.acacia",
      created: 1766420712,
      data: {
        object: {
          id: "pi_1ShCrCSF0MtsiMvy7jNESOSz",
          object: "payment_intent",
          amount: 500,
          currency: "usd",
        },
      },
    },
  },
  {
    id: "log_4",
    eventType: "checkout.session.completed",
    status: "failed",
    statusCode: 503,
    timestamp: new Date("2024-12-22T22:30:25"),
    eventId: "evt_1ShCrDSF0MtsiMvy7jNESOSz",
    originDate: new Date("2024-12-22T22:30:25"),
    source: "Automatic",
    apiVersion: "2024-11-20.acacia",
    description: "A Checkout Session was completed",
    response: undefined,
    nextRetry: "45 minutes",
    request: {
      id: "evt_1ShCrDSF0MtsiMvy7jNESOSz",
      object: "event",
      api_version: "2024-11-20.acacia",
      created: 1766419825,
      data: {
        object: {
          id: "cs_live_a2GEl4Fou7z3jIF5yGf2AI6railZLHRL9r8YpS1IyUvuGUnkQyhNvwFf3C",
          object: "checkout.session",
          amount_subtotal: 1200,
          amount_total: 1200,
        },
      },
    },
  },
  {
    id: "log_5",
    eventType: "payment_intent.succeeded",
    status: "succeeded",
    statusCode: 200,
    timestamp: new Date("2024-12-22T21:15:30"),
    eventId: "evt_1ShCrESF0MtsiMvy7jNESOSz",
    originDate: new Date("2024-12-22T21:15:30"),
    source: "Automatic",
    apiVersion: "2024-11-20.acacia",
    description: "A Payment Intent succeeded",
    response: "Success",
    request: {
      id: "evt_1ShCrESF0MtsiMvy7jNESOSz",
      object: "event",
      api_version: "2024-11-20.acacia",
      created: 1766415330,
      data: {
        object: {
          id: "pi_1ShCrESF0MtsiMvy7jNESOSz",
          object: "payment_intent",
          amount: 2500,
          currency: "usd",
        },
      },
    },
  },
];


const StatusBadge = ({ status, statusCode }: { status: WebhookLogStatus; statusCode?: number }) => {
  if (status === "succeeded" && statusCode === 200) {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
      >
        <CheckCircle2 className="h-3 w-3" />
        200 OK
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1.5 border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
    >
      <XCircle className="h-3 w-3" />
      Failed
    </Badge>
  );
};


const CopyButton = ({ text, label }: { text: string; label?: string }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="h-8 w-8"
      onClick={handleCopy}
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


const columns: ColumnDef<WebhookLog>[] = [
  {
    accessorKey: "status",
    header: () => null,
    cell: ({ row }) => {
      const log = row.original;
      return (
        <div className="flex items-center gap-3">
          <StatusBadge status={log.status} statusCode={log.statusCode} />
          <div className="flex flex-col">
            <span className="font-medium text-sm">{log.eventType}</span>
            <span className="text-xs text-muted-foreground">
              {log.timestamp.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        </div>
      );
    },
  },
];

// --- Main Component ---

export default function WebhookLogPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Filter logs based on search and status 
  const filteredLogs = React.useMemo(() => {
    let logs = mockWebhookLogs;

    if (searchQuery) {
      logs = logs.filter(
        (log) =>
          log.eventId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.eventType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== "all") {
      logs = logs.filter((log) => log.status === statusFilter);
    }

    return logs;
  }, [searchQuery, statusFilter]);

  const formatJSON = (obj: object) => {
    return JSON.stringify(obj, null, 2);
  };

  const renderDetail = (log: WebhookLog) => {
    return (
      <div className="flex h-full flex-col">
        {/* Header with Resend Button */}
        <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Delivery attempt</h3>
            <p className="text-sm text-muted-foreground">{log.eventType}</p>
          </div>
          <Button size="sm">
            Resend
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">

        {/* Delivery Status Section */}
        <LogDetailSection title="Delivery status">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Delivery status</span>
              <div className="flex items-center gap-2">
                {log.status === "failed" ? (
                  <Badge
                    variant="outline"
                    className="border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
                  >
                    Failed
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
                  >
                    Succeeded
                  </Badge>
                )}
                {log.nextRetry && (
                  <span className="text-xs text-muted-foreground">
                    Next retry in {log.nextRetry}
                  </span>
                )}
              </div>
            </div>

            <LogDetailItem
              label="Attempt date"
              value={log.timestamp.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            />

            <div className="flex items-center justify-between">
              <LogDetailItem
                label="Event ID"
                value={
                  <Link
                    href="#"
                    className="text-primary hover:underline"
                  >
                    {log.eventId}
                  </Link>
                }
              />
              <CopyButton text={log.eventId} label="Copy event ID" />
            </div>

            <LogDetailItem
              label="Origin date"
              value={log.originDate.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }) + " IST"}
            />

            <LogDetailItem label="Source" value={log.source} />
            <LogDetailItem label="API version" value={log.apiVersion} />
            <LogDetailItem label="Description" value={log.description} />
          </div>
        </LogDetailSection>

        {/* Response Section */}
        <LogDetailSection title="Response">
          {log.response ? (
            <CodeBlock
              language="json"
              showCopyButton={true}
              maxHeight="200px"
            >
              {typeof log.response === "string"
                ? log.response
                : formatJSON(log.response)}
            </CodeBlock>
          ) : (
            <p className="text-sm text-muted-foreground">No data</p>
          )}
        </LogDetailSection>

        <LogDetailSection title="Request">
          <CodeBlock
            language="json"
            showCopyButton={true}
            maxHeight="400px"
          >
            {formatJSON(log.request)}
          </CodeBlock>
        </LogDetailSection>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Resent automatically
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-6 p-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard/webhooks">Webhooks</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>Logs</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Webhook Logs</h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  View delivery attempts and event details
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center justify-between gap-4">
              {/* @ts-expect-error - MixinProps type definition issue, component works correctly */}
              <UnderlineTabs
                value={statusFilter}
                onValueChange={setStatusFilter}
                className="w-auto"
              >
                <UnderlineTabs.List>
                  <UnderlineTabs.Trigger value="all">All</UnderlineTabs.Trigger>
                  <UnderlineTabs.Trigger value="succeeded">Succeeded</UnderlineTabs.Trigger>
                  <UnderlineTabs.Trigger value="failed">Failed</UnderlineTabs.Trigger>
                </UnderlineTabs.List>
              </UnderlineTabs>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {/* Update Info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
    <div>
                Updated today{" "}
                {new Date().toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}{" "}
                IST
              </div>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-sm">
                Show new events
              </Button>
            </div>

            {/* Log Picker */}
            <div className="h-[calc(100vh-400px)] min-h-[600px]">
              <LogPicker
                data={filteredLogs}
                columns={columns}
                renderDetail={renderDetail}
                detailPanelWidth={500}
                emptyMessage="No webhook logs found"
                className="h-full"
              />
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
    </div>
  );
}
