import { stellar } from "@stellar-tools/better-auth";
import { betterAuth } from "better-auth";
import { Horizon } from "@stellar/stellar-sdk";

export const auth = betterAuth({
  plugins: [
    stellar({
      horizonServer: new Horizon.Server("https://horizon-testnet.stellar.org"),
      networkPassphrase: "Test SDF Network ; September 2015",
      merchantPublicKey: process.env.STELLAR_PUBLIC_KEY!,
    }),
  ],
});
