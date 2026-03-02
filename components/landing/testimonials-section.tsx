"use client";

import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "I built a metered billing system for my AI app in an afternoon. The LangChain adapter is wild — every chain call just bills automatically. This is what I always wanted Stripe to do.",
    name: "Alex K.",
    role: "Founder, AI tooling startup",
    initial: "A",
  },
  {
    quote:
      "Finally a payments solution that actually works for African markets. My customers in Lagos scan the QR code and it's done in seconds. No more Stripe friction, no more failed cards.",
    name: "Temi O.",
    role: "SaaS founder, Lagos",
    initial: "T",
  },
  {
    quote:
      "The DX is genuinely comparable to Stripe. I integrated StellarTools into my Medusa store in a few hours. Subscriptions, refunds, the whole thing — just works.",
    name: "Marcus L.",
    role: "Engineer, e-commerce",
    initial: "M",
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5 text-yellow-400">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" />
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section className="bg-secondary px-10 py-24" id="testimonials">
      <div className="mx-auto max-w-[1200px]">
        <div className="text-primary mb-4 text-[12.5px] font-bold tracking-[1.2px] uppercase">From the community</div>
        <h2 className="text-foreground mb-16 text-[clamp(34px,4vw,50px)] leading-[1.15] font-bold tracking-tight">
          Builders love StellarTools.
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-card border-border flex flex-col gap-5 rounded-2xl border p-8">
              <StarRating />
              <p className="text-muted-foreground text-[15px] leading-relaxed italic">"{testimonial.quote}"</p>
              <div className="mt-auto flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-base font-bold">
                  {testimonial.initial}
                </div>
                <div>
                  <div className="text-foreground text-sm font-semibold">{testimonial.name}</div>
                  <div className="text-muted-foreground text-xs">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
