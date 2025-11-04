"use client";

import Image from "next/image";
import Link from "next/link";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Paykit } from "@/components/icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { CodeBlock } from "@/components/codeblock";

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
    logo: "/fonts/integrations/better-auth.png",
    filename: "auth.ts",
    code: betterAuthCodeSample,
  },
  {
    id: "medusa",
    name: "Medusa",
    logo: "/fonts/integrations/medusa.jpeg",
    filename: "medusa-config.ts",
    code: medusaJSCodeSample,
  },
  {
    id: "shopify",
    name: "Shopify",
    logo: "/fonts/integrations/shopify.png",
    filename: "app.ts",
    code: shopifyCodeSample,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Paykit className="size-8" />
            <span className="text-muted-foreground">/</span>
            <Image
              src="/fonts/logo.png"
              alt="Stellar Tools logo"
              width={32}
              height={32}
              className="size-8 object-contain"
            />
            <span className="text-lg font-semibold font-rosemary">
              Stellar Tools
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild>
              <Link
                href="https://github.com/usepaykit/stellar-tools"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <Github className="size-5" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

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

            {/* CTA */}
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link
                  href="https://communityfund.stellar.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Stellar Community
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
