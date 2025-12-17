"use client";

import { CodeBlock } from "@/components/codeblock";
import { Header } from "@/components/ui/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
const betterAuthCodeSample = `
import { betterAuth } from "better-auth"
import { stellar } from "@stellar-tools/better-auth";
import { Server } from "@stellar/stellar-sdk";

const stellarClient = new Server("https://horizon-testnet.stellar.org");

export const auth = betterAuth({
  plugins: [stellar({ stellarClient })]
});

export default auth;`;


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

const providers = [
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

export default function Home() {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Header />

      {/* Main Content */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h1 className="mb-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Bring Stellar Payments to Every Platform Instantly
              </h1>
              <p className="mb-8 text-lg leading-8 text-muted-foreground sm:text-xl">
                Stellar SDK adapters for BetterAuth, Medusa, Shopify, and many
                more to make crypto-native payments seamless for your users.
              </p>
            </div>

            {/* Tabs with Code Block */}
            <Tabs defaultValue={providers[0].id} className="w-full">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <TabsList className="flex-col sm:flex-row w-full sm:w-auto sm:justify-start">
                  {providers.map((provider) => (
                    <TabsTrigger
                      key={provider.id}
                      value={provider.id}
                      className="gap-2 w-full sm:w-auto justify-start sm:justify-center"
                    >
                      <Image
                        src={provider.logo}
                        alt={`${provider.name} logo`}
                        width={16}
                        height={16}
                        className="size-4 object-contain rounded-full"
                      />
                      <span>{provider.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                <span className="text-center sm:text-left whitespace-nowrap text-sm text-muted-foreground">
                  + many more
                </span>
              </div>

              {providers.map((provider) => (
                <TabsContent
                  key={provider.id}
                  value={provider.id}
                  className="mt-0 w-full"
                >
                  <div className="mx-2 sm:mx-0">
                    <CodeBlock
                      language="typescript"
                      filename={provider.filename}
                      logo={provider.logo}
                      showCopyButton
                    >
                      {provider.code}
                    </CodeBlock>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
}
