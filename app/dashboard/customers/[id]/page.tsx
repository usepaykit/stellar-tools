"use client";

import * as React from "react";

import { retrieveCustomer } from "@/actions/customers";
import { retrievePayments } from "@/actions/payment";
import { CustomerModal } from "@/app/dashboard/customers/page";
import { RefundModal } from "@/app/dashboard/transactions/page";
import { CodeBlock } from "@/components/code-block";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { Payment } from "@/db";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Edit,
  Eye,
  EyeOff,
  MoreHorizontal,
  Plus,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const ORGANIZATION_ID = "org_placeholder";
const ENVIRONMENT = "testnet";

const StatusBadge = ({ status }: { status: Payment["status"] }) => {
  const variants = {
    confirmed: {
      className:
        "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      icon: CheckCircle2,
      label: "Confirmed",
    },
    pending: {
      className:
        "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
      icon: Clock,
      label: "Pending",
    },
    failed: {
      className:
        "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      icon: XCircle,
      label: "Failed",
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

const CopyButton = ({ text, label }: { text: string; label?: string }) => {
  const { copied, handleCopy } = useCopy();

  return (
    <button
      onClick={() => handleCopy({ text, message: "Copied to clipboard" })}
      className="hover:bg-muted inline-flex items-center justify-center rounded-md p-1 transition-colors"
      aria-label={label || "Copy to clipboard"}
    >
      {copied ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="text-muted-foreground h-4 w-4" />
      )}
    </button>
  );
};

// Payment columns definition
const paymentColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "xlm",
          }).format(row.original.amount)}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "checkoutId",
    header: "Description",
    cell: ({ row }) => (
      <span className="text-muted-foreground font-mono text-sm">
        {row.original.checkoutId}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.original.status as Payment["status"]} />
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {row.original.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}{" "}
        {row.original.createdAt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}
      </div>
    ),
  },
];

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;
  // const customer = getCustomerById(customerId);

  const [hiddenWallets, setHiddenWallets] = React.useState<Set<string>>(
    new Set()
  );
  const [isRefundModalOpen, setIsRefundModalOpen] = React.useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = React.useState<
    string | null
  >(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["payments", customerId],
    queryFn: () =>
      retrievePayments(ORGANIZATION_ID, { customerId }, ENVIRONMENT),
  });

  const { data: customer, isLoading: _customerLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => retrieveCustomer(customerId, ORGANIZATION_ID),
  });

  const handleToggleWalletVisibility = (walletId: string) => {
    const newHidden = new Set(hiddenWallets);
    if (newHidden.has(walletId)) newHidden.delete(walletId);
    else newHidden.add(walletId);
    setHiddenWallets(newHidden);
  };

  const handleDeleteCustomer = async () => {
    setIsDeleting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Customer deleted successfully");
      setIsDeleteModalOpen(false);
      router.push("/dashboard/customers");
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast.error("Failed to delete customer", {
        description: "Please try again later",
      } as Parameters<typeof toast.error>[1]);
    } finally {
      setIsDeleting(false);
    }
  };

  const paymentActions: TableAction<Payment>[] = React.useMemo(
    () => [
      {
        label: "Refund payment",
        onClick: (payment: Payment) => {
          setSelectedPaymentId(payment.id);
          setIsRefundModalOpen(true);
        },
      },
      {
        label: "Send receipt",
        onClick: (payment: Payment) => {
          console.log("Send receipt:", payment.id);
        },
      },
      {
        label: "Copy payment ID",
        onClick: (payment: Payment) => {
          navigator.clipboard.writeText(payment.id);
          toast.success("Payment ID copied to clipboard");
        },
      },
      {
        label: "View payment details",
        onClick: (payment: Payment) => {
          console.log("View payment details:", payment.id);
        },
      },
    ],
    []
  );

  if (!customer) {
    return (
      <div className="w-full">
        <DashboardSidebar>
          <DashboardSidebarInset>
            <div className="flex flex-col gap-6 p-6">
              <div className="py-12 text-center">
                <h1 className="mb-2 text-2xl font-bold">Customer not found</h1>
                <p className="text-muted-foreground mb-4">
                  The customer you&apos;re looking for doesn&apos;t exist.
                </p>
                <Button onClick={() => router.push("/dashboard/customers")}>
                  Back to Customers
                </Button>
              </div>
            </div>
          </DashboardSidebarInset>
        </DashboardSidebar>
      </div>
    );
  }

  const totalSpent = payments
    ?.filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  const isNewCustomer =
    new Date().getTime() - customer.createdAt.getTime() <
    7 * 24 * 60 * 60 * 1000;

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-6 p-4 sm:p-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard/customers">Customers</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>{customer.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h1 className="text-2xl font-bold sm:text-3xl">
                      {customer.name}
                    </h1>
                    {isNewCustomer && (
                      <Badge variant="secondary" className="text-xs">
                        New customer
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {customer.email}
                  </p>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  <Button
                    variant="outline"
                    className="w-full gap-2 shadow-none sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create payment</span>
                    <span className="sm:hidden">Payment</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 shadow-none sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create invoice</span>
                    <span className="sm:hidden">Invoice</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 cursor-pointer shadow-none"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        Edit customer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(
                            `/dashboard/transactions?customerId=${customerId}`
                          )
                        }
                      >
                        {" "}
                        View transactions
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setIsDeleteModalOpen(true)}
                      >
                        Delete customer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold sm:text-xl">Payments</h3>
                  <DataTable
                    columns={paymentColumns}
                    data={payments ?? []}
                    enableBulkSelect={false}
                    actions={paymentActions}
                    isLoading={isLoadingPayments}
                    skeletonRowCount={3}
                  />
                </div>

                {/* Wallet Address Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold sm:text-xl">
                      Wallet Address
                    </h3>
                    <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Add wallet address</span>
                    </Button>
                  </div>
                  {customer.walletAddresses &&
                  customer.walletAddresses.length > 0 ? (
                    <div className="space-y-3">
                      {customer.walletAddresses.map(({ address, memo }) => {
                        const isHidden = hiddenWallets.has(address);
                        return (
                          <div
                            key={address}
                            className="bg-muted/50 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <Image
                                src="/images/integrations/stellar-official.png"
                                alt="Stellar"
                                width={20}
                                height={20}
                                className="h-5 w-5 shrink-0 object-contain"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-mono text-xs break-all sm:text-sm">
                                  {isHidden ? "•".repeat(20) : address}
                                </div>
                                {memo && (
                                  <div className="text-muted-foreground mt-1 text-xs">
                                    {memo}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2 sm:self-center">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleToggleWalletVisibility(address)
                                }
                                aria-label={
                                  isHidden
                                    ? "Show wallet address"
                                    : "Hide wallet address"
                                }
                              >
                                {isHidden ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </Button>
                              <CopyButton
                                text={address}
                                label="Copy wallet address"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">No wallet address</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Insights Section */}
                <div className="mb-8 space-y-3">
                  <h3 className="text-lg font-semibold sm:text-xl">Insights</h3>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <div>
                        <div className="text-base font-bold">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(totalSpent ?? 0)}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Total spent
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold sm:text-xl">
                      Details
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-8 w-8"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit details</span>
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-muted-foreground mb-1 text-xs">
                          Customer ID
                        </div>
                        <div className="font-mono text-sm break-all">
                          cus_{customer.id}
                        </div>
                      </div>
                      <CopyButton
                        text={`cus_${customer.id}`}
                        label="Copy customer ID"
                      />
                    </div>

                    <Separator />

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-muted-foreground mb-1 text-xs">
                          Customer since
                        </div>
                        <div className="text-sm">
                          {customer.createdAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      <Clock className="text-muted-foreground h-4 w-4 shrink-0" />
                    </div>

                    <Separator />

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-muted-foreground mb-1 text-xs">
                          Billing email
                        </div>
                        <div className="text-sm break-all">
                          {customer.email}
                        </div>
                      </div>
                      <CopyButton
                        text={customer?.email || ""}
                        label="Copy email"
                      />
                    </div>

                    <Separator />

                    <div>
                      <div className="text-muted-foreground mb-1 text-xs">
                        Full Name
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {customer?.name || "-"}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button className="text-primary hover:text-primary/80 text-sm underline-offset-4 transition-colors hover:underline">
                      Show more
                    </button>
                  </div>
                </div>

                {/* Metadata Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold sm:text-xl">
                      Metadata
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-8 w-8"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit metadata</span>
                    </Button>
                  </div>

                  {customer?.appMetadata &&
                  Object.keys(customer?.appMetadata).length > 0 ? (
                    <CodeBlock
                      language="json"
                      showCopyButton={true}
                      maxHeight="none"
                      className="w-full"
                    >
                      {JSON.stringify(customer?.appMetadata, null, 2)}
                    </CodeBlock>
                  ) : (
                    <div className="border-muted-foreground/20 hover:border-muted-foreground/30 flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors">
                      <div className="space-y-1 text-center">
                        <div className="text-muted-foreground text-sm font-medium">
                          No metadata
                        </div>
                        <p className="text-muted-foreground/70 text-xs">
                          Add custom metadata to track additional information
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>

      {/* Refund Modal */}
      <RefundModal
        open={isRefundModalOpen}
        onOpenChange={(open) => {
          setIsRefundModalOpen(open);
          if (!open) {
            setSelectedPaymentId(null);
          }
        }}
        initialPaymentId={selectedPaymentId || undefined}
      />

      {/* Edit Customer Modal */}
      <CustomerModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        customer={customer ?? null}
      />

      {/* Delete Customer Modal */}
      <FullScreenModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Customer"
        description={`Are you sure you want to delete ${customer.name}? This action cannot be undone.`}
        size="small"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              No, Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteCustomer}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This will permanently delete the customer and all associated data.
          </p>
        </div>
      </FullScreenModal>
      <CodeBlock
        language="json"
        filename="metadata.json"
        showCopyButton={true}
        maxHeight="none"
        className="w-full"
      >
        {JSON.stringify(customer?.appMetadata || {}, null, 2)}
      </CodeBlock>
    </div>
  );
}
