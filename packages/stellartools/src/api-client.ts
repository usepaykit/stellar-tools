import { Result } from "better-result";
import ky, { HTTPError, KyInstance } from "ky";

export type ApiClientConfig = {
  baseUrl: string;
  headers: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
};

export interface DetailedResponse<T> {
  status: number;
  ok: boolean;
  data: T | null;
  text: string;
}

export class ApiClient {
  private api: KyInstance;

  constructor(config: ApiClientConfig) {
    this.api = ky.create({
      prefixUrl: config.baseUrl,
      headers: {
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

  private formatPath(url: string): string {
    return url.startsWith("/") ? url.slice(1) : url;
  }

  private request = async <T>(call: () => Promise<T>): Promise<Result<T, Error>> => {
    return Result.tryPromise({
      try: call,
      catch: (e) => (e instanceof Error ? e : new Error(String(e))),
    });
  };

  get = <T>(url: string, searchParams?: any, headers?: HeadersInit) =>
    this.request(() =>
      this.api
        .get(this.formatPath(url), { searchParams, headers: { "Content-Type": "application/json", ...headers } })
        .json<T>()
    );

  post = <T>(url: string, body?: any, headers?: HeadersInit) =>
    this.request(() =>
      this.api
        .post(this.formatPath(url), { json: body, headers: { "Content-Type": "application/json", ...headers } })
        .json<T>()
    );

  // POST with FormData (e.g. file uploads). No Content-Type is set so the browser sends multipart/form-data with boundary.
  postFormData = <T>(url: string, formData: FormData) =>
    this.request(() => this.api.post(this.formatPath(url), { body: formData }).json<T>());

  put = <T>(url: string, body?: any, headers?: HeadersInit) =>
    this.request(() =>
      this.api
        .put(this.formatPath(url), { json: body, headers: { "Content-Type": "application/json", ...headers } })
        .json<T>()
    );

  delete = <T>(url: string, headers?: HeadersInit) =>
    this.request(() =>
      this.api.delete(this.formatPath(url), { headers: { "Content-Type": "application/json", ...headers } }).json<T>()
    );

  // For External Calls (like Webhooks).
  requestDetailed = async <T>(call: () => Promise<Response>): Promise<Result<DetailedResponse<T>, Error>> => {
    return Result.tryPromise({
      try: async () => {
        let res: Response;
        try {
          res = await call();
        } catch (e) {
          if (e instanceof HTTPError) {
            res = e.response;
          } else {
            throw e;
          }
        }

        const text = await res.text();
        let data = null;
        try {
          data = text ? (JSON.parse(text) as T) : null;
        } catch {
          // Fallback if the external server returns non-JSON (like plain text "OK")
        }

        return { status: res.status, ok: res.ok, data, text };
      },
      catch: (e) => (e instanceof Error ? e : new Error(String(e))),
    });
  };

  postDetailed = <T>(url: string, body?: any) =>
    this.requestDetailed<T>(() => this.api.post(this.formatPath(url), { body }));
}
