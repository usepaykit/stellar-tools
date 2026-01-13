"use client";

import * as React from "react";

// import { retrieveCustomers } from "@/actions/customers";
// import { retrieveProducts } from "@/actions/product";
// import { postSubscription } from "@/actions/subscription";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import { DatePicker } from "@/components/date-picker";
import { EntityPicker } from "@/components/entity-picker";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { Subscription } from "@/db";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  Pause,
  Plus,
  User,
  XCircle,
} from "lucide-react";
import moment from "moment";
import { DateRange } from "react-day-picker";
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
      return (
        <div className="text-muted-foreground text-sm">{moment(date).format("MMM DD, YYYY")}</div>
      );
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

      <AddSubscriptionModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </div>
  );
}

function AddSubscriptionModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const form = RHF.useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      customerIds: [],
      productId: "",
      billingPeriod: {
        from: new Date(),
        to: moment().add(1, "month").toDate(),
      },
      cancelAtPeriodEnd: false,
    },
  });

  const customerIds = form.watch("customerIds");
  const productId = form.watch("productId");

  const selectedCustomer = React.useMemo(() => {
    return mockCustomers.filter((c) => customerIds.includes(c.id));
  }, [customerIds]);

  const selectedProduct = React.useMemo(() => {
    return mockProducts.find((p) => p.id === productId);
  }, [productId]);

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const product = mockProducts.find((p) => p.id === data.productId);
      if (!product) throw new Error("Product not found");

      // Mock success response
      return {
        id: `sub_${Math.random().toString(36).substring(7)}`,
        customerIds: data.customerIds,
        productId: data.productId,
        periodStart: data.billingPeriod.from,
        periodEnd: data.billingPeriod.to,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        product,
      };
    },
    onSuccess: () => {
      toast.success("Subscription created successfully!");
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create subscription");
    },
  });

  const onSubmit = async (data: SubscriptionFormData) => {
    createSubscriptionMutation.mutate(data);
  };

  React.useEffect(() => {
    if (open) {
      form.reset({
        customerIds: [],
        productId: "",
        billingPeriod: {
          from: new Date(),
          to: moment().add(1, "month").toDate(),
        },
        cancelAtPeriodEnd: false,
      });
    }
  }, [open, form]);

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create Subscription"
      description="Select a customer and product to create a new subscription"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-muted-foreground text-sm">
            {selectedCustomer && selectedProduct
              ? "Review the details and click Create to proceed"
              : "Please fill in all required fields to continue"}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createSubscriptionMutation.isPending}
              className="shadow-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={createSubscriptionMutation.isPending || !form.formState.isValid}
              isLoading={createSubscriptionMutation.isPending}
              className="gap-2 shadow-none"
            >
              {createSubscriptionMutation.isPending ? "Creating..." : "Create Subscription"}
            </Button>
          </div>
        </div>
      }
    >
      <form className="space-y-6">
        {/* Customer and Product Selection */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Customer Selection */}
          <Card className="shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <User className="text-muted-foreground h-5 w-5" />
                <CardTitle className="text-lg">Customer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <RHF.Controller
                control={form.control}
                name="customerIds"
                render={({ field, fieldState: { error } }) => (
                  <EntityPicker
                    id="customer-selector"
                    label="Select Customer"
                    data={mockCustomers}
                    isLoading={false}
                    multiple
                    getItemId={(customer) => customer.id}
                    getTagLabel={(customer) => customer.name}
                    value={field.value}
                    onChange={field.onChange}
                    searchKeys={["name", "email"]}
                    columns={[
                      { header: "Name", accessorKey: "name" },
                      { header: "Email", accessorKey: "email" },
                    ]}
                    tableSkeletonRowCount={3}
                    tableClassName="max-h-[300px] overflow-auto"
                    error={error?.message}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card className="shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Package className="text-muted-foreground h-5 w-5" />
                <CardTitle className="text-lg">Product</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <RHF.Controller
                control={form.control}
                name="productId"
                render={({ field, fieldState: { error } }) => (
                  <EntityPicker
                    id="product-selector"
                    label="Select Product"
                    data={mockProducts}
                    isLoading={false}
                    getItemId={(product) => product.id}
                    getTagLabel={(product) => product.name}
                    value={field.value ? [field.value] : []}
                    onChange={(val) => {
                      const lastSelected = val[val.length - 1];
                      field.onChange(lastSelected || "");
                    }}
                    searchKeys={["name", "description"]}
                    columns={[
                      { header: "Name", accessorKey: "name" },
                      { header: "Description", accessorKey: "description" },
                    ]}
                    tableSkeletonRowCount={3}
                    tableClassName="max-h-[50px] overflow-auto"
                    error={error?.message}
                  />
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Subscription Details */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Calendar className="text-muted-foreground h-5 w-5" />
            <h3 className="text-lg font-semibold">Subscription Details</h3>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Billing Period */}
            <RHF.Controller
              control={form.control}
              name="billingPeriod"
              render={({ field, fieldState: { error } }) => (
                <DatePicker
                  id="billing-period"
                  mode="range"
                  label="Billing Period"
                  value={field.value as DateRange}
                  onChange={(value) => field.onChange(value)}
                  error={error?.message || null}
                  helpText="Select the start and end dates for the subscription billing period"
                  dateFormat="MMM DD, YYYY"
                />
              )}
            />

            {/* Cancel at Period End */}
            <div className="flex flex-col justify-center">
              <RHF.Controller
                control={form.control}
                name="cancelAtPeriodEnd"
                render={({ field }) => (
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="cancel-at-period-end"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="cancel-at-period-end"
                        className="cursor-pointer text-sm font-medium"
                      >
                        Cancel at period end
                      </Label>
                      <p className="text-muted-foreground text-sm">
                        The subscription will be canceled at the end of the current billing period
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
        </div>
      </form>
    </FullScreenModal>
  );
}
