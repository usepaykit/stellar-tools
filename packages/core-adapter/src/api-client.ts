import { nanoid } from "nanoid";

import { ERR, OK, Result, buildError, executeWithRetryWithHandler } from "./utils";

const DEFAULT_TIMEOUT = 30000;

export type ApiClientConfig = {
  /**
   * The base URL of the API
   */
  baseUrl: string;

  /**
   * The headers to send with the request
   */
  headers: Record<string, string>;

  /**
   * The retry options
   */
  retryOptions: { max: number; baseDelay: number; debug: boolean };

  /**
   * The timeout for the request
   */
  timeout?: number;
};

export type ApiResponse<T = unknown> = {
  /**
   * Whether the request was successful
   */
  ok: boolean;
  /**
   * The status code of the response
   */
  status: number;

  /**
   * The status text of the response
   */
  statusText: string;

  /**
   * The headers of the response
   */
  headers: Headers;

  /**
   * The parsed JSON data of the response
   */
  data: T;

  /**
   * The raw response text
   */
  text: string;

  /**
   * The final URL after redirects
   */
  url: string;
};

export class ApiClient {
  constructor(private config: ApiClientConfig) {}

  private abortControllers: Map<string, AbortController> = new Map();

  private errorHandler = (err: unknown) => {
    return ERR(buildError(String(err), err));
  };

