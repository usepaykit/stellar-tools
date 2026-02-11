"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AccountBillingCycle } from "@/constant/schema.client";
import type { Plan as PlanSchema } from "@/db";
import { useCheckout } from "@/hooks/use-checkout";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { Check, Loader2, Star } from "lucide-react";
import Link from "next/link";

function formatLimit(value: number): string | null {
  if (value === -1) return "Unlimited";
  if (value < 0) return null;
  return value.toLocaleString();
}

function buildBenefits(plan: PlanSchema): string[] {
  const items: string[] = [];
  if (plan.customers) items.push(`${formatLimit(plan.customers)} customers`);
  if (plan.subscriptions) items.push(`${formatLimit(plan.subscriptions)} subscriptions`);
  if (plan.billingEvents) items.push(`${formatLimit(plan.billingEvents)} billing events`);
  if (plan.payments) items.push(`${formatLimit(plan.payments)} payments`);
  if (plan.organizations) items.push(`${formatLimit(plan.organizations)} organization(s)`);
  if (plan.products) items.push(`${formatLimit(plan.products)} products`);
  if (plan.usageRecords) items.push(`${formatLimit(plan.usageRecords)} usage records`);
  return items;
}

function getPriceConfig(plan: PlanSchema, cycle: AccountBillingCycle) {
  const monthly = plan.monthlyAmountUsdCents / 100;
  const yearly = plan.yearlyAmountUsdCents / 100;
  const savingsPercent =
    cycle === "yearly" && monthly > 0 && yearly > 0 ? Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100) : 0;
  const perMonth = cycle === "yearly" ? yearly / 12 : monthly;
  const amount = cycle === "yearly" ? yearly : monthly;
  return { amount, savingsPercent, perMonth };
}

interface PricingGridProps {
  plans: PlanSchema[];
}

export function PricingGrid({ plans }: PricingGridProps) {
  const [cycle, setCycle] = React.useState<AccountBillingCycle>("monthly");
  const { startCheckout, isLoading } = useCheckout();

  const maxSavings = React.useMemo(() => {
    return Math.max(
      0,
      ...plans.map((p) => {
        const { savingsPercent } = getPriceConfig(p, "yearly");
        return savingsPercent;
      })
    );
  }, [plans]);

  const handleSelect = async (plan: PlanSchema) => {
    if (plan.isCustom) return;
    const pm = plan.paymentMethods;
    const priceKey = pm?.polarId ?? pm?.usdcId ?? pm?.paystackId ?? "";
    const method = pm?.polarId ? "polar" : pm?.usdcId ? "usdc" : pm?.paystackId ? "paystack" : "usdc";
    if (!priceKey && plan.monthlyAmountUsdCents > 0) return;
    const { url, error } = await startCheckout({
      price_key: priceKey || "placeholder",
      source: "pricing_page",
      method,
      plan_id: plan.id,
      billing_cycle: cycle,
    });
    if (error) return;
    if (url) window.location.href = url;
  };

  return (
    <>
      <div className="mb-10 flex justify-center">
        <Tabs value={cycle} onValueChange={(v) => setCycle(v as AccountBillingCycle)} className="w-full max-w-sm">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" className="inline-flex items-center justify-center gap-2">
              Yearly
              {maxSavings > 0 && (
                <Badge variant="secondary" className="bg-primary/20 text-primary text-[10px] font-semibold">
                  Save {maxSavings}%
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {plans.map((plan) => {
          const { amount, savingsPercent, perMonth } = getPriceConfig(plan, cycle);
          const benefits = buildBenefits(plan);
          const isCustom = plan.isCustom;
          const isPopular = /starter/i.test(plan.name);

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl transition-all hover:shadow-xl",
                isPopular ? "bg-primary border-primary text-primary-foreground shadow-lg" : "bg-card border-border"
              )}
            >
              {isPopular && (
                <div className="bg-primary-foreground text-primary absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-md">
                  <Star className="fill-primary size-3" />
                  Popular
                </div>
              )}

              <CardHeader className="pb-6">
                <CardTitle
                  className={cn("text-2xl font-bold", isPopular ? "text-primary-foreground" : "text-foreground")}
                >
                  {plan.name}
                </CardTitle>
                <CardDescription
                  className={cn("text-base", isPopular ? "text-primary-foreground/80" : "text-muted-foreground")}
                >
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6 pb-6">
                <div>
                  {isCustom ? (
                    <div className="text-3xl font-bold">Custom</div>
                  ) : amount === 0 ? (
                    <div className="text-4xl font-bold">Free</div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <NumberFlow
                        value={Math.round(perMonth)}
                        format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
                        transformTiming={{ duration: 400, easing: "ease-out" }}
                        className="text-4xl font-bold"
                      />
                      <span
                        className={cn("text-base", isPopular ? "text-primary-foreground/70" : "text-muted-foreground")}
                      >
                        /month
                      </span>
                    </div>
                  )}
                  {cycle === "yearly" && savingsPercent > 0 && !isCustom && amount > 0 && (
                    <div
                      className={cn(
                        "mt-2 text-sm font-medium",
                        isPopular ? "text-primary-foreground/90" : "text-primary"
                      )}
                    >
                      Discounted for yearly billing
                    </div>
                  )}
                </div>

                <ul className="space-y-3">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className={cn("mt-0.5 size-5 shrink-0", isPopular ? "text-primary-foreground" : "text-primary")}
                      />
                      <span className={isPopular ? "text-primary-foreground" : "text-foreground"}>{b}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-0">
                {isCustom ? (
                  <Button variant={isPopular ? "secondary" : "outline"} className="w-full" size="lg" asChild>
                    <Link href="/contact">Book a meeting</Link>
                  </Button>
                ) : amount === 0 ? (
                  <Button
                    variant={isPopular ? "secondary" : "outline"}
                    className={cn(
                      "w-full",
                      isPopular && "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    )}
                    size="lg"
                    asChild
                  >
                    <Link href="/dashboard">Get started</Link>
                  </Button>
                ) : (
                  <Button
                    variant={isPopular ? "secondary" : "default"}
                    className={cn(
                      "w-full",
                      isPopular && "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    )}
                    size="lg"
                    disabled={isLoading}
                    onClick={() => handleSelect(plan)}
                  >
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Go to Dashboard"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export { PlanSchema };
