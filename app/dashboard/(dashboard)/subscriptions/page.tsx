"use client";

import * as React from "react";

import { retrieveCustomers } from "@/actions/customers";
import { getCurrentOrganization } from "@/actions/organization";
import { retrieveProducts } from "@/actions/product";
import { retrieveSubscriptions } from "@/actions/subscription";
import { AppModal } from "@/components/app-modal";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable } from "@/components/data-table";
import { DateField } from "@/components/date-field";
import { NumberField } from "@/components/number-field";
import { ResourceField } from "@/components/resource-field";
import { TextField } from "@/components/text-field";
import { Timeline } from "@/components/timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { subscriptionStatusEnum } from "@/constant/schema.client";
import { useInvalidateOrgQuery, useOrgQuery } from "@/hooks/use-org-query";
import { useSyncTableFilters } from "@/hooks/use-sync-table-filters";
import { STROOPS_PER_XLM, cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiClient } from "@stellartools/core";
import { useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import * as RHF from "react-hook-form";
import { z } from "zod";

const subscriptionFormSchema = z.object({
  customerIds: z.array(z.string()).min(1, "Select at least one customer"),
  productId: z.string().min(1, "Select a product"),
  billStarting: z.date(),
  trialDays: z.coerce.number().min(0).default(0),
  cancelAtPeriodEnd: z.boolean().default(false),
  metadata: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    )
    .default([]),
});

type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>;

const formatXLM = (s: number) => (s / STROOPS_PER_XLM).toLocaleString(undefined, { minimumFractionDigits: 2 });

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  active: { cls: "bg-green-500/10 text-green-700 border-green-500/20", label: "Active" },
  trialing: { cls: "bg-blue-500/10 text-blue-700 border-blue-500/20", label: "Trialing" },
  past_due: { cls: "bg-orange-500/10 text-orange-700 border-orange-500/20", label: "Past due" },
  canceled: { cls: "bg-gray-500/10 text-gray-700 border-gray-500/20", label: "Canceled" },
  paused: { cls: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20", label: "Paused" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.active;
  return (
    <Badge variant="outline" className={cn("gap-1.5", cfg.cls)}>
      {cfg.label}
    </Badge>
  );
};

export default function SubscriptionsPage() {
  const router = useRouter();
  const invalidate = useInvalidateOrgQuery();
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [columnFilters, setColumnFilters] = useSyncTableFilters();
  const submitRef = React.useRef<(() => void) | null>(null);
  const [footerState, setFooterState] = React.useState({ isPending: false });

  const { data: subs = [], isLoading } = useOrgQuery(["subscriptions"], retrieveSubscriptions);

  const stats = React.useMemo(() => {
    const counts = { all: subs.length, active: 0, paused: 0, canceled: 0 };
    subs.forEach((s) => {
      if (s.subscription.status in counts) counts[s.subscription.status as keyof typeof counts]++;
    });
    return counts;
  }, [subs]);

  const rows = React.useMemo(
    () =>
      subs
        .filter((s) => activeTab === "all" || s.subscription.status === activeTab)
        .map((s) => ({
          id: s.subscription.id,
          customer: s.customer.name ?? "—",
          customerEmail: s.customer.email,
          status: s.subscription.status,
          product: s.product.name,
          amount: s.product.priceAmount,
          createdAt: s.subscription.createdAt,
        })),
    [subs, activeTab]
  );

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "customerEmail",
      header: "Customer",
      meta: { filterable: true, filterVariant: "text" },
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.customer}</div>
          <div className="text-muted-foreground text-xs">{row.original.customerEmail}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: {
        filterable: true,
        filterVariant: "select",
        filterOptions: subscriptionStatusEnum.map((s) => ({ label: moment().format(s), value: s })),
      },
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "product",
      header: "Product",
      cell: ({ row }) => <div className="font-medium">{row.original.product}</div>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <div className="text-sm">{formatXLM(row.original.amount)} XLM / mo</div>,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      meta: { filterable: true, filterVariant: "date" },
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm">{moment(row.original.createdAt).format("D MMM, HH:mm")}</div>
      ),
    },
  ];

  const openModal = () =>
    AppModal.open({
      title: "Create subscription",
      size: "full",
      showCloseButton: true,
      content: (
        <SubscriptionModalContent
          onSuccess={() => {
            invalidate(["subscriptions"]);
            AppModal.close();
          }}
          setSubmitRef={submitRef}
          onFooterChange={setFooterState}
        />
      ),
      footer: (
        <SubscriptionModalFooter onClose={AppModal.close} submitRef={submitRef} isPending={footerState.isPending} />
      ),
    });

  return (
    <DashboardSidebar>
      <DashboardSidebarInset>
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
            <Button className="gap-2" onClick={openModal}>
              <Plus className="h-4 w-4" /> Create subscription
            </Button>
          </div>

          <div className="border-border flex items-center gap-1 border-b">
            {["all", "active", "paused", "canceled"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "hover:text-foreground relative px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tab ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab !== "all" && (stats as any)[tab] > 0 && (
                  <span className="ml-1.5 text-xs">({(stats as any)[tab]})</span>
                )}
                {activeTab === tab && <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />}
              </button>
            ))}
          </div>

          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            actions={(r) => [{ label: "View details", onClick: () => router.push(`/subscriptions/${r.id}`) }]}
            columnFilters={columnFilters}
            setColumnFilters={setColumnFilters}
          />
        </div>
      </DashboardSidebarInset>
    </DashboardSidebar>
  );
}

