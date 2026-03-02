"use client";

import { useState } from "react";

import { CodeBlock } from "@/components/code-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import Image from "next/image";
import { z } from "zod";

const requestFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  content: z.string().min(10, "Please provide more details about your request"),
});

const integrations = [
  {
    id: "langchain",
    name: "LangChain",
    logo: "/images/integrations/langchain.png",
    filename: "langchain-billing.ts",
    code: `import { StellarTools } from "@stellartools/core";
import { ChatOpenAI } from "@langchain/openai";

const stellar = new StellarTools({ apiKey: process.env.STELLAR_API_KEY });

// Meter LLM usage per token
const chat = new ChatOpenAI({ model: "gpt-4" });
const response = await chat.invoke("Hello world");

await stellar.credits.charge({
  customerId: "cus_123",
  amount: response.usage.totalTokens * 0.00001,
  description: "GPT-4 usage"
});`,
  },
  {
    id: "ai-sdk",
    name: "AI SDK",
    logo: "/images/integrations/aisdk.jpg",
    filename: "ai-sdk-billing.ts",
    code: `import { StellarTools } from "@stellartools/core";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const stellar = new StellarTools({ apiKey: process.env.STELLAR_API_KEY });

const { text, usage } = await generateText({
  model: openai("gpt-4-turbo"),
  prompt: "Write a haiku about Stellar"
});

// Bill per token with metered credits
await stellar.credits.charge({
  customerId: "cus_456",
  amount: usage.totalTokens * 0.00002,
  description: "AI SDK generation"
});`,
  },
  {
    id: "medusa",
    name: "MedusaJS",
    logo: "/images/integrations/medusa.svg",
    filename: "medusa-provider.ts",
    code: `import { StellarTools } from "@stellartools/medusa";

// Register as Medusa payment provider
export default StellarTools.createProvider({
  apiKey: process.env.STELLAR_API_KEY,
  webhookSecret: process.env.STELLAR_WEBHOOK_SECRET,
  
  // Auto-convert cart to Stellar checkout
  async createPayment(cart) {
    return stellar.checkout.create({
      amount: cart.total,
      currency: "XLM",
      metadata: { cartId: cart.id }
    });
  }
});`,
  },
  {
    id: "better-auth",
    name: "BetterAuth",
    logo: "/images/integrations/better-auth.png",
    filename: "auth-subscriptions.ts",
    code: `import { StellarTools } from "@stellartools/better-auth";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  plugins: [
    StellarTools.plugin({
      apiKey: process.env.STELLAR_API_KEY,
      
      // Gate features by subscription tier
      subscriptionTiers: {
        free: { credits: 100 },
        pro: { credits: 10000, features: ["api-access"] },
        enterprise: { credits: Infinity }
      }
    })
  ]
});`,
  },
];

export function AppConnectionWidget() {
  const [requestForm, setRequestForm] = useState({
    name: "",
    email: "",
    content: "",
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    content?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = requestFormSchema.safeParse(requestForm);

    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setRequestForm({ name: "", email: "", content: "" });
  };

  return (
    <section className="bg-card px-6 py-24 sm:px-10" id="integrations">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-16 text-center">
          <div className="text-primary mb-4 text-[12.5px] font-bold tracking-[1.2px] uppercase">Integrations</div>
          <h2 className="text-foreground mx-auto mb-5 text-[clamp(34px,4vw,50px)] leading-[1.15] font-bold tracking-tight">
            Drops right into your
            <br />
            <em className="text-primary italic">favorite stack.</em>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl text-[17px] leading-relaxed">
            We built native adapters so you don&apos;t have to. Whether you&apos;re charging per AI token, building with
            Medusa, or just need auth-aware billing, there&apos;s a plug-and-play integration for that.
          </p>
        </div>

        <Tabs defaultValue={integrations[0].id} className="w-full">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="bg-secondary w-full flex-col sm:w-auto sm:flex-row sm:justify-start">
              {integrations.map((integration) => (
                <TabsTrigger
                  key={integration.id}
                  value={integration.id}
                  className="w-full justify-start gap-2 data-[state=active]:shadow-none sm:w-auto sm:justify-center"
                >
                  <Image
                    src={integration.logo}
                    alt={`${integration.name} logo`}
                    width={16}
                    height={16}
                    className="size-4 rounded-full object-contain"
                  />
                  <span>{integration.name}</span>
                </TabsTrigger>
              ))}
              <TabsTrigger
                value="request"
                className="w-full justify-start gap-2 data-[state=active]:shadow-none sm:w-auto sm:justify-center"
              >
                <Plus className="size-4" />
                <span>Request</span>
              </TabsTrigger>
            </TabsList>
            <span className="text-muted-foreground text-center text-sm whitespace-nowrap sm:text-left">
              + many more
            </span>
          </div>

          {integrations.map((integration) => (
            <TabsContent key={integration.id} value={integration.id} className="mt-0 w-full">
              <div className="mx-2 sm:mx-0">
                <CodeBlock language="typescript" filename={integration.filename} logo={integration.logo} showCopyButton>
                  {integration.code}
                </CodeBlock>
              </div>
            </TabsContent>
          ))}

          <TabsContent value="request" className="mt-0 w-full">
            <div className="mx-2 sm:mx-0">
              <div className="border-border bg-secondary/50 rounded-xl border p-8">
                {isSubmitted ? (
                  <div className="py-8 text-center">
                    <div className="mb-4 text-4xl">🎉</div>
                    <h3 className="text-foreground mb-2 text-xl font-semibold">Request Submitted!</h3>
                    <p className="text-muted-foreground text-sm">
                      Thanks for your request. We&apos;ll review it and get back to you soon.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => setIsSubmitted(false)}>
                      Submit Another Request
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-foreground mb-2 text-lg font-semibold">Request an Integration</h3>
                    <p className="text-muted-foreground mb-6 text-sm">
                      Don&apos;t see your stack? Let us know what adapter you need and we&apos;ll prioritize it.
                    </p>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-foreground mb-1.5 block text-sm font-medium">Name</label>
                          <Input
                            placeholder="Your name"
                            value={requestForm.name}
                            onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                            className={errors.name ? "border-destructive" : "shadow-none"}
                          />
                          {errors.name && <p className="text-destructive mt-1 text-xs">{errors.name}</p>}
                        </div>
                        <div>
                          <label className="text-foreground mb-1.5 block text-sm font-medium">Email</label>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            value={requestForm.email}
                            onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                            className={errors.email ? "border-destructive" : "shadow-none"}
                          />
                          {errors.email && <p className="text-destructive mt-1 text-xs">{errors.email}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="text-foreground mb-1.5 block text-sm font-medium">Integration Request</label>
                        <Textarea
                          placeholder="Tell us which framework, library, or platform you'd like us to support..."
                          value={requestForm.content}
                          onChange={(e) => setRequestForm({ ...requestForm, content: e.target.value })}
                          rows={4}
                          className={errors.content ? "border-destructive" : "shadow-none"}
                        />
                        {errors.content && <p className="text-destructive mt-1 text-xs">{errors.content}</p>}
                      </div>
                      <Button
                        type="submit"
                        className="bg-primary text-primary-foreground w-full sm:w-auto sm:self-end"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Submitting..." : "Submit Request"}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center">
          <a
            href="/docs/integrations"
            className="bg-primary text-primary-foreground inline-block rounded-[9px] px-5 py-2.5 text-[14.5px] font-semibold no-underline transition-all hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(91,79,255,0.35)]"
          >
            Browse all integrations →
          </a>
        </div>
      </div>
    </section>
  );
}
