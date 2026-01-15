"use client";

import * as React from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { PayoutReceipt } from "@/components/payout/payout-receipt";
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
import { PayoutStatus } from "@/constant/schema.client";
import { Payout } from "@/db";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
  Wallet,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const formatDate = (date?: Date) =>
  date
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(date)
    : "";

const getExplorerUrl = (hash: string, env?: string) =>
  `https://stellar.expert/explorer/${env === "live" ? "public" : "testnet"}/tx/${hash}`;

// --- Shared Internal Components ---

const StatusBadge = ({ status }: { status: PayoutStatus }) => {
  const config = {
    pending: {
      cls: "bg-orange-500/10 text-orange-700 border-orange-500/20",
      icon: Clock,
      label: "Pending",
    },
    succeeded: {
      cls: "bg-green-500/10 text-green-700 border-green-500/20",
      icon: CheckCircle2,
      label: "Succeeded",
    },
    failed: {
      cls: "bg-red-500/10 text-red-700 border-red-500/20",
      icon: XCircle,
      label: "Failed",
    },
  };
  const { cls, icon: Icon, label } = config[status];
  return (
    <Badge variant="outline" className={cn("gap-1.5", cls)}>
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

const DetailRow = ({ label, value, icon: Icon, action, mono = false }: any) => (
  <div className="flex items-start justify-between gap-2">
    <div className="min-w-0 flex-1">
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="text-muted-foreground h-4 w-4 shrink-0" />}
        <span className={cn("text-sm", mono && "font-mono break-all")}>{value}</span>
      </div>
    </div>
    {action}
  </div>
);

export default function PayoutDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const payout = mockPayouts.find((p) => p.id === id);

  const handleDownloadReceipt = React.useCallback(async () => {
    if (!payout) return;

    const downloadPromise = generateAndDownloadReceipt(payout, "StellarTools");

    toast.promise(downloadPromise, {
      loading: "Generating receipt...",
      success: "Receipt downloaded successfully",
      error: "Failed to download receipt",
    });
  }, [payout]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Status refreshed");
    setIsRefreshing(false);
  };

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  if (!payout)
    return (
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="py-12 text-center">
            <h1 className="text-2xl font-bold">Payout not found</h1>
            <Button onClick={() => router.push("/dashboard/payout")} className="mt-4">
              Back
            </Button>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
    );

  return (
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

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Payout Details</h1>
                <StatusBadge status={payout.status as any} />
              </div>
              <p className="text-muted-foreground text-sm">Payout #{payout.id}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="gap-2 shadow-none"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /> Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadReceipt}
                className="gap-2 shadow-none"
              >
                <Download className="h-4 w-4" /> Receipt
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shadow-none">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => copyToClipboard(payout.id, "ID Copied")}>
                    Copy ID
                  </DropdownMenuItem>
                  {payout.transactionHash && (
                    <DropdownMenuItem
                      onClick={() =>
                        window.open(
                          getExplorerUrl(payout.transactionHash!, payout.environment),
                          "_blank"
                        )
                      }
                    >
                      View on Explorer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Payout Amount", value: `${payout.amount} XLM` },
              { label: "Status", value: <StatusBadge status={payout.status as any} /> },
              {
                label: "Network",
                value: payout.environment === "mainnet" ? "Live Mode" : "Test Mode",
              },
            ].map((card, i) => (
              <div key={i} className="bg-card rounded-lg border p-4">
                <div className="text-muted-foreground mb-1 text-xs">{card.label}</div>
                <div className="text-lg font-bold">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Payout Information</h3>
                <div className="bg-card space-y-4 rounded-lg border p-4">
                  <DetailRow label="Amount" value={`${payout.amount} XLM`} />
                  <Separator />
                  <DetailRow
                    label="Payout Method"
                    value={payout.walletAddress}
                    icon={Wallet}
                    mono
                    action={<CopyBtn text={payout.walletAddress} />}
                  />
                  {payout.transactionHash && (
                    <>
                      <Separator />
                      <DetailRow
                        label="Transaction Hash"
                        value={payout.transactionHash}
                        mono
                        action={
                          <div className="flex gap-2">
                            <CopyBtn text={payout.transactionHash} />
                            <ExternalLink
                              className="h-4 w-4 cursor-pointer"
                              onClick={() =>
                                window.open(
                                  getExplorerUrl(payout.transactionHash!, payout.environment),
                                  "_blank"
                                )
                              }
                            />
                          </div>
                        }
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Timeline</h3>
                <div className="bg-card space-y-4 rounded-lg border p-4">
                  {payout.createdAt && (
                    <DetailRow
                      label="Requested At"
                      value={formatDate(payout.createdAt)}
                      icon={Clock}
                    />
                  )}
                  {payout.completedAt && (
                    <>
                      <Separator />
                      <DetailRow
                        label="Processed At"
                        value={formatDate(payout.completedAt)}
                        icon={CheckCircle2}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Details</h3>
              <div className="space-y-3">
                <DetailRow
                  label="Payout ID"
                  value={payout.id}
                  mono
                  action={<CopyBtn text={payout.id} />}
                />
                <Separator />
                <DetailRow label="Asset" value="XLM" />
              </div>
            </div>
          </div>
        </div>
      </DashboardSidebarInset>
    </DashboardSidebar>
  );
}

export async function generateAndDownloadReceipt(
  payout: Payout,
  organizationName?: string,
  organizationAddress?: string,
  organizationEmail?: string
): Promise<void> {
  try {
    const doc = (
      <PayoutReceipt
        payout={payout}
        organizationName={organizationName}
        organizationAddress={organizationAddress}
        organizationEmail={organizationEmail}
      />
    );

    const blob = await pdf(doc).toBlob();

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `payout-receipt-${payout.id}-${dateStr}.pdf`;
    saveAs(blob, filename);
  } catch (error) {
    console.error("Error generating receipt:", error);
    throw new Error("Failed to generate receipt");
  }
}

const mockPayouts: Array<Payout> = [
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
];
