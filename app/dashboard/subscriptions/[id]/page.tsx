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
import { toast } from "@/components/ui/toast";
import { Payment, Subscription } from "@/db";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Pause,
  Play,
  RefreshCw,
  XCircle,
} from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STROOPS_TO_XLM = 1000000;

const formatXLM = (stroops: number) => {
  return (stroops / STROOPS_TO_XLM).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  });
};

type BadgeVariant = {
  className: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

const createStatusBadge = (variants: Record<string, BadgeVariant>, displayName: string) => {
  const BadgeComponent = ({ status }: { status: string }) => {
    const variant = variants[status];
    if (!variant) return null;

    const Icon = variant.icon;
    return (
      <Badge variant="outline" className={cn("gap-1.5 border", variant.className)}>
        <Icon className="h-3 w-3" />
        {variant.label}
      </Badge>
    );
  };
  BadgeComponent.displayName = displayName;
  return BadgeComponent;
};

const StatusBadge = createStatusBadge(
  {
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
  },
  "StatusBadge"
);

const PaymentStatusBadge = createStatusBadge(
  {
    confirmed: {
      className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      icon: CheckCircle2,
      label: "Confirmed",
    },
    pending: {
      className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
      icon: Clock,
      label: "Pending",
    },
    failed: {
      className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      icon: XCircle,
      label: "Failed",
    },
  },
  "PaymentStatusBadge"
);

const CopyButton = ({ text, label }: { text: string; label?: string }) => {
  const { copied, handleCopy } = useCopy();

  return (
    <button
      onClick={() => handleCopy({ text, message: "Copied to clipboard" })}
      className="hover:bg-muted inline-flex items-center justify-center rounded-md p-1 transition-colors shadow-none"
      aria-label={label || "Copy to clipboard"}
    >
      {copied ? (
        <CheckCircle2 className="size-4 text-green-600" />
      ) : (
        <Copy className="text-muted-foreground size-4" />
      )}
    </button>
  );
};

const mockSubscription: Subscription & {
  customer?: { id: string; name: string; email: string };
  product?: { id: string; name: string; priceAmount: number; assetId: string; description?: string };
} = {
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
  environment: "test" as any,
  customer: {
    id: "cust_mock456",
    name: "John Doe",
    email: "john.doe@example.com",
  },
  product: {
    id: "prod_premium123",
    name: "Premium Plan",
    priceAmount: 50000000,
    assetId: "XLM",
    description: "Full access to all premium features",
  },
};

const mockPayments: Payment[] = [
  {
    id: "pay_abc123def456ghi789jkl012mno345",
    organizationId: "org_mock123",
    checkoutId: "chk_xyz789abc123def456",
    customerId: "cust_mock456",
    amount: 50000000,
    transactionHash: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
    status: "confirmed",
    createdAt: new Date("2025-01-01T10:30:00Z"),
    updatedAt: new Date("2025-01-01T10:30:15Z"),
    environment: "test" as any,
  },
  {
    id: "pay_previous456",
    organizationId: "org_mock123",
    checkoutId: "chk_previous123",
    customerId: "cust_mock456",
    amount: 50000000,
    transactionHash: "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3",
    status: "confirmed",
    createdAt: new Date("2024-12-01T10:30:00Z"),
    updatedAt: new Date("2024-12-01T10:30:15Z"),
    environment: "test" as any,
  },
];

const getPaymentTitle = (status: Payment["status"]) => {
  const titles: Record<Payment["status"], string> = {
    confirmed: "Payment Confirmed",
    pending: "Payment Pending",
    failed: "Payment Failed",
  };
  return titles[status] || "Payment";
};

const getStellarExplorerUrl = (txHash: string, environment: string) => {
  const baseUrl =
    environment === "live"
      ? "https://stellar.expert/explorer/public/tx"
      : "https://stellar.expert/explorer/testnet/tx";
  return `${baseUrl}/${txHash}`;
};

const DetailRow = ({
  label,
  value,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <>
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-sm font-medium">{label}</span>
      {children || <span className="text-sm">{value}</span>}
    </div>
  </>
);

export default function SubscriptionDetailPage() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const subscription = mockSubscription;
  const payments = mockPayments;

  const createSubscriptionHandler = React.useCallback(
    (action: string, successMessage: string) => {
      return async () => {
        if (!subscription) return;

        setIsRefreshing(true);
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          toast.success(successMessage);
        } catch (error) {
          console.error(`Failed to ${action}:`, error);
          toast.error(`Failed to ${action}`);
        } finally {
          setIsRefreshing(false);
        }
      };
    },
    [subscription]
  );

  const handleRefreshStatus = React.useMemo(
    () => createSubscriptionHandler("refresh subscription status", "Subscription status refreshed"),
    [createSubscriptionHandler]
  );
  const handleCancelSubscription = React.useMemo(
    () => createSubscriptionHandler("cancel subscription", "Subscription will be canceled at the end of the current period"),
    [createSubscriptionHandler]
  );
  const handlePauseSubscription = React.useMemo(
    () => createSubscriptionHandler("pause subscription", "Subscription paused"),
    [createSubscriptionHandler]
  );
  const handleResumeSubscription = React.useMemo(
    () => createSubscriptionHandler("resume subscription", "Subscription resumed"),
    [createSubscriptionHandler]
  );

  if (!subscription) {
    return (
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-6 p-6">
            <div className="py-12 text-center">
              <h1 className="mb-2 text-2xl font-bold">Subscription not found</h1>
              <p className="text-muted-foreground mb-4">The subscription you&apos;re looking for doesn&apos;t exist.</p>
              <Button onClick={() => router.push("/dashboard/subscriptions")} variant="outline" className="shadow-none">
                Back to Subscriptions
              </Button>
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
    );
  }

  const daysRemaining = moment(subscription.currentPeriodEnd).diff(moment(), "days");
  const isActive = subscription.status === "active";
  const isPaused = subscription.status === "paused";

  type DetailItem = {
    label: string;
    value: React.ReactNode;
  };

  const subscriptionDetails: DetailItem[] = [
    { label: "Status", value: <StatusBadge status={subscription.status} /> },
    {
      label: "Current Period",
      value: (
        <div className="text-right text-sm">
          <div>{moment(subscription.currentPeriodStart).format("MMM DD, YYYY")}</div>
          <div className="text-muted-foreground text-xs">to {moment(subscription.currentPeriodEnd).format("MMM DD, YYYY")}</div>
        </div>
      ),
    },
    ...(subscription.nextBillingDate
      ? [{ label: "Next Billing Date", value: moment(subscription.nextBillingDate).format("MMM DD, YYYY") as React.ReactNode }]
      : []),
    ...(daysRemaining >= 0 ? [{ label: "Days Remaining", value: `${daysRemaining} days` as React.ReactNode }] : []),
    ...(subscription.cancelAtPeriodEnd ? [{ label: "Cancellation", value: "Will cancel at period end" as React.ReactNode }] : []),
    ...(subscription.canceledAt
      ? [{ label: "Canceled At", value: moment(subscription.canceledAt).format("MMM DD, YYYY HH:mm") as React.ReactNode }]
      : []),
    ...(subscription.pausedAt
      ? [{ label: "Paused At", value: moment(subscription.pausedAt).format("MMM DD, YYYY HH:mm") as React.ReactNode }]
      : []),
    ...(subscription.failedPaymentCount && subscription.failedPaymentCount > 0
      ? [
          {
            label: "Failed Payments",
            value: <span className="text-sm font-medium text-orange-600">{subscription.failedPaymentCount}</span>,
          },
        ]
      : []),
    { label: "Created", value: moment(subscription.createdAt).format("MMM DD, YYYY") },
    { label: "Last Updated", value: moment(subscription.updatedAt).format("MMM DD, YYYY HH:mm") },
    {
      label: "Environment",
      value: (
        <Badge variant="outline" className="text-xs">
          {subscription.environment}
        </Badge>
      ),
    },
  ];

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-6 p-4 sm:p-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard/subscriptions">Subscriptions</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>{subscription.id}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h1 className="text-2xl font-bold sm:text-3xl">Subscription Details</h1>
                    <StatusBadge status={subscription.status} />
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base">{subscription.id}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-lg border bg-card p-6">
                  <h2 className="mb-4 text-lg font-semibold">Subscription Information</h2>
                  <div className="space-y-4">
                    {subscriptionDetails.map((detail, index) => (
                      <React.Fragment key={index}>
                        {index > 0 && <Separator />}
                        <DetailRow label={detail?.label || ""} value={detail?.value} />
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {subscription.customer && (
                  <div className="rounded-lg border bg-card p-6">
                    <h2 className="mb-4 text-lg font-semibold">Customer Information</h2>
                    <div className="space-y-4">
                      <DetailRow
                        label="Customer"
                        value={
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/customers/${subscription.customer.id}`}
                              className="text-primary hover:underline font-medium"
                            >
                              {subscription.customer.name}
                            </Link>
                            <CopyButton text={subscription.customer.id} label="Copy customer ID" />
                          </div>
                        }
                      />
                      <Separator />
                      <DetailRow label="Email" value={subscription.customer.email} />
                    </div>
                  </div>
                )}

                {subscription.product && (
                  <div className="rounded-lg border bg-card p-6">
                    <h2 className="mb-4 text-lg font-semibold">Product Information</h2>
                    <div className="space-y-4">
                      <DetailRow
                        label="Product"
                        value={
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/products/${subscription.product.id}`}
                              className="text-primary hover:underline font-medium"
                            >
                              {subscription.product.name}
                            </Link>
                            <CopyButton text={subscription.product.id} label="Copy product ID" />
                          </div>
                        }
                      />
                      {subscription.product.description && (
                        <>
                          <Separator />
                          <DetailRow label="Description" value={subscription.product.description} />
                        </>
                      )}
                      <Separator />
                      <DetailRow
                        label="Price"
                        value={
                          <span className="text-sm font-medium">
                            {formatXLM(subscription.product.priceAmount)} {subscription.product.assetId}
                          </span>
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="rounded-lg border bg-card p-6">
                  <h2 className="mb-4 text-lg font-semibold">Payment History</h2>
                  <Timeline
                    items={payments}
                    limit={5}
                    emptyMessage="No payment history available"
                    renderItem={(payment) => {
                      const txHash = payment.transactionHash;
                      const shortHash = `${txHash.slice(0, 8)}...${txHash.slice(-8)}`;
                      const explorerUrl = getStellarExplorerUrl(txHash, payment.environment);

                      return {
                        key: payment.id,
                        title: getPaymentTitle(payment.status),
                        date: moment(payment.createdAt).format("MMM DD, YYYY hh:mm A"),
                        data: {},
                        contentOverride: (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <PaymentStatusBadge status={payment.status} />
                              <span className="text-foreground font-medium">
                                {formatXLM(payment.amount)} {subscription?.product?.assetId || "XLM"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-xs font-mono">{shortHash}</span>
                              <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View on Stellar Explorer
                              </a>
                            </div>
                          </div>
                        ),
                      };
                    }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="mb-4 text-sm font-semibold">Quick Actions</h3>
                  <div className="space-y-2">
                    {isActive && (
                      <>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 shadow-none"
                          onClick={handlePauseSubscription}
                        >
                          <Pause className="size-4" />
                          Pause Subscription
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 shadow-none"
                          onClick={handleCancelSubscription}
                        >
                          <XCircle className="size-4" />
                          Cancel Subscription
                        </Button>
                      </>
                    )}
                    {isPaused && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 shadow-none"
                        onClick={handleResumeSubscription}
                      >
                        <Play className="size-4" />
                        Resume Subscription
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 shadow-none"
                      onClick={handleRefreshStatus}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
                      Refresh Status
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-6">
                  <h3 className="mb-4 text-sm font-semibold">Summary</h3>
                  <div className="space-y-3">
                    <DetailRow
                      label="Subscription ID"
                      value={
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs">{subscription.id.slice(0, 12)}...</span>
                          <CopyButton text={subscription.id} label="Copy subscription ID" />
                        </div>
                      }
                    />
                    <Separator />
                    {subscription.product && (
                      <>
                        <DetailRow
                          label="Amount"
                          value={
                            <span className="font-medium">
                              {formatXLM(subscription.product.priceAmount)} {subscription.product.assetId}
                            </span>
                          }
                        />
                        <Separator />
                      </>
                    )}
                    <DetailRow
                      label="Period"
                      value={
                        <span className="text-xs">
                          {moment(subscription.currentPeriodStart).format("MMM DD")} -{" "}
                          {moment(subscription.currentPeriodEnd).format("MMM DD, YYYY")}
                        </span>
                      }
                    />
                    {subscription.nextBillingDate && (
                      <>
                        <Separator />
                        <DetailRow
                          label="Next Billing"
                          value={<span className="text-xs">{moment(subscription.nextBillingDate).format("MMM DD, YYYY")}</span>}
                        />
                      </>
                    )}
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
