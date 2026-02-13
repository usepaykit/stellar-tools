"use client";

import React from "react";

import { retrieveOverviewStats } from "@/actions/organization";
import { retrieveOwnerPlan } from "@/actions/plan";
import { CircularProgress } from "@/components/circular-progress";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import {
  AddUserIcon,
  DollarIcon,
  GroupedUsersIcon,
  HourglassIcon,
  LoopIcon,
  SubscriptionIcon,
} from "@/components/icon";
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

const CHART_DAYS = 28;

/** Fill in missing days so the sparkline has a point for every day (0 where no data). */
function fillSparklineDays<T extends { i: string; value: number }>(
  points: T[],
  days: number = CHART_DAYS
): { i: string; value: number }[] {
  const byDate = new Map(points.map((p) => [p.i, p.value]));
  const result: { i: string; value: number }[] = [];
  const d = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(d);
    day.setDate(day.getDate() - i);
    const dateStr = day.toISOString().slice(0, 10);
    result.push({ i: dateStr, value: byDate.get(dateStr) ?? 0 });
  }
  return result;
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

  const displayStats = stats;
  const plan = accountPlan?.plan;

  if (isLoading || !displayStats) {
    return (
      <div className="w-full">
        <DashboardSidebar>
          <DashboardSidebarInset>
            <StatCardsSkeleton />
          </DashboardSidebarInset>
        </DashboardSidebar>
      </div>
    );
  }

  const revenue28 = stroopsToDisplay(displayStats.revenue, countryCode);
  const mrrDisplay = stroopsToDisplay(displayStats.mrr, countryCode);
  const selectedCountry =
    COUNTRY_ITEMS.find((c) => c.countryCode === countryCode) ?? COUNTRY_ITEMS.find((c) => c.countryCode === "US")!;

  const chartDays = displayStats.charts.revenue?.length ?? CHART_DAYS;
  const revenueSparkData = fillSparklineDays(
    (displayStats.charts.revenue ?? []).map((r) => ({
      i: r.date,
      value: r.amount / STROOPS_PER_XLM,
    })),
    chartDays
  );
  const subsSparkData = fillSparklineDays(
    (displayStats.charts.subscriptions ?? []).map((r) => ({ i: r.date, value: r.count })),
    chartDays
  );
  const custSparkData = fillSparklineDays(
    (displayStats.charts.customers ?? []).map((r) => ({ i: r.date, value: r.count })),
    chartDays
  );

  const subsLimit =
    plan && typeof plan.subscriptions === "number" && plan.subscriptions !== Infinity ? plan.subscriptions : 1;
  const customersLimit = plan && typeof plan.customers === "number" && plan.customers !== Infinity ? plan.customers : 1;

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-8 p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">Overview</h1>
              </div>
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryOpen}
                    className="border-border/80 h-9 w-[200px] justify-between rounded-lg font-normal shadow-xs"
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

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              <StatCard
                title="Active Trials"
                value={displayStats.activeTrials}
                subtitle="In total"
                icon={<HourglassIcon className="text-muted-foreground size-5" />}
                sparkData={revenueSparkData}
                color="var(--chart-1)"
                usage={displayStats.activeTrials}
                max={subsLimit}
              />
              <StatCard
                title="Active Subscriptions"
                value={displayStats.activeSubscriptions}
                subtitle="In total"
                icon={<SubscriptionIcon className="text-muted-foreground size-5" />}
                sparkData={subsSparkData}
                color="var(--chart-2)"
                usage={displayStats.activeSubscriptions}
                max={subsLimit}
              />
              <StatCard
                title="MRR"
                value={mrrDisplay.formatted}
                subtitle="Monthly Recurring Revenue"
                icon={<LoopIcon className="text-muted-foreground size-5" />}
                sparkData={revenueSparkData}
                color="var(--chart-2)"
              />
              <StatCard
                title="Revenue"
                value={revenue28.formatted}
                subtitle="Last 28 days"
                icon={<DollarIcon className="text-muted-foreground size-5" />}
                sparkData={revenueSparkData}
                color="var(--chart-2)"
              />
              <StatCard
                title="New Customers"
                value={displayStats.newCustomers}
                subtitle="Last 28 days"
                icon={<AddUserIcon className="text-muted-foreground size-5" />}
                sparkData={custSparkData}
                color="var(--chart-3)"
                href="/customers"
              />
              <StatCard
                title="Active Customers"
                value={displayStats.totalCustomers}
                subtitle="In total"
                icon={<GroupedUsersIcon className="text-muted-foreground size-5" />}
                sparkData={custSparkData}
                color="var(--chart-3)"
                usage={displayStats.totalCustomers}
                max={customersLimit}
              />
            </div>

            <div className="flex justify-center pt-2">
              <Link
                href="https://docs.stellartools.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary hover:bg-muted/50 inline-flex items-center gap-2 rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors"
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

