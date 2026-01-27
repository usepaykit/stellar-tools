"use client";

import * as React from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronRight, Clock, Copy, ExternalLink, Pause, Play, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

// --- Helpers ---
const formatXLM = (stroops: number) => (stroops / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2 });
const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
const getExplorerUrl = (hash: string, env: string) =>
  `https://stellar.expert/explorer/${env === "live" ? "public" : "testnet"}/tx/${hash}`;

// --- Internal Components ---
const StatusBadge = ({ status }: { status: string }) => {
  const variants: any = {
    active: { cls: "bg-green-500/10 text-green-700 border-green-500/20", icon: CheckCircle2, label: "Active" },
    past_due: { cls: "bg-orange-500/10 text-orange-700 border-orange-500/20", icon: Clock, label: "Past Due" },
    canceled: { cls: "bg-gray-500/10 text-gray-700 border-gray-500/20", icon: XCircle, label: "Canceled" },
    paused: { cls: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20", icon: Pause, label: "Paused" },
  };
  const { cls, icon: Icon, label } = variants[status] || variants.active;
  return (
    <Badge variant="outline" className={cn("gap-1.5", cls)}>
      <Icon className="h-3 w-3" /> {label}
    </Badge>
  );
};

const DetailRow = ({
  label,
  value,
  href,
  copy,
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
  copy?: string;
}) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground font-medium">{label}</span>
    <div className="flex items-center gap-2">
      {href ? (
        <Link href={href} className="text-primary font-medium hover:underline">
          {value}
        </Link>
      ) : (
        <span>{value}</span>
      )}
      {copy && (
        <button
          onClick={() => {
            navigator.clipboard.writeText(copy);
            toast.success("Copied");
          }}
          className="hover:bg-muted rounded p-1"
        >
          <Copy className="text-muted-foreground h-3 w-3" />
        </button>
      )}
    </div>
  </div>
);

const InfoSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card space-y-4 rounded-lg border p-6">
    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

export default function SubscriptionDetailPage() {
  const { id: _subId } = useParams();
  const _router = useRouter();
  const [isBusy, setIsBusy] = React.useState(false);

  // Mocked for structure - replace with useOrgQuery for sub and retrieveEvents for history
  const sub = mockSubscription;
  const history = mockEvents;

  const performAction = async (msg: string) => {
    setIsBusy(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success(msg);
    setIsBusy(false);
  };

  return (
    <DashboardSidebar>
      <DashboardSidebarInset>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 sm:p-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/subscriptions">Subscriptions</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{sub.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Subscription</h1>
              <StatusBadge status={sub.status} />
            </div>
            <p className="text-muted-foreground font-mono text-xs">{sub.id}</p>
          </header>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <InfoSection title="Subscription Details">
                <DetailRow label="Current Status" value={<StatusBadge status={sub.status} />} />
                <Separator />
                <DetailRow
                  label="Billing Period"
                  value={
                    <div className="text-right">
                      <p>{formatDate(sub.currentPeriodStart)}</p>
                      <p className="text-muted-foreground text-xs italic">Ends {formatDate(sub.currentPeriodEnd)}</p>
                    </div>
                  }
                />
                <Separator />
                <DetailRow
                  label="Auto-renew"
                  value={
                    sub.cancelAtPeriodEnd ? (
                      <span className="text-destructive text-[10px] font-bold uppercase">Off</span>
                    ) : (
                      <span className="text-[10px] font-bold text-green-600 uppercase">On</span>
                    )
                  }
                />
              </InfoSection>

              <InfoSection title="Participants">
                <DetailRow
                  label="Customer"
                  value={sub.customer.name}
                  href={`/customers/${sub.customer.id}`}
                  copy={sub.customer.id}
                />
                <Separator />
                  <DetailRow label="Product" value={sub.product.name} href={`/products/${sub.product.id}`} />
                <Separator />
                <DetailRow
                  label="Recurring Amount"
                  value={`${formatXLM(sub.product.priceAmount)} ${sub.product.assetId}`}
                />
              </InfoSection>

              <InfoSection title="History & Events">
                <Timeline
                  items={history}
                  limit={5}
                  renderItem={(evt) => ({
                    key: evt.id,
                    title: evt.type.replace(/[._]/g, " ").toUpperCase(),
                    date: formatDate(evt.createdAt),
                    data: evt.data,
                    contentOverride: evt.data?.transactionHash ? (
                      <a
                        href={getExplorerUrl(evt.data.transactionHash, sub.environment)}
                        target="_blank"
                        className="text-primary mt-1 flex items-center gap-1 text-xs hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> View Transaction
                      </a>
                    ) : undefined,
                  })}
                />
              </InfoSection>
            </div>

            <div className="sticky top-20 space-y-6">
              <InfoSection title="Actions">
                <div className="flex flex-col gap-2">
                  {sub.status === "active" ? (
                    <>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => performAction("Paused")}
                      >
                        <Pause className="h-4 w-4" /> Pause
                      </Button>
                      <Button
                        variant="outline"
                        className="text-destructive w-full justify-start gap-2"
                        onClick={() => performAction("Canceled")}
                      >
                        <XCircle className="h-4 w-4" /> Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => performAction("Resumed")}
                    >
                      <Play className="h-4 w-4" /> Resume
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => performAction("Refreshed")}
                    disabled={isBusy}
                  >
                    <RefreshCw className={cn("h-4 w-4", isBusy && "animate-spin")} /> Sync Status
                  </Button>
                </div>
              </InfoSection>

              <div className="bg-primary/5 border-primary/10 rounded-lg border p-6">
                <h3 className="text-primary/70 mb-4 text-xs font-black tracking-widest uppercase">
                  Financial Metadata
                </h3>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-muted-foreground text-xs">Lifetime Value</span>
                    <span className="text-foreground text-lg font-black">
                      {formatXLM(sub.product.priceAmount * 12)}{" "}
                      <span className="text-[10px] opacity-50">{sub.product.assetId}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardSidebarInset>
    </DashboardSidebar>
  );
}

const mockSubscription = {
  id: "sub_abc123",
  status: "active",
  currentPeriodStart: "2025-01-01T00:00:00Z",
  currentPeriodEnd: "2025-02-01T00:00:00Z",
  cancelAtPeriodEnd: false,
  environment: "test",
  customer: { id: "cust_001", name: "John Doe", email: "john@example.com" },
  product: { id: "prod_001", name: "Premium Plan", priceAmount: 50000000, assetId: "XLM" },
};

const mockEvents = [
  { id: "e1", type: "subscription.created", createdAt: "2025-01-01T10:00:00Z", data: { plan: "Premium" } },
  {
    id: "e2",
    type: "payment.confirmed",
    createdAt: "2025-01-01T10:05:00Z",
    data: { amount: 50, transactionHash: "abc..." },
  },
];
