import { Result } from "better-result";
import { z } from "zod";

export const chunk = <T>(arr: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

export function validateSchema<T>(schema: z.ZodType<T>, data: unknown): Result<T, Error> {
  const result = schema.safeParse(data);

  if (!result.success) {
    return Result.err(new Error(`Validation failed: ${result.error.message}`));
  }

  return Result.ok(result.data);
}

export const executeWithRetryWithHandler = async <T>(
  apiCall: () => Promise<T>,
  errorHandler: (error: unknown, attempt: number) => { retry: boolean; data: unknown },
  maxRetries: number = 3,
  baseDelay: number = 1000,
  currentAttempt: number = 1
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    const handledError = errorHandler(error, currentAttempt);

    if (!handledError.retry) return handledError.data as T;

    if (handledError.retry && currentAttempt <= maxRetries) {
      const delay = baseDelay * Math.pow(2, currentAttempt - 1) * (0.5 + Math.random() * 0.5);

      await new Promise((resolve) => setTimeout(resolve, delay));

      return executeWithRetryWithHandler(apiCall, errorHandler, maxRetries, baseDelay, currentAttempt + 1);
    }

    return handledError.data as T;
  }
};

class UnTraceableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    this.stack = undefined;
  }
}

export const validateRequiredKeys = <K extends string>(
  requiredKeys: readonly K[],
  source: Record<K, string>,
  errorMessage: string | ((missingKeys: K[]) => string),
  errorInstance?: (message: string) => Error
): Record<K, string> => {
  const missingKeys: K[] = [];
  const result: Partial<Record<K, string>> = {};

  for (const key of requiredKeys) {
    const value = source[key];
    if (!value) {
      missingKeys.push(key);
    } else {
      result[key] = value;
    }
  }

  if (missingKeys.length > 0) {
    const missingKeysList = missingKeys.join(", ");
    const error =
      typeof errorMessage === "function" ? errorMessage(missingKeys) : errorMessage.replace("{keys}", missingKeysList);

    throw errorInstance?.(error) ?? new UnTraceableError(error);
  }

  return result as Record<K, string>;
};

export const schemaFor = <TInterface>() => {
  return <TSchema extends z.ZodType<TInterface>>(schema: TSchema): TSchema => schema;
};
