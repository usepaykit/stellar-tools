"use client";

import * as React from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
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
import { useCopy } from "@/hooks/use-copy";
import { generateAndDownloadReceipt } from "@/lib/payout-receipt-utils";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
  Wallet,
} from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";

type PayoutStatus = "pending" | "paid";

export const payoutSchema = z.object({
  id: z.string().min(1, "Payout ID is required"),
  date: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  payoutMethod: z.object({
    address: z.string().min(1, "Wallet address is required"),
  }),
  status: z.enum(["pending", "paid"]),
  amount: z.string().min(1, "Amount is required"),
  asset: z.string().min(1, "Asset is required"),
  memo: z.string().optional(),
  transactionHash: z.string().optional(),
  environment: z.enum(["test", "live"]).optional(),
  fees: z.string().optional(),
  netAmount: z.string().optional(),
  requestedAt: z.coerce.date().optional(),
  processedAt: z.coerce.date().optional(),
});

export type Payout = z.infer<typeof payoutSchema>;

const StatusBadge = ({ status }: { status: PayoutStatus }) => {
  const variants = {
    pending: {
      className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
      icon: Clock,
      label: "Pending",
    },
    paid: {
      className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      icon: CheckCircle2,
      label: "Paid",
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

const mockPayouts: Payout[] = [
  {
    id: "1",
    date: new Date("2026-01-14"),
    createdAt: new Date("2026-01-14T08:30:00"),
    requestedAt: new Date("2026-01-14T08:30:00"),
    payoutMethod: {
      address: "GABCDEF1234567890ABCDEF1234567890ABCD",
    },
    status: "pending",
    amount: "91.94",
    asset: "XLM",
    environment: "test",
  },
  {
    id: "2",
    date: new Date("2025-09-14"),
    createdAt: new Date("2025-09-14T10:15:00"),
    updatedAt: new Date("2025-09-14T10:16:30"),
    requestedAt: new Date("2025-09-14T10:15:00"),
    processedAt: new Date("2025-09-14T10:16:30"),
    payoutMethod: {
      address: "GXYZ9876543210ABCDEF1234567890ABCDEF",
    },
    status: "paid",
    amount: "76.45",
    asset: "XLM",
    transactionHash: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
    environment: "test",
    fees: "0.00001",
    netAmount: "76.44999",
  },
  {
    id: "3",
    date: new Date("2025-08-20"),
    createdAt: new Date("2025-08-20T14:20:00"),
    updatedAt: new Date("2025-08-20T14:21:15"),
    requestedAt: new Date("2025-08-20T14:20:00"),
    processedAt: new Date("2025-08-20T14:21:15"),
    payoutMethod: {
      address: "GABCDEF1234567890ABCDEF1234567890ABCD",
    },
    status: "paid",
    amount: "150.00",
    asset: "XLM",
    memo: "Monthly payout",
    transactionHash: "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2a1",
    environment: "live",
    fees: "0.00001",
    netAmount: "149.99999",
  },
  {
    id: "4",
    date: new Date("2025-07-15"),
    createdAt: new Date("2025-07-15T09:45:00"),
    updatedAt: new Date("2025-07-15T09:46:20"),
    requestedAt: new Date("2025-07-15T09:45:00"),
    processedAt: new Date("2025-07-15T09:46:20"),
    payoutMethod: {
      address: "GXYZ9876543210ABCDEF1234567890ABCDEF",
    },
    status: "paid",
    amount: "200.50",
    asset: "XLM",
    transactionHash: "c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2a1b2",
    environment: "live",
    fees: "0.00001",
    netAmount: "200.49999",
  },
];

const getStellarExplorerUrl = (txHash: string, network?: string) => {
  const baseUrl =
    network === "live"
      ? "https://stellar.expert/explorer/public/tx"
      : "https://stellar.expert/explorer/testnet/tx";
  return `${baseUrl}/${txHash}`;
};

const getNetworkDisplayName = (network?: string) => {
  if (network === "live") return "Live Mode";
  if (network === "test") return "Test Mode";
  return "Test Mode";
};

export default function PayoutDetailPage() {
  const router = useRouter();
  const params = useParams();
  const payoutId = params?.id as string;

  const payout = React.useMemo(() => {
    return mockPayouts.find((p) => p.id === payoutId);
  }, [payoutId]);

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleDownloadReceipt = React.useCallback(async () => {
    if (!payout) return;

    const downloadPromise = generateAndDownloadReceipt(payout, "StellarTools");

    toast.promise(downloadPromise, {
      loading: "Generating receipt...",
      success: "Receipt downloaded successfully",
      error: "Failed to download receipt",
    });
  }, [payout]);

  const handleRefreshStatus = React.useCallback(async () => {
    if (!payout) return;
    setIsRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Payout status refreshed");
    } catch (error) {
      console.error("Failed to refresh status:", error);
      toast.error("Failed to refresh payout status");
    } finally {
      setIsRefreshing(false);
    }
  }, [payout]);

  if (!payout) {
    return (
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-6 p-6">
            <div className="py-12 text-center">
              <h1 className="mb-2 text-2xl font-bold">Payout not found</h1>
              <p className="text-muted-foreground mb-4">
                The payout you&apos;re looking for doesn&apos;t exist.
              </p>
              <Button onClick={() => router.push("/dashboard/payout")}>Back to Payouts</Button>
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
    );
  }

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-6 p-4 sm:p-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard/payout">Payout history</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>Payout {payout.id}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h1 className="text-2xl font-bold sm:text-3xl">Payout Details</h1>
                    <StatusBadge status={payout.status} />
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base">Payout #{payout.id}</p>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  <Button
                    variant="outline"
                    className="w-full gap-2 shadow-none sm:w-auto"
                    onClick={handleRefreshStatus}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    <span>Refresh Status</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 shadow-none sm:w-auto"
                    onClick={handleDownloadReceipt}
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Receipt</span>
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
                      <DropdownMenuItem onClick={handleDownloadReceipt}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Receipt
                      </DropdownMenuItem>
                      {payout.transactionHash && (
                        <DropdownMenuItem
                          onClick={() => {
                            window.open(
                              getStellarExplorerUrl(payout.transactionHash!, payout.environment),
                              "_blank"
                            );
                          }}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View on Stellar Explorer
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(payout.id);
                          toast.success("Payout ID copied to clipboard");
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Payout ID
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(payout.payoutMethod.address);
                          toast.success("Wallet address copied to clipboard");
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Wallet Address
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="bg-card rounded-lg border p-4">
                <div className="text-muted-foreground mb-1 text-xs">Payout Amount</div>
                <div className="text-xl font-bold">
                  {payout.amount} {payout.asset}
                </div>
              </div>
              <div className="bg-card rounded-lg border p-4">
                <div className="text-muted-foreground mb-1 text-xs">Status</div>
                <StatusBadge status={payout.status} />
              </div>
              <div className="bg-card rounded-lg border p-4">
                <div className="text-muted-foreground mb-1 text-xs">Network</div>
                <div className="text-sm font-medium">
                  {getNetworkDisplayName(payout.environment)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {/* Payout Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold sm:text-xl">Payout Information</h3>
                  <div className="bg-card space-y-4 rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-muted-foreground mb-1 text-xs">Amount</div>
                        <div className="text-2xl font-bold">
                          {payout.amount} {payout.asset}
                        </div>
                        {payout.fees && payout.netAmount && (
                          <div className="text-muted-foreground mt-1 text-xs">
                            Fees: {payout.fees} {payout.asset} • Net: {payout.netAmount}{" "}
                            {payout.asset}
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-muted-foreground mb-1 text-xs">Payout Method</div>
                        <div className="flex items-center gap-2">
                          <Wallet className="text-muted-foreground h-4 w-4 shrink-0" />
                          <span className="font-mono text-sm break-all">
                            {payout.payoutMethod.address}
                          </span>
                        </div>
                      </div>
                      <CopyButton text={payout.payoutMethod.address} label="Copy wallet address" />
                    </div>

                    {payout.memo && (
                      <>
                        <Separator />
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-muted-foreground mb-1 text-xs">Memo</div>
                            <div className="text-sm">{payout.memo}</div>
                          </div>
                        </div>
                      </>
                    )}

                    {payout.transactionHash && (
                      <>
                        <Separator />
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-muted-foreground mb-1 text-xs">
                              Transaction Hash
                            </div>
                            <div className="font-mono text-sm break-all">
                              {payout.transactionHash}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <CopyButton
                              text={payout.transactionHash}
                              label="Copy transaction hash"
                            />
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8"
                              onClick={() => {
                                window.open(
                                  getStellarExplorerUrl(
                                    payout.transactionHash!,
                                    payout.environment
                                  ),
                                  "_blank"
                                );
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-muted-foreground mb-1 text-xs">Network</div>
                        <div className="text-sm">{getNetworkDisplayName(payout.environment)}</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-muted-foreground mb-1 text-xs">Date</div>
                        <div className="text-sm">
                          {moment(payout.date).format("MMMM DD, YYYY [at] h:mm A")}
                        </div>
                      </div>
                      <Calendar className="text-muted-foreground h-4 w-4 shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Timeline Section */}
                {(payout.requestedAt || payout.processedAt || payout.createdAt) && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold sm:text-xl">Timeline</h3>
                    <div className="bg-card space-y-4 rounded-lg border p-4">
                      {payout.requestedAt && (
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-muted-foreground mb-1 text-xs">Requested At</div>
                            <div className="text-sm">
                              {moment(payout.requestedAt).format("MMMM DD, YYYY [at] h:mm A")}
                            </div>
                          </div>
                          <Clock className="text-muted-foreground h-4 w-4 shrink-0" />
                        </div>
                      )}

                      {payout.processedAt && (
                        <>
                          {payout.requestedAt && <Separator />}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-muted-foreground mb-1 text-xs">Processed At</div>
                              <div className="text-sm">
                                {moment(payout.processedAt).format("MMMM DD, YYYY [at] h:mm A")}
                              </div>
                            </div>
                            <CheckCircle2 className="text-muted-foreground h-4 w-4 shrink-0" />
                          </div>
                        </>
                      )}

                      {payout.createdAt &&
                        (!payout.requestedAt ||
                          payout.createdAt.getTime() !== payout.requestedAt.getTime()) && (
                          <>
                            {(payout.requestedAt || payout.processedAt) && <Separator />}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="text-muted-foreground mb-1 text-xs">Created At</div>
                                <div className="text-sm">
                                  {moment(payout.createdAt).format("MMMM DD, YYYY [at] h:mm A")}
                                </div>
                              </div>
                              <Clock className="text-muted-foreground h-4 w-4 shrink-0" />
                            </div>
                          </>
                        )}

                      {payout.updatedAt &&
                        payout.updatedAt.getTime() !== payout.createdAt?.getTime() &&
                        payout.updatedAt.getTime() !== payout.processedAt?.getTime() && (
                          <>
                            <Separator />
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="text-muted-foreground mb-1 text-xs">
                                  Last Updated
                                </div>
                                <div className="text-sm">
                                  {moment(payout.updatedAt).format("MMMM DD, YYYY [at] h:mm A")}
                                </div>
                              </div>
                              <RefreshCw className="text-muted-foreground h-4 w-4 shrink-0" />
                            </div>
                          </>
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Details Section */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold sm:text-xl">Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-muted-foreground mb-1 text-xs">Payout ID</div>
                        <div className="font-mono text-sm break-all">{payout.id}</div>
                      </div>
                      <CopyButton text={payout.id} label="Copy payout ID" />
                    </div>

                    <Separator />

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-muted-foreground mb-1 text-xs">Status</div>
                        <StatusBadge status={payout.status} />
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-muted-foreground mb-1 text-xs">Asset</div>
                        <div className="text-sm font-medium">{payout.asset}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold sm:text-xl">Actions</h3>
                  <div className="space-y-2">
                    {payout.transactionHash && (
                      <Button
                        variant="outline"
                        className="hover:bg-muted/50 h-auto w-full justify-start gap-2.5 px-3 py-2.5 shadow-none transition-colors"
                        onClick={() => {
                          window.open(
                            getStellarExplorerUrl(payout.transactionHash!, payout.environment),
                            "_blank"
                          );
                        }}
                      >
                        <ExternalLink className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium">View on Stellar Explorer</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="hover:bg-muted/50 h-auto w-full justify-start gap-2.5 px-3 py-2.5 shadow-none transition-colors"
                      onClick={handleDownloadReceipt}
                    >
                      <Download className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium">Download Receipt</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
    </div>
  );
}
