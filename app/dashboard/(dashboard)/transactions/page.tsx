"use client";

import * as React from "react";

import { retrieveCustomerWallets } from "@/actions/customers";
import { retrievePayments } from "@/actions/payment";
import { AppModal } from "@/components/app-modal";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import { SelectField } from "@/components/select-field";
import { TextAreaField, TextField } from "@/components/text-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { PaymentStatus } from "@/constant/schema.client";
import { Customer } from "@/db";
import { useCopy } from "@/hooks/use-copy";
import { useInvalidateOrgQuery, useOrgContext, useOrgQuery } from "@/hooks/use-org-query";
import { cn, formatCurrency, truncate } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiClient } from "@stellartools/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Clock, Copy, Download, Plus, Settings, Wallet, XCircle } from "lucide-react";
import moment from "moment";
import { useRouter, useSearchParams } from "next/navigation";
import * as RHF from "react-hook-form";
import { z } from "zod";

// --- Types ---

type Transaction = {
  id: string;
  amount: string;
  asset: string;
  paymentMethod: {
    type: "wallet";
    address: string;
  };
  description: string;
  customer: Customer;
  date: Date;
  refundedDate?: Date;
  status: PaymentStatus;
};

// --- Status Badge Component ---

const StatusBadge = ({ status }: { status: PaymentStatus | "refunded" }) => {
  const variants = {
    confirmed: {
      className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      icon: CheckCircle2,
      label: "Confirmed",
    },
    refunded: {
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      icon: CheckCircle2,
      label: "Refunded",
    },
    failed: {
      className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      icon: XCircle,
      label: "Failed",
    },
    pending: {
      className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
      icon: Clock,
      label: "Pending",
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

// --- Copy Wallet Address Component ---

const CopyWalletAddress = ({ address }: { address: string }) => {
  const { copied, handleCopy } = useCopy();

  const displayAddress = truncate(address, { start: 4, end: 4 });

  return (
    <div className="flex items-center gap-2">
      <Wallet className="text-muted-foreground h-4 w-4" />
      <span className="font-mono text-sm">{displayAddress}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-6 w-6"
        onClick={(e) => {
          e.stopPropagation();
          handleCopy({
            text: address,
            message: "Wallet address copied to clipboard",
          });
        }}
        title="Copy wallet address"
      >
        {copied ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="text-muted-foreground h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

// --- Table Columns ---

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const transaction = row.original;
      return <div className="font-semibold">{formatCurrency(Number(transaction.amount), transaction.asset)}</div>;
    },
  },
  {
    accessorKey: "paymentMethod",
    header: "Payment method",
    cell: ({ row }) => {
      const transaction = row.original;
      return <CopyWalletAddress address={transaction.paymentMethod.address} />;
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      return <div className="text-muted-foreground font-mono text-sm">{row.original.description}</div>;
    },
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      return <div className="text-sm">{row.original.customer.email}</div>;
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.original.date;
      return <div className="text-muted-foreground text-sm">{moment(date).format("MMM D, h:mm A")}</div>;
    },
  },
  {
    accessorKey: "refundedDate",
    header: "Refunded date",
    cell: ({ row }) => {
      const refundedDate = row.original.refundedDate;
      return (
        <div className="text-muted-foreground text-sm">
          {refundedDate ? moment(refundedDate).format("MMM D, h:mm A") : "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return <StatusBadge status={row.original.status} />;
    },
  },
];

// --- Refund Modal Schema ---

const refundSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  walletAddress: z.string().optional(),
  customerWalletId: z.string().optional(),
  reason: z.string().optional(),
});

type RefundFormData = z.infer<typeof refundSchema>;

// --- Refund Modal Footer ---

export function RefundModalFooter({
  onClose,
  submitRef,
  isPending,
}: {
  onClose: () => void;
  submitRef: React.MutableRefObject<(() => void) | null>;
  isPending: boolean;
}) {
  return (
    <div className="flex w-full justify-end gap-2">
      <Button variant="ghost" type="button" onClick={onClose} disabled={isPending}>
        Cancel
      </Button>
      <Button onClick={() => submitRef.current?.()} disabled={isPending} isLoading={isPending}>
        Create refund
      </Button>
    </div>
  );
}

// --- Refund Modal Component ---

export function RefundModalContent({
  initialPaymentId,
  onClose,
  onSuccess,
  setSubmitRef,
  onFooterChange,
}: {
  initialPaymentId?: string;
  onClose: () => void;
  onSuccess: () => void;
  setSubmitRef?: React.MutableRefObject<(() => void) | null>;
  onFooterChange?: (props: { isPending: boolean }) => void;
}) {
  const { data: orgContext } = useOrgContext();
  const form = RHF.useForm<RefundFormData>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      paymentId: initialPaymentId ?? "",
      walletAddress: "",
      customerWalletId: "",
      reason: "",
    },
  });

  const paymentId = form.watch("paymentId");

  const { data: payments } = useQuery({
    queryKey: ["refund-payment", paymentId?.trim()],
    queryFn: () => retrievePayments(undefined, undefined, { paymentId: paymentId!.trim() }),
    enabled: !!paymentId?.trim(),
  });

  const payment = payments?.[0] ?? null;

  const showWalletField = !!payment && !payment.customerWalletId;
  const showWalletSelect = showWalletField && !!payment?.customerId;
  const showWalletText = showWalletField && !payment?.customerId;

  const { data: customerWalletsList = [], isLoading: isLoadingWallets } = useQuery({
    queryKey: ["refund-customer-wallets", payment?.customerId],
    queryFn: () => retrieveCustomerWallets(payment!.customerId!),
    enabled: !!payment?.customerId && showWalletField,
  });

  React.useEffect(() => {
    if (initialPaymentId) form.setValue("paymentId", initialPaymentId);
  }, [initialPaymentId, form]);

  const createRefundMutation = useMutation({
    mutationFn: async (data: RefundFormData) => {
      if (!orgContext) throw new Error("No organization context found");

      const paymentRow = await retrievePayments(undefined, undefined, { paymentId: data.paymentId }).then(([p]) => p);

      let receiverPublicKey: string;
      if (paymentRow.customerWalletId && paymentRow.customerId) {
        const wallets = await retrieveCustomerWallets(paymentRow.customerId, { id: paymentRow.customerWalletId });
        const wallet = Array.isArray(wallets) ? wallets[0] : wallets;
        if (!wallet?.address) throw new Error("Customer wallet not found");
        receiverPublicKey = wallet.address;
      } else if (paymentRow.customerId && data.customerWalletId?.trim()) {
        const wallets = await retrieveCustomerWallets(paymentRow.customerId, { id: data.customerWalletId.trim() });
        const wallet = Array.isArray(wallets) ? wallets[0] : wallets;
        if (!wallet?.address) throw new Error("Customer wallet not found");
        receiverPublicKey = wallet.address;
      } else {
        if (!data.walletAddress?.trim()) throw new Error("Wallet address is required");
        receiverPublicKey = data.walletAddress.trim();
      }

      const api = new ApiClient({
        baseUrl: process.env.NEXT_PUBLIC_API_URL!,
        headers: { "x-auth-token": orgContext?.token! },
      });

      const result = await api.post<{ id: string }>("/refunds", {
        paymentId: data.paymentId,
        customerId: paymentRow.customerId,
        assetId: paymentRow.assetId,
        amount: paymentRow.amount,
        receiverPublicKey,
        reason: data.reason ?? null,
        metadata: null,
      });

      if (result.isErr()) throw new Error(result.error.message);

      return result.value;
    },
    onSuccess: () => {
      toast.success("Refund created successfully!");
      form.reset();
      onSuccess();
    },
    onError: () => toast.error("Failed to create refund"),
  });

  const onSubmit = (data: RefundFormData) => {
    if (showWalletField && payment?.customerId && !data.customerWalletId?.trim()) {
      form.setError("customerWalletId", { message: "Select a wallet to refund to" });
      return;
    }
    if (showWalletField && !payment?.customerId && !data.walletAddress?.trim()) {
      form.setError("walletAddress", { message: "Wallet address is required" });
      return;
    }
    createRefundMutation.mutate(data);
  };

  const submitForm = React.useCallback(() => {
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  React.useEffect(() => {
    if (!setSubmitRef) return;
    setSubmitRef.current = submitForm;
    return () => {
      setSubmitRef.current = null;
    };
  }, [setSubmitRef, submitForm]);

  React.useEffect(() => {
    onFooterChange?.({ isPending: createRefundMutation.isPending });
  }, [createRefundMutation.isPending, onFooterChange]);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-6">
        {showWalletSelect && (
          <RHF.Controller
            control={form.control}
            name="customerWalletId"
            render={({ field, fieldState: { error } }) => (
              <SelectField
                id="customerWalletId"
                label="Refund to wallet"
                value={field.value ?? ""}
                onChange={field.onChange}
                items={customerWalletsList.map((w: { id: string; address: string }) => ({
                  value: w.id,
                  label: truncate(w.address, { start: 6, end: 6 }),
                }))}
                placeholder="Select wallet"
                error={error?.message}
                isLoading={isLoadingWallets}
              />
            )}
          />
        )}
        {showWalletText && (
          <RHF.Controller
            control={form.control}
            name="walletAddress"
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                value={field.value ?? ""}
                id="walletAddress"
                label="Wallet Address"
                error={error?.message}
                placeholder="Enter wallet address"
                className="shadow-none"
              />
            )}
          />
        )}

        <RHF.Controller
          control={form.control}
          name="reason"
          render={({ field, fieldState: { error } }) => (
            <TextAreaField
              {...field}
              value={field.value ?? ""}
              id="reason"
              label="Reason"
              error={error?.message}
              placeholder="Enter reason for refund (optional)"
              className="min-h-[120px] shadow-none"
            />
          )}
        />
      </div>
      <div className="flex shrink-0 justify-end gap-2 border-t pt-4">
        <Button variant="outline" type="button" onClick={onClose} disabled={createRefundMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={createRefundMutation.isPending}
          isLoading={createRefundMutation.isPending}
        >
          {createRefundMutation.isPending ? "Creating..." : "Create refund"}
        </Button>
      </div>
    </div>
  );
}

