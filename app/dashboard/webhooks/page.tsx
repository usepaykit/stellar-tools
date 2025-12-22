"use client";

import { useState } from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import { LineChart } from "@/components/line-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChartConfig } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebHooksModal } from "@/components/webhook/webhooks-modal";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Clock,
  Info,
  Plus,
  Sparkles,
  TrendingUp,
  Webhook,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Webhook destination type definition
type WebhookDestination = {
  id: string;
  name: string;
  url: string;
  status: "active" | "disabled";
  eventCount: number;
  eventsFrom: "account" | "test";
  activity?: number[];
  responseTime?: number[];
  errorRate: number;
};

// Mock webhook destinations data
const mockWebhooks: WebhookDestination[] = [
  {
    id: "1",
    name: "Leadmash_custom",
    url: "https://leadmash-backend-custom.onrender.com/api/stripe/webhook",
    status: "active",
    eventCount: 3,
    eventsFrom: "account",
    activity: [10, 12, 11, 13, 10],
    responseTime: [150, 145, 152, 148, 150],
    errorRate: 0,
  },
  {
    id: "2",
    name: "LM",
    url: "https://leadmash-backend.onrender.com/api/stripe/webhook",
    status: "active",
    eventCount: 3,
    eventsFrom: "account",
    activity: [8, 9, 8, 10, 9],
    responseTime: [200, 195, 205, 198, 200],
    errorRate: 0,
  },
  {
    id: "3",
    name: "N8N Main",
    url: "https://api.leadtechpros.com/webhook/dropleads-stripe",
    status: "active",
    eventCount: 11,
    eventsFrom: "account",
    activity: [25, 30, 22, 28, 35, 20, 32],
    responseTime: [180, 200, 175, 190, 185, 195, 180],
    errorRate: 0,
  },
  {
    id: "4",
    name: "",
    url: "https://app.dropleads.io/api/webhook/stripe",
    status: "disabled",
    eventCount: 6,
    eventsFrom: "account",
    errorRate: 0,
  },
  {
    id: "5",
    name: "",
    url: "https://leadmash.io/index.php?flu...i_notify=1&payment_method=",
    status: "disabled",
    eventCount: 7,
    eventsFrom: "account",
    errorRate: 0,
  },
];

// Status badge component
const StatusBadge = ({ status }: { status: WebhookDestination["status"] }) => {
  return (
    <Badge
      variant={status === "active" ? "default" : "secondary"}
      className={cn(
        status === "active"
          ? "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
          : "bg-muted text-muted-foreground"
      )}
    >
      {status === "active" ? "Active" : "Disabled"}
    </Badge>
  );
};

// Chart configurations
const activityChartConfig: ChartConfig = {
  value: {
    label: "Activity",
    color: "hsl(var(--chart-1))",
  },
};

const responseTimeChartConfig: ChartConfig = {
  value: {
    label: "Response Time",
    color: "hsl(var(--chart-1))",
  },
};

// Transform data array to LineChart format
const transformDataForChart = (data: number[] | undefined) => {
  if (!data || data.length === 0) return null;

  return data.map((value, index) => ({
    index: index.toString(),
    value,
  }));
};

