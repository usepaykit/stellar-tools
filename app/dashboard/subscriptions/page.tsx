"use client";

import * as React from "react";

// import { retrieveCustomers } from "@/actions/customers";
// import { retrieveProducts } from "@/actions/product";
// import { postSubscription } from "@/actions/subscription";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { Subscription } from "@/db";
// import { useInvalidateOrgQuery, useOrgQuery } from "@/hooks/use-org-query";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Pause,
  Plus,
  XCircle,
  User,
  Package,
  Calendar,
  Coins,
  Check,
  Mail,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import moment from "moment";
import * as RHF from "react-hook-form";
import { useWatch } from "react-hook-form";
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
      className:
        "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      icon: CheckCircle2,
      label: "Active",
    },
    past_due: {
      className:
        "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
      icon: Clock,
      label: "Past Due",
    },
    canceled: {
      className:
        "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
      icon: XCircle,
      label: "Canceled",
    },
    paused: {
      className:
        "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
      icon: Pause,
      label: "Paused",
    },
  };

  const variant = variants[status];
  const Icon = variant.icon;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border", variant.className)}
    >
      <Icon className="h-3 w-3" />
      {variant.label}
    </Badge>
  );
};

const SortableHeader = ({
  column,
  title,
}: {
  column: any;
  title: string;
}) => {
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
    header: ({ column }) => (
      <SortableHeader column={column} title="Customer" />
    ),
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
    header: ({ column }) => (
      <SortableHeader column={column} title="Product" />
    ),
    cell: ({ row }) => {
      const product = row.original.product;
      if (!product) return <span className="text-muted-foreground">-</span>;
      return <div className="font-medium">{product.name}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "product.priceAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title="Amount" />
    ),
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
    header: ({ column }) => (
      <SortableHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    enableSorting: true,
  },
  {
    accessorKey: "currentPeriodEnd",
    header: ({ column }) => (
      <SortableHeader column={column} title="Next Billing" />
    ),
    cell: ({ row }) => {
      const date = row.original.currentPeriodEnd;
      if (!date) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="text-sm">
          {moment(date).format("MMM DD, YYYY")}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.original.createdAt;
      if (!date) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="text-muted-foreground text-sm">
          {moment(date).format("MMM DD, YYYY")}
        </div>
      );
    },
    enableSorting: true,
  },
];

const subscriptionSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  productId: z.string().min(1, "Product is required"),
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
                <Button
                  className="gap-2 shadow-none"
                  onClick={() => setIsCreateModalOpen(true)}
                >
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

      <AddSubscriptionModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
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
      customerId: "",
      productId: "",
    },
  });

  // Search states
  const [customerSearch, setCustomerSearch] = React.useState("");
  const [productSearch, setProductSearch] = React.useState("");

  // Pagination states
  const [customerPage, setCustomerPage] = React.useState(1);
  const [productPage, setProductPage] = React.useState(1);
  const itemsPerPage = 3;

  const customerId = useWatch({ control: form.control, name: "customerId" });
  const productId = useWatch({ control: form.control, name: "productId" });

  // Filter customers based on search
  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch.trim()) return mockCustomers;

    const query = customerSearch.toLowerCase();
    return mockCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
    );
  }, [customerSearch]);

  // Filter products based on search
  const filteredProducts = React.useMemo(() => {
    if (!productSearch.trim()) return mockProducts;

    const query = productSearch.toLowerCase();
    return mockProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        (p.priceAmount / 1000000).toString().includes(query)
    );
  }, [productSearch]);

  // Paginate customers
  const paginatedCustomers = React.useMemo(() => {
    const start = (customerPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredCustomers.slice(start, end);
  }, [filteredCustomers, customerPage]);

  // Paginate products
  const paginatedProducts = React.useMemo(() => {
    const start = (productPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, productPage]);

  // Calculate total pages
  const customerTotalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const productTotalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const selectedCustomer = React.useMemo(() => {
    return mockCustomers.find((c) => c.id === customerId);
  }, [customerId]);

  const selectedProduct = React.useMemo(() => {
    return mockProducts.find((p) => p.id === productId);
  }, [productId]);

  // Reset pagination when search changes
  React.useEffect(() => {
    setCustomerPage(1);
  }, [customerSearch]);

  React.useEffect(() => {
    setProductPage(1);
  }, [productSearch]);

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const product = mockProducts.find((p) => p.id === data.productId);
      if (!product) throw new Error("Product not found");

      // Mock success response
      return {
        id: `sub_${Math.random().toString(36).substring(7)}`,
        ...data,
        product,
      };
    },
    onSuccess: () => {
      toast.success("Subscription created successfully!");
      form.reset({
        customerId: "",
        productId: "",
      });
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
        customerId: "",
        productId: "",
      });
      setCustomerSearch("");
      setProductSearch("");
      setCustomerPage(1);
      setProductPage(1);
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
              ? "Review the details below and click Create to proceed"
              : "Please select both a customer and product to continue"}
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
              disabled={
                createSubscriptionMutation.isPending ||
                !customerId ||
                !productId
              }
              isLoading={createSubscriptionMutation.isPending}
              className="gap-2 shadow-none"
            >
              {createSubscriptionMutation.isPending
                ? "Creating..."
                : "Create Subscription"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Customer Selection Table */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Select Customer</CardTitle>
              </div>
              <p className="text-muted-foreground text-sm">
                Choose the customer for this subscription
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <InputGroup className="shadow-none">
                <InputGroupAddon align="inline-start">
                  <Search className="h-4 w-4" />
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  placeholder="Search by name or email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </InputGroup>

              <RHF.Controller
                control={form.control}
                name="customerId"
                render={({ field, fieldState: { error } }) => (
                  <div className="space-y-2">
                    {error && (
                      <p className="text-destructive text-sm">{error.message}</p>
                    )}
                    <div className="rounded-md border overflow-hidden">
                      <div className="relative max-h-[400px] overflow-auto">
                        <Table>
                          <TableHeader className="sticky top-0 z-10 bg-background">
                            <TableRow>
                              <TableHead className="w-12 bg-background"></TableHead>
                              <TableHead className="bg-background">Name</TableHead>
                              <TableHead className="bg-background">Email</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                          {paginatedCustomers.length > 0 ? (
                            paginatedCustomers.map((customer) => {
                              const isSelected = field.value === customer.id;
                              return (
                                <TableRow
                                  key={customer.id}
                                  className={cn(
                                    "cursor-pointer transition-colors",
                                    isSelected
                                      ? "bg-primary/5 hover:bg-primary/10"
                                      : "hover:bg-muted/50"
                                  )}
                                  onClick={() => field.onChange(customer.id)}
                                >
                                  <TableCell className="w-12">
                                    <div
                                      className={cn(
                                        "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                                        isSelected
                                          ? "border-primary bg-primary"
                                          : "border-border"
                                      )}
                                    >
                                      {isSelected && (
                                        <Check className="h-3 w-3 text-primary-foreground" />
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                        <User className="h-4 w-4 text-primary" />
                                      </div>
                                      <span
                                        className={cn(
                                          "font-medium",
                                          isSelected && "text-primary"
                                        )}
                                      >
                                        {customer.name}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <Mail className="h-3.5 w-3.5" />
                                      <span className="text-sm">{customer.email}</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="h-24 text-center">
                                <p className="text-muted-foreground text-sm">
                                  No customers found
                                </p>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="text-muted-foreground text-sm">
                        Showing {Math.min(
                          (customerPage - 1) * itemsPerPage + 1,
                          filteredCustomers.length
                        )}{" "}
                        - {Math.min(
                          customerPage * itemsPerPage,
                          filteredCustomers.length
                        )}{" "}
                        of {filteredCustomers.length} customers
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                          disabled={customerPage === 1 || customerTotalPages <= 1}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-muted-foreground text-sm">
                          Page {customerPage} of {customerTotalPages}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCustomerPage((p) =>
                              Math.min(customerTotalPages, p + 1)
                            )
                          }
                          disabled={customerPage === customerTotalPages || customerTotalPages <= 1}
                          className="h-8 w-8 p-0 shadow-none"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Product Selection Table */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Select Product</CardTitle>
              </div>
              <p className="text-muted-foreground text-sm">
                Choose the subscription product
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <InputGroup className="shadow-none">
                <InputGroupAddon align="inline-start">
                  <Search className="h-4 w-4" />
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  placeholder="Search by name, description, or price..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </InputGroup>

              <RHF.Controller
                control={form.control}
                name="productId"
                render={({ field, fieldState: { error } }) => (
                  <div className="space-y-2">
                    {error && (
                      <p className="text-destructive text-sm">{error.message}</p>
                    )}
                    <div className="rounded-md border overflow-hidden">
                      <div className="relative max-h-[400px] overflow-auto">
                        <Table>
                          <TableHeader className="sticky top-0 z-10 bg-background">
                            <TableRow>
                              <TableHead className="w-12 bg-background"></TableHead>
                              <TableHead className="bg-background">Product</TableHead>
                              <TableHead className="text-right bg-background">Price</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                          {paginatedProducts.length > 0 ? (
                            paginatedProducts.map((product) => {
                            const isSelected = field.value === product.id;
                            const priceInXLM = product.priceAmount / 1000000;
                            return (
                              <TableRow
                                key={product.id}
                                className={cn(
                                  "cursor-pointer transition-colors",
                                  isSelected
                                    ? "bg-primary/5 hover:bg-primary/10"
                                    : "hover:bg-muted/50"
                                )}
                                onClick={() => field.onChange(product.id)}
                              >
                                <TableCell className="w-12">
                                  <div
                                    className={cn(
                                      "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                                      isSelected
                                        ? "border-primary bg-primary"
                                        : "border-border"
                                    )}
                                  >
                                    {isSelected && (
                                      <Check className="h-3 w-3 text-primary-foreground" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                        <Package className="h-4 w-4 text-primary" />
                                      </div>
                                      <span
                                        className={cn(
                                          "font-semibold",
                                          isSelected && "text-primary"
                                        )}
                                      >
                                        {product.name}
                                      </span>
                                    </div>
                                    {product.description && (
                                      <p className="text-muted-foreground text-xs pl-10">
                                        {product.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-1.5 pl-10 text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      <span className="text-xs capitalize">
                                        Billed {product.recurringPeriod || "month"}ly
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <Coins className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-semibold">
                                        {priceInXLM.toLocaleString("en-US", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 7,
                                        })}
                                      </span>
                                      <span className="text-muted-foreground text-sm">
                                        XLM
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="h-24 text-center">
                                <p className="text-muted-foreground text-sm">
                                  No products found
                                </p>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="text-muted-foreground text-sm">
                        Showing {Math.min(
                          (productPage - 1) * itemsPerPage + 1,
                          filteredProducts.length
                        )}{" "}
                        - {Math.min(
                          productPage * itemsPerPage,
                          filteredProducts.length
                        )}{" "}
                        of {filteredProducts.length} products
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                          disabled={productPage === 1 || productTotalPages <= 1}
                          className="h-8 w-8 p-0 shadow-none"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-muted-foreground text-sm">
                          Page {productPage} of {productTotalPages}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setProductPage((p) =>
                              Math.min(productTotalPages, p + 1)
                            )
                          }
                          disabled={productPage === productTotalPages || productTotalPages <= 1}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        {selectedCustomer && selectedProduct && (
          <Card className="border-primary/20 bg-primary/5 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Subscription Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Customer
                  </p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">{selectedCustomer.name}</p>
                  </div>
                  <p className="text-muted-foreground text-sm pl-6">
                    {selectedCustomer.email}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Product
                  </p>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">{selectedProduct.name}</p>
                  </div>
                  <p className="text-muted-foreground text-sm pl-6">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Billing Amount
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg font-bold">
                      {(selectedProduct.priceAmount / 1000000).toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 7,
                        }
                      )}{" "}
                      <span className="text-muted-foreground text-sm font-normal">
                        XLM
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Next Billing
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">
                      {moment().add(1, "month").format("MMM DD, YYYY")}
                    </p>
                  </div>
                  <p className="text-muted-foreground text-sm pl-6 capitalize">
                    {selectedProduct.recurringPeriod || "month"}ly billing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </FullScreenModal>
  );
}