// --- Modal Content ---

export function SubscriptionModalContent({ onSuccess, editingSubscription, setSubmitRef, onFooterChange }: any) {
  const isEditMode = !!editingSubscription;
  const form = RHF.useForm({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      customerIds: editingSubscription ? [editingSubscription.customerId] : [],
      productId: editingSubscription?.productId ?? "",
      billStarting: editingSubscription ? new Date(editingSubscription.currentPeriodStart) : new Date(),
      trialDays: editingSubscription?.trialDays ?? 0,
      cancelAtPeriodEnd: editingSubscription?.cancelAtPeriodEnd ?? false,
      metadata: editingSubscription?.metadata
        ? Object.entries(editingSubscription.metadata).map(([key, value]) => ({ key, value: String(value) }))
        : [],
    },
  });

  const { fields, append, remove } = RHF.useFieldArray({ control: form.control, name: "metadata" });
  const { data: customers = [], isLoading: loadingCust } = useOrgQuery(["customers"], retrieveCustomers);
  const { data: products = [], isLoading: loadingProd } = useOrgQuery(["products"], () =>
    retrieveProducts(undefined, undefined, { status: "active" })
  );

  // Derived Selection State
  const selectedProd = products.find((p) => p.product.id === form.watch("productId"));
  const price = selectedProd?.product.priceAmount ?? editingSubscription?.productPrice ?? 0;
  const billingStart = form.watch("billStarting");

  const mutation = useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      const org = await getCurrentOrganization();
      const api = new ApiClient({
        baseUrl: process.env.NEXT_PUBLIC_APP_URL!,
        headers: { "x-auth-token": org?.token! },
      });
      const metadata = data.metadata.reduce(
        (acc, m) => {
          if (m.key) acc[m.key] = m.value;
          return acc;
        },
        {} as Record<string, string>
      );

      const payload = { ...data, metadata: Object.keys(metadata).length ? metadata : null };
      const res = isEditMode
        ? await api.put(`/api/subscriptions/${editingSubscription.id}`, payload)
        : await api.post("/api/subscriptions", payload);

      if (res.isErr()) throw new Error(res.error.message);
      return res.value;
    },
    onSuccess: () => {
      toast.success(`Subscription ${isEditMode ? "updated" : "created"}`);
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  React.useEffect(() => {
    if (setSubmitRef) setSubmitRef.current = form.handleSubmit((d) => mutation.mutate(d));
  }, [form, mutation, setSubmitRef]);

  React.useEffect(() => {
    onFooterChange?.({ isPending: mutation.isPending });
  }, [mutation.isPending, onFooterChange]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-7">
      <div className="space-y-8 lg:col-span-4">
        {/* Customer Selection */}
        <section className="space-y-3">
          <h3 className="text-base font-semibold">Customer</h3>
          <RHF.Controller
            name="customerIds"
            control={form.control}
            render={({ field }) => (
              <ResourceField
                isLoading={loadingCust}
                items={customers}
                value={field.value}
                onChange={field.onChange}
                multiple
                placeholder="Find or add a customer..."
                renderItem={(c) => ({ searchValue: c.name!, id: c.id, title: c.name!, subtitle: c.email! })}
              />
            )}
          />
        </section>

        <Separator />

        <section className="space-y-6">
          <h3 className="text-base font-semibold">Subscription details</h3>

          <div className="space-y-4 rounded-lg border p-5">
            <h4 className="text-sm font-semibold">Pricing</h4>
            <RHF.Controller
              name="productId"
              control={form.control}
              render={({ field }) => (
                <ResourceField
                  isLoading={loadingProd}
                  items={products.filter((p) => p.product.type === "subscription")}
                  value={field.value ? [field.value] : []}
                  onChange={field.onChange}
                  renderItem={(p) => ({
                    searchValue: p.product.name!,
                    id: p.product.id,
                    title: p.product.name,
                    subtitle: `${formatXLM(p.product.priceAmount)} XLM / ${p.product.recurringPeriod}`,
                  })}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <RHF.Controller
              name="billStarting"
              control={form.control}
              render={({ field }) => (
                <DateField
                  id="billStarting"
                  label="Bill starting"
                  value={field.value}
                  onChange={field.onChange}
                  helpText="When the first invoice generates."
                />
              )}
            />
            <RHF.Controller
              name="trialDays"
              control={form.control}
              render={({ field }) => (
                <NumberField
                  id="trialDays"
                  label="Free trial days"
                  value={field.value as number}
                  onChange={field.onChange}
                  placeholder="0"
                />
              )}
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Metadata</h4>
            {fields.map((field, i) => (
              <div key={field.id} className="animate-in slide-in-from-top-1 flex items-end gap-2">
                <RHF.Controller
                  name={`metadata.${i}.key`}
                  control={form.control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      id={`meta-k-${i}`}
                      label={i === 0 ? "Key" : null}
                      value={field.value as string}
                      onChange={field.onChange}
                      placeholder="e.g. internal_id"
                      className="flex-1 shadow-none"
                      error={error?.message}
                    />
                  )}
                />

                <RHF.Controller
                  name={`metadata.${i}.value`}
                  control={form.control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      id={`meta-v-${i}`}
                      label={i === 0 ? "Value" : null}
                      value={field.value as string}
                      onChange={field.onChange}
                      placeholder="value"
                      className="flex-1 shadow-none"
                      error={error?.message}
                    />
                  )}
                />

                <Button variant="ghost" size="icon" onClick={() => remove(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => append({ key: "", value: "" })}
              className="text-primary text-sm font-medium hover:underline"
            >
              + Add metadata
            </button>
          </div>

          <div className="flex items-start gap-3">
            <RHF.Controller
              name="cancelAtPeriodEnd"
              control={form.control}
              render={({ field }) => (
                <Checkbox id="cancelAtPeriodEnd" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <div className="grid gap-1">
              <Label htmlFor="cancelAtPeriodEnd" className="font-bold">
                Cancel at period end
              </Label>
              <p className="text-muted-foreground text-xs">
                Automatically end the subscription after the current cycle.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Right Sidebar: Timeline & Calculations */}
      <div className="lg:col-span-3">
        <Card className="bg-muted/30 sticky top-6 shadow-none">
          <CardContent className="space-y-6 p-6">
            <h3 className="text-lg font-semibold">Preview</h3>
            <Tabs defaultValue="summary">
              <TabsList className="w-full">
                <TabsTrigger value="summary" className="flex-1">
                  Summary
                </TabsTrigger>
                <TabsTrigger value="invoice" className="flex-1">
                  Invoice
                </TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="pt-4">
                <Timeline
                  items={[
                    { title: "Subscription starts", date: moment(billingStart).format("D MMM, YYYY") },
                    {
                      title: "First invoice generated",
                      date: moment(billingStart)
                        .add(form.watch("trialDays") as number, "days")
                        .format("D MMM, YYYY"),
                    },
                  ]}
                  renderItem={(item) => ({ title: item.title, date: item.date, data: {} })}
                />
              </TabsContent>
              <TabsContent value="invoice" className="space-y-4 pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatXLM(price)} XLM</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-base font-bold">
                    <span>Total due now</span>
                    <span className="text-primary">
                      {formatXLM((form.watch("trialDays") as number) > 0 ? 0 : price)} XLM
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SubscriptionModalFooter({ onClose, submitRef, isPending }: any) {
  return (
    <div className="flex w-full justify-end gap-3">
      <Button variant="outline" onClick={onClose} disabled={isPending}>
        Cancel
      </Button>
      <Button onClick={() => submitRef.current?.()} isLoading={isPending}>
        Save Subscription
      </Button>
    </div>
  );
}
