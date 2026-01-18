"use client";

import * as React from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { NumberPicker } from "@/components/number-picker";
import { TextField } from "@/components/text-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { PayoutStatus } from "@/constant/schema.client";
import { Payout } from "@/db";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Banknote, Calendar, CheckCircle2, Circle, Clock, Coins, Plus, Wallet, XCircle } from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import * as RHF from "react-hook-form";
import { z } from "zod";

import { generateAndDownloadReceipt } from "./[id]/page";

const mockPayouts: Payout[] = [
  {
    id: "1",
    organizationId: "1",
    walletAddress: "GABC...ABCD",
    memo: null,
    status: "pending",
    amount: 91.94,
    environment: "testnet",
    transactionHash: "0xabc...",
    createdAt: new Date(),
    completedAt: new Date(),
    metadata: null,
  },
  {
    id: "2",
    organizationId: "1",
    walletAddress: "GXYZ...CDEF",
    memo: null,
    status: "succeeded",
    amount: 76.45,
    environment: "testnet",
    transactionHash: "0xabc...",
    createdAt: new Date(),
    completedAt: new Date(),
    metadata: null,
  },
  {
    id: "3",
    organizationId: "1",
    walletAddress: "GABC...ABCD",
    memo: null,
    status: "succeeded",
    amount: 150.0,
    environment: "testnet",
    transactionHash: "0xabc...",
    createdAt: new Date(),
    completedAt: new Date(),
    metadata: null,
  },
  {
    id: "4",
    organizationId: "1",
    walletAddress: "GXYZ...CDEF",
    memo: null,
    status: "succeeded",
    amount: 200.5,
    environment: "testnet",
    transactionHash: "0xabc...",
    createdAt: new Date(),
    completedAt: new Date(),
    metadata: null,
  },
];

