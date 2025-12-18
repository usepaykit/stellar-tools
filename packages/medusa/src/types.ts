import { z } from "zod";

export const stellarOptionsSchema = z.object({
  /**
   * Stellar Horizon Server instance URL
   */
  horizonServerUrl: z.string().url(),

  /**
   * Public key where payments are sent (merchant account)
   */
  merchantPublicKey: z.string(),

  /**
   * The network passphrase ("Public Global Stellar Network ; September 2015" or "Test SDF Network ; September 2015")
   */
  networkPassphrase: z.enum([
    "Public Global Stellar Network ; September 2015",
    "Test SDF Network ; September 2015",
  ]),

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
   * Payment timeout in seconds
   */
  paymentTimeout: z.number().optional().default(300),

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
