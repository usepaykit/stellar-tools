import type { GenericEndpointContext } from "better-auth";
import type { InferOptionSchema } from "better-auth";
import { PlanSchema, stellar$PluginSchema } from "./schema";
import { Horizon } from "@stellar/stellar-sdk";

export interface StellarOptions {
  /**
   * Stellar Horizon Server instance
   */
  horizonServer: Horizon.Server;

  /**
   * Public key where payments are sent
   */
  merchantPublicKey: string;

  /**
   * The network passphrase (Public or Testnet)
   */
  networkPassphrase: string;

  /**
   * Subscription plans configuration
   */
  subscription?: {
    enabled: boolean;
    plans: PlanSchema[] | (() => Promise<PlanSchema[]>);
  };

  /**
   * Callback when a payment is verified on-chain
   */
  onPaymentVerified?: (
    data: { payment: unknown; tx: unknown },
    ctx: GenericEndpointContext
  ) => Promise<void>;

  /**
   * Extendable Schema for the plugin
   */
  schema?: InferOptionSchema<typeof stellar$PluginSchema>;
}
