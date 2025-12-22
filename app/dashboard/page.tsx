"use client";

import React from "react";

import { AreaChart } from "@/components/area-chart";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { LineChart } from "@/components/line-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";

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

// Sample data for UploadThing provider
const uploadThingData = [
  { month: "Jan", uploads: 186 },
  { month: "Feb", uploads: 305 },
  { month: "Mar", uploads: 237 },
  { month: "Apr", uploads: 273 },
  { month: "May", uploads: 209 },
  { month: "Jun", uploads: 314 },
];

const uploadThingChartConfig = {
  uploads: {
    label: "Uploads",
    color: "hsl(var(--chart-2))",
  },
};

// Sample data for AI SDK provider
const aiSdkData = [
  { month: "Jan", requests: 142 },
  { month: "Feb", requests: 198 },
  { month: "Mar", requests: 165 },
  { month: "Apr", requests: 221 },
  { month: "May", requests: 189 },
  { month: "Jun", requests: 256 },
];

const aiSdkChartConfig = {
  requests: {
    label: "API Requests",
    color: "hsl(var(--chart-3))",
  },
};

// Sample data for Medusa provider
const medusaData = [
  { month: "Jan", orders: 89 },
  { month: "Feb", orders: 124 },
  { month: "Mar", orders: 156 },
  { month: "Apr", orders: 142 },
  { month: "May", orders: 178 },
  { month: "Jun", orders: 201 },
];

const medusaChartConfig = {
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-4))",
  },
};

// Sample data for Better Auth provider
const betterAuthData = [
  { month: "Jan", sessions: 156 },
  { month: "Feb", sessions: 198 },
  { month: "Mar", sessions: 187 },
  { month: "Apr", sessions: 223 },
  { month: "May", sessions: 245 },
  { month: "Jun", sessions: 267 },
];

const betterAuthChartConfig = {
  sessions: {
    label: "Sessions",
    color: "hsl(var(--chart-1))",
  },
};

// Sample data for Shopify provider
const shopifyData = [
  { month: "Jan", transactions: 67 },
  { month: "Feb", transactions: 89 },
  { month: "Mar", transactions: 112 },
  { month: "Apr", transactions: 98 },
  { month: "May", transactions: 134 },
  { month: "Jun", transactions: 156 },
];

const shopifyChartConfig = {
  transactions: {
    label: "Transactions",
    color: "hsl(var(--chart-2))",
  },
};

// Sample data for Payload CMS provider
const payloadCmsData = [
  { month: "Jan", content: 45 },
  { month: "Feb", content: 67 },
  { month: "Mar", content: 54 },
  { month: "Apr", content: 78 },
  { month: "May", content: 89 },
  { month: "Jun", content: 102 },
];

const payloadCmsChartConfig = {
  content: {
    label: "Content Updates",
    color: "hsl(var(--chart-3))",
  },
};

export default function DashboardPage() {
  const [dateRange, setDateRange] = React.useState("7");
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

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
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent className="shadow-none">
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="180">Last 6 months</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                    <SelectItem value="this-month">This month</SelectItem>
                    <SelectItem value="last-month">Last month</SelectItem>
                    <SelectItem value="this-year">This year</SelectItem>
                  </SelectContent>
                </Select>
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

              <h2 className="text-2xl font-semibold tracking-tight">
                Integrations
              </h2>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="shadow-none">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="border-border bg-background flex h-8 w-8 items-center justify-center rounded-lg border">
                        <Image
                          src="/images/integrations/uploadthing.png"
                          alt="UploadThing"
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <CardTitle>UploadThing</CardTitle>
                        <CardDescription>
                          File uploads processed through UploadThing
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      data={uploadThingData}
                      config={uploadThingChartConfig}
                      xAxisKey="month"
                      activeKey="uploads"
                      color="var(--chart-2)"
                      className="h-[250px]"
                    />
                  </CardContent>
                </Card>

                {/* AI SDK Chart */}
                <Card className="shadow-none">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="border-border bg-background flex h-8 w-8 items-center justify-center rounded-lg border">
                        <Image
                          src="/images/integrations/aisdk.jpg"
                          alt="AI SDK"
                          width={24}
                          height={24}
                          className="rounded object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <CardTitle>AI SDK</CardTitle>
                        <CardDescription>
                          API requests handled by AI SDK
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      data={aiSdkData}
                      config={aiSdkChartConfig}
                      xAxisKey="month"
                      activeKey="requests"
                      color="var(--chart-3)"
                      className="h-[250px]"
                    />
                  </CardContent>
                </Card>

                {/* Medusa Chart */}
                <Card className="shadow-none">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="border-border bg-background flex h-8 w-8 items-center justify-center rounded-lg border">
                        <Image
                          src="/images/integrations/medusa.jpeg"
                          alt="Medusa"
                          width={24}
                          height={24}
                          className="rounded object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <CardTitle>Medusa</CardTitle>
                        <CardDescription>
                          Orders processed through Medusa
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      data={medusaData}
                      config={medusaChartConfig}
                      xAxisKey="month"
                      activeKey="orders"
                      color="var(--chart-4)"
                      className="h-[250px]"
                    />
                  </CardContent>
                </Card>

                <Card className="shadow-none">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="border-border bg-background flex h-8 w-8 items-center justify-center rounded-lg border">
                        <Image
                          src="/images/integrations/better-auth.png"
                          alt="Better Auth"
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <CardTitle>Better Auth</CardTitle>
                        <CardDescription>
                          User sessions managed by Better Auth
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      data={betterAuthData}
                      config={betterAuthChartConfig}
                      xAxisKey="month"
                      activeKey="sessions"
                      color="var(--chart-1)"
                      className="h-[250px]"
                    />
                  </CardContent>
                </Card>

                {/* Shopify Chart */}
                <Card className="shadow-none">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="border-border bg-background flex h-8 w-8 items-center justify-center rounded-lg border">
                        <Image
                          src="/images/integrations/shopify.png"
                          alt="Shopify"
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <CardTitle>Shopify</CardTitle>
                        <CardDescription>
                          Transactions processed via Shopify
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      data={shopifyData}
                      config={shopifyChartConfig}
                      xAxisKey="month"
                      activeKey="transactions"
                      color="var(--chart-2)"
                      className="h-[250px]"
                    />
                  </CardContent>
                </Card>

                {/* Payload CMS Chart */}
                <Card className="shadow-none">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="border-border bg-background flex h-8 w-8 items-center justify-center rounded-lg border">
                        <Image
                          src="/images/integrations/payloadcms.png"
                          alt="Payload CMS"
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <CardTitle>Payload CMS</CardTitle>
                        <CardDescription>
                          Content updates in Payload CMS
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      data={payloadCmsData}
                      config={payloadCmsChartConfig}
                      xAxisKey="month"
                      activeKey="content"
                      color="var(--chart-3)"
                      className="h-[250px]"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          </DashboardSidebarInset>
        </DashboardSidebar>
    </div>
  );
}