// --- Main Component ---

type TabType = "all" | "refunded" | PaymentStatus;

function TransactionsPageContent() {
  const searchParams = useSearchParams();
  const customerId = searchParams?.get("customer");
  const paymentId = searchParams?.get("paymentId");
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<TabType>("all");
  const invalidate = useInvalidateOrgQuery();

  const refundModalSubmitRef = React.useRef<(() => void) | null>(null);
  const [refundModalFooterProps, setRefundModalFooterProps] = React.useState({
    isPending: false,
  });
  const isRefundModalOpenRef = React.useRef(false);

  React.useEffect(() => {
    if (!isRefundModalOpenRef.current) return;
    AppModal.updateConfig({
      footer: (
        <RefundModalFooter
          onClose={AppModal.close}
          submitRef={refundModalSubmitRef}
          isPending={refundModalFooterProps.isPending}
        />
      ),
    });
  }, [refundModalFooterProps.isPending]);

  const openRefundModal = React.useCallback(
    (initialPaymentId?: string) => {
      isRefundModalOpenRef.current = true;
      setRefundModalFooterProps({ isPending: false });
      AppModal.open({
        title: "Create Refund",
        description: "Process a refund for a transaction by providing the payment details.",
        content: (
          <RefundModalContent
            initialPaymentId={initialPaymentId}
            onClose={() => {
              isRefundModalOpenRef.current = false;
              AppModal.close();
            }}
            onSuccess={() => {
              invalidate(["refunds"]);
              isRefundModalOpenRef.current = false;
              AppModal.close();
            }}
            setSubmitRef={refundModalSubmitRef}
            onFooterChange={(props) => setRefundModalFooterProps(props)}
          />
        ),
        footer: <RefundModalFooter onClose={AppModal.close} submitRef={refundModalSubmitRef} isPending={false} />,
        size: "small",
        showCloseButton: true,
      });
    },
    [invalidate]
  );

  const { data: payments, isLoading } = useOrgQuery(["payments"], () =>
    retrievePayments(undefined, undefined, undefined, { withRefunds: true, withAsset: true, withCustomer: true })
  );

  const stats = React.useMemo(() => {
    if (!payments?.length) {
      return { all: 0, succeeded: 0, refunded: 0, failed: 0 };
    }

    return payments.reduce(
      (acc, p) => ({
        ...acc,
        all: acc.all + 1,
        succeeded: acc.succeeded + (p.status === "confirmed" ? 1 : 0),
        refunded: acc.refunded + (p.refunds?.status === "succeeded" ? 1 : 0),
        failed: acc.failed + (p.status === "failed" ? 1 : 0),
      }),
      { all: 0, succeeded: 0, refunded: 0, failed: 0 }
    );
  }, [payments]);

  const filteredTransactions = React.useMemo(() => {
    if (!payments?.length) return [];

    return payments.filter((p) => {
      if (customerId && p.customer?.email !== customerId) return false;

      if (paymentId) {
        const matchesId = p.id === paymentId || p.checkoutId === paymentId;
        if (!matchesId) return false;
      }

      console.log({ p, activeTab });

      if (activeTab === "all") return true;
      if (activeTab === "refunded") return p.refunds?.status === "succeeded";
      return p.status === activeTab;
    });
  }, [payments, activeTab, customerId, paymentId]);

  const tableActions = (row: Transaction): TableAction<Transaction>[] => {
    const actions: Array<TableAction<Transaction>> = [
      {
        label: "View details",
        onClick: (transaction) => router.push(`/transactions/${transaction.id}`),
      },
      {
        label: "Delete",
        onClick: (transaction) => console.log("Delete", transaction),
        variant: "destructive",
      },
    ];

    if (row.status === "confirmed") {
      actions.push({ label: "Refund", onClick: (transaction) => openRefundModal(transaction.description) });
    }

    return actions;
  };

  const tabs = [
    { id: "all" as TabType, label: "All", count: stats.all },
    { id: "confirmed" as TabType, label: "Succeeded", count: stats.succeeded },
    { id: "refunded" as TabType, label: "Refunded", count: stats.refunded },
    { id: "failed" as TabType, label: "Failed", count: stats.failed },
  ];

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-8 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button className="gap-2 shadow-sm" onClick={() => openRefundModal()}>
                  <Plus className="h-4 w-4" />
                  Create refund
                </Button>
              </div>
            </div>

            <div className="border-border flex items-center gap-1 border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "hover:text-foreground relative px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === tab.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                  {activeTab === tab.id && <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {tabs.map((tab) => (
                <Card
                  key={tab.id}
                  className={cn(
                    "cursor-pointer shadow-none transition-colors",
                    activeTab === tab.id && "border-primary"
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-sm font-medium">{tab.label}</p>
                      <p className="text-2xl font-bold tracking-tight">{tab.count}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Edit columns
                </Button>
              </div>
            </div>

            <div className="overflow-hidden">
              <DataTable
                columns={columns}
                data={filteredTransactions.map((it) => ({
                  id: it.id,
                  amount: it.amount.toString(),
                  asset: it.asset?.code ?? "",
                  paymentMethod: {
                    type: "wallet" as const,
                    address: it.transactionHash,
                  },
                  description: it.checkoutId || it.id,
                  customer: it.customer!,
                  date: it.createdAt,
                  status: (it.refunds?.status === "succeeded" ? "refunded" : it.status) as PaymentStatus,
                  refundedDate: it.refunds?.createdAt ?? undefined,
                }))}
                enableBulkSelect={true}
                actions={tableActions}
                isLoading={isLoading}
              />
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <TransactionsPageContent />
    </React.Suspense>
  );
}
