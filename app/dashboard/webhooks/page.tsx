"use client";

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
  Link2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

// Activity chart component (simple visualization)
const ActivityChart = ({ data }: { data?: number[] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Info className="h-4 w-4" />
        <span className="text-sm">This data is unavailable</span>
      </div>
    );
  }

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  return (
    <div className="flex items-center gap-0.5 h-6 w-20">
      {data.map((value, index) => {
        const height = ((value - minValue) / range) * 100;
        return (
          <div
            key={index}
            className="flex-1 bg-primary rounded-sm"
            style={{ height: `${Math.max(height, 10)}%` }}
            aria-hidden="true"
          />
        );
      })}
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
        <Link2 className="h-4 w-4 text-muted-foreground" />
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
    cell: ({ row }) => <ActivityChart data={row.original.activity} />,
    enableSorting: false,
  },
  {
    accessorKey: "responseTime",
    header: "Response time",
    cell: ({ row }) => <ActivityChart data={row.original.responseTime} />,
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
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add destination</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="w-full shadow-none">
                <TabsList >
                  <TabsTrigger value="overview" className='data-[state=active]:shadow-none'>Overview</TabsTrigger>
                  <TabsTrigger value="webhooks" className='data-[state=active]:shadow-none'>Webhooks</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Overview content will be displayed here.
                    </p>
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
    </div>
  );
}