  private getFullUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
    return `${this.config.baseUrl}/${cleanEndpoint}`;
  }

  private getRequestOptions(options?: Omit<RequestInit, "method">): RequestInit {
    return {
      headers: {
        "Content-Type": "application/json",
        ...this.config.headers,
        ...options?.headers,
      },
      ...options,
    };
  }
  private retryErrorHandler = (error: unknown, attempt: number) => {
    const errorString = String(error).toLowerCase();

    const retryablePatterns = [
      /rate[_\-\s]?limit/i,
      /connection/i,
      /timeout/i,
      /internal[_\-\s]?server[_\-\s]?error/i,
      /bad[_\-\s]?gateway/i,
      /service[_\-\s]?unavailable/i,
      /gateway[_\-\s]?timeout/i,
      /500|502|503|504/,
    ];

    // Don't retry if explicitly aborted
    if (errorString.includes("aborted")) {
      return { retry: false, data: null };
    }

    const shouldRetry = retryablePatterns.some((pattern) => pattern.test(errorString));

    if (this.config.retryOptions.debug) {
      console.info(`[ApiClient] Attempt ${attempt} failed: "${String(error)}" - Retry: ${shouldRetry}`);
    }

    return { retry: shouldRetry, data: null };
  };

  private async withRetry<T>(
    apiCall: () => Promise<Result<ApiResponse<T>, Error>>
  ): Promise<Result<ApiResponse<T>, Error>> {
    return executeWithRetryWithHandler(
      apiCall,
      this.retryErrorHandler,
      this.config.retryOptions.max,
      this.config.retryOptions.baseDelay
    );
  }

  private createAbortController(requestId: string): AbortController {
    const controller = new AbortController();
    const timeout = this.config.timeout ?? DEFAULT_TIMEOUT;

    // Auto-abort after timeout
    const timeoutId = setTimeout(() => {
      controller.abort(new Error(`Request timed out after ${timeout}ms`));
    }, timeout);

    // Cleanup timeout on abort
    controller.signal.addEventListener("abort", () => {
      clearTimeout(timeoutId);
    });

    this.abortControllers.set(requestId, controller);
    return controller;
  }

  private cleanupAbortController(requestId: string) {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      this.abortControllers.delete(requestId);
    }
  }

  abort(requestId: string) {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort(new Error("Request aborted by user"));
      this.cleanupAbortController(requestId);
    }
  }

  abortAll() {
    for (const [id, controller] of this.abortControllers.entries()) {
      controller.abort(new Error("All requests aborted"));
      this.cleanupAbortController(id);
    }
  }

  private async parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
    const text = await res.text();
    let data: T;

    try {
      data = text ? (JSON.parse(text) as T) : ({} as T);
    } catch {
      data = text as unknown as T;
    }

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
      data,
      text,
      url: res.url,
    };
  }

  get = async <T>(
    endpoint: string,
    options?: Omit<RequestInit, "method"> & { requestId?: string }
  ): Promise<Result<ApiResponse<T>, Error>> => {
    const requestId = options?.requestId ?? `get_${Date.now()}_${nanoid(10)}`;

    return this.withRetry(async () => {
      try {
        const controller = this.createAbortController(requestId);
        const url = this.getFullUrl(endpoint);
        const requestOptions = this.getRequestOptions(options);

        const res = await fetch(url, {
          method: "GET",
          ...requestOptions,
          signal: controller.signal,
        });

        this.cleanupAbortController(requestId);

        const apiResponse = await this.parseResponse<T>(res);

        if (!res.ok) {
          return ERR(buildError(`${res.status}: ${apiResponse.text}`, apiResponse) as Error);
        }

        return OK(apiResponse);
      } catch (err) {
        this.cleanupAbortController(requestId);
        return this.errorHandler(err);
      }
    });
  };

  post = async <T>(
    endpoint: string,
    options?: Omit<RequestInit, "method"> & { requestId?: string }
  ): Promise<Result<ApiResponse<T>, Error>> => {
    const requestId = options?.requestId ?? `post_${Date.now()}_${nanoid(10)}`;

    return this.withRetry(async () => {
      try {
        const controller = this.createAbortController(requestId);
        const url = this.getFullUrl(endpoint);
        const requestOptions = this.getRequestOptions(options);

        const res = await fetch(url, {
          method: "POST",
          ...requestOptions,
          signal: controller.signal,
        });

        this.cleanupAbortController(requestId);
        const apiResponse = await this.parseResponse<T>(res);

        if (!res.ok) {
          return ERR(buildError(`${res.status}: ${apiResponse.text}`, apiResponse) as Error);
        }

        return OK(apiResponse);
      } catch (err) {
        this.cleanupAbortController(requestId);
        return this.errorHandler(err);
      }
    });
  };

  delete = async <T>(
    endpoint: string,
    options?: Omit<RequestInit, "method"> & { requestId?: string }
  ): Promise<Result<ApiResponse<T>, Error>> => {
    const requestId = options?.requestId ?? `delete_${Date.now()}_${nanoid(10)}`;

    return this.withRetry(async () => {
      try {
        const controller = this.createAbortController(requestId);
        const url = this.getFullUrl(endpoint);
        const requestOptions = this.getRequestOptions(options);

        const res = await fetch(url, {
          method: "DELETE",
          ...requestOptions,
          signal: controller.signal,
        });

        this.cleanupAbortController(requestId);
        const apiResponse = await this.parseResponse<T>(res);

        if (!res.ok) {
          return ERR(buildError(`${res.status}: ${apiResponse.text}`, apiResponse) as Error);
        }

        return OK(apiResponse);
      } catch (err) {
        this.cleanupAbortController(requestId);
        return this.errorHandler(err);
      }
    });
  };

  put = async <T>(
    endpoint: string,
    options?: Omit<RequestInit, "method"> & { requestId?: string }
  ): Promise<Result<ApiResponse<T>, Error>> => {
    const requestId = options?.requestId ?? `put_${Date.now()}_${nanoid(10)}`;

    return this.withRetry(async () => {
      try {
        const controller = this.createAbortController(requestId);
        const url = this.getFullUrl(endpoint);
        const requestOptions = this.getRequestOptions(options);

        const res = await fetch(url, {
          method: "PUT",
          ...requestOptions,
          signal: controller.signal,
        });

        this.cleanupAbortController(requestId);
        const apiResponse = await this.parseResponse<T>(res);

        if (!res.ok) {
          return ERR(buildError(`${res.status}: ${apiResponse.text}`, apiResponse) as Error);
        }

        return OK(apiResponse);
      } catch (err) {
        this.cleanupAbortController(requestId);
        return this.errorHandler(err);
      }
    });
  };

  patch = async <T>(
    endpoint: string,
    options?: Omit<RequestInit, "method"> & { requestId?: string }
  ): Promise<Result<ApiResponse<T>, Error>> => {
    const requestId = options?.requestId ?? `patch_${Date.now()}_${nanoid(10)}`;

    return this.withRetry(async () => {
      try {
        const controller = this.createAbortController(requestId);
        const url = this.getFullUrl(endpoint);
        const requestOptions = this.getRequestOptions(options);

        const res = await fetch(url, {
          method: "PATCH",
          ...requestOptions,
          signal: controller.signal,
        });

        this.cleanupAbortController(requestId);
        const apiResponse = await this.parseResponse<T>(res);

        if (!res.ok) {
          return ERR(buildError(`${res.status}: ${apiResponse.text}`, apiResponse) as Error);
        }

        return OK(apiResponse);
      } catch (err) {
        this.cleanupAbortController(requestId);
        return this.errorHandler(err);
      }
    });
  };
}
