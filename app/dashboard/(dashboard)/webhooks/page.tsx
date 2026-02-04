"use client";

import * as React from "react";

import { getWebhooksWithAnalytics, postWebhook } from "@/actions/webhook";
import { CodeBlock } from "@/components/code-block";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable } from "@/components/data-table";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { Curl, TypeScript } from "@/components/icon";
import { TextAreaField, TextField } from "@/components/text-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { useCopy } from "@/hooks/use-copy";
import { useInvalidateOrgQuery, useOrgContext, useOrgQuery } from "@/hooks/use-org-query";
import { cn, generateResourceId } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { z as Schema, Webhook, webhookEvent } from "@stellartools/core";
import { useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { BarChart3, Copy, Info, Plus, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as RHF from "react-hook-form";

const formatEventLabel = (event: string) =>
  event
    .split(".")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const WEBHOOK_EVENTS = webhookEvent.map((id) => ({ id, label: formatEventLabel(id) }));

const schema = Schema.object({
  name: Schema.string().min(1, "Name is required"),
  url: Schema.url().refine((u) => u.startsWith("https:"), "Must use HTTPS"),
  description: Schema.string().optional(),
  events: Schema.array(Schema.string()).min(1, "Select at least one event"),
});

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

export default function WebhooksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const { data: webhooks = [], isLoading } = useOrgQuery(["webhooks"], () => getWebhooksWithAnalytics());

  React.useEffect(() => {
    if (searchParams.get("create") === "true") setIsModalOpen(true);
  }, [searchParams]);

  const columns: ColumnDef<Webhook & { errorRate: number; responseTime: number[] }>[] = [
    {
      header: "Destination",
      cell: ({ row }) => (
        <div className="grid gap-0.5">
          <span className="text-sm font-semibold">{row.original.name}</span>
          <span className="text-muted-foreground max-w-[250px] truncate font-mono text-xs">{row.original.url}</span>
        </div>
      ),
    },
    {
      header: "Configuration",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge
            variant={row.original.isDisabled ? "secondary" : "default"}
            className={cn(row.original.isDisabled ? "bg-muted" : "bg-green-500/10 text-green-700")}
          >
            {row.original.isDisabled ? "Disabled" : "Active"}
          </Badge>
          <span className="text-muted-foreground text-xs font-medium">{row.original.events.length} events</span>
        </div>
      ),
    },
    {
      header: "Performance",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 opacity-50">
          <Info className="size-3" />
          <span className="text-[10px] font-bold tracking-tighter uppercase">Analytics Pending</span>
        </div>
      ),
    },
    {
      header: "Errors",
      cell: ({ row }) => <span className="text-xs font-bold">{row.original.errorRate ?? 0}%</span>,
    },
  ];

  return (
    <DashboardSidebar>
      <DashboardSidebarInset>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-6">
          <header className="flex items-start justify-between">
            <div className="grid gap-1">
              <h1 className="text-3xl font-bold tracking-tight">Event destinations</h1>
              <p className="text-muted-foreground">Stream Stellar events to your webhooks and cloud services.</p>
            </div>
            <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
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
                actions={[
                  { label: "Edit", onClick: (w) => console.log(w) },
                  { label: "Delete", variant: "destructive", onClick: (w) => console.log(w) },
                ]}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardSidebarInset>
      <WebhooksModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </DashboardSidebar>
  );
}

function WebhooksModal({ open, onOpenChange }: any) {
  const { handleCopy } = useCopy();
  const { data: organization } = useOrgContext();
  const invalidate = useInvalidateOrgQuery();

  const secret = React.useMemo(() => generateResourceId("whsec", organization?.id!, 32), [open]);

  const form = RHF.useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", url: "", description: "", events: [] as string[] },
  });

  const selectedEvents = form.watch("events");

  const mutation = useMutation({
    mutationFn: (data: any) =>
      postWebhook(undefined, undefined, { ...data, secret, isDisabled: false, createdAt: new Date() }),
    onSuccess: () => {
      invalidate(["webhooks"]);
      toast.success("Destination created");
      onOpenChange(false);
      form.reset();
    },
  });

  const toggleAll = () => {
    const all = WEBHOOK_EVENTS.map((e) => e.id);
    form.setValue("events", selectedEvents.length === all.length ? [] : all);
  };

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title="Configure destination"
      description="Connect your servers to the Stellar network events."
      footer={
        <div className="flex w-full justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Back
            </Button>
            <Button onClick={form.handleSubmit((d) => mutation.mutate(d))} isLoading={mutation.isPending}>
              Create destination
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-12 pb-20 lg:grid-cols-2">
        <div className="space-y-8">
          <div className="grid gap-6">
            <RHF.Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id={field.name}
                  label="Destination name"
                  placeholder="e.g. Production API"
                  error={fieldState.error?.message}
                />
              )}
            />
            <RHF.Controller
              name="url"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Endpoint URL"
                  id={field.name}
                  placeholder="https://api.yourdomain.com/webhook"
                  error={fieldState.error?.message}
                />
              )}
            />
            <RHF.Controller
              name="description"
              control={form.control}
              render={({ field, fieldState: { error } }) => (
                <TextAreaField
                  error={error?.message}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  id={field.name}
                  label="Description (Optional)"
                  placeholder="What is this destination for?"
                />
              )}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <Label className="text-muted-foreground/60 text-[10px] font-black tracking-widest uppercase">
                Subscription Events
              </Label>
              <Button
                variant="link"
                size="sm"
                onClick={toggleAll}
                className="h-auto p-0 text-[10px] font-bold uppercase"
              >
                {selectedEvents.length === WEBHOOK_EVENTS.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {WEBHOOK_EVENTS.map((e) => (
                <div key={e.id} className="flex items-center gap-3">
                  <Checkbox
                    id={e.id}
                    checked={selectedEvents.includes(e.id)}
                    onCheckedChange={(checked) => {
                      const next = checked ? [...selectedEvents, e.id] : selectedEvents.filter((id) => id !== e.id);
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
        </div>

        <aside className="space-y-8">
          <div className="bg-muted/30 space-y-4 rounded-xl border p-6 shadow-xs">
            <h4 className="text-primary text-[10px] font-black tracking-widest uppercase">Signing Secret</h4>
            <div className="flex gap-2">
              <code className="bg-background flex-1 rounded border p-2.5 font-mono text-xs break-all">{secret}</code>
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleCopy({ text: secret, message: "Copied to clipboard" })}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed italic">
              Use this secret to verify signatures. Never expose this in client-side code.
            </p>
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
                  {getCurlExample(selectedEvents[0] || "payment.confirmed")}
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
