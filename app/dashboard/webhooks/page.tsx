"use client";

import { useState } from "react";
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardSidebarInset } from '@/components/dashboard/app-sidebar-inset';
import { DataTable, TableAction } from '@/components/data-table';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Webhook,
  Info,
  BarChart3,
  TrendingUp,
  Activity,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart } from "@/components/line-chart";
import type { ChartConfig } from "@/components/ui/chart";
import { WebHooksModal } from "@/components/webhook/webhooks-modal";

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
          ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
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
      <div className="flex items-center gap-2 text-muted-foreground">
        <Info className="h-4 w-4" />
        <span className="text-sm">This data is unavailable</span>
      </div>
    );
  }

  return (
    <div className="w-24 h-12 flex items-center justify-center">
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
      <div className="flex items-center gap-2 text-muted-foreground">
        <Info className="h-4 w-4" />
        <span className="text-sm">This data is unavailable</span>
      </div>
    );
  }

  return (
    <div className="w-24 h-12 flex items-center justify-center">
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
        <Webhook className="h-4 w-4 text-muted-foreground" />

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
          className="flex items-center gap-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-1 -mx-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label={`Sort by destination ${isSorted === "asc" ? "descending" : "ascending"}`}
        >
          <span>Destination</span>
          {isSorted === "asc" ? (
            <ArrowUp className="ml-1 h-4 w-4" aria-hidden="true" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-1 h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" aria-hidden="true" />
          )}
        </button>
      );
    },
    cell: ({ row }) => {
      const webhook = row.original;
      return (
        <div className="flex flex-col gap-1">
          {webhook.name && (
            <div className="font-medium">{webhook.name}</div>
          )}
          <div className="text-sm text-muted-foreground font-mono break-all">
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
          <span className="text-sm text-muted-foreground">
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
        <div className="text-sm text-muted-foreground">
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
      <div className="text-sm text-muted-foreground">
        {row.original.errorRate} %
      </div>
    ),
    enableSorting: false,
  },
];

export default function WebhooksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
                  <h1 className="text-2xl sm:text-3xl font-bold">Event destinations</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Send events from Stellar to webhook endpoints and cloud services.
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
                <TabsList >
                  <TabsTrigger value="overview" className='data-[state=active]:shadow-none'>Overview</TabsTrigger>
                  <TabsTrigger value="webhooks" className='data-[state=active]:shadow-none'>Webhooks</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="flex flex-col items-center justify-center min-h-[500px] py-16 px-4">
                    {/* Animated Icon Container */}
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                      <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                        <BarChart3 className="w-12 h-12 text-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2">
                        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="text-center max-w-2xl space-y-4">
                      <div className="flex items-center justify-center gap-3">
                        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                          Webhook Overview
                        </h2>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          Coming Soon
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground/80 max-w-md mx-auto">
                        We&apos;re building a comprehensive overview dashboard that will give you insights into your webhook performance, analytics, and real-time monitoring.
                      </p>
                    </div>

                    {/* Feature Preview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full max-w-4xl">
                      <div className="group relative p-6 rounded-lg border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:border-primary/20">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Activity className="w-5 h-5 text-primary" />
                          </div>
                          <h3 className="font-semibold text-sm">Real-time Monitoring</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Track webhook events and responses in real-time
                        </p>
                      </div>

                      <div className="group relative p-6 rounded-lg border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:border-primary/20 ">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <TrendingUp className="w-5 h-5 text-primary" />
                          </div>
                          <h3 className="font-semibold text-sm">Analytics & Insights</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Detailed analytics and performance metrics
                        </p>
                      </div>

                      <div className="group relative p-6 rounded-lg border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:border-primary/20">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Clock className="w-5 h-5 text-primary" />
                          </div>
                          <h3 className="font-semibold text-sm">Historical Data</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
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
