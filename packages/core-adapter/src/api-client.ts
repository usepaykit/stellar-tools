import { Result } from "better-result";
import ky, { KyInstance } from "ky";

export type ApiClientConfig = {
  baseUrl: string;
  headers: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
};

export class ApiClient {
  private api: KyInstance;

  constructor(config: ApiClientConfig) {
    this.api = ky.create({
      prefixUrl: config.baseUrl,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      timeout: config.timeout ?? 30000,
      retry: {
        limit: config.maxRetries ?? 3,
        methods: ["get", "put", "post", "delete", "patch"],
        statusCodes: [408, 413, 429, 500, 502, 503, 504],
      },
    });
  }

  private request = async <T>(call: () => Promise<T>): Promise<Result<T, Error>> => {
    return Result.tryPromise({
      try: call,
      catch: (e) => (e instanceof Error ? e : new Error(String(e))),
    });
  };

  get = <T>(url: string, searchParams?: any) =>
    this.request(() => this.api.get(url, { searchParams }).json<{ data: T }>());

  post = <T>(url: string, body?: any) => this.request(() => this.api.post(url, { json: body }).json<{ data: T }>());

  put = <T>(url: string, body?: any) => this.request(() => this.api.put(url, { json: body }).json<{ data: T }>());

  delete = <T>(url: string) => this.request(() => this.api.delete(url).json<{ data: T }>());
}