const StatusBadge = ({ status }: { status: PayoutStatus }) => {
  const variants = {
    pending: {
      className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
      icon: Clock,
      label: "Pending",
    },
    succeeded: {
      className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      icon: CheckCircle2,
      label: "Succeeded",
    },
    failed: {
      className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      icon: XCircle,
      label: "Failed",
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

// --- Payout Method Display Component ---

const PayoutMethodDisplay = ({ method }: { method: Payout["walletAddress"] }) => {
  return (
    <div className="flex items-center gap-2">
      <Wallet className="text-muted-foreground h-4 w-4" />
      <span className="font-mono text-sm">
        {method.slice(0, 8)}...{method.slice(-4)}
      </span>
    </div>
  );
};

const columns: ColumnDef<Payout>[] = [
  {
    accessorKey: "date",
    header: () => (
      <div className="flex items-center gap-2">
        <Calendar className="text-muted-foreground h-4 w-4" />
        <span>Date</span>
      </div>
    ),
    cell: ({ row }) => <div className="text-sm">{moment(row.original.createdAt).format("DD MMM YYYY")}</div>,
  },
  {
    accessorKey: "walletAddress",
    header: () => (
      <div className="flex items-center gap-2">
        <Wallet className="text-muted-foreground h-4 w-4" />
        <span>Payout method</span>
      </div>
    ),
    cell: ({ row }) => <PayoutMethodDisplay method={row.original.walletAddress} />,
  },
  {
    accessorKey: "status",
    header: () => (
      <div className="flex items-center gap-2">
        <Circle className="text-muted-foreground h-4 w-4" />
        <span>Status</span>
      </div>
    ),
    cell: ({ row }) => {
      return <StatusBadge status={row.original.status as PayoutStatus} />;
    },
  },
  {
    accessorKey: "amount",
    header: () => (
      <div className="flex items-center gap-2">
        <Coins className="text-muted-foreground h-4 w-4" />
        <span>Amount</span>
      </div>
    ),
    cell: ({ row }) => <div className="text-sm font-medium">{row.original.amount} XLM</div>,
  },
];

const requestPayoutSchema = z
  .object({
    paymentMethod: z.enum(["wallet", "bank"]),
    amount: z.number().optional(),
    walletAddress: z.string(),
    memo: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod === "wallet") {
        return data.amount !== undefined && !isNaN(data.amount) && data.amount > 0;
      }
      return true;
    },
    {
      message: "Amount must be greater than 0",
      path: ["amount"],
    }
  );

type RequestPayoutFormData = z.infer<typeof requestPayoutSchema>;

function RequestPayoutModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const form = RHF.useForm<RequestPayoutFormData>({
    resolver: zodResolver(requestPayoutSchema),
    defaultValues: {
      paymentMethod: "wallet",
      amount: undefined,
      walletAddress: "",
      memo: "",
    },
  });

  const paymentMethod = RHF.useWatch({
    control: form.control,
    name: "paymentMethod",
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        paymentMethod: "wallet",
        amount: undefined,
        walletAddress: "",
        memo: "",
      });
    }
  }, [open, form]);

  const requestPayoutMutation = useMutation({
    mutationFn: async (data: RequestPayoutFormData) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      toast.success("Payout request submitted successfully!");
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to submit payout request");
    },
  });

  const onSubmit = (data: RequestPayoutFormData) => {
    requestPayoutMutation.mutate(data);
  };

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title="Request Payout"
      description="Request a payout to your preferred payment method"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={requestPayoutMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={requestPayoutMutation.isPending}>
            {requestPayoutMutation.isPending ? "Submitting..." : "Request Payout"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h3 className="mb-1 text-sm font-semibold">Payment Method</h3>
          <p className="text-muted-foreground text-xs">Choose how you want to receive your payout</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant={paymentMethod === "wallet" ? "default" : "outline"}
            className={cn(
              "flex h-auto items-center gap-2 px-4 py-3",
              paymentMethod === "wallet" && "bg-primary text-primary-foreground"
            )}
            onClick={() => {
              form.setValue("paymentMethod", "wallet");
              form.clearErrors();
            }}
          >
            <Wallet className="h-4 w-4" />
            <span>Wallet Address</span>
            {paymentMethod === "wallet" && <CheckCircle2 className="ml-1 h-4 w-4" />}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled
            className="flex h-auto items-center gap-2 px-4 py-3 opacity-60"
            onClick={() => {
              toast.info("Local bank payouts coming soon!");
            }}
          >
            <Banknote className="h-4 w-4" />
            <span>Local Bank</span>
            <Badge variant="outline" className="ml-1 h-4 px-1.5 py-0 text-xs">
              Soon
            </Badge>
          </Button>
        </div>

        {paymentMethod === "wallet" && (
          <div className="max-w-2xl space-y-5 border-t pt-6">
            <RHF.Controller
              control={form.control}
              name="amount"
              render={({ field, fieldState: { error } }) => (
                <NumberPicker
                  id="amount"
                  value={field.value}
                  onChange={field.onChange}
                  label="Amount"
                  allowDecimal={true}
                  error={error?.message}
                  placeholder="0.00"
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
                  placeholder="GABCDEF1234567890..."
                  className="shadow-none"
                />
              )}
            />

            <RHF.Controller
              control={form.control}
              name="memo"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  id={field.name}
                  value={field.value as string}
                  label="Memo (Optional)"
                  error={error?.message}
                  placeholder="Add a memo for this payout"
                  className="shadow-none"
                />
              )}
            />
          </div>
        )}
      </div>
    </FullScreenModal>
  );
}

// --- Main Page Component ---

export default function PayoutPage() {
  const router = useRouter();
  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);

  const tableActions: TableAction<Payout>[] = [
    {
      label: "View Details",
      onClick: (row) => {
        router.push(`/dashboard/payout/${row.id}`);
      },
    },
    {
      label: "Download Receipt",
      onClick: async (row) => {
        const downloadPromise = generateAndDownloadReceipt(row, "StellarTools");
        toast.promise(downloadPromise, {
          loading: "Generating receipt...",
          success: "Receipt downloaded successfully",
          error: "Failed to download receipt",
        });
      },
    },
  ];

  return (
    <DashboardSidebar>
      <DashboardSidebarInset>
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Payout history</h1>
              <p className="text-muted-foreground mt-1 text-sm">See the payout history for this store</p>
            </div>
            <Button onClick={() => setIsRequestModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </div>

          <DataTable
            className="border-x-0"
            columns={columns}
            data={mockPayouts}
            actions={tableActions}
            onRowClick={(row) => {
              router.push(`/dashboard/payout/${row.id}`);
            }}
          />

          <div className="text-muted-foreground text-sm">
            {mockPayouts.length} result{mockPayouts.length !== 1 ? "s" : ""}
          </div>
        </div>

        <RequestPayoutModal open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen} />
      </DashboardSidebarInset>
    </DashboardSidebar>
  );
}
