import { schemaFor } from "@stellartools/core";
import { z } from "zod";

export interface StellarToolsMedusaAdapterOptions {
  /**
   * The API key for the Stellar Tools API.
   */
  apiKey: string;

  /**
   * Whether to enable debug mode.
   */
  debug?: boolean;
}

export const stellarToolsMedusaAdapterOptionsSchema =
  schemaFor<StellarToolsMedusaAdapterOptions>()(
    z.object({
      apiKey: z.string(),
      debug: z.boolean().optional(),
    })
  );
