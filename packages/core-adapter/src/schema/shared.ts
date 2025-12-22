import { z } from "zod";

import { schemaFor } from "../utils";

export const environmentSchema = z.enum(["testnet", "mainnet"]);

export type Environment = z.infer<typeof environmentSchema>;

export interface StellarToolsConfig {
  /**
   * The API key for the Stellar Tools API.
   */
  apiKey: string;

  /**
   * Whether to enable debug mode.
   */
  debug: boolean;
}

export const stellarToolsConfigSchema = schemaFor<StellarToolsConfig>()(
  z.object({
    apiKey: z.string(),
    debug: z.boolean(),
  })
);