// Activity chart component using LineChart
const ActivityChart = ({ data }: { data?: number[] }) => {
  const chartData = transformDataForChart(data);

  if (!chartData) {
    return (
      <div className="text-muted-foreground flex items-center gap-2">
        <Info className="h-4 w-4" />
        <span className="text-sm">This data is unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex h-12 w-24 items-center justify-center">
      <LineChart
        data={chartData}
        config={activityChartConfig}
        xAxisKey="index"
        activeKey="value"
        color="var(--chart-1)"
        showTooltip={false}
        showXAxis={false}
        className="h-12"
      />
    </div>
  );
};

// Response time chart component using LineChart
const ResponseTimeChart = ({ data }: { data?: number[] }) => {
  const chartData = transformDataForChart(data);

  if (!chartData) {
    return (
      <div className="text-muted-foreground flex items-center gap-2">
        <Info className="h-4 w-4" />
        <span className="text-sm">This data is unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex h-12 w-24 items-center justify-center">
      <LineChart
        data={chartData}
        config={responseTimeChartConfig}
        xAxisKey="index"
        activeKey="value"
        color="var(--chart-1)"
        showTooltip={false}
        showXAxis={false}
        className="h-12"
      />
    </div>
  );
};

// Column definitions
const columns: ColumnDef<WebhookDestination>[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: () => (
      <div className="flex items-center">
        <Webhook className="text-muted-foreground h-4 w-4" />
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "destination",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <button
          className="hover:text-foreground focus-visible:ring-ring -mx-1 flex items-center gap-2 rounded-sm px-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label={`Sort by destination ${isSorted === "asc" ? "descending" : "ascending"}`}
        >
          <span>Destination</span>
          {isSorted === "asc" ? (
            <ArrowUp className="ml-1 h-4 w-4" aria-hidden="true" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-1 h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowUpDown
              className="ml-1 h-4 w-4 opacity-50"
              aria-hidden="true"
            />
          )}
        </button>
      );
    },
    cell: ({ row }) => {
      const webhook = row.original;
      return (
        <div className="flex flex-col gap-1">
          {webhook.name && <div className="font-medium">{webhook.name}</div>}
          <div className="text-muted-foreground font-mono text-sm break-all">
            {webhook.url}
          </div>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "listeningTo",
    header: "Listening to",
    cell: ({ row }) => {
      const webhook = row.original;
      return (
        <div className="flex items-center gap-2">
          <StatusBadge status={webhook.status} />
          <span className="text-muted-foreground text-sm">
            {webhook.eventCount} event{webhook.eventCount !== 1 ? "s" : ""}
          </span>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "eventsFrom",
    header: "Events from",
    cell: ({ row }) => {
      const source = row.original.eventsFrom;
      return (
        <div className="text-muted-foreground text-sm">
          {source === "account" ? "Your account" : "Test"}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "activity",
    header: "Activity",
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <ActivityChart data={row.original.activity} />
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "responseTime",
    header: "Response time",
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <ResponseTimeChart data={row.original.responseTime} />
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "errorRate",
    header: "Error rate",
    cell: ({ row }) => (
      <div className="text-muted-foreground text-sm">
        {row.original.errorRate} %
      </div>
    ),
    enableSorting: false,
  },
];

export default function WebhooksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  // Table actions
  const tableActions: TableAction<WebhookDestination>[] = [
    {
      label: "Edit",
      onClick: (webhook) => {
        console.log("Edit webhook:", webhook.id);
        // Add your edit logic here
      },
    },
    {
      label: "Disable",
      onClick: (webhook) => {
        console.log("Disable webhook:", webhook.id);
        // Add your disable logic here
      },
    },
    {
      label: "Delete",
      onClick: (webhook) => {
        console.log("Delete webhook:", webhook.id);
        // Add your delete logic here
      },
      variant: "destructive",
    },
  ];

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-6 p-4 sm:p-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2">
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    Event destinations
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Send events from Stellar to webhook endpoints and cloud
                    services.
                  </p>
                </div>
                <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add destination</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="webhooks" className="w-full shadow-none">
                <TabsList>
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:shadow-none"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="webhooks"
                    className="data-[state=active]:shadow-none"
                  >
                    Webhooks
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="flex min-h-[500px] flex-col items-center justify-center px-4 py-16">
                    {/* Animated Icon Container */}
                    <div className="relative mb-8">
                      <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-3xl" />
                      <div className="from-primary/10 to-primary/5 border-primary/20 relative flex h-24 w-24 items-center justify-center rounded-2xl border bg-linear-to-br">
                        <BarChart3 className="text-primary h-12 w-12" />
                      </div>
                      <div className="absolute -top-2 -right-2">
                        <Sparkles className="text-primary h-6 w-6 animate-pulse" />
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="max-w-2xl space-y-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <h2 className="from-foreground to-foreground/70 bg-linear-to-r bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                          Webhook Overview
                        </h2>
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary border-primary/20"
                        >
                          Coming Soon
                        </Badge>
                      </div>
                      <p className="text-muted-foreground/80 mx-auto max-w-md text-sm">
                        We&apos;re building a comprehensive overview dashboard
                        that will give you insights into your webhook
                        performance, analytics, and real-time monitoring.
                      </p>
                    </div>

                    {/* Feature Preview Cards */}
                    <div className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="group bg-card/50 hover:bg-card/80 hover:border-primary/20 relative rounded-lg border p-6 backdrop-blur-sm transition-all duration-300">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="bg-primary/10 group-hover:bg-primary/20 rounded-lg p-2 transition-colors">
                            <Activity className="text-primary h-5 w-5" />
                          </div>
                          <h3 className="text-sm font-semibold">
                            Real-time Monitoring
                          </h3>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Track webhook events and responses in real-time
                        </p>
                      </div>

                      <div className="group bg-card/50 hover:bg-card/80 hover:border-primary/20 relative rounded-lg border p-6 backdrop-blur-sm transition-all duration-300">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="bg-primary/10 group-hover:bg-primary/20 rounded-lg p-2 transition-colors">
                            <TrendingUp className="text-primary h-5 w-5" />
                          </div>
                          <h3 className="text-sm font-semibold">
                            Analytics & Insights
                          </h3>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Detailed analytics and performance metrics
                        </p>
                      </div>

                      <div className="group bg-card/50 hover:bg-card/80 hover:border-primary/20 relative rounded-lg border p-6 backdrop-blur-sm transition-all duration-300">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="bg-primary/10 group-hover:bg-primary/20 rounded-lg p-2 transition-colors">
                            <Clock className="text-primary h-5 w-5" />
                          </div>
                          <h3 className="text-sm font-semibold">
                            Historical Data
                          </h3>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          View past events and historical trends
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="webhooks" className="mt-6">
                  <DataTable
                    columns={columns}
                    data={mockWebhooks}
                    enableBulkSelect={true}
                    actions={tableActions}
                    onRowClick={(row) => {
                      router.push(`/dashboard/webhooks/${row.id}`);
                      console.log("Row clicked:", row);
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
      <WebHooksModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
