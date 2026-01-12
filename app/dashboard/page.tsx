"use client";

import React from "react";

import { AreaChart } from "@/components/area-chart";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SelectPicker } from "@/components/select-picker";
import { LineChart, type ChartColor } from "@/components/line-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FullScreenModal } from "@/components/fullscreen-modal";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Check, Search, Sparkles } from "lucide-react";

type Integration = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  chartData: any[];
  chartConfig: any;
  xAxisKey: string;
  activeKey: string;
  color: ChartColor;
};

const allIntegrations: Integration[] = [
  {
    id: "uploadthing",
    name: "UploadThing",
    description: "File uploads processed through UploadThing",
    icon: "/images/integrations/uploadthing.png",
    category: "Storage",
    chartData: [
      { month: "Jan", uploads: 186 },
      { month: "Feb", uploads: 305 },
      { month: "Mar", uploads: 237 },
      { month: "Apr", uploads: 273 },
      { month: "May", uploads: 209 },
      { month: "Jun", uploads: 314 },
    ],
    chartConfig: {
      uploads: {
        label: "Uploads",
        color: "hsl(var(--chart-2))",
      },
    },
    xAxisKey: "month",
    activeKey: "uploads",
    color: "var(--chart-2)",
  },
  {
    id: "aisdk",
    name: "AI SDK",
    description: "API requests handled by AI SDK",
    icon: "/images/integrations/aisdk.jpg",
    category: "AI",
    chartData: [
      { month: "Jan", requests: 142 },
      { month: "Feb", requests: 198 },
      { month: "Mar", requests: 165 },
      { month: "Apr", requests: 221 },
      { month: "May", requests: 189 },
      { month: "Jun", requests: 256 },
    ],
    chartConfig: {
      requests: {
        label: "API Requests",
        color: "hsl(var(--chart-3))",
      },
    },
    xAxisKey: "month",
    activeKey: "requests",
    color: "var(--chart-3)",
  },
  {
    id: "medusa",
    name: "Medusa",
    description: "Orders processed through Medusa",
    icon: "/images/integrations/medusa.jpeg",
    category: "E-commerce",
    chartData: [
      { month: "Jan", orders: 89 },
      { month: "Feb", orders: 124 },
      { month: "Mar", orders: 156 },
      { month: "Apr", orders: 142 },
      { month: "May", orders: 178 },
      { month: "Jun", orders: 201 },
    ],
    chartConfig: {
      orders: {
        label: "Orders",
        color: "hsl(var(--chart-4))",
      },
    },
    xAxisKey: "month",
    activeKey: "orders",
    color: "var(--chart-4)",
  },
  {
    id: "better-auth",
    name: "Better Auth",
    description: "User sessions managed by Better Auth",
    icon: "/images/integrations/better-auth.png",
    category: "Authentication",
    chartData: [
      { month: "Jan", sessions: 156 },
      { month: "Feb", sessions: 198 },
      { month: "Mar", sessions: 187 },
      { month: "Apr", sessions: 223 },
      { month: "May", sessions: 245 },
      { month: "Jun", sessions: 267 },
    ],
    chartConfig: {
      sessions: {
        label: "Sessions",
        color: "hsl(var(--chart-1))",
      },
    },
    xAxisKey: "month",
    activeKey: "sessions",
    color: "var(--chart-1)",
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Transactions processed via Shopify",
    icon: "/images/integrations/shopify.png",
    category: "E-commerce",
    chartData: [
      { month: "Jan", transactions: 67 },
      { month: "Feb", transactions: 89 },
      { month: "Mar", transactions: 112 },
      { month: "Apr", transactions: 98 },
      { month: "May", transactions: 134 },
      { month: "Jun", transactions: 156 },
    ],
    chartConfig: {
      transactions: {
        label: "Transactions",
        color: "hsl(var(--chart-2))",
      },
    },
    xAxisKey: "month",
    activeKey: "transactions",
    color: "var(--chart-2)",
  },
  {
    id: "payloadcms",
    name: "Payload CMS",
    description: "Content updates in Payload CMS",
    icon: "/images/integrations/payloadcms.png",
    category: "CMS",
    chartData: [
      { month: "Jan", content: 45 },
      { month: "Feb", content: 67 },
      { month: "Mar", content: 54 },
      { month: "Apr", content: 78 },
      { month: "May", content: 89 },
      { month: "Jun", content: 102 },
    ],
    chartConfig: {
      content: {
        label: "Content Updates",
        color: "hsl(var(--chart-3))",
      },
    },
    xAxisKey: "month",
    activeKey: "content",
    color: "var(--chart-3)",
  },
  {
    id: "clerk",
    name: "Clerk",
    description: "User authentication and management",
    icon: "/images/integrations/clerk.png",
    category: "Authentication",
    chartData: [
      { month: "Jan", users: 234 },
      { month: "Feb", users: 289 },
      { month: "Mar", users: 312 },
      { month: "Apr", users: 298 },
      { month: "May", users: 356 },
      { month: "Jun", users: 401 },
    ],
    chartConfig: {
      users: {
        label: "Active Users",
        color: "hsl(var(--chart-1))",
      },
    },
    xAxisKey: "month",
    activeKey: "users",
    color: "var(--chart-1)",
  },
  {
    id: "wordpress",
    name: "WordPress",
    description: "Content management and publishing",
    icon: "/images/integrations/wordpress.png",
    category: "CMS",
    chartData: [
      { month: "Jan", posts: 89 },
      { month: "Feb", posts: 112 },
      { month: "Mar", posts: 98 },
      { month: "Apr", posts: 134 },
      { month: "May", posts: 156 },
      { month: "Jun", posts: 178 },
    ],
    chartConfig: {
      posts: {
        label: "Posts",
        color: "hsl(var(--chart-4))",
      },
    },
    xAxisKey: "month",
    activeKey: "posts",
    color: "var(--chart-4)",
  },
];

