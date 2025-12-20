import { setTimeout } from "timers/promises";

type Success<T> = [T, undefined];

type Failure<E = Error> = [undefined, E];

export type Result<T, E = Error> = Success<T> | Failure<E>;

export async function tryCatchAsync<T, E = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return [data as T, undefined];
  } catch (error) {
    return [undefined, error as E];
  }
}

export function tryCatchSync<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    const data = fn();
    return [data, undefined];
  } catch (error) {
    return [undefined, error as E];
  }
}

export type ResultFP<T, E = unknown> =
  | { ok: true; value: T; error?: never }
  | { ok: false; value?: never; error: E };

export const OK = <V>(value: V): ResultFP<V, never> => ({ ok: true, value });

export const ERR = <E>(error: E): ResultFP<never, E> => ({
  ok: false,
  error,
});

export const buildError = (message: string, cause?: unknown): Error => {
  const error = new Error(message);

  if (cause) error.cause = cause;

  return error;
};

export const executeWithRetryWithHandler = async <T>(
  apiCall: () => Promise<T>,
  errorHandler: (
    error: unknown,
    attempt: number
  ) => { retry: boolean; data: unknown },
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
      const delay =
        baseDelay *
        Math.pow(2, currentAttempt - 1) *
        (0.5 + Math.random() * 0.5);

      await setTimeout(delay);

      return executeWithRetryWithHandler(
        apiCall,
        errorHandler,
        maxRetries,
        baseDelay,
        currentAttempt + 1
      );
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
      typeof errorMessage === "function"
        ? errorMessage(missingKeys)
        : errorMessage.replace("{keys}", missingKeysList);

    throw errorInstance?.(error) ?? new UnTraceableError(error);
  }

  return result as Record<K, string>;
};
