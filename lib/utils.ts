import { type ClassValue, clsx } from "clsx";
import _ from "lodash";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const truncate = (
  text: string,
  { start = 6, end = 4, separator = "..." }: { start?: number; end?: number; separator?: string } = {}
): string => {
  if (!text) return "";

  if (text.length <= start + end) {
    return text;
  }

  const prefix = start > 0 ? text.slice(0, start) : "";
  const suffix = end > 0 ? text.slice(-end) : "";

  return `${prefix}${separator}${suffix}`;
};

export const parseJSON = <T>(str: string, schema: z.ZodSchema<T>): T => {
  const parsed = JSON.parse(str);
  return schema.parse(parsed);
};

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function computeDiff<T extends Record<string, unknown>>(
  oldData: T,
  newData: Partial<T>,
  ignoreKeys: string[] = ["updatedAt", "createdAt", "id"]
) {
  const diff: Record<string, { from: unknown; to: unknown }> = {};

  Object.keys(newData).forEach((key) => {
    if (ignoreKeys.includes(key)) return;

    const oldVal = oldData[key as keyof T];
    const newVal = newData[key as keyof T];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = {
        from: oldVal ?? null,
        to: newVal ?? null,
      };
    }
  });

  return Object.keys(diff).length > 0 ? diff : null;
}

export const toSnakeCase = (data: unknown): unknown => {
  if (_.isArray(data)) {
    return data.map(toSnakeCase);
  }

  if (_.isPlainObject(data)) {
    return _.mapValues(
      _.mapKeys(data as Record<string, unknown>, (_v, k) => _.snakeCase(k)),
      toSnakeCase
    );
  }

  return data;
};

export const urlToFile = async (url: string, fileName: string): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type });
};
