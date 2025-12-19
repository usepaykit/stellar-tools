import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const truncate = (
  text: string,
  { start = 6, end = 4, separator = "..." }: { start?: number, end?: number, separator?: string } = {}
): string => {
  if (!text) return "";
  
  if (text.length <= start + end) {
    return text;
  }

  const prefix = start > 0 ? text.slice(0, start) : "";
  const suffix = end > 0 ? text.slice(-end) : "";

  return `${prefix}${separator}${suffix}`;
};