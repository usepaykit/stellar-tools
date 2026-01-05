"use client";

import * as React from "react";

import { getWebhooksWithAnalytics, postWebhook } from "@/actions/webhook";
import { CodeBlock } from "@/components/code-block";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { Curl, TypeScript } from "@/components/icon";
import { TextAreaField, TextField } from "@/components/input-picker";
import { LineChart } from "@/components/line-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChartConfig } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { Webhook as WebhookSchema } from "@/db";
import { useCopy } from "@/hooks/use-copy";
import { useInvalidateOrgQuery, useOrgQuery } from "@/hooks/use-org-query";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { WebhookEvent } from "@stellartools/core";
import { useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Check,
  Clock,
  Copy,
  Info,
  Plus,
  Sparkles,
  TrendingUp,
  Webhook,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useRouter, useSearchParams } from "next/navigation";
import * as RHF from "react-hook-form";
import { z } from "zod";

interface WebhookDestination extends Pick<
  WebhookSchema,
  "id" | "name" | "url" | "isDisabled"
> {
  eventCount: number;
  eventsFrom: "account" | "test";
  activity?: number[];
  responseTime?: number[];
  errorRate: number;
}

const StatusBadge = ({ isDisabled }: { isDisabled: boolean }) => {
  return (
    <Badge
      variant={isDisabled ? "secondary" : "default"}
      className={cn(
        isDisabled
          ? "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
          : "bg-muted text-muted-foreground"
      )}
    >
      {isDisabled ? "Disabled" : "Active"}
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

const ActivityChart = ({ data }: { data?: number[] }) => {
  const chartData = data?.map((value, index) => ({
    index: index.toString(),
    value,
  }));

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

const ResponseTimeChart = ({ data }: { data?: number[] }) => {
  const chartData = data?.map((value, index) => ({
    index: index.toString(),
    value,
  }));

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
          <StatusBadge isDisabled={webhook.isDisabled} />
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

function WebhooksPageContent() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: webhooks = [], isLoading } = useOrgQuery(
    ["webhooks"],
    () => getWebhooksWithAnalytics(),
    {
      select: (webhooksData) => {
        return webhooksData.map((webhook) => ({
          ...webhook,
          logsCount: webhook.logsCount,
          eventsFrom: "account" as const,
          eventCount: webhook.events.length,
          errorRate: 0,
          activity: [],
        }));
      },
    }
  );

  React.useEffect(() => {
    if (searchParams.get("create") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const handleModalChange = (open: boolean) => {
    setIsModalOpen(open);
    const params = new URLSearchParams(searchParams.toString());
    if (open) {
      params.set("create", "true");
    } else {
      params.delete("create");
    }
    router.replace(
      `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`
    );
  };

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
                <Button
                  className="gap-2"
                  onClick={() => handleModalChange(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add destination</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>

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
                    <div className="relative mb-8">
                      <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-3xl" />
                      <div className="from-primary/10 to-primary/5 border-primary/20 relative flex h-24 w-24 items-center justify-center rounded-2xl border bg-linear-to-br">
                        <BarChart3 className="text-primary h-12 w-12" />
                      </div>
                      <div className="absolute -top-2 -right-2">
                        <Sparkles className="text-primary h-6 w-6 animate-pulse" />
                      </div>
                    </div>

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
                        We’re building a comprehensive overview dashboard that
                        will give you insights into your webhook performance,
                        analytics, and real-time monitoring.
                      </p>
                    </div>

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
                    data={webhooks}
                    enableBulkSelect={true}
                    actions={tableActions}
                    isLoading={isLoading}
                    skeletonRowCount={5}
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

      <WebooksModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}

export default function WebhooksPage() {
  return (
    <React.Suspense fallback={<div>Loading webhooks...</div>}>
      <WebhooksPageContent />
    </React.Suspense>
  );
}

const WEBHOOK_SECRET = `whsec_${nanoid(32)}`;

const WEBHOOK_TYPESCRIPT_EXAMPLE = /* ts */ `import { NextRequest, NextResponse } from 'next/server';
import { StellarTools } from '@stellartools/core';

const stellar = new StellarTools({
  apiKey: process.env.STELLAR_API_KEY!,
  debug: false,
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stellar-signature');

  if (!signature) {
    return NextResponse.json( { error: 'Missing signature' }, { status: 401 });
  }

  // Verify webhook signature
  const isValid = stellar.webhook.verifySignature(
    body,
    signature,
    '${WEBHOOK_SECRET}'
  );

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  // Handle different event types
  switch (event.type) {
    case 'customer.created':
      await handleCustomerCreated(event.data);
      break;
    case 'customer.updated':
      await handleCustomerUpdated(event.data);
      break;
    case 'customer.deleted':
      await handleCustomerDeleted(event.data);
      break;
    case 'checkout.created':
      await handleCheckoutCreated(event.data);
      break;
    case 'payment.pending':
      await handlePaymentPending(event.data);
      break;
    case 'payment.confirmed':
      await handlePaymentConfirmed(event.data);
      break;
    case 'payment.failed':
      await handlePaymentFailed(event.data);
      break;
    case 'refund.created':
      await handleRefundCreated(event.data);
      break;
    case 'refund.succeeded':
      await handleRefundSucceeded(event.data);
      break;
    case 'refund.failed':
      await handleRefundFailed(event.data);
      break;
    default:
      console.log('Unhandled event:', event.type);
  }

  return NextResponse.json({ received: true });
}
`;

const WEBHOOK_CURL_EXAMPLE = /* sh */ `
curl -X POST https://your-domain.com/api/webhooks \\
  -H "Content-Type: application/json" \\
  -H "stellar-signature: t=1735000000,v1=abc123..." \\
  -d '{
    "id": "evt_123",
    "type": "payment.confirmed",
    "created": 1735000000,
    "data": {
      "id": "pay_123",
      "amount": 100,
      "assetCode": "USDC",
      "status": "confirmed",
      "transactionHash": "abc123...",
      "customerId": "cus_123"
    }
  }'

# Available webhook events:
# - customer.created
# - customer.updated
# - customer.deleted
# - checkout.created
# - payment.pending
# - payment.confirmed
# - payment.failed
# - refund.created
# - refund.succeeded
# - refund.failed
`;

const schema = z.object({
  destinationName: z.string().regex(/^[a-z0-9-]+$/),
  endpointUrl: z.url().refine(
    (url) => {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === "https:";
      } catch {
        return false;
      }
    },
    {
      message: "Endpoint URL must use HTTPS protocol",
    }
  ),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  events: z.array(z.string()).min(1, "Please select at least one event"),
});

const WEBHOOK_EVENTS = [
  { id: "customer.created", label: "Customer Created" },
  { id: "customer.updated", label: "Customer Updated" },
  { id: "customer.deleted", label: "Customer Deleted" },
  { id: "checkout.created", label: "Checkout Created" },
  { id: "payment.pending", label: "Payment Pending" },
  { id: "payment.confirmed", label: "Payment Confirmed" },
  { id: "payment.failed", label: "Payment Failed" },
  { id: "refund.created", label: "Refund Created" },
  { id: "refund.succeeded", label: "Refund Succeeded" },
  { id: "refund.failed", label: "Refund Failed" },
] as const satisfies { id: WebhookEvent[number]; label: string }[];

interface WebhooksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function WebooksModal({ open, onOpenChange }: WebhooksModalProps) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const invalidateOrgQuery = useInvalidateOrgQuery();
  const [webhookSecret, setWebhookSecret] = React.useState<string>("");
  const { copied, handleCopy } = useCopy();

  // Generate webhook secret when modal opens
  React.useEffect(() => {
    if (open) {
      const secret = `whsec_${nanoid(32)}`;
      setWebhookSecret(secret);
    }
  }, [open]);

  const handleCopySecret = async () => {
    if (webhookSecret) {
      await handleCopy({
        text: webhookSecret,
        message: "Webhook secret copied to clipboard",
      });
    }
  };

  const form = RHF.useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      destinationName: "",
      endpointUrl: "",
      description: "",
      events: [] as string[],
    },
  });

  const events = form.watch("events");

  // Create webhook mutation
  const createWebhookMutation = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      return await postWebhook(undefined, undefined, {
        name: data.destinationName,
        url: data.endpointUrl,
        description: data.description ?? null,
        events: data.events as WebhookEvent[],
        isDisabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        secret: webhookSecret,
      });
    },
    onSuccess: () => {
      invalidateOrgQuery(["webhooks"]);
      toast.success("Webhook destination created successfully");
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to create webhook destination");
    },
  });

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleSelectAll = () => {
    if (events.length === WEBHOOK_EVENTS.length) {
      form.setValue("events", []);
    } else {
      form.setValue(
        "events",
        WEBHOOK_EVENTS.map((e) => e.id)
      );
    }
  };

  const onSubmit = async (data: z.infer<typeof schema>) => {
    createWebhookMutation.mutate(data);
  };

  const footer = (
    <div className="flex w-full justify-between">
      <Button
        type="button"
        variant="ghost"
        onClick={() => onOpenChange(false)}
        className="text-muted-foreground hover:text-foreground"
      >
        Cancel
      </Button>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={() => form.handleSubmit(onSubmit)()}
          className="gap-2"
          disabled={createWebhookMutation.isPending}
          isLoading={createWebhookMutation.isPending}
        >
          Create destination
        </Button>
      </div>
    </div>
  );

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title="Configure destination"
      description="Tell StellarTools where to send events and give your destination a helpful description."
      footer={footer}
      dialogClassName="flex"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <form
          ref={formRef}
          id="webhook-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="min-w-0 flex-1 space-y-6"
        >
          <RHF.Controller
            control={form.control}
            name="destinationName"
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                id="destination-name"
                label="Destination name"
                className="shadow-none"
                error={error?.message}
              />
            )}
          />

          <RHF.Controller
            control={form.control}
            name="endpointUrl"
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                id="endpoint-url"
                label="Endpoint URL"
                className="shadow-none"
                error={error?.message}
              />
            )}
          />

          <RHF.Controller
            control={form.control}
            name="description"
            render={({ field, fieldState: { error } }) => (
              <TextAreaField
                {...field}
                value={field.value as string}
                id="description"
                label="Description"
                error={error?.message}
                className="shadow-none"
              />
            )}
          />

          {/* Events Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Select Events</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-auto px-2 py-1 text-xs shadow-none"
              >
                {events.length === WEBHOOK_EVENTS.length
                  ? "Deselect all"
                  : "Select all"}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Choose which events this webhook should listen to.
            </p>
            <RHF.Controller
              control={form.control}
              name="events"
              render={({ field, fieldState: { error } }) => (
                <div className="space-y-2">
                  <div className="flex flex-col gap-3">
                    {WEBHOOK_EVENTS.map((event) => (
                      <div key={event.id} className="flex items-center gap-2">
                        <Checkbox
                          id={event.id}
                          checked={field.value.includes(event.id)}
                          onCheckedChange={(checked) => {
                            const newValue = checked
                              ? [...field.value, event.id]
                              : field.value.filter(
                                  (id: string) => id !== event.id
                                );
                            field.onChange(newValue);
                          }}
                        />
                        <Label
                          htmlFor={event.id}
                          className="cursor-pointer text-sm font-medium"
                        >
                          {event.label}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {error?.message && (
                    <p className="text-destructive text-sm" role="alert">
                      {error.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </form>
        <div className="min-w-0 flex-1 space-y-6 lg:max-w-2xl">
          <div className="space-y-2">
            <Label>Webhook Secret</Label>
            <div className="flex items-center gap-2">
              <div className="bg-muted border-border flex-1 rounded-md border p-3 shadow-none">
                <code className="font-mono text-sm break-all">
                  {webhookSecret}
                </code>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopySecret}
                className="shrink-0 shadow-none"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Use this secret to verify webhook signatures. Keep it secure and
              never expose it in client-side code.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Code Examples</h3>
            <p className="text-muted-foreground text-sm">
              Here are examples of how to handle webhook events in your
              application.
            </p>
          </div>

          <Tabs defaultValue="typescript" className="w-full">
            <TabsList className="w-fit">
              <TabsTrigger
                value="typescript"
                className="min-w-[120px] px-4 py-2 data-[state=active]:shadow-none"
              >
                <TypeScript className="h-4 w-4" />
                TypeScript
              </TabsTrigger>
              <TabsTrigger
                value="curl"
                className="min-w-[120px] px-4 py-2 data-[state=active]:shadow-none"
              >
                <Curl className="h-4 w-4" />
                cURL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="typescript" className="mt-4">
              <div className="space-y-2">
                <Label>TypeScript Example</Label>
                <CodeBlock
                  language="typescript"
                  filename="app/api/webhooks/route.ts"
                  maxHeight="400px"
                >
                  {WEBHOOK_TYPESCRIPT_EXAMPLE}
                </CodeBlock>
              </div>
            </TabsContent>

            <TabsContent value="curl" className="mt-4">
              <div className="space-y-2">
                <Label>cURL Example</Label>
                <CodeBlock language="bash" maxHeight="400px">
                  {WEBHOOK_CURL_EXAMPLE}
                </CodeBlock>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </FullScreenModal>
  );
}
