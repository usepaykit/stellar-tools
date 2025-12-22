import {
  ERR,
  OK,
  ResultFP,
  buildError,
  executeWithRetryWithHandler,
} from "./utils";

export type ApiClientConfig = {
  baseUrl: string;
  headers: Record<string, string>;
  retryOptions: { max: number; baseDelay: number; debug: boolean };
};

export class ApiClient {
  constructor(private config: ApiClientConfig) {}

  private errorHandler = (err: unknown) => {
    return ERR(buildError(String(err), err));
  };

  private getFullUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith("/")
      ? endpoint.slice(1)
      : endpoint;
    return `${this.config.baseUrl}/${cleanEndpoint}`;
  }

  private getRequestOptions(
    options?: Omit<RequestInit, "method">
  ): RequestInit {
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

    const shouldRetry = retryablePatterns.some((pattern) =>
      pattern.test(errorString)
    );

    if (this.config.retryOptions.debug) {
      console.info(
        `[ApiClient] Attempt ${attempt} failed: "${String(error)}" - Retry: ${shouldRetry}`
      );
    }

    return { retry: shouldRetry, data: null };
  };

  private async withRetry<T>(
    apiCall: () => Promise<ResultFP<T, Error>>
  ): Promise<ResultFP<T, Error>> {
    return executeWithRetryWithHandler(
      apiCall,
      this.retryErrorHandler,
      this.config.retryOptions.max,
      this.config.retryOptions.baseDelay
    );
  }

  get = async <T>(
    endpoint: string,
    options?: Omit<RequestInit, "method">
  ): Promise<ResultFP<T, Error>> => {
    return this.withRetry(async () => {
      const url = this.getFullUrl(endpoint);
      const requestOptions = this.getRequestOptions(options);

      const res = await fetch(url, { method: "GET", ...requestOptions });

      const data = (await res.json()) as T;

      if (!res.ok) {
        return ERR(buildError(`${res.status}: ${JSON.stringify(data)}`, data));
      }
      return OK(data);
    });
  };

  post = async <T>(
    endpoint: string,
    options?: Omit<RequestInit, "method">
  ): Promise<ResultFP<T, Error>> => {
    return this.withRetry(async () => {
      const url = this.getFullUrl(endpoint);
      const requestOptions = this.getRequestOptions(options);
      const res = await fetch(url, { method: "POST", ...requestOptions });

      const data = (await res.json()) as T;

      if (!res.ok) {
        return ERR(
          buildError(`${res.status}: ${JSON.stringify(data)}`, data) as Error
        );
      }

      return OK(data);
    });
  };

  delete = async <T>(
    endpoint: string,
    options?: Omit<RequestInit, "method">
  ): Promise<ResultFP<T, Error>> => {
    return this.withRetry(async () => {
      const url = this.getFullUrl(endpoint);
      const requestOptions = this.getRequestOptions(options);
      return await fetch(url, { method: "DELETE", ...requestOptions })
        .then((res) => OK(res.json() as T))
        .catch((err) => this.errorHandler(err));
    });
  };

  put = async <T>(
    endpoint: string,
    options?: Omit<RequestInit, "method">
  ): Promise<ResultFP<T, Error>> => {
    return this.withRetry(async () => {
      const url = this.getFullUrl(endpoint);
      const requestOptions = this.getRequestOptions(options);
      return await fetch(url, { method: "PUT", ...requestOptions })
        .then((res) => OK(res.json() as T))
        .catch((err) => this.errorHandler(err));
    });
  };

  patch = async <T>(
    endpoint: string,
    options?: Omit<RequestInit, "method">
  ): Promise<ResultFP<T, Error>> => {
    return this.withRetry(async () => {
      const url = this.getFullUrl(endpoint);
      const requestOptions = this.getRequestOptions(options);
      return await fetch(url, { method: "PATCH", ...requestOptions })
        .then((res) => OK(res.json() as T))
        .catch((err) => this.errorHandler(err));
    });
  };
}