function StatCardSkeleton() {
  return (
    <Card className="border-border/60 bg-card overflow-hidden rounded-2xl shadow-xs">
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="bg-muted/60 h-3 w-20 animate-pulse rounded" />
            <div className="bg-muted/60 h-8 w-16 animate-pulse rounded sm:h-9" />
            <div className="flex items-center gap-1.5">
              <div className="bg-muted/40 size-3 animate-pulse rounded-full" />
              <div className="bg-muted/50 h-3 w-14 animate-pulse rounded" />
            </div>
          </div>
          <div className="bg-muted/60 size-10 shrink-0 animate-pulse rounded-xl" />
        </div>
        <div className="bg-muted/30 relative -mx-6 mt-1 h-16 animate-pulse overflow-hidden rounded-b-2xl" />
      </CardContent>
    </Card>
  );
}

function StatCardsSkeleton() {
  return (
    <div className="flex flex-col gap-8 p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="bg-muted/50 h-8 w-40 animate-pulse rounded-lg md:h-9 md:w-52" />
          <div className="bg-muted/40 h-4 w-56 animate-pulse rounded" />
        </div>
        <div className="bg-muted/50 h-9 w-[200px] animate-pulse rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="flex justify-center pt-2">
        <div className="bg-muted/40 h-5 w-40 animate-pulse rounded" />
      </div>
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
  href,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  sparkData: { i: string; value: number }[];
  color: string;
  usage?: number;
  max?: number;
  href?: string;
}) {
  const hasSpark = sparkData.length > 0;
  const chartData = hasSpark ? sparkData : Array.from({ length: 7 }, (_, i) => ({ i: `d${i}`, value: 0 }));
  const showProgress = typeof max === "number" && max > 0 && typeof usage === "number";

  const card = (
    <Card
      className={cn(
        "border-border/60 bg-card relative overflow-hidden rounded-2xl shadow-xs transition-shadow",
        href && "cursor-pointer hover:shadow-sm"
      )}
    >
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{title}</p>
            <div className="flex items-center gap-3">
              <p className="text-foreground text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
              {showProgress && <CircularProgress value={Math.min(usage!, max)} max={max} size={20} />}
            </div>
            <div className="flex items-center gap-1.5">
              <Info className="text-muted-foreground/50 size-3 shrink-0" aria-hidden />
              <p className="text-muted-foreground text-xs">{subtitle}</p>
            </div>
          </div>
          <div
            className="bg-muted/80 flex size-10 shrink-0 items-center justify-center rounded-xl [&>svg]:size-5"
            style={{ color }}
          >
            {icon}
          </div>
        </div>

        <div className="relative -mx-6 mt-1 h-16 overflow-hidden rounded-b-2xl">
          <LineChart
            data={chartData}
            config={SPARKLINE_CONFIG}
            xAxisKey="i"
            activeKey="value"
            color={color as "var(--chart-1)"}
            className="h-full w-full"
            showXAxis={false}
            showTooltip={false}
            showGrid={false}
          />
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="focus-visible:ring-ring block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {card}
      </Link>
    );
  }
  return card;
}