// Sample data for the overview charts (Last 7 days)
const overviewData = [
  { date: "2024-03-13", revenue: 1200 },
  { date: "2024-03-14", revenue: 1900 },
  { date: "2024-03-15", revenue: 1500 },
  { date: "2024-03-16", revenue: 2100 },
  { date: "2024-03-17", revenue: 1800 },
  { date: "2024-03-18", revenue: 2400 },
  { date: "2024-03-19", revenue: 2200 },
];

const overviewChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
};


export default function DashboardPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = React.useState("7");
  const [activeIntegrations, setActiveIntegrations] = React.useState<string[]>(
    []
  );
  const [isMarketplaceOpen, setIsMarketplaceOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const activeIntegrationData = React.useMemo(() => {
    return allIntegrations.filter((integration) =>
      activeIntegrations.includes(integration.id)
    );
  }, [activeIntegrations]);

  const filteredMarketplaceIntegrations = React.useMemo(() => {
    return allIntegrations.filter((integration) => {
      const matchesSearch =
        integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        integration.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery]);

  const handleAddIntegration = (integrationId: string) => {
    if (!activeIntegrations.includes(integrationId)) {
      setActiveIntegrations([...activeIntegrations, integrationId]);
      setIsMarketplaceOpen(false);
      router.push("/dashboard");
    }
  };


  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-8 p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Today</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card className="shadow-none">
                  <CardContent className="pt-6">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-sm">
                        Gross volume
                      </p>
                      <p className="text-2xl font-semibold">1,613.60 XLM</p>
                      <p className="text-muted-foreground text-xs">
                        as of {currentTime}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Yesterday */}
                <Card className="shadow-none">
                  <CardContent className="pt-6">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-sm">Yesterday</p>
                      <p className="text-2xl font-semibold">2,955.81 XLM</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Balance */}
                <Card className="shadow-none">
                  <CardContent className="pt-6">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm">
                          XLM balance
                        </p>
                        <Link
                          href="#"
                          className="text-primary text-xs hover:underline"
                        >
                          View
                        </Link>
                      </div>
                      <p className="text-2xl font-semibold">185,458.98 XLM</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Payouts */}
                <Card className="shadow-none">
                  <CardContent className="pt-6">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm">Payouts</p>
                        <Link
                          href="#"
                          className="text-primary text-xs hover:underline"
                        >
                          View
                        </Link>
                      </div>
                      <p className="text-2xl font-semibold">2,343.36 XLM</p>
                      <p className="text-muted-foreground text-xs">
                        Expected tomorrow
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Your overview
                </h2>

                <SelectPicker
                  id="date-range"
                  value={dateRange}
                  onChange={setDateRange}
                  triggerValuePlaceholder="Select date range"
                  triggerClassName="w-[180px]"
                  isLoading={true}
                  items={[
                    { value: "7", label: "Last 7 days" },
                    { value: "30", label: "Last 30 days" },
                    { value: "90", label: "Last 90 days" },
                    { value: "180", label: "Last 6 months" },
                    { value: "365", label: "Last year" },
                    { value: "this-month", label: "This month" },
                    { value: "last-month", label: "Last month" },
                    { value: "this-year", label: "This year" },
                  ]}
                />
              </div>

              {/* Overview Chart - Full Width */}
              <Card className="shadow-none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Gross volume</CardTitle>
                      <CardDescription>
                        Total volume over the last 7 days
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      Explore
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <AreaChart
                    data={overviewData}
                    config={overviewChartConfig}
                    xAxisKey="date"
                    activeKey="revenue"
                    color="var(--chart-1)"
                    className="h-[300px]"
                  />
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Integrations
                </h2>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setIsMarketplaceOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Integration
                </Button>
              </div>

              <FullScreenModal
                open={isMarketplaceOpen}
                onOpenChange={setIsMarketplaceOpen}
                title="Integration Marketplace"
                description="Connect your favorite tools and services to streamline your workflow"
                size="full"
                showCloseButton={true}
              >
                <div className="flex flex-col gap-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search integrations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 h-10 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMarketplaceIntegrations.map((integration) => {
                      const isActive = activeIntegrations.includes(
                        integration.id
                      );
                      return (
                        <Card
                          key={integration.id}
                          className="shadow-none border hover:border-primary/50 transition-colors cursor-pointer group"
                          onClick={() => {
                            if (!isActive) {
                              handleAddIntegration(integration.id);
                            }
                          }}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="border-border bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
                                  <Image
                                    src={integration.icon}
                                    alt={integration.name}
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base truncate">
                                    {integration.name}
                                  </CardTitle>
                                  <CardDescription className="text-xs line-clamp-2">
                                    {integration.description}
                                  </CardDescription>
                                </div>
                              </div>
                              {isActive ? (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 gap-1.5 border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
                                >
                                  <Check className="h-3 w-3" />
                                  Added
                                </Badge>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="shrink-0 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddIntegration(integration.id);
                                  }}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Add
                                </Button>
                              )}
                            </div>
                            <div className="mt-2">
                              <Badge
                                variant="outline"
                                className="text-xs font-normal"
                              >
                                {integration.category}
                              </Badge>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                  {filteredMarketplaceIntegrations.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium mb-1">
                        No integrations found
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Try adjusting your search query
                      </p>
                    </div>
                  )}
                </div>
              </FullScreenModal>

              {activeIntegrationData.length === 0 ? (
                <Card className="shadow-none border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full mb-6">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      No integrations yet
                    </h3>
                    <p className="text-muted-foreground text-sm text-center max-w-md mb-6">
                      Connect your favorite tools and services to start tracking
                      your data and streamline your workflow
                    </p>
                    <Button
                      className="gap-2"
                      onClick={() => setIsMarketplaceOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Browse Integrations
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {activeIntegrationData.map((integration) => (
                    <Card key={integration.id} className="shadow-none">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="border-border bg-background flex h-8 w-8 items-center justify-center rounded-lg border">
                            <Image
                              src={integration.icon}
                              alt={integration.name}
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <CardTitle>{integration.name}</CardTitle>
                            <CardDescription>
                              {integration.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <LineChart
                          data={integration.chartData}
                          config={integration.chartConfig}
                          xAxisKey={integration.xAxisKey}
                          activeKey={integration.activeKey}
                          color={integration.color}
                          className="h-[250px]"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
    </div>
  );
}
