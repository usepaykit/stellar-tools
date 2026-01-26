import { schemaFor } from "@stellartools/core";
import { z } from "zod";

export interface MeterConfig {
  /**
   * The API key for the Stellar Tools API.
   */
  apiKey: string;

  /**
   * The ID of the metered product to use for billing.
   */
  productId: string;
}

export const meterConfigSchema = schemaFor<MeterConfig>()(
  z.object({
    apiKey: z.string(),
    productId: z.string(),
  })
);
