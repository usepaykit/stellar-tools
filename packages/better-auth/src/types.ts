import type { GenericEndpointContext, User } from "better-auth";
import type { Horizon } from "@stellar/stellar-sdk";

export interface StellarOptions {
  horizonServer: Horizon.Server;
  networkPassphrase: string;
  merchantPublicKey: string;
  merchantSecretKey?: string; // For server-side signing if needed
  onPaymentComplete?: (
    data: {
      payment: Payment;
      user: User;
      transactionHash: string;
    },
    ctx: GenericEndpointContext
  ) => Promise<void>;
}

export interface Payment {
  id: string;
  userId: string;
  amount: string;
  asset: string;
  status: "pending" | "completed" | "failed";
  transactionHash?: string;
  createdAt: Date;
}
