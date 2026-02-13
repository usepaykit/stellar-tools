"use client";

import * as React from "react";

import { retrieveCustomers } from "@/actions/customers";
import { retrieveEvents } from "@/actions/event";
import { getCurrentOrganization } from "@/actions/organization";
import { retrievePayments } from "@/actions/payment";
import { retrieveProducts } from "@/actions/product";
import { CustomerModal } from "@/app/dashboard/(dashboard)/customers/page";
import { RefundModal } from "@/app/dashboard/(dashboard)/transactions/page";
import { CodeBlock } from "@/components/code-block";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable } from "@/components/data-table";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { SelectField } from "@/components/select-field";
import { TextAreaField, TextField } from "@/components/text-field";
import { Timeline } from "@/components/timeline";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { Payment } from "@/db";
import { useCopy } from "@/hooks/use-copy";
import { useInvalidateOrgQuery, useOrgQuery } from "@/hooks/use-org-query";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiClient, Checkout } from "@stellartools/core";
import { useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import _ from "lodash";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Edit,
  Eye,
  EyeOff,
  MoreHorizontal,
  Plus,
  XCircle,
} from "lucide-react";
import moment from "moment";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import * as RHF from "react-hook-form";
import { z } from "zod";

// --- Helpers ---

const formatXLM = (amt: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "XLM" }).format(amt);
const formatUSD = (amt: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amt);

// --- Reusable Internal Components ---

const StatusBadge = ({ status }: { status: Payment["status"] }) => {
  const variants = {
    confirmed: {
      cls: "bg-green-500/10 text-green-700 border-green-500/20",
      icon: CheckCircle2,
      label: "Confirmed",
    },
    pending: {
      cls: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
      icon: Clock,
      label: "Pending",
    },
    failed: { cls: "bg-red-500/10 text-red-700 border-red-500/20", icon: XCircle, label: "Failed" },
  };
  const { cls, icon: Icon, label } = variants[status as keyof typeof variants] || variants.pending;
  return (
    <Badge variant="outline" className={cn("gap-1.5 border", cls)}>
      <Icon className="h-3 w-3" /> {label}
    </Badge>
  );
};

const CopyBtn = ({ text }: { text: string }) => {
  const { copied, handleCopy } = useCopy();
  return (
    <button
      onClick={() => handleCopy({ text, message: "Copied" })}
      className="hover:bg-muted rounded-md p-1 transition-colors"
    >
      {copied ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="text-muted-foreground h-4 w-4" />
      )}
    </button>
  );
};

const DetailRow = ({ label, value, action, mono }: any) => (
  <div className="flex items-start justify-between gap-2">
    <div className="min-w-0 flex-1">
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      <div className={cn("text-sm", mono && "font-mono break-all")}>{value}</div>
    </div>
    {action}
  </div>
);

// --- Table Config ---

const paymentColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <span className="font-medium">{formatXLM(row.original.amount)}</span>,
  },
  {
    accessorKey: "checkoutId",
    header: "Description",
    cell: ({ row }) => <span className="text-muted-foreground font-mono text-sm">{row.original.checkoutId}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status as any} />,
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <div className="text-muted-foreground text-xs">{moment(row.original.createdAt).format("MMM DD, YYYY")}</div>
    ),
  },
];

