import { Result, StellarTools } from "@stellartools/core";
import { UploadThingError, createUploadthing } from "uploadthing/server";
import type { ExpandedRouteConfig } from "uploadthing/types";

import { StellarToolsUploadthingOptions, stellarToolsUploadthingOptionsSchema } from "./schema";

export class StellarToolsUploadThingAdapter {
  private stellar: StellarTools;
  private f = createUploadthing();

  constructor(private opts: StellarToolsUploadthingOptions) {
    const parsed = stellarToolsUploadthingOptionsSchema.parse(opts);
    this.stellar = new StellarTools({ apiKey: parsed.apiKey });
  }

  private unwrap<T>(result: Result<T, Error>, code: UploadThingError["code"] = "BAD_REQUEST"): T {
    if (result.isErr()) throw new UploadThingError({ code, message: result.error.message });

    return result.value;
  }

  public routerFactory<T extends ExpandedRouteConfig>(
    config: T,
    options?: Parameters<typeof this.f>[1]
  ): ReturnType<ReturnType<typeof createUploadthing>> {
    const builder = this.f(config, options);

    return {
      input: builder.input.bind(builder),

      middleware: <TOutput extends Record<string, unknown>>(
        userMiddleware?: (opts: any) => Promise<TOutput> | TOutput
      ) => {
        return builder.middleware(async (opts) => {
          const customerId = opts.req.headers.get("x-customer-id");
          if (!customerId) throw new UploadThingError({ code: "FORBIDDEN", message: "Missing x-customer-id" });

          const amount = opts.files.reduce((sum, f) => sum + f.size, 0);

          this.unwrap(await this.stellar.products.retrieve(this.opts.productId), "INTERNAL_SERVER_ERROR");

          this.unwrap(
            await this.stellar.credits.consume(customerId, {
              productId: this.opts.productId,
              rawAmount: amount,
              reason: "deduct",
              metadata: { files: opts.files.map((f) => f.name), source: "uploadthing-adapter" },
            }),
            "FORBIDDEN"
          );

          try {
            const metadata = userMiddleware ? await userMiddleware(opts) : ({} as TOutput);
            return { ...metadata, __stellar: { customerId, requiredCredits: amount } };
          } catch (err) {
            // If user middleware fails, we throw with data so onUploadError can refund
            throw new UploadThingError({
              code: "INTERNAL_SERVER_ERROR",
              message: err instanceof Error ? err.message : "Middleware failed",
              data: { __stellar: { customerId, requiredCredits: amount } },
            });
          }
        });
      },

      onUploadError: (fn?: (opts: any) => Promise<void> | void) => {
        return builder.onUploadError(async (opts) => {
          const stellar = (opts.error.data as any)?.__stellar;

          if (stellar?.customerId && stellar?.requiredCredits) {
            if (this.opts.debug) console.log(`[Stellar] Refunding ${stellar.requiredCredits} to ${stellar.customerId}`);

            await this.stellar.credits.refund(stellar.customerId, {
              productId: this.opts.productId,
              amount: stellar.requiredCredits,
              reason: "upload_failed_automatic_refund",
            });
          }

          if (fn) await fn(opts);
        });
      },

      onUploadComplete: (fn: (opts: any) => void) => builder.onUploadComplete(fn),
    } as unknown as typeof builder;
  }
}
