import { StellarTools } from "@stellartools/core";
import { UploadThingError, createUploadthing } from "uploadthing/server";
import type { ExpandedRouteConfig } from "uploadthing/types";

import {
  StellarUploadthingOptions,
  stellarUploadthingOptionsSchema,
} from "./schema";
import { calculateCredits } from "./utils";

export const createStellarUploadthing = (
  opts: StellarUploadthingOptions
): ReturnType<typeof createUploadthing> => {
  const { error, data } = stellarUploadthingOptionsSchema.safeParse(opts);

  if (error) {
    throw new Error(`Invalid options: ${error.message}`);
  }

  const stellar = new StellarTools({ apiKey: data.apiKey });

  // Get the base factory function
  const baseFactory = createUploadthing();

  // Return a wrapped factory that enhances the builder
  return function stellarFactory<T extends ExpandedRouteConfig>(
    routeConfig: T,
    routeOptions?: Parameters<typeof baseFactory>[1]
  ) {
    // Get the initial builder from the base factory
    const baseBuilder = baseFactory(routeConfig, routeOptions);

    // Return a proxy object that intercepts middleware calls
    return {
      input: baseBuilder.input.bind(baseBuilder),

      /**
       * Enhanced middleware that checks credits BEFORE user middleware
       */
      middleware: function (
        userMiddleware: Parameters<typeof baseBuilder.middleware>[0]
      ) {
        // Wrap user's middleware with credit checking logic
        const wrappedMiddleware = async (opts: any) => {
          if (data.debug) {
            console.log("[StellarUploadthing] Checking credits before upload");
          }
          const product = await stellar.product.retrieve(data.productId);

          if (!product.ok) {
            throw new UploadThingError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to retrieve product",
            });
          }

          const customerId =
            opts.req?.headers?.get?.("x-customer-id") ?? // Standard Request
            opts.req?.headers?.["x-customer-id"] ?? // Node-style headers
            opts.event?.req?.headers?.get?.("x-customer-id"); // H3/Nuxt style

          if (!customerId) {
            throw new UploadThingError({
              code: "FORBIDDEN",
              message: "Missing customer ID. Pass via `x-customer-id` header.",
            });
          }

          // 2. CALCULATE REQUIRED CREDITS
          const requiredCredits = calculateCredits(opts.files, {
            unitDivisor: product.value.unitDivisor as number,
            unitsPerCredit: product.value.unitsPerCredit as number,
          });

          if (data.debug) {
            console.log(
              `[StellarUploadthing] Required credits: ${requiredCredits}`
            );
          }

          // 3. CHECK & RESERVE CREDITS
          const checkResult = await stellar.credit.check(
            customerId,
            data.productId
          );

          if (!checkResult.ok) {
            throw new UploadThingError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to check credits",
            });
          }

          if (checkResult.value.balance < requiredCredits) {
            throw new UploadThingError({
              code: "FORBIDDEN",
              message: `Insufficient credits. Required: ${requiredCredits}, Available: ${checkResult.value.balance}`,
            });
          }

          // Reserve credits
          const reserveResult = await stellar.credit.deduct(customerId, {
            productId: data.productId,
            amount: requiredCredits,
            reason: "Upload started",
            metadata: {
              source: "uploadthing",
            },
          });

          if (!reserveResult.ok) {
            throw new UploadThingError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to deduct credits",
            });
          }

          const userMetadata = userMiddleware ? await userMiddleware(opts) : {};

          // 5. INJECT STELLAR METADATA
          return {
            ...userMetadata,
            __stellar: { customerId, requiredCredits },
          };
        };

        // Call the base middleware with our wrapped version
        return baseBuilder.middleware(wrappedMiddleware);
      },

      onUploadError: function (
        fn: Parameters<typeof baseBuilder.onUploadError>[0]
      ) {
        // Optionally wrap onUploadError to release reserved credits on error
        const wrappedOnUploadError = async (opts: any) => {
          // Release credits if upload failed
          if (opts.metadata?.__stellar?.reservationId) {
            if (data.debug) {
              console.log(
                "[StellarUploadthing] Releasing reserved credits due to error"
              );
            }

            await stellar.credit.refund(opts.metadata.__stellar.customerId, {
              productId: data.productId,
              amount: opts.metadata.__stellar.requiredCredits,
              reason: "Upload failed",
              metadata: {
                source: "uploadthing",
              },
            });
          }

          if (fn) await fn(opts);
        };

        return baseBuilder.onUploadError(wrappedOnUploadError);
      },

      onUploadComplete: function (
        fn: Parameters<typeof baseBuilder.onUploadComplete>[0]
      ) {
        // Wrap onUploadComplete to commit the credits
        const wrappedOnUploadComplete = async (opts: any) => {
          // Commit the credits (convert reservation to actual charge)
          if (opts.metadata?.__stellar?.reservationId) {
            if (data.debug) {
              console.log("[StellarUploadthing] Committing reserved credits");
            }
            await stellar.credit.deduct(opts.metadata.__stellar.customerId, {
              productId: data.productId,
              amount: opts.metadata.__stellar.requiredCredits,
              reason: "Upload complete",
              metadata: {
                source: "uploadthing",
              },
            });
          }

          return await fn(opts);
        };

        return baseBuilder.onUploadComplete(wrappedOnUploadComplete);
      },
    } as typeof baseBuilder;
  };
};
