"use client";

import React from "react";

import { Timeline, TimelineEntry } from "@/components/timeline";
import { Banknote } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Create your account & add your first product",
    description:
      "Sign up, create a product (one-time or subscription), and set your price in XLM or pegged to USD. No blockchain knowledge required.",
  },
  {
    number: "02",
    title: "Generate a payment link or use the API",
    description:
      "Share a hosted checkout link or integrate via our REST API and JS SDK. Your checkout page is hosted — zero frontend work needed.",
  },
  {
    number: "03",
    title: "Customer scans QR or connects wallet",
    description:
      "Your customer sees a Stripe-like checkout. They scan the QR (opens Solar or xBull wallet with pre-filled amount) or connect their wallet directly.",
  },
  {
    number: "04",
    title: "Get paid. Withdraw to local currency.",
    description:
      "Funds settle to your StellarTools account instantly. Withdraw to your Stellar wallet or convert to NGN, KES, GHS, and more.",
  },
];

export default function HowItWorks() {
  const renderStep = (step: (typeof steps)[number], index: number): TimelineEntry => ({
    key: step.number,
    title: step.title,
    date: ``,
    data: {},
    contentOverride: <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>,
    titleClassName: "font-bold text-sm text-foreground"
  });

  return (
    <section className="bg-secondary px-6 py-24 sm:px-10 " id="how-it-works">
      <div className="mx-auto max-w-[1200px]">
        <div className="text-primary mb-4 text-[12.5px] font-bold tracking-[1.2px] uppercase">How It Works</div>
        <h2 className="text-foreground max-w-2xl text-[clamp(34px,4vw,50px)] leading-[1.15] font-bold tracking-tight">
          From zero to collecting
          <br />
          payments in <em className="text-primary">minutes.</em>
        </h2>

        <div className="mt-16 grid items-center gap-12 md:grid-cols-2 md:gap-20">
          <Timeline items={steps} renderItem={renderStep} />

          <div>
            <div className="from-primary/5 to-primary/15 border-primary/30 flex h-[420px] flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed bg-linear-to-br p-8 text-center">
              <Banknote className="text-primary/60 h-12 w-12" />
              <strong className="text-primary text-sm font-semibold">Transactions / Payout Screenshot</strong>
              <div className="text-muted-foreground text-xs">
                Screenshot of the Transactions or Payout section showing settled payments history
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
