import { type ClassValue, clsx } from "clsx";
import crypto from "crypto";
import _ from "lodash";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
type HashAlgorithm = "shake128" | "sha256";
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

export function computeDiff<T extends Record<string, any>>(
  oldData: T,
  newData: Partial<T>,
  ignoreKeys: string[] = ["updatedAt", "createdAt", "id"],
  delimiter?: string // e.g., "." to enable deep diff
) {
  const diff: Record<string, { from: unknown; to: unknown }> = {};

  for (const key in newData) {
    if (ignoreKeys.includes(key)) continue;

    const oldVal = oldData?.[key];
    const newVal = newData[key];
    const currentPath = key;

    const isObject = (v: unknown) => v && typeof v === "object" && !Array.isArray(v);

    if (delimiter && isObject(oldVal) && isObject(newVal)) {
      const nestedDiff = computeDiff(
        oldVal as Partial<T[keyof T]>,
        newVal as Partial<T[keyof T]>,
        ignoreKeys,
        delimiter
      );
      if (nestedDiff) Object.assign(diff, nestedDiff);
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[currentPath] = {
        from: oldVal ?? null,
        to: newVal ?? null,
      };
    }
  }

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

export function generateResourceId(
  prefix: string,
  baseSignature: string,
  length: number,
  hashAlgorithm: HashAlgorithm = "shake128"
): string {
  if (!baseSignature || !prefix || length <= 0) {
    throw new Error("Invalid arguments: baseSignature, prefix, and length (> 0) are required");
  }

  const hash = crypto.createHash(hashAlgorithm, { outputLength: 3 }).update(baseSignature).digest();

  let signature = "";
  let value = (hash[0] << 16) | (hash[1] << 8) | hash[2];
  for (let i = 0; i < 4; i++) {
    signature += ALPHABET[value % 62];
    value = Math.floor(value / 62);
  }

  const bytes = crypto.randomBytes(length);
  let entropy = "";
  for (let i = 0; i < length; i++) {
    entropy += ALPHABET[bytes[i] % 62];
  }

  return `${prefix}_${signature}${entropy}`;
}

export function normalizeTimeSeries(points: { i: string; value: number }[], count: number, unit: "hour" | "day") {
  const byTime = new Map(points.map((p) => [p.i, p.value]));
  const result: { i: string; value: number }[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    if (unit === "hour") d.setHours(d.getHours() - i);
    else d.setDate(d.getDate() - i);

    const timeKey =
      unit === "hour"
        ? d.toISOString().slice(0, 13) // YYYY-MM-DDTHH
        : d.toISOString().slice(0, 10); // YYYY-MM-DD

    result.push({ i: timeKey, value: byTime.get(timeKey) ?? 0 });
  }
  return result;
}
