"use client";

import React from "react";

import { retrieveOverviewStats } from "@/actions/organization";
import { retrieveOwnerPlan } from "@/actions/plan";
import { CircularProgress } from "@/components/circular-progress";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { LineChart } from "@/components/line-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOrgQuery } from "@/hooks/use-org-query";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { TCountryCode, countries } from "countries-list";
import { ChevronsUpDown, Info } from "lucide-react";
import Link from "next/link";

const STROOPS_PER_XLM = 10_000_000;
const XLM_USD_RATE = 0.12;

const CURRENCY_RATES: Record<string, number> = {
  USD: XLM_USD_RATE,
  EUR: XLM_USD_RATE * 0.92,
  GBP: XLM_USD_RATE * 0.79,
  NGN: XLM_USD_RATE * 1600,
  CAD: XLM_USD_RATE * 1.36,
  AUD: XLM_USD_RATE * 1.52,
  CHF: XLM_USD_RATE * 0.88,
  JPY: XLM_USD_RATE * 149,
  INR: XLM_USD_RATE * 83,
  BRL: XLM_USD_RATE * 5.0,
  MXN: XLM_USD_RATE * 17,
  ZAR: XLM_USD_RATE * 18,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  NGN: "₦",
  CAD: "C$",
  AUD: "A$",
  CHF: "CHF",
  JPY: "¥",
  INR: "₹",
  BRL: "R$",
  MXN: "MX$",
  ZAR: "R",
};

const COUNTRY_ITEMS = (() => {
  const countryEntries = Object.entries(countries).map(([code, data]) => {
    const currency = data.currency?.[0] ?? "USD";
    const rate = CURRENCY_RATES[currency] ?? XLM_USD_RATE;
    const symbol = CURRENCY_SYMBOLS[currency] ?? currency + " ";
    return {
      countryCode: code as TCountryCode,
      name: data.name,
      currency,
      rate,
      symbol,
      label: `${data.name} (${currency})`,
      searchKey: `${data.name} ${data.native} ${currency}`.toLowerCase(),
    };
  });
  countryEntries.sort((a, b) => a.name.localeCompare(b.name));
  return [
    {
      countryCode: "XLM" as const,
      name: "XLM",
      currency: "XLM",
      rate: 1,
      symbol: "",
      label: "XLM",
      searchKey: "xlm stellar",
    },
    ...countryEntries,
  ];
})();

function stroopsToDisplay(stroops: number, countryCode: string): { value: number; formatted: string } {
  const xlm = stroops / STROOPS_PER_XLM;
  const item =
    COUNTRY_ITEMS.find((c) => c.countryCode === countryCode) ?? COUNTRY_ITEMS.find((c) => c.countryCode === "US")!;
  const useXlm = countryCode === "XLM";
  const value = useXlm ? xlm : xlm * item.rate;
  const formatted = useXlm
    ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " XLM"
    : item.symbol + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return { value, formatted };
}

const SPARKLINE_CONFIG = {
  value: { label: "", color: "hsl(var(--chart-1))" },
};

// Custom SVG Icons
function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

function SubscriptionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

function RevenueIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

function CustomerAddIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 8c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm-6 4c.22-.72 3.31-2 6-2 2.7 0 5.8 1.29 6 2H9zM6 12v-2H4v2H2v2h2v2h2v-2h2v-2z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

function CustomerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const [countryCode, setCountryCode] = React.useState<string>("US");
  const [countryOpen, setCountryOpen] = React.useState(false);

  const { data: accountPlan } = useQuery({
    queryKey: ["account-plan"],
    queryFn: () => retrieveOwnerPlan({ currentUser: true }),
  });

  const { data: stats, isLoading } = useOrgQuery(["overview-stats"], () => retrieveOverviewStats(), {
    staleTime: 60 * 1000,
  });

  if (isLoading || !stats) {
    return (
      <div className="w-full">
        <DashboardSidebar>
          <DashboardSidebarInset>
            <div className="flex flex-col gap-8 p-6">
              <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-muted/30 h-48 animate-pulse rounded-xl" />
                ))}
              </div>
            </div>
          </DashboardSidebarInset>
        </DashboardSidebar>
      </div>
    );
  }

  const revenue28 = stroopsToDisplay(stats.revenue, countryCode);
  const mrrDisplay = stroopsToDisplay(stats.mrr, countryCode);
  const selectedCountry =
    COUNTRY_ITEMS.find((c) => c.countryCode === countryCode) ?? COUNTRY_ITEMS.find((c) => c.countryCode === "US")!;

  const revenueSparkData = (stats.charts.revenue ?? []).map((r) => ({
    i: r.date,
    value: r.amount / STROOPS_PER_XLM,
  }));
  const subsSparkData = (stats.charts.subscriptions ?? []).map((r) => ({ i: r.date, value: r.count }));
  const custSparkData = (stats.charts.customers ?? []).map((r) => ({ i: r.date, value: r.count }));

  const plan = accountPlan?.plan;

  if (!plan) return null;

  const subsLimit = typeof plan.subscriptions === "number" && plan.subscriptions !== Infinity ? plan.subscriptions : 1;
  const customersLimit = typeof plan.customers === "number" && plan.customers !== Infinity ? plan.customers : 1;

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-8 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryOpen}
                    className="h-9 w-[180px] justify-between font-normal"
                  >
                    <span className="truncate">{selectedCountry.label}</span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="end" onWheel={(e) => e.stopPropagation()}>
                  <Command>
                    <CommandInput placeholder="Search country or currency..." />
                    <CommandList className="max-h-[280px]">
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {COUNTRY_ITEMS.map((item) => (
                          <CommandItem
                            key={item.countryCode}
                            value={item.searchKey}
                            onSelect={() => {
                              setCountryCode(item.countryCode);
                              setCountryOpen(false);
                            }}
                          >
                            <span className={cn("flex-1 truncate", countryCode === item.countryCode && "font-medium")}>
                              {item.label}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Active Trials"
                value={stats.activeTrials}
                subtitle="In total"
                icon={<ActivityIcon className="text-muted-foreground size-5" />}
                sparkData={revenueSparkData}
                color="var(--chart-1)"
                usage={stats.activeTrials}
                max={subsLimit}
              />
              <StatCard
                title="Active Subscriptions"
                value={stats.activeSubscriptions}
                subtitle="In total"
                icon={<SubscriptionIcon className="text-muted-foreground size-5" />}
                sparkData={subsSparkData}
                color="var(--chart-2)"
                usage={stats.activeSubscriptions}
                max={subsLimit}
              />
              <StatCard
                title="MRR"
                value={mrrDisplay.formatted}
                subtitle="Monthly Recurring Revenue"
                icon={<RevenueIcon className="text-muted-foreground size-5" />}
                sparkData={revenueSparkData}
                color="var(--chart-2)"
              />
              <StatCard
                title="Revenue"
                value={revenue28.formatted}
                subtitle="Last 28 days"
                icon={<RevenueIcon className="text-muted-foreground size-5" />}
                sparkData={revenueSparkData}
                color="var(--chart-2)"
              />
              <StatCard
                title="New Customers"
                value={stats.newCustomers}
                subtitle="Last 28 days"
                icon={<CustomerAddIcon className="text-muted-foreground size-5" />}
                sparkData={custSparkData}
                color="var(--chart-3)"
              />
              <StatCard
                title="Active Customers"
                value={stats.totalCustomers}
                subtitle="In total"
                icon={<CustomerIcon className="text-muted-foreground size-5" />}
                sparkData={custSparkData}
                color="var(--chart-3)"
                usage={stats.totalCustomers}
                max={customersLimit}
              />
            </div>

            <div className="flex justify-center">
              <Link
                href="https://docs.stellartools.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm font-medium hover:underline"
              >
                Explore our integrations
              </Link>
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  sparkData,
  color,
  usage,
  max,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  sparkData: { i: string; value: number }[];
  color: string;
  usage?: number;
  max?: number;
}) {
  const hasSpark = sparkData.length > 0;
  const chartData = hasSpark ? sparkData : Array.from({ length: 7 }, (_, i) => ({ i: `d${i}`, value: 0 }));
  const showProgress = typeof max === "number" && max > 0 && typeof usage === "number";

  return (
    <Card className="relative overflow-hidden shadow-none">
      <CardContent className="flex flex-col gap-6 p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold tracking-tight">
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
              {showProgress && <CircularProgress value={Math.min(usage!, max)} max={max} size={20} />}
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-muted-foreground text-xs">{subtitle}</p>
              <Info className="text-muted-foreground/60 size-3" aria-hidden />
            </div>
          </div>
          <div className="shrink-0">{icon}</div>
        </div>

        <div className="relative -mx-6 h-20">
          <LineChart
            data={chartData}
            config={SPARKLINE_CONFIG}
            xAxisKey="i"
            activeKey="value"
            color={color as "var(--chart-1)"}
            className="h-full w-full"
            showXAxis={false}
            showTooltip={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
