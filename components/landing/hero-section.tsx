import React from "react";

import { CodeBlock } from "@/components/code-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heroproviders } from "@/constant/hero-constant";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="mb-2 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Stripe for Stellar
            </h1>
            <p className="text-muted-foreground mb-8 text-lg leading-8 sm:text-xl">
              Drop-in payment adapters for your stack. Accept fast, low-cost
              crypto payments in minutes.
            </p>
          </div>

          {/* Tabs with Code Block */}
          <Tabs defaultValue={Heroproviders[0].id} className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="w-full flex-col sm:w-auto sm:flex-row sm:justify-start">
                {Heroproviders.map((provider) => (
                  <TabsTrigger
                    key={provider.id}
                    value={provider.id}
                    className="w-full justify-start gap-2 data-[state=active]:shadow-none sm:w-auto sm:justify-center"
                  >
                    <Image
                      src={provider.logo}
                      alt={`${provider.name} logo`}
                      width={16}
                      height={16}
                      className="size-4 rounded-full object-contain"
                    />
                    <span>{provider.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <span className="text-muted-foreground text-center text-sm whitespace-nowrap sm:text-left">
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
  );
}
