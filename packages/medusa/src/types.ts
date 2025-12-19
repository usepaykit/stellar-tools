import { z } from "zod";

export const stellarOptionsSchema = z.object({
  /**
   * Stellar API key for authentication
   */
  apiKey: z.string().min(1, "API key is required"),

  /**
   * Default asset for payments (XLM, USDC, etc.)
   */
  defaultAsset: z
    .object({
      code: z.string(),
      issuer: z.string().optional(),
    })
    .optional()
    .default({ code: "XLM" }),

  /**
   * Whether to enable debug mode
   */
  debug: z.boolean().optional().default(false),
});

export type StellarMedusaOptions = z.infer<typeof stellarOptionsSchema>;

export interface StellarPaymentData {
  id: string;
  memo: string;
  amount: string;
  asset_code: string;
  asset_issuer?: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "canceled";
  txHash?: string;
  payment_url?: string;
  created_at: number;
  expires_at: number;
}
