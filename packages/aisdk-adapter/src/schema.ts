import { schemaFor } from "@stellartools/core";
import { z } from "zod";

export const stellarToolsAISDKOptionsSchema =
  schemaFor<StellarToolsAISDKOptions>()(
    z.object({
      apiKey: z.string(),
      customerId: z.string(),
      productId: z.string(),
    })
  );

export interface StellarToolsAISDKOptions {
  /**
   * The API key for the Stellar Tools API.
   */
  apiKey: string;

  /**
   * The customer ID of the Stellar metadata.
   */
  customerId: string;

  /**
   * The ID of the metered product to use for billing.
   */
  productId: string;
}
