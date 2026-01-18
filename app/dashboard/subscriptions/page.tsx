"use client";

import * as React from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import { DatePicker } from "@/components/date-picker";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { ResourcePicker } from "@/components/resource-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { Subscription } from "@/db";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Box,
  Calendar,
  CheckCircle2,
  Clock,
  Pause,
  Plus,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import * as RHF from "react-hook-form";
import { z } from "zod";

const mockSubscriptions: (Subscription & {
  customer?: { name: string; email: string };
  product?: { name: string; priceAmount: number; assetId: string };
})[] = [
  {
    id: "sub_abc123def456ghi789",
    customerId: "cust_mock456",
    productId: "prod_premium123",
    status: "active",
    organizationId: "org_mock123",
    currentPeriodStart: new Date("2025-01-01T00:00:00Z"),
    currentPeriodEnd: new Date("2025-02-01T00:00:00Z"),
    cancelAtPeriodEnd: false,
    canceledAt: null,
    pausedAt: null,
    lastPaymentId: "pay_last123",
    nextBillingDate: new Date("2025-02-01T00:00:00Z"),
    failedPaymentCount: 0,
    createdAt: new Date("2024-12-01T00:00:00Z"),
    updatedAt: new Date("2025-01-15T10:30:00Z"),
    metadata: {},
    environment: "testnet",
    customer: {
      name: "John Doe",
      email: "john.doe@example.com",
    },
    product: {
      name: "Premium Plan",
      priceAmount: 50000000, // 50 XLM in stroops
      assetId: "XLM",
    },
  },
  {
    id: "sub_xyz789abc123def456",
    customerId: "cust_mock789",
    productId: "prod_basic456",
    status: "past_due",
    organizationId: "org_mock123",
    currentPeriodStart: new Date("2024-12-15T00:00:00Z"),
    currentPeriodEnd: new Date("2025-01-15T00:00:00Z"),
    cancelAtPeriodEnd: false,
    canceledAt: null,
    pausedAt: null,
    lastPaymentId: "pay_last456",
    nextBillingDate: new Date("2025-01-15T00:00:00Z"),
    failedPaymentCount: 2,
    createdAt: new Date("2024-11-01T00:00:00Z"),
    updatedAt: new Date("2025-01-14T08:00:00Z"),
    metadata: {},
    environment: "testnet",
    customer: {
      name: "Jane Smith",
      email: "jane.smith@example.com",
    },
    product: {
      name: "Basic Plan",
      priceAmount: 20000000, // 20 XLM in stroops
      assetId: "XLM",
    },
  },
  {
    id: "sub_canceled789xyz",
    customerId: "cust_mock456",
    productId: "prod_premium123",
    status: "canceled",
    organizationId: "org_mock123",
    currentPeriodStart: new Date("2024-11-01T00:00:00Z"),
    currentPeriodEnd: new Date("2024-12-01T00:00:00Z"),
    cancelAtPeriodEnd: true,
    canceledAt: new Date("2024-11-15T00:00:00Z"),
    pausedAt: null,
    lastPaymentId: "pay_last789",
    nextBillingDate: null,
    failedPaymentCount: 0,
    createdAt: new Date("2024-10-01T00:00:00Z"),
    updatedAt: new Date("2024-11-15T00:00:00Z"),
    metadata: {},
    environment: "testnet",
    customer: {
      name: "John Doe",
      email: "john.doe@example.com",
    },
    product: {
      name: "Premium Plan",
      priceAmount: 50000000, // 50 XLM in stroops
      assetId: "XLM",
    },
  },
];

const mockCustomers = [
  { id: "cust_001", name: "John Doe", email: "john.doe@example.com" },
  { id: "cust_002", name: "Jane Smith", email: "jane.smith@example.com" },
  { id: "cust_003", name: "Alice Johnson", email: "alice.j@example.com" },
  { id: "cust_004", name: "Bob Williams", email: "bob.w@example.com" },
  { id: "cust_005", name: "Charlie Brown", email: "charlie.b@example.com" },
];

const mockProducts = [
  {
    id: "prod_premium123",
    name: "Premium Plan",
    priceAmount: 50000000, // 50 XLM in stroops
    assetId: "XLM",
    description: "Full access to all premium features",
    recurringPeriod: "month",
  },
  {
    id: "prod_basic456",
    name: "Basic Plan",
    priceAmount: 20000000, // 20 XLM in stroops
    assetId: "XLM",
    description: "Essential features for getting started",
    recurringPeriod: "month",
  },
  {
    id: "prod_pro789",
    name: "Pro Plan",
    priceAmount: 100000000, // 100 XLM in stroops
    assetId: "XLM",
    description: "Advanced features for power users",
    recurringPeriod: "month",
  },
  {
    id: "prod_enterprise",
    name: "Enterprise Plan",
    priceAmount: 500000000, // 500 XLM in stroops
    assetId: "XLM",
    description: "Custom solutions for large teams",
    recurringPeriod: "month",
  },
];

