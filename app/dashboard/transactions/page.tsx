"use client";

import * as React from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { TextAreaField, TextField } from "@/components/input-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import * as RHF from "react-hook-form";
import { z } from "zod";
import {
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Plus,
  Settings,
  Wallet,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---

type TransactionStatus =
  | "succeeded"
  | "refunded"
  | "failed";

type Transaction = {
  id: string;
  amount: string;
  asset: string;
  paymentMethod: {
    type: "wallet";
    address: string;
  };
  description: string;
  customer: {
    email: string;
    name?: string;
  };
  date: Date;
  refundedDate?: Date;
  status: TransactionStatus;
};

// --- Mock Data ---

const mockTransactions: Transaction[] = [
  {
    id: "tx_1",
    amount: "6.00",
    asset: "USD",
    paymentMethod: {
      type: "wallet",
      address: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    },
    description: "pi_3Sh7CESF0MtsiMvy1FkUbs8V",
    customer: {
      email: "abramson@theleadgenerationguys.com",
    },
    date: new Date("2024-12-22T16:52:00"),
    status: "succeeded",
  },
  {
    id: "tx_2",
    amount: "9.00",
    asset: "USD",
    paymentMethod: {
      type: "wallet",
      address: "GYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
    },
    description: "pi_3Sh7CESF0MtsiMvy1FkUbs8W",
    customer: {
      email: "customer@example.com",
    },
    date: new Date("2024-12-22T15:30:00"),
    status: "succeeded",
  },
  {
    id: "tx_3",
    amount: "12.00",
    asset: "USD",
    paymentMethod: {
      type: "wallet",
      address: "GZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
    },
    description: "pi_3Sh7CESF0MtsiMvy1FkUbs8X",
    customer: {
      email: "user@example.com",
    },
    date: new Date("2024-12-22T14:15:00"),
    status: "succeeded",
  },
  {
    id: "tx_4",
    amount: "3.00",
    asset: "USD",
    paymentMethod: {
      type: "wallet",
      address: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    description: "pi_3Sh7CESF0MtsiMvy1FkUbs8Y",
    customer: {
      email: "chris@1secondleads.com",
    },
    date: new Date("2024-12-21T10:20:00"),
    status: "failed",
  },
  {
    id: "tx_5",
    amount: "8400.00",
    asset: "INR",
    paymentMethod: {
      type: "wallet",
      address: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
    },
    description: "pi_3Sh7CESF0MtsiMvy1FkUbs8Z",
    customer: {
      email: "yogi@branale.com",
    },
    date: new Date("2024-12-20T09:45:00"),
    status: "failed",
  },
  {
    id: "tx_6",
    amount: "15.00",
    asset: "USD",
    paymentMethod: {
      type: "wallet",
      address: "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
    },
    description: "pi_3Sh7CESF0MtsiMvy1FkUbs9A",
    customer: {
      email: "refund@example.com",
    },
    date: new Date("2024-12-19T12:00:00"),
    refundedDate: new Date("2024-12-20T10:00:00"),
    status: "refunded",
  },
  {
    id: "tx_8",
    amount: "8.00",
    asset: "USD",
    paymentMethod: {
      type: "wallet",
      address: "GEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
    },
    description: "pi_3Sh7CESF0MtsiMvy1FkUbs9C",
    customer: {
      email: "customer2@example.com",
    },
    date: new Date("2024-12-17T13:20:00"),
    status: "succeeded",
  },
];

// --- Status Badge Component ---

const StatusBadge = ({ status }: { status: TransactionStatus }) => {
  const variants = {
    succeeded: {
      className:
        "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      icon: CheckCircle2,
      label: "Succeeded",
    },
    refunded: {
      className:
        "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      icon: CheckCircle2,
      label: "Refunded",
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

// --- Copy Wallet Address Component ---

const CopyWalletAddress = ({ address }: { address: string }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <div className="flex items-center gap-2">
      <Wallet className="h-4 w-4 text-muted-foreground" />
      <span className="font-mono text-sm">{displayAddress}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-6 w-6"
        onClick={(e) => {
          e.stopPropagation();
          handleCopy();
        }}
        title="Copy wallet address"
      >
        <Copy className={cn("h-3 w-3", copied && "text-green-600")} />
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
      return (
        <div className="font-semibold">
          {transaction.asset === "USD" ? "$" : "₹"}
          {parseFloat(transaction.amount).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          {transaction.asset}
        </div>
      );
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
      return (
        <div className="font-mono text-sm text-muted-foreground">
          {row.original.description}
        </div>
      );
    },
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {row.original.customer.email}
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.original.date;
      return (
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "refundedDate",
    header: "Refunded date",
    cell: ({ row }) => {
      const refundedDate = row.original.refundedDate;
      return (
        <div className="text-sm text-muted-foreground">
          {refundedDate
            ? refundedDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : "—"}
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
  walletAddress: z.string().min(1, "Wallet Address is required"),
  reason: z.string().min(1, "Reason is required"),
});

type RefundFormData = z.infer<typeof refundSchema>;

// --- Refund Modal Component ---

export function RefundModal({
  open,
  onOpenChange,
  initialPaymentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPaymentId?: string;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = RHF.useForm<RefundFormData>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      paymentId: initialPaymentId || "",
      walletAddress: "",
      reason: "",
    },
  });

  // Update form when initialPaymentId changes
  React.useEffect(() => {
    if (initialPaymentId) {
      form.setValue("paymentId", initialPaymentId);
    }
  }, [initialPaymentId, form]);

  const onSubmit = async (data: RefundFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Refund data:", data);
      toast.success("Refund created successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create refund");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create Refund"
      description="Process a refund for a transaction by providing the payment details."
      footer={
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create refund
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <RHF.Controller
          control={form.control}
          name="paymentId"
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              id="paymentId"
              label="Payment ID"
              error={error?.message}
              placeholder="Enter payment ID"
              className="shadow-none"
            />
          )}
        />

        <RHF.Controller
          control={form.control}
          name="walletAddress"
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              id="walletAddress"
              label="Wallet Address"
              error={error?.message}
              placeholder="Enter wallet address"
              className="shadow-none"
            />
          )}
        />

        <RHF.Controller
          control={form.control}
          name="reason"
          render={({ field, fieldState: { error } }) => (
            <TextAreaField
              {...field}
              value={field.value}
              id="reason"
              label="Reason"
              error={error?.message}
              placeholder="Enter reason for refund"
              className="shadow-none min-h-[120px]"
            />
          )}
        />
      </div>
    </FullScreenModal>
  );
}

// --- Main Component ---

type TabType = "all" | TransactionStatus;

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = React.useState<TabType>("all");
  const [isRefundModalOpen, setIsRefundModalOpen] = React.useState(false);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const all = mockTransactions.length;
    const succeeded = mockTransactions.filter(
      (t) => t.status === "succeeded"
    ).length;
    const refunded = mockTransactions.filter(
      (t) => t.status === "refunded"
    ).length;
    const failed = mockTransactions.filter((t) => t.status === "failed").length;

    return { all, succeeded, refunded, failed };
  }, []);

  // Filter transactions based on active tab
  const filteredTransactions = React.useMemo(() => {
    if (activeTab === "all") {
      return mockTransactions;
    }
    return mockTransactions.filter((t) => t.status === activeTab);
  }, [activeTab]);

  const tableActions: TableAction<Transaction>[] = [
    { label: "View details", onClick: (transaction) => console.log(transaction) },
    { label: "Refund", onClick: (transaction) => console.log("Refund", transaction) },
    {
      label: "Delete",
      onClick: (transaction) => console.log("Delete", transaction),
      variant: "destructive",
    },
  ];

  const tabs = [
    { id: "all" as TabType, label: "All", count: stats.all },
    { id: "succeeded" as TabType, label: "Succeeded", count: stats.succeeded },
    { id: "refunded" as TabType, label: "Refunded", count: stats.refunded },
    { id: "failed" as TabType, label: "Failed", count: stats.failed },
  ];

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-8 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Transactions
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="gap-2 shadow-sm"
                  onClick={() => setIsRefundModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create refund
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium transition-colors hover:text-foreground",
                    activeTab === tab.id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({tab.count})
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {tabs.map((tab) => (
                <Card
                  key={tab.id}
                  className={cn(
                    "shadow-none cursor-pointer transition-colors",
                    activeTab === tab.id && "border-primary"
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {tab.label}
                      </p>
                      <p className="text-2xl font-bold tracking-tight">
                        {tab.count}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Actions */}
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

            {/* Data Table */}
            <div className="overflow-hidden rounded-lg border border-border/50">
              <DataTable
                columns={columns}
                data={filteredTransactions}
                enableBulkSelect={true}
                actions={tableActions}
              />
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>

      {/* Refund Modal */}
      <RefundModal
        open={isRefundModalOpen}
        onOpenChange={setIsRefundModalOpen}
      />
    </div>
  );
}

