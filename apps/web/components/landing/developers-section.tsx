"use client";

import React from "react";

import { CodeBlock } from "@/components/code-block";
import { FlaskConical, Key, Webhook } from "lucide-react";

const features = [
  {
    icon: Key,
    title: "REST API + TypeScript SDK",
    description:
      "Everything is typed, documented, and consistent. Create customers, products, invoices, subscriptions with a single function call.",
  },
  {
    icon: Webhook,
    title: "Webhooks for every event",
    description:
      "payment.completed, subscription.renewed, refund.issued — subscribe to what matters and build reactive systems.",
  },
  {
    icon: FlaskConical,
    title: "Full sandbox / testnet mode",
    description:
      "Test everything on Stellar Testnet without touching real funds. Toggle production with a single env variable.",
  },
];

const codeExamples = [
  {
    filename: "create-subscription.ts",
    code: `import { StellarTools } from '@stellartools/sdk';

const st = new StellarTools({
  apiKey: process.env.STELLAR_API_KEY,
});

// Create a customer
const customer = await st.customers.create({
  email: 'user@example.com',
  name: 'Emmanuel Odii',
});

// Generate a hosted checkout link
const link = await st.checkout.create({
  customerId: customer.id,
  redirectUrl: 'https://yourapp.com/success',
});

console.log(link.url); // → share with customer`,
  },
  {
    filename: "langchain-metered.ts",
    code: `import { stellarMeter } from '@stellartools/langchain';

// Wrap any LangChain chain with automatic
// per-token billing on Stellar
const chain = stellarMeter(yourLangChainChain, {
  customerId: 'cus_abc123',
  meterId: 'tokens_used',
  pricePerUnit: 0.00001, // XLM per token
});

// Every chain.invoke() now bills automatically 🎉`,
  },
];

export default function DevelopersSection() {
  return (
    <section className="bg-primary-foreground px-6 py-24 sm:px-10" id="developers">
      <div className="mx-auto grid max-w-[1200px] items-start gap-12 md:grid-cols-2 md:gap-20">
        <div>
          <div className="text-primary mb-4 text-[12.5px] font-bold tracking-[1.2px] uppercase">For Developers</div>
          <h2 className="mb-5 text-[clamp(34px,4vw,50px)] leading-[1.15] font-bold tracking-tight text-white">
            A Stripe-like API you&apos;ll
            <br />
            <em className="text-primary italic">actually enjoy.</em>
          </h2>
          <p className="mb-12 text-[17px] leading-relaxed text-white/55">
            Familiar REST API, typed JS SDK, webhooks, and sandbox mode. If you&apos;ve ever integrated Stripe,
            you&apos;ll feel right at home — except payments settle in 3 seconds for fractions of a cent.
          </p>

          <div className="flex flex-col gap-7">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 min-w-[40px] items-center justify-center rounded-[10px] bg-white/6">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="mb-1.5 text-[15px] font-semibold text-white">{feature.title}</div>
                  <div className="text-[13.5px] leading-relaxed text-white/50">{feature.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {codeExamples.map((example) => (
            <CodeBlock
              key={example.filename}
              language="typescript"
              filename={example.filename}
              showCopyButton
              theme="dark"
            >
              {example.code}
            </CodeBlock>
          ))}
        </div>
      </div>
    </section>
  );
}
