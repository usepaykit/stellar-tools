import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { Heroproviders } from '@/constant/hero-constant';
import { CodeBlock } from "@/components/code-block";

export default function HeroSection() {
  return (

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
        <Tabs defaultValue={Heroproviders[0].id} className="w-full">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="flex-col sm:flex-row w-full sm:w-auto sm:justify-start">
              {Heroproviders.map((provider) => (
                <TabsTrigger
                  key={provider.id}
                  value={provider.id}
                  className="gap-2 w-full sm:w-auto justify-start sm:justify-center data-[state=active]:shadow-none"
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

          {Heroproviders.map((provider) => (
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
  )
}
