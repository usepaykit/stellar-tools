import { type ClassValue, clsx } from "clsx";
import moment from "moment";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const truncate = (
  text: string,
  { start = 6, end = 4, separator = "..." }: { start?: number; end?: number; separator?: string } = {}
): string => {
  if (!text) return "";
  if (text.length <= start + end) return text;
  const prefix = start > 0 ? text.slice(0, start) : "";
  const suffix = end > 0 ? text.slice(-end) : "";
  return `${prefix}${separator}${suffix}`;
};

export type NormalizedChartPoint = {
  i: string;
  value: number;
};

type RawDataPoint = Record<string, any>;

export function normalizeTimeSeries<T extends RawDataPoint>(
  data: T[] = [],
  count: number = 28,
  unit: moment.unitOfTime.DurationConstructor = "day"
): NormalizedChartPoint[] {
  const result: NormalizedChartPoint[] = [];
  const now = moment();
  const formatStr = unit === "day" ? "YYYY-MM-DD" : "YYYY-MM-DDTHH";

  for (let i = count - 1; i >= 0; i--) {
    const time = moment(now).subtract(i, unit);
    const key = time.format(formatStr);
    const match = data.find((p) => p.date === key || p.h === key || p.i === key);
    const rawVal = match ? (match.value ?? match.amount ?? match.count ?? match.c ?? 0) : 0;

    result.push({
      i: key,
      value: typeof rawVal === "string" ? parseFloat(rawVal) : rawVal,
    });
  }

  return result;
}
