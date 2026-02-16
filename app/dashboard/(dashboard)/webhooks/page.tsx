"use client";
import * as React from "react";

import { getCurrentOrganization } from "@/actions/organization";
import { getWebhooksWithAnalytics } from "@/actions/webhook";
import { CodeBlock } from "@/components/code-block";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, type TableAction } from "@/components/data-table";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { Curl, TypeScript } from "@/components/icon";
import { LineChart } from "@/components/line-chart";
import { TextAreaField, TextField } from "@/components/text-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartConfig } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { useCopy } from "@/hooks/use-copy";
import { useInvalidateOrgQuery, useOrgContext, useOrgQuery } from "@/hooks/use-org-query";
import { cn, generateResourceId } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiClient, Webhook, type WebhookEvent as WebhookEventType, webhookEvent } from "@stellartools/core";
import { useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Check,
  Copy,
  Info,
  Plus,
  Sparkles,
  Webhook as WebhookIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as RHF from "react-hook-form";
import z from "zod";

const formatEventLabel = (event: string) =>
  event
    .split(".")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const WEBHOOK_EVENTS = webhookEvent.map((id) => ({ id, label: formatEventLabel(id) }));

const getTsExample = (secret: string) => /* ts */ `import { NextRequest, NextResponse } from 'next/server';
import { StellarTools } from '@stellartools/core';

const stellar = new StellarTools({ apiKey: process.env.STELLAR_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('X-StellarTools-Signature');

  const isValid = stellar.webhooks.verifySignature(body, signature, '${secret}');
  if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

  const event = JSON.parse(body);
  // Handle event.type (e.g. 'payment.confirmed')
  return NextResponse.json({ received: true });
}`;

const getCurlExample = (event: string) => /* sh */ `curl -X POST https://your-api.com/webhooks \\
  -H "Content-Type: application/json" \\
  -H "X-StellarTools-Signature: t=1735000000,v1=..." \\
  -d '{
    "id": "evt_123",
    "type": "${event}",
    "data": { "id": "res_123" }
  }'`;

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

const ActivityChart = ({ data }: { data?: number[] }) => {
  const chartData = data?.map((value, index) => ({
    index: index.toString(),
    value,
  }));

  console.log({ chartData });

  if (!chartData?.length) {
    return (
      <div className="text-muted-foreground flex items-center gap-2">
        <Info className="h-4 w-4" />
        <span className="text-sm">No data</span>
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

const StatusBadge = ({ isDisabled }: { isDisabled: boolean }) => {
  return (
    <Badge
      variant={isDisabled ? "secondary" : "default"}
      className={cn(
        isDisabled
          ? "bg-muted text-muted-foreground"
          : "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
      )}
    >
      {isDisabled ? "Disabled" : "Active"}
    </Badge>
  );
};

const columns: ColumnDef<WebhookDestination>[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: () => (
      <div className="flex items-center">
        <WebhookIcon className="text-muted-foreground h-4 w-4" />
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
            <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" aria-hidden="true" />
          )}
        </button>
      );
    },
    cell: ({ row }) => {
      const webhook = row.original;
      return (
        <div className="flex flex-col gap-1">
          {webhook.name && <div className="font-medium">{webhook.name}</div>}
          <div className="text-muted-foreground font-mono text-sm break-all">{webhook.url}</div>
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
      return <div className="text-muted-foreground text-sm">{source === "account" ? "Your account" : "Test"}</div>;
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
    cell: ({ row }) => <div className="text-muted-foreground text-sm">{row.original.errorRate} %</div>,
    enableSorting: false,
  },
];

const api = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL!,
  headers: {},
});

function WebhooksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingWebhook, setEditingWebhook] = React.useState<WebhookDestination | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const invalidateOrgQuery = useInvalidateOrgQuery();
  const { data: webhooks = [], isLoading } = useOrgQuery(["webhooks"], () => getWebhooksWithAnalytics(), {
    select: (data) => {
      return data.map((webhook) => ({
        ...webhook,
        eventCount: webhook.events.length,
        eventsFrom: "account" as const,
        activity: webhook.activityHistory,
        responseTime: webhook.responseTimeHistory,
        errorRate: webhook.errorRate,
      }));
    },
  });

  React.useEffect(() => {
    if (searchParams?.get("create") === "true") {
      setEditingWebhook(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const toggleWebhookDisabledMutation = useMutation({
    mutationFn: async ({ id, isDisabled }: { id: string; isDisabled: boolean }) => {
      const organization = await getCurrentOrganization();
      const result = await api.put(`/webhooks/${id}`, { isDisabled }, { "x-auth-token": organization?.token! });
      if (result.isErr()) throw new Error(result.error.message);
      return result.value;
    },
    onSuccess: (_, { isDisabled }) => {
      invalidateOrgQuery(["webhooks"]);
      toast.success(isDisabled ? "Webhook disabled" : "Webhook enabled");
    },
    onError: () => toast.error("Failed to update webhook"),
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const organization = await getCurrentOrganization();
      return await api.delete<Webhook>(`/webhooks/${id}`, {
        "x-auth-token": organization?.token!,
      });
    },
    onSuccess: () => {
      invalidateOrgQuery(["webhooks"]);
      toast.success("Webhook deleted");
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast.error("Failed to delete webhook");
    },
  });

  const handleModalChange = (open: boolean) => {
    if (!open) setEditingWebhook(null);
    setIsModalOpen(open);
    const params = new URLSearchParams(searchParams?.toString());
    if (open) {
      params.set("create", "true");
    } else {
      params.delete("create");
    }
    router.replace(`${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleEditWebhook = (webhook: WebhookDestination) => {
    setEditingWebhook(webhook);
    setIsModalOpen(true);
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("create");
    const query = params.toString();
    router.replace(`${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  const tableActions: TableAction<WebhookDestination>[] = [
    {
      label: "Edit",
      onClick: handleEditWebhook,
    },
    {
      label: (webhook) => (webhook.isDisabled ? "Enable" : "Disable"),
      onClick: (webhook) => toggleWebhookDisabledMutation.mutate({ id: webhook.id, isDisabled: !webhook.isDisabled }),
    },
    {
      label: "Delete",
      onClick: (webhook) => setDeleteConfirmId(webhook.id),
      variant: "destructive",
    },
  ];

  return (
    <DashboardSidebar>
      <DashboardSidebarInset>
        <div className="mx-auto flex w-full flex-col gap-8 p-6">
          <header className="flex items-start justify-between">
            <div className="grid gap-1">
              <h1 className="text-3xl font-bold tracking-tight">Event destinations</h1>
              <p className="text-muted-foreground">Stream Stellar events to your webhooks and cloud services.</p>
            </div>
            <Button className="gap-2" onClick={() => handleModalChange(true)}>
              <Plus className="size-4" /> Add destination
            </Button>
          </header>

          <Tabs defaultValue="webhooks">
            <TabsList>
              <TabsTrigger value="overview" className="data-[state=active]:shadow-none">
                Overview
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="data-[state=active]:shadow-none">
                Webhooks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="py-12">
              <ComingSoonView />
            </TabsContent>

            <TabsContent value="webhooks" className="pt-4">
              <DataTable
                columns={columns}
                data={webhooks as any}
                isLoading={isLoading}
                onRowClick={(row) => router.push(`/webhooks/${row.id}`)}
                actions={tableActions}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardSidebarInset>
      <WebhooksModal
        open={isModalOpen}
        onOpenChange={handleModalChange}
        editingWebhook={editingWebhook}
        onEditingWebhookChange={setEditingWebhook}
      />

      <FullScreenModal
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Delete webhook?"
        size="small"
        description="This will permanently remove this webhook destination. Events will no longer be sent to this endpoint."
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteConfirmId && deleteWebhookMutation.mutate(deleteConfirmId)}
              disabled={deleteWebhookMutation.isPending}
              isLoading={deleteWebhookMutation.isPending}
            >
              {deleteWebhookMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        }
      >
        <p className="text-muted-foreground text-sm">
          This action cannot be undone. The webhook endpoint will stop receiving events immediately.
        </p>
      </FullScreenModal>
    </DashboardSidebar>
  );
}

export default function WebhooksPage() {
  return (
    <React.Suspense fallback={<div>Loading webhooks...</div>}>
      <WebhooksPageContent />
    </React.Suspense>
  );
}

const schema = z.object({
  destinationName: z.string().min(1, "Destination name is required"),
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
  description: z.string().max(500, "Description must be less than 500 characters").optional().or(z.literal("")),
  events: z
    .array(z.custom<WebhookEventType>((v) => webhookEvent.includes(v as WebhookEventType)))
    .min(1, "Please select at least one event"),
});

interface WebhookDestination extends Pick<Webhook, "id" | "name" | "url" | "isDisabled"> {
  eventCount: number;
  eventsFrom: "account" | "test";
  activity?: number[];
  responseTime?: number[];
  errorRate: number;
  description?: string | null;
  events?: string[];
}
interface WebhooksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingWebhook?: WebhookDestination | null;
  onEditingWebhookChange?: (webhook: WebhookDestination | null) => void;
}

function WebhooksModal({ open, onOpenChange, editingWebhook = null, onEditingWebhookChange }: WebhooksModalProps) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const invalidateOrgQuery = useInvalidateOrgQuery();
  const { data: organization, isLoading } = useOrgContext();
  const [secret, setSecret] = React.useState<string>("");

  React.useEffect(() => {
    if (!open || isLoading) return;
    const webhookSecret = generateResourceId("whsec", organization?.id!, 32, "sha256");
    setSecret(webhookSecret);
  }, [open, organization?.id, isLoading]);

  const { copied, handleCopy } = useCopy();
  const isEditMode = !!editingWebhook;

  const handleCopySecret = async () => {
    if (secret) {
      await handleCopy({
        text: secret,
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
      events: [] as WebhookEventType[],
    },
  });

  const events = form.watch("events");

  // Prefill form when opening for edit; reset when opening for create or when closing
  React.useEffect(() => {
    if (!open) {
      form.reset();
      onEditingWebhookChange?.(null);
      return;
    }
    if (editingWebhook) {
      form.reset({
        destinationName: editingWebhook.name ?? "",
        endpointUrl: editingWebhook.url ?? "",
        description: (editingWebhook.description ?? "") as string,
        events: (editingWebhook.events ?? []) as WebhookEventType[],
      });
    } else {
      form.reset({
        destinationName: "",
        endpointUrl: "",
        description: "",
        events: [],
      });
    }
  }, [open, editingWebhook, form, onEditingWebhookChange]);

  const createWebhookMutation = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      const { destinationName: name, endpointUrl: url, description, events } = data;
      const organization = await getCurrentOrganization();
      const result = await api.post(
        "/webhooks",
        { name, url, description, events, secret },
        { "x-auth-token": organization?.token! }
      );
      if (result.isErr()) throw new Error(result.error.message);
      return result.value;
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

  const updateWebhookMutation = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      if (!editingWebhook) return;
      const organization = await getCurrentOrganization();
      const result = await api.put<Webhook>(
        `/webhooks/${editingWebhook.id}`,
        {
          name: data.destinationName,
          url: data.endpointUrl,
          description: data.description ?? null,
          events: data.events,
        },
        { "x-auth-token": organization?.token! }
      );
      if (result.isErr()) throw new Error(result.error.message);
      return result.value;
    },
    onSuccess: () => {
      invalidateOrgQuery(["webhooks"]);
      toast.success("Webhook destination updated successfully");
      form.reset();
      onOpenChange(false);
      onEditingWebhookChange?.(null);
    },
    onError: () => {
      toast.error("Failed to update webhook destination");
    },
  });

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
    if (isEditMode) {
      updateWebhookMutation.mutate(data);
    } else {
      createWebhookMutation.mutate(data);
    }
  };

  const isPending = createWebhookMutation.isPending || updateWebhookMutation.isPending;

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
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={() => form.handleSubmit(onSubmit)()}
          className="gap-2"
          disabled={isPending}
          isLoading={isPending}
        >
          {isEditMode ? "Save changes" : "Create destination"}
        </Button>
      </div>
    </div>
  );

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? "Edit destination" : "Configure destination"}
      description={
        isEditMode
          ? "Update where StellarTools sends events for this destination."
          : "Tell StellarTools where to send events and give your destination a helpful description."
      }
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
              <Label>Subscription Events</Label>
              <Button
                variant="link"
                size="sm"
                type="button"
                onClick={handleSelectAll}
                className="h-auto p-0 text-[10px] font-bold uppercase"
              >
                {events.length === WEBHOOK_EVENTS.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {WEBHOOK_EVENTS.map((e) => (
                <div key={e.id} className="flex items-center gap-3">
                  <Checkbox
                    id={e.id}
                    checked={events.includes(e.id)}
                    onCheckedChange={(checked) => {
                      const next = checked ? [...events, e.id] : events.filter((id: WebhookEventType) => id !== e.id);
                      form.setValue("events", next);
                    }}
                  />
                  <Label htmlFor={e.id} className="cursor-pointer text-sm font-medium">
                    {e.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </form>
        <aside className="min-w-0 flex-1 space-y-6 lg:max-w-2xl">
          <div className="space-y-2">
            <Label>Signing Secret</Label>
            {isEditMode ? (
              <>
                <div className="bg-muted border-border flex items-center rounded-md border p-3 shadow-none">
                  <span className="text-muted-foreground text-sm italic">Secret is hidden for security</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  The webhook secret cannot be viewed or changed after creation. Use your existing secret to verify
                  signatures.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="bg-muted border-border flex-1 rounded-md border p-3 shadow-none">
                    <code className="font-mono text-sm break-all">{secret}</code>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopySecret}
                    className="shrink-0 shadow-none"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  Use this secret to verify signatures. Never expose this in client-side code.
                </p>
              </>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold tracking-tight">Implementation Guide</h4>
            <Tabs defaultValue="ts">
              <TabsList className="bg-muted/50 border-none p-1">
                <TabsTrigger value="ts" className="gap-2 px-4 py-1.5">
                  <TypeScript className="size-3" /> TypeScript
                </TabsTrigger>
                <TabsTrigger value="curl" className="gap-2 px-4 py-1.5">
                  <Curl className="size-3" /> cURL
                </TabsTrigger>
              </TabsList>
              <TabsContent value="ts" className="pt-2">
                <CodeBlock language="typescript" filename="api/webhook/route.ts" maxHeight="400px">
                  {getTsExample(secret)}
                </CodeBlock>
              </TabsContent>
              <TabsContent value="curl" className="pt-2">
                <CodeBlock language="bash" maxHeight="400px">
                  {getCurlExample(events[0] || "payment.confirmed")}
                </CodeBlock>
              </TabsContent>
            </Tabs>
          </div>
        </aside>
      </div>
    </FullScreenModal>
  );
}

function ComingSoonView() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-20 text-center">
      <div className="relative">
        <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-3xl" />
        <div className="from-primary/20 border-primary/20 relative flex size-24 items-center justify-center rounded-3xl border bg-linear-to-br to-transparent">
          <BarChart3 className="text-primary size-12" />
        </div>
        <div className="absolute -top-2 -right-2">
          <Sparkles className="text-primary size-6 animate-pulse" />
        </div>
      </div>
      <div className="max-w-sm space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <p className="text-muted-foreground text-sm leading-relaxed font-medium">
          We’re building real-time monitoring to track your delivery rates, latencies, and payload health.
        </p>
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary border-none text-[10px] font-bold tracking-widest uppercase"
        >
          In Development
        </Badge>
      </div>
    </div>
  );
}
