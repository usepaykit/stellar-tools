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
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  RefreshCw,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCopy } from "@/hooks/use-copy";

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

const StatusBadge = ({
  status,
  statusCode,
  nextRetry,
}: {
  status: WebhookLogStatus;
  statusCode?: number;
  nextRetry?: string;
}) => {
  if (status === "succeeded" && statusCode === 200) {
    return (
      <Badge
        variant="outline"
        className="w-[90px] justify-center gap-1.5 border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
      >
        <CheckCircle2 className="h-3 w-3" />
        200 OK
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="w-[90px] justify-center gap-1.5 border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
    >
      {nextRetry ? (
        <Clock className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      Failed
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

const columns: ColumnDef<WebhookLog>[] = [
  {
    accessorKey: "status",
    header: () => null,
    cell: ({ row }) => {
      const log = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <StatusBadge
              status={log.status}
              statusCode={log.statusCode}
              nextRetry={log.nextRetry}
            />
          </div>
          <span className="text-sm font-medium">{log.eventType}</span>
        </div>
      );
    },
    size: 1000,
  },
  {
    accessorKey: "timestamp",
    header: () => null,
    cell: ({ row }) => {
      const log = row.original;
      return (
        <div className="text-right whitespace-nowrap">
          <span className="text-muted-foreground text-sm">
            {log.timestamp.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}
          </span>
        </div>
      );
    },
    size: 150,
  },
];

// --- Main Component ---

export default function WebhookLogPage() {
  const [searchQuery, _] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

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

  const renderDetail = (log: WebhookLog) => {
    return (
      <div className="flex h-full flex-col">
        <div className="border-border mb-4 flex items-start justify-between border-b pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Delivery attempt</h3>
            <p className="text-muted-foreground text-sm">{log.eventType}</p>
          </div>
          <Button size="sm">Resend</Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
          <LogDetailSection title="Delivery status">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm font-medium">Delivery status</span>
                <div className="flex shrink-0 items-center gap-2">
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
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
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

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <LogDetailItem
                    label="Event ID"
                    value={
                      <Link href="#" className="text-primary hover:underline">
                        {log.eventId}
                      </Link>
                    }
                  />
                </div>
                <div className="flex items-center pt-4">
                  <CopyButton text={log.eventId} label="Copy event ID" />
                </div>
              </div>

              <LogDetailItem
                label="Origin date"
                value={
                  log.originDate.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }) + " IST"
                }
              />

              <LogDetailItem label="Source" value={log.source} />
              <LogDetailItem label="API version" value={log.apiVersion} />
              <LogDetailItem label="Description" value={log.description} />
            </div>
          </LogDetailSection>

          <LogDetailSection title="Response">
            {log.response ? (
              <CodeBlock
                language="json"
                showCopyButton={true}
                maxHeight="200px"
              >
                {typeof log.response === "string"
                  ? log.response
                  : JSON.stringify(log.response, null, 2)}
              </CodeBlock>
            ) : (
              <p className="text-muted-foreground text-sm">No data</p>
            )}
          </LogDetailSection>

          <LogDetailSection title="Request">
            <CodeBlock language="json" showCopyButton={true} maxHeight="400px">
              {JSON.stringify(log.request, null, 2)}
            </CodeBlock>
          </LogDetailSection>
        </div>

        <div className="border-border mt-4 border-t pt-4">
          <p className="text-muted-foreground text-center text-xs">
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
                <h1 className="text-3xl font-bold tracking-tight">Today</h1>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <UnderlineTabs
                value={statusFilter}
                onValueChange={setStatusFilter}
                className="w-auto"
              >
                <UnderlineTabsList>
                  <UnderlineTabsTrigger value="all">All</UnderlineTabsTrigger>
                  <UnderlineTabsTrigger value="succeeded">
                    Succeeded
                  </UnderlineTabsTrigger>
                  <UnderlineTabsTrigger value="failed">
                    Failed
                  </UnderlineTabsTrigger>
                </UnderlineTabsList>
              </UnderlineTabs>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            <div className="text-muted-foreground flex items-center justify-end text-sm">
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
            </div>

            <div className="h-[calc(100vh-400px)] min-h-[600px]">
              <LogPicker
                data={filteredLogs}
                columns={columns}
                renderDetail={renderDetail}
                detailPanelWidth={500}
                emptyMessage="No logs found"
                className="h-full"
              />
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
    </div>
  );
}
