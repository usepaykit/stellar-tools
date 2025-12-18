"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface chartData {
  date: string;
  [key: string]: string | number;
}

interface LineChartComponentProps {
  chartData: chartData[];
  chartConfig: ChartConfig;
  defaultActiveChart?: string;
  title?: string;
  description?: string;
}

export function LineChartComponent({
  chartData,
  chartConfig,
  defaultActiveChart,
}: LineChartComponentProps) {
  const chartKeys = Object.keys(chartConfig).filter(
    (key) => chartConfig[key].label && chartConfig[key].color
  );

  const [activeChart, setActiveChart] = React.useState<string>(
    defaultActiveChart || chartKeys[0] || "desktop"
  );

  const totals = React.useMemo(() => {
    const result: Record<string, number> = {};
    chartKeys.forEach((key) => {
      result[key] = chartData?.reduce(
        (acc, curr) => acc + (Number(curr[key]) || 0),
        0
      );
    });
    return result;
  }, [chartData, chartKeys]);

  return (
    <div className="py-4 sm:py-0">
      <div className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex">
          {chartKeys.map((key) => {
            return (
              <button
                key={key}
                data-active={activeChart === key}
                className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(key)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[key].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {totals[key]?.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[250px] w-full"
      >
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-[150px]"
                nameKey="views"
                labelFormatter={(value) => {
                  return new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
              />
            }
          />
          <Line
            dataKey={activeChart}
            type="monotone"
            stroke={`var(--color-${activeChart})`}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
