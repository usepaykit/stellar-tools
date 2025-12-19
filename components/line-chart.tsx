"use client";

import React from "react";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "@/lib/utils";
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  XAxis,
} from "recharts";

export type BaseChartData = Record<string, string | number>;

export type ChartColor =
  | "var(--chart-1)"
  | "var(--chart-2)"
  | "var(--chart-3)"
  | "var(--chart-4)"
  | "var(--chart-5)";

interface LineChartProps<T extends BaseChartData>
  extends
    Omit<React.ComponentProps<typeof ChartContainer>, "children">,
    MixinProps<
      "xAxis",
      Omit<React.ComponentProps<typeof XAxis>, "dataKey" | "key" | "ref">
    >,
    MixinProps<
      "tooltip",
      Omit<
        React.ComponentProps<typeof ChartTooltipContent>,
        "nameKey" | "labelFormatter" | "key" | "ref"
      >
    >,
    MixinProps<
      "line",
      Omit<React.ComponentProps<typeof Line>, "dataKey" | "key" | "ref">
    >,
    MixinProps<"grid", React.ComponentProps<typeof CartesianGrid>> {
  data: T[];
  config: ChartConfig;
  xAxisKey: Extract<keyof T, string>;
  activeKey: Extract<keyof T, string>;
  color: ChartColor;
  xAxisFormatter?: (value: string | number) => string;
  tooltipLabelFormatter?: (value: string | number) => string;
  className?: string;
  showTooltip?: boolean;
  showXAxis?: boolean;
}

export function LineChart<T extends BaseChartData>({
  data,
  config,
  xAxisKey,
  activeKey,
  color,
  xAxisFormatter,
  tooltipLabelFormatter,
  className,
  showTooltip = true,
  showXAxis = true,
  ...mixinProps
}: LineChartProps<T>) {
  const defaultFormatter = (value: string | number) => {
    const date = new Date(value);

    return !isNaN(date.getTime())
      ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : String(value);
  };

  const formatX = xAxisFormatter || defaultFormatter;
  const formatTooltip = tooltipLabelFormatter || defaultFormatter;

  const { xAxis, tooltip, line, rest, grid } = splitProps(
    mixinProps,
    "xAxis",
    "tooltip",
    "line",
    "grid"
  );

  return (
    <ChartContainer
      {...rest}
      config={config}
      className={cn("aspect-auto h-[250px] w-full", className)}
    >
      <RechartsLineChart
        accessibilityLayer
        data={data}
        margin={{ left: 12, right: 12 }}
      >
        <CartesianGrid vertical={false} {...grid} />

        {showXAxis && (
          <XAxis
            {...xAxis}
            dataKey={xAxisKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={formatX}
          />
        )}

        {showTooltip && (
          <ChartTooltip
            content={
              <ChartTooltipContent
                {...tooltip}
                className={cn(
                  "border-muted/40 w-fit min-w-[120px] gap-1 px-2 py-1.5 text-[11px] shadow-lg backdrop-blur-sm",
                  tooltip.className
                )}
                labelClassName="font-medium text-muted-foreground/80 mb-0.5"
                nameKey={activeKey}
                labelFormatter={formatTooltip}
              />
            }
          />
        )}

        <Line
          type="monotone"
          stroke={color}
          strokeWidth={2}
          dot={false}
          {...line}
          dataKey={activeKey}
        />
      </RechartsLineChart>
    </ChartContainer>
  );
}

/**
 * USAGE
 * 
 * const dummyData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
];

// 2. Create the chart configuration
// The keys here must match the keys in your data
const chartConfig = {
  desktop: {
    label: "Desktop Users",
    color: "hsl(var(--chart-1))",
  },
};

export default function MyChartPage() {
  return (
    <div className="p-10 w-full max-w-2xl">
      <LineChart
        data={dummyData}
        config={chartConfig}
        xAxisKey="month" // The key for the X-axis
        activeKey="desktop" // The key for the line values
        color="var(--chart-5)" // The line color
        // Optional: Customize child components using MixinProps
        xAxisTickMargin={10}
        tooltipIndicator="dot"
      />
    </div>
  );
}

 */
