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

export function generateResourceId(prefix: string, baseSignature: string, length: number, hashAlgorithm: HashAlgorithm = 'shake128'): string {
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