// --- Page Component ---

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id: customerId } = useParams() as { id: string };
  const [hiddenWallets, setHiddenWallets] = React.useState<Set<string>>(new Set());

  const [modal, setModal] = React.useState<{
    type: "refund" | "edit" | "delete" | "checkout" | null;
    id?: string | null;
  }>({ type: null });

  const { data: payments, isLoading: isLoadingPayments } = useOrgQuery(["payments", customerId], () =>
    retrievePayments(undefined, { customerId: customerId }, undefined)
  );
  const { data: customer, isLoading: customerLoading } = useOrgQuery(["customer", customerId], () =>
    retrieveCustomers({ id: customerId }, { withWallets: true }).then(([c]) => c)
  );
  const { data: customerEvents, isLoading: isLoadingCustomerEvents } = useOrgQuery(
    ["customer-events", customerId],
    () => retrieveEvents({ customerId })
  );

  const totalSpent = React.useMemo(
    () => payments?.filter((p) => p.status === "confirmed").reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0,
    [payments]
  );

  const isNew = customer && new Date().getTime() - customer.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;

  if (customerLoading) return <CustomerDetailSkeleton />;

  if (!customer) return <NotFound router={router} />;

  return (
    <DashboardSidebar>
      <DashboardSidebarInset>
        <div className="flex flex-col gap-6 p-4 sm:p-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/customers">Customers</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{customer.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold sm:text-3xl">{customer.name}</h1>
                {isNew && <Badge variant="secondary">New customer</Badge>}
              </div>
              <p className="text-muted-foreground text-sm">{customer.email}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 shadow-none" onClick={() => setModal({ type: "checkout" })}>
                <CreditCard className="h-4 w-4" /> <span>Checkout</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shadow-none">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setModal({ type: "edit" })}>Edit customer</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setModal({ type: "delete" })}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section className="space-y-3">
                <h3 className="text-lg font-semibold">Payments</h3>
                <DataTable
                  columns={paymentColumns}
                  data={payments ?? []}
                  isLoading={isLoadingPayments}
                  actions={[
                    {
                      label: "Refund payment",
                      onClick: (p) => setModal({ type: "refund", id: p.id }),
                    },
                    {
                      label: "Copy ID",
                      onClick: (p) => {
                        navigator.clipboard.writeText(p.id);
                        toast.success("Copied");
                      },
                    },
                  ]}
                />
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold">Timeline</h3>

                <Timeline
                  limit={3}
                  isLoading={isLoadingCustomerEvents}
                  items={customerEvents ?? []}
                  renderItem={(evt) => ({
                    title: _.startCase(evt.type.replace(/[::$]/g, " ")),
                    date: moment(evt.createdAt).format("MMM DD, YYYY hh:mm A"),
                    data: evt.data,
                  })}
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Wallet Addresses</h3>
                  <Button variant="ghost" size="icon-sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {customer.wallets?.map(({ address, name }) => (
                    <div key={address} className="bg-muted/50 flex items-center gap-3 rounded-lg border p-4">
                      <Image
                        src="/images/integrations/stellar-official.png"
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-xs break-all sm:text-sm">
                          {hiddenWallets.has(address) ? "•".repeat(20) : address}
                        </div>
                        {name && <p className="text-muted-foreground text-[10px]">{name}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            const next = new Set(hiddenWallets);
                            next.has(address) ? next.delete(address) : next.add(address);
                            setHiddenWallets(next);
                          }}
                        >
                          {hiddenWallets.has(address) ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <CopyBtn text={address} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-8">
              <div>
                <h3 className="mb-2 text-lg font-semibold">Insights</h3>
                <p className="text-xl font-bold">{formatUSD(totalSpent)}</p>
                <p className="text-muted-foreground text-xs">Total spent</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Details</h3>
                  <Button variant="ghost" size="icon-sm" onClick={() => setModal({ type: "edit" })}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <DetailRow label="Customer ID" value={customer.id} mono action={<CopyBtn text={customer.id} />} />
                <Separator />
                <DetailRow label="Customer since" value={moment(customer.createdAt).format("MMM DD, YYYY")} />
                <Separator />
                <DetailRow label="Billing email" value={customer.email} action={<CopyBtn text={customer.email!} />} />
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Metadata</h3>
                {customer.metadata ? (
                  <CodeBlock language="json">{JSON.stringify(customer.metadata, null, 2)}</CodeBlock>
                ) : (
                  <div className="text-muted-foreground rounded-lg border-2 border-dashed p-6 text-center text-xs">
                    No metadata
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </DashboardSidebarInset>

      <RefundModal
        open={modal.type === "refund"}
        onOpenChange={() => setModal({ type: null })}
        initialPaymentId={modal.id!}
      />
      <CustomerModal open={modal.type === "edit"} onOpenChange={() => setModal({ type: null })} customer={customer} />
      <CheckoutModal
        open={modal.type === "checkout"}
        onOpenChange={() => setModal({ type: null })}
        customerId={customerId}
      />
    </DashboardSidebar>
  );
}

// --- Checkout Modal ---

const checkoutSchema = z.object({
  productId: z.string().min(1, "Product required"),
  description: z.string().optional(),
  successUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  successMessage: z.string().optional(),
});

function CheckoutModal({ open, onOpenChange, customerId }: any) {
  const invalidate = useInvalidateOrgQuery();
  const [createdUrl, setCreatedUrl] = React.useState<string | null>(null);
  const { handleCopy } = useCopy();

  const form = RHF.useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      productId: "",
      description: "",
      successUrl: "",
      successMessage: "",
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setCreatedUrl(null);
    form.reset();
  };

  const { data: productsData, isLoading: isLoadingProducts } = useOrgQuery(["products"], () => retrieveProducts());

  const products = React.useMemo(() => {
    return (
      productsData
        ?.filter((p) => p.product.status === "active")
        .map((p) => ({
          value: p.product.id,
          label: `${p.product.name} - ${p.product.priceAmount} ${p.asset.code}`,
          type: p.product.type,
          recurringPeriod: p.product.recurringPeriod,
        })) ?? []
    );
  }, [productsData]);

  const selectedProductId = form.watch("productId");
  const selectedProduct = React.useMemo(
    () => products.find((p) => p.value === selectedProductId),
    [products, selectedProductId]
  );

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof checkoutSchema>) => {
      const organization = await getCurrentOrganization();
      const api = new ApiClient({
        baseUrl: process.env.NEXT_PUBLIC_API_URL!,
        headers: { "x-auth-token": organization?.token! },
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      let subscriptionData = undefined;

      if (selectedProduct?.type === "subscription") {
        const periodStart = new Date();
        const periodEnd = new Date();

        switch (selectedProduct.recurringPeriod) {
          case "day":
            periodEnd.setDate(periodEnd.getDate() + 1);
            break;
          case "week":
            periodEnd.setDate(periodEnd.getDate() + 7);
            break;
          case "month":
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            break;
          case "year":
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            break;
        }

        subscriptionData = {
          periodStart,
          periodEnd,
          cancelAtPeriodEnd: false,
        };
      }

      const response = await api.post<Checkout>("/checkout?type=product", {
        customerId,
        customerEmail: undefined,
        customerPhone: undefined,
        productId: data.productId,
        description: data.description,
        successUrl: data.successUrl,
        successMessage: data.successMessage,
        subscriptionData,
        metadata: null,
      });

      if (response.isErr()) {
        throw new Error(response.error.message);
      }

      return response.value as Checkout;
    },
    onSuccess: async (data) => {
      invalidate(["payments", customerId]);
      toast.success("Checkout created");
      const url = `${process.env.NEXT_PUBLIC_CHECKOUT_URL}/${data.id}`;
      setCreatedUrl(url);
    },
  });

  return (
    <FullScreenModal
      open={open}
      onOpenChange={handleClose}
      title={createdUrl ? "Checkout Link Ready" : "Create Checkout"}
      description={
        createdUrl
          ? "The checkout session has been created. You can now share this link with the customer."
          : "Create a new checkout session for this customer."
      }
      size="small"
      footer={
        <div className="flex w-full justify-end gap-2">
          {createdUrl ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit((d) => mutation.mutate(d))} isLoading={mutation.isPending}>
                Create Checkout
              </Button>
            </>
          )}
        </div>
      }
    >
      {createdUrl ? (
        <div className="space-y-6 py-4">
          <div className="bg-muted/50 flex items-center justify-between gap-4 rounded-xl border p-4">
            <code className="text-muted-foreground flex-1 truncate text-sm">{createdUrl}</code>
            <Button variant="outline" size="sm" onClick={() => handleCopy({ text: createdUrl, message: "Copied" })}>
              Copy Link
            </Button>
          </div>
        </div>
      ) : (
        <form className="space-y-4 py-4">
          <RHF.Controller
            control={form.control}
            name="productId"
            render={({ field }) => (
              <SelectField
                id="productId"
                label="Product"
                items={products}
                value={field.value}
                onChange={field.onChange}
                isLoading={isLoadingProducts}
              />
            )}
          />
          <RHF.Controller
            control={form.control}
            name="description"
            render={({ field, fieldState: { error } }) => (
              <TextAreaField
                id="description"
                label="Description"
                {...field}
                value={field.value || ""}
                error={error?.message}
              />
            )}
          />

          <RHF.Controller
            control={form.control}
            name="successUrl"
            render={({ field, fieldState: { error } }) => (
              <TextField
                id="successUrl"
                label="Success URL"
                placeholder="https://example.com/success"
                {...field}
                value={field.value || ""}
                error={error?.message}
              />
            )}
          />

          <RHF.Controller
            control={form.control}
            name="successMessage"
            render={({ field, fieldState: { error } }) => (
              <TextField
                id="successMessage"
                label="Success Message"
                placeholder="Thanks for your purchase!"
                {...field}
                value={field.value || ""}
                error={error?.message}
              />
            )}
          />
        </form>
      )}
    </FullScreenModal>
  );
}

function NotFound({ router }: any) {
  return (
    <DashboardSidebar>
      <DashboardSidebarInset>
        <div className="py-24 text-center">
          <h1 className="text-xl font-bold">Customer not found</h1>
          <Button onClick={() => router.push("/customers")} className="mt-4">
            Back
          </Button>
        </div>
      </DashboardSidebarInset>
    </DashboardSidebar>
  );
}

function CustomerDetailSkeleton() {
  return (
    <DashboardSidebar>
      <DashboardSidebarInset>
        <div className="flex flex-col gap-6 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>

          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-5 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-9" />
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <div className="space-y-2 rounded-lg border p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-8 w-8" />
                </div>
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-muted/50 flex items-center gap-3 rounded-lg border p-4">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-8">
              <div className="space-y-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                    </div>
                    {i < 3 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            </aside>
          </div>
        </div>
      </DashboardSidebarInset>
    </DashboardSidebar>
  );
}