const StatusBadge = ({ status }: { status: Subscription["status"] }) => {
  const variants = {
    active: {
      className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      icon: CheckCircle2,
      label: "Active",
    },
    past_due: {
      className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
      icon: Clock,
      label: "Past Due",
    },
    canceled: {
      className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
      icon: XCircle,
      label: "Canceled",
    },
    paused: {
      className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
      icon: Pause,
      label: "Paused",
    },
  };

  const variant = variants[status];
  const Icon = variant.icon;

  return (
    <Badge variant="outline" className={cn("gap-1.5 border", variant.className)}>
      <Icon className="h-3 w-3" />
      {variant.label}
    </Badge>
  );
};

const SortableHeader = ({ column, title }: { column: any; title: string }) => {
  const isSorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      className="hover:text-foreground -mx-2 h-8 gap-2 font-semibold"
      onClick={() => column.toggleSorting(isSorted === "asc")}
    >
      {title}
      {isSorted === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : isSorted === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </Button>
  );
};

type SubscriptionWithDetails = Subscription & {
  customer?: { name: string; email: string };
  product?: { name: string; priceAmount: number; assetId: string };
};

const columns: ColumnDef<SubscriptionWithDetails>[] = [
  {
    accessorKey: "customer",
    header: ({ column }) => <SortableHeader column={column} title="Customer" />,
    cell: ({ row }) => {
      const customer = row.original.customer;
      if (!customer) return <span className="text-muted-foreground">-</span>;
      return (
        <div>
          <div className="font-medium">{customer.name}</div>
          <div className="text-muted-foreground text-xs">{customer.email}</div>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "product",
    header: ({ column }) => <SortableHeader column={column} title="Product" />,
    cell: ({ row }) => {
      const product = row.original.product;
      if (!product) return <span className="text-muted-foreground">-</span>;
      return <div className="font-medium">{product.name}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "product.priceAmount",
    header: ({ column }) => <SortableHeader column={column} title="Amount" />,
    cell: ({ row }) => {
      const product = row.original.product;
      if (!product) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="font-medium">
          {(product.priceAmount / 1000000).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 7,
          })}{" "}
          XLM
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} title="Status" />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    enableSorting: true,
  },
  {
    accessorKey: "currentPeriodEnd",
    header: ({ column }) => <SortableHeader column={column} title="Next Billing" />,
    cell: ({ row }) => {
      const date = row.original.currentPeriodEnd;
      if (!date) return <span className="text-muted-foreground">-</span>;
      return <div className="text-sm">{moment(date).format("MMM DD, YYYY")}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} title="Created" />,
    cell: ({ row }) => {
      const date = row.original.createdAt;
      if (!date) return <span className="text-muted-foreground">-</span>;
      return <div className="text-muted-foreground text-sm">{moment(date).format("MMM DD, YYYY")}</div>;
    },
    enableSorting: true,
  },
];

const subscriptionSchema = z.object({
  customerIds: z.array(z.string()).min(1, "At least one customer is required"),
  productId: z.string().min(1, "Product is required"),
  billingPeriod: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .refine((data) => data.from && data.to, {
      message: "Please select both start and end dates",
    })
    .refine((data) => !data.from || !data.to || data.to > data.from, {
      message: "End date must be after start date",
    }),
  cancelAtPeriodEnd: z.boolean(),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

export default function SubscriptionsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  const subscriptions = React.useMemo(() => mockSubscriptions, []);
  const isLoading = false;

  const tableActions: TableAction<SubscriptionWithDetails>[] = [
    {
      label: "View Details",
      onClick: () => {
        toast.info("Subscription details page coming soon");
      },
    },
    {
      label: "Cancel Subscription",
      onClick: () => {
        toast.info("Cancel subscription functionality coming soon");
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
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Subscriptions</h1>
                <Button className="gap-2 shadow-none" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Subscription
                </Button>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={subscriptions}
              enableBulkSelect={false}
              actions={tableActions}
              isLoading={isLoading}
              skeletonRowCount={5}
            />
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>

      <CreateSubscriptionModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </div>
  );
}

export function CreateSubscriptionModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const form = RHF.useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      customerIds: [],
      productId: "",
      billingPeriod: { from: new Date(), to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      cancelAtPeriodEnd: false,
    },
  });

  const { customerIds, productId, billingPeriod, cancelAtPeriodEnd } = form.watch();

  const selectedCustomers = React.useMemo(() => mockCustomers.filter((c) => customerIds.includes(c.id)), [customerIds]);
  const selectedProduct = React.useMemo(() => mockProducts.find((p) => p.id === productId), [productId]);

  const formatDate = (date?: Date) =>
    date?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleSubmit = async (data: SubscriptionFormData) => {
    console.log(data);
  };

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title="New Subscription"
      description="Configure billing and access for your customers."
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
            <ShieldCheck className="text-primary size-3.5" />
            {selectedCustomers.length > 0 && selectedProduct
              ? `Processing ${selectedCustomers.length} client(s) • ${selectedProduct.name}`
              : "Awaiting configuration"}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                const isValid = await form.trigger();
                if (!isValid) return;
                const data = form.getValues();
                await handleSubmit(data);
              }}
            >
              Create Subscription
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="mx-auto max-w-6xl space-y-12 pt-4 pb-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <RHF.Controller
            control={form.control}
            name="customerIds"
            render={({ field }) => (
              <ResourcePicker
                label="Target Customers"
                items={mockCustomers}
                multiple
                value={field.value}
                onChange={field.onChange}
                placeholder="Search..."
                renderItem={(c) => ({
                  id: c.id,
                  title: c.name,
                  subtitle: c.email,
                  searchValue: `${c.name} ${c.email}`,
                })}
                isLoading
                onAddNew={() => router.push("/dashboard/customers?mode=create")}
              />
            )}
          />

          <RHF.Controller
            control={form.control}
            name="productId"
            render={({ field }) => (
              <ResourcePicker
                label="Subscription Plan"
                items={mockProducts}
                value={field.value ? [field.value] : []}
                onChange={(val) => field.onChange(val[0] || "")}
                placeholder="Select plan..."
                renderItem={(p) => ({
                  id: p.id,
                  title: p.name,
                  subtitle: `${p.priceAmount} ${p.assetId} per period`,
                  searchValue: p.name,
                })}
                onAddNew={() => router.push("/dashboard/products?mode=create")}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div className="flex items-center gap-2 border-b pb-2">
              <Calendar className="text-muted-foreground size-4" />
              <h3 className="text-foreground/70 text-sm font-bold tracking-widest uppercase">Schedule</h3>
            </div>

            <div className="space-y-6">
              <RHF.Controller
                control={form.control}
                name="billingPeriod"
                render={({ field }) => (
                  <DatePicker
                    id="billing-period"
                    mode="range"
                    label="Active Duration"
                    value={field.value as any}
                    onChange={field.onChange}
                  />
                )}
              />

              <div className="flex items-start gap-3">
                <RHF.Controller
                  control={form.control}
                  name="cancelAtPeriodEnd"
                  render={({ field }) => (
                    <Checkbox id="cancel" checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
                  )}
                />
                <div className="grid gap-1">
                  <Label
                    htmlFor="cancel"
                    className="hover:text-primary cursor-pointer text-sm font-bold transition-colors"
                  >
                    Auto-expire
                  </Label>
                  <p className="text-muted-foreground text-[11px] leading-tight">
                    Access will be revoked automatically at the end of the billing period.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/10 space-y-6 self-start rounded-xl border p-6 shadow-xs">
            <div className="border-border/50 flex items-center justify-between border-b pb-3">
              <h4 className="text-muted-foreground/60 text-[10px] font-black tracking-[0.2em] uppercase">
                Order Summary
              </h4>
              <Badge variant="outline" className="bg-background text-[9px]">
                Draft
              </Badge>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Box className="text-muted-foreground/50 size-3.5" />
                  <span className="text-muted-foreground text-xs font-semibold">Plan</span>
                </div>
                <span className="text-foreground text-right text-xs font-bold">
                  {selectedProduct?.name || "None Selected"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Users className="text-muted-foreground/50 size-3.5" />
                  <span className="text-muted-foreground text-xs font-semibold">Volume</span>
                </div>
                <span className="text-foreground text-xs font-bold">{selectedCustomers.length} customer(s)</span>
              </div>

              <Separator className="opacity-30" />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground/70 font-medium">Activation Date</span>
                  <span className="text-foreground/80 font-mono">{formatDate(billingPeriod.from) || "---"}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground/70 font-medium">Expiry Date</span>
                  <span className="text-foreground/80 font-mono">{formatDate(billingPeriod.to) || "---"}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground/70 font-medium">Auto-renew</span>
                  <span
                    className={cn(
                      "font-bold tracking-tighter uppercase",
                      cancelAtPeriodEnd ? "text-destructive" : "text-accent-foreground"
                    )}
                  >
                    {cancelAtPeriodEnd ? "Off" : "On"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </FullScreenModal>
  );
}
