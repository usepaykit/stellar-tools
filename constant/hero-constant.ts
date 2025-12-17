const medusaJSCodeSample = `
import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  modules: [
    {
      resolve: "@medusajs/payment",
      options: {
        providers: [
          {
            resolve: "@stellar-tools/medusajs",
            id: "stellar",
            debug: true,
            webhookSecret: process.env.STELLAR_WEBHOOK_SECRET,
          },
        ],
      },
    },
  ],
});
`;

 const shopifyCodeSample = `
import { StellarApp } from "@stellar-tools/shopify";

export default StellarApp({
  apiKey: process.env.STELLAR_API_KEY,
  network: "testnet",
  webhooks: {
    payment: "/api/webhooks/stellar"
  }
});
`;

const betterAuthCodeSample = `
import { betterAuth } from "better-auth"
import { stellar } from "@stellar-tools/better-auth";
import { Server } from "@stellar/stellar-sdk";

const stellarClient = new Server("https://horizon-testnet.stellar.org");

export const auth = betterAuth({
  plugins: [stellar({ stellarClient })]
});

export default auth;`;



export const Heroproviders = [
  {
    id: "betterauth",
    name: "BetterAuth",
    logo: "/images/integrations/better-auth.png",
    filename: "auth.ts",
    code: betterAuthCodeSample,
  },
  {
    id: "medusa",
    name: "Medusa",
    logo: "/images/integrations/medusa.jpeg",
    filename: "medusa-config.ts",
    code: medusaJSCodeSample,
  },
  {
    id: "shopify",
    name: "Shopify",
    logo: "/images/integrations/shopify.png",
    filename: "app.ts",
    code: shopifyCodeSample,
  },
];