import { schemaFor } from "@stellartools/core";
import { z } from "zod";

export interface StellarToolsUploadthingOptions {
  /**
   * The API key for the Stellar Tools API.
   */
  apiKey: string;

  /**
   * The ID of the metered product to use for billing.
   */
  productId: string;

  /**
   * Whether to enable debug mode.
   */
  debug?: boolean;
}

export const stellarToolsUploadthingOptionsSchema = schemaFor<StellarToolsUploadthingOptions>()(
  z.object({
    apiKey: z.string(),
    productId: z.string(),
    debug: z.boolean().optional(),
  })
);
