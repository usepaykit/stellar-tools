import { z as Schema, schemaFor } from "@stellartools/core";

export const meterConfigSchema = schemaFor<MeterConfig>()(
  Schema.object({
    apiKey: Schema.string(),
    productId: Schema.string(),
  })
);

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
