"use client";

import * as React from "react";

import { retrieveCustomers } from "@/actions/customers";
import { getCurrentOrganization } from "@/actions/organization";
import { retrieveProducts } from "@/actions/product";
import { retrieveSubscriptions } from "@/actions/subscription";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable } from "@/components/data-table";
import { DateField } from "@/components/date-field";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { ResourceField } from "@/components/resource-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useInvalidateOrgQuery, useOrgQuery } from "@/hooks/use-org-query";
import { cn } from "@/lib/utils";
import { ApiClient, z as Schema } from "@stellartools/core";
import { useMutation } from "@tanstack/react-query";
import { Calendar, CheckCircle2, Clock, Pause, Plus, ShieldCheck, XCircle } from "lucide-react";
import moment from "moment";
import { toast } from "sonner";

const formatXLM = (stroops: number) => (stroops / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2 });
const formatDate = (date: Date) => moment(date).format("MMM D, YYYY");

const STATUS_CONFIG = {
  active: { cls: "bg-green-500/10 text-green-700 border-green-500/20", icon: CheckCircle2, label: "Active" },
  past_due: { cls: "bg-orange-500/10 text-orange-700 border-orange-500/20", icon: Clock, label: "Past Due" },
  canceled: { cls: "bg-gray-500/10 text-gray-700 border-gray-500/20", icon: XCircle, label: "Canceled" },
  paused: { cls: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20", icon: Pause, label: "Paused" },
};

export default function SubscriptionsPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { data: subs, isLoading } = useOrgQuery(["subscriptions"], () => retrieveSubscriptions());

  const columns: any[] = [
    {
      header: "Customer",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.customer.name}</div>
          <div className="text-muted-foreground text-xs">{row.original.customer.email}</div>
        </div>
      ),
    },
    { header: "Product", cell: ({ row }: any) => <div className="font-medium">{row.original.product.name}</div> },
    {
      header: "Amount",
      cell: ({ row }: any) => <div className="font-medium">{formatXLM(row.original.product.priceAmount)} XLM</div>,
    },
    {
      header: "Status",
      cell: ({ row }: any) => {
        const config = STATUS_CONFIG[row.original.subscription.status as keyof typeof STATUS_CONFIG];
        return (
          <Badge variant="outline" className={cn("gap-1.5", config.cls)}>
            <config.icon className="h-3 w-3" /> {config.label}
          </Badge>
        );
      },
    },
    {
      header: "Next Billing",
      cell: ({ row }: any) => <div className="text-sm">{formatDate(row.original.subscription.currentPeriodEnd)}</div>,
    },
  ];

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
              <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4" /> Add Subscription
              </Button>
            </div>

            <DataTable columns={columns} data={subs ?? []} isLoading={isLoading} />
            <CreateSubscriptionModal open={isModalOpen} onOpenChange={setIsModalOpen} />
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
    </div>
  );
}

const subscriptionSchema = Schema.object({
  customerIds: Schema.array(Schema.string()),
  productId: Schema.string(),
  billingPeriod: Schema.object({ from: Schema.date(), to: Schema.date() }),
  cancelAtPeriodEnd: Schema.boolean(),
});

type Subscription = Schema.infer<typeof subscriptionSchema>;

export function CreateSubscriptionModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const invalidate = useInvalidateOrgQuery();
  const { data: allCustomers, isLoading: isLoadingCustomers } = useOrgQuery(["customers"], () => retrieveCustomers());
  const { data: allProducts, isLoading: isLoadingProducts } = useOrgQuery(["products"], () => retrieveProducts());

  const [form, setForm] = React.useState({
    customerIds: [] as string[],
    productId: "",
    billingPeriod: { from: moment().toDate(), to: moment().add(30, "days").toDate() },
    cancelAtPeriodEnd: false,
  });

  const mutation = useMutation({
    mutationFn: async (data: Subscription) => {
      const organization = await getCurrentOrganization();

      const api = new ApiClient({
        baseUrl: process.env.NEXT_PUBLIC_APP_URL!,
        headers: { "x-session-token": organization?.token ?? undefined! },
      });

      const result = await api.post<{ id: string; success: boolean }>("/api/subscriptions", {
        body: JSON.stringify({
          customerIds: data.customerIds,
          productId: data.productId,
          period: data.billingPeriod,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          metadata: null,
        }),
      });

      if (result.isErr()) throw new Error(result.error.message);

      return result.value;
    },
    onSuccess: () => {
      toast.success("Subscriptions created");
      invalidate(["subscriptions"]);
      onOpenChange(false);
    },
  });

  const selectedProduct = allProducts?.find((p) => p.product.id === form.productId);

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title="New Subscription"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
            <ShieldCheck className="text-primary size-3.5" />
            {form.customerIds.length} Clients • {selectedProduct?.product.name || "Awaiting Selection"}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(form)}
              isLoading={mutation.isPending}
            >
              Confirm & Create
            </Button>
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-5xl space-y-10 py-4">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <ResourceField
            isLoading={isLoadingCustomers}
            label="Target Customers"
            items={allCustomers ?? []}
            multiple
            value={form.customerIds}
            onChange={(ids) => setForm({ ...form, customerIds: ids })}
            renderItem={(c) => ({ id: c.id, title: c.name!, subtitle: c.email!, searchValue: `${c.name} ${c.email}` })}
          />
          <ResourceField
            isLoading={isLoadingProducts}
            label="Subscription Plan"
            items={allProducts?.filter((p) => p.product.type === "subscription") ?? []}
            value={form.productId ? [form.productId] : []}
            onChange={(ids) => setForm({ ...form, productId: ids[0] || "" })}
            renderItem={(p) => ({
              id: p.product.id,
              title: p.product.name,
              subtitle: `${formatXLM(p.product.priceAmount)} XLM`,
              searchValue: [p.product.name, p.asset.code].join(" "),
            })}
          />
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="flex items-center gap-2 border-b pb-2">
              <Calendar className="text-muted-foreground size-4" />
              <h3 className="text-foreground/70 text-sm font-black tracking-widest uppercase">Billing Logic</h3>
            </div>
            <DateField
              id="billingPeriod"
              mode="range"
              label="Active Period"
              value={form.billingPeriod}
              onChange={(p: any) => setForm({ ...form, billingPeriod: p })}
            />
            <div className="flex items-start gap-3">
              <Checkbox
                id="cancel"
                checked={form.cancelAtPeriodEnd}
                onCheckedChange={(v) => setForm({ ...form, cancelAtPeriodEnd: !!v })}
              />
              <div className="grid gap-1">
                <Label htmlFor="cancel" className="font-bold">
                  Auto-expire
                </Label>
                <p className="text-muted-foreground text-[11px]">Revoke access automatically at end of period.</p>
              </div>
            </div>
          </div>

          <div className="bg-muted/10 space-y-5 self-start rounded-xl border p-6">
            <h4 className="text-muted-foreground/60 text-[10px] font-black tracking-widest uppercase">
              Order Specification
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px]">
                <span>Activation</span>
                <span className="font-mono">{formatDate(form.billingPeriod.from)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Termination</span>
                <span className="font-mono">{formatDate(form.billingPeriod.to)}</span>
              </div>
              <Separator />
              <div className="flex items-end justify-between">
                <span className="text-primary text-[10px] font-bold uppercase">Est. Revenue</span>
                <span className="text-primary text-lg font-black">
                  {selectedProduct ? formatXLM(selectedProduct.product.priceAmount * form.customerIds.length) : "0.00"}{" "}
                  <span className="text-[10px] opacity-60">XLM</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FullScreenModal>
  );
}
