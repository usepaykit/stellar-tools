"use client";

import * as React from "react";

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

  const standardPlans = plans.filter((p) => !p.isCustom);
  const enterprisePlans = plans.filter((p) => p.isCustom);
  const displaySavings = maxSavings > 0 ? maxSavings : 40;

  return (
    <div className="space-y-10">
      <Tabs value={cycle} onValueChange={(v) => setCycle(v as AccountBillingCycle)} className="w-full">
        <div className="flex justify-center">
          <TabsList
            aria-label="Billing period"
            className="bg-muted/60 h-auto w-auto rounded-full p-1 shadow-inner [&>span]:rounded-full"
          >
            <TabsTrigger
              value="monthly"
              className="rounded-full px-5 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
            >
              Monthly
            </TabsTrigger>
            <TabsTrigger
              value="yearly"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-primary data-[state=inactive]:hover:text-primary/90"
            >
              Yearly
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Save {displaySavings}%
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Standard plans: 4-column grid */}
      {standardPlans.length > 0 && (
        <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {standardPlans.map((plan) => {
            const { amount, savingsPercent, perMonth } = getPriceConfig(plan, cycle);
            const benefits = buildBenefits(plan);
            const isPopular = /starter/i.test(plan.name);

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border-2 transition-all duration-200 hover:shadow-lg",
                  !isPopular && "overflow-hidden",
                  isPopular
                    ? "border-primary bg-primary text-primary-foreground shadow-primary/10 shadow-lg"
                    : "border-border bg-card"
                )}
              >
                {isPopular && (
                  <div className="border-primary bg-background text-primary ring-background absolute top-0 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold shadow-lg ring-2">
                    <Star className="fill-primary size-4" />
                    Popular
                  </div>
                )}

                <CardHeader className="pt-8 pb-4">
                  <CardTitle
                    className={cn(
                      "text-2xl font-bold tracking-tight",
                      isPopular ? "text-primary-foreground" : "text-foreground"
                    )}
                  >
                    {plan.name}
                  </CardTitle>
                  <CardDescription
                    className={cn(
                      "text-sm leading-relaxed",
                      isPopular ? "text-primary-foreground/85" : "text-muted-foreground"
                    )}
                  >
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-5 pb-6">
                  <div>
                    {amount === 0 ? (
                      <div className="text-3xl font-bold">Free</div>
                    ) : (
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-2xl font-bold">$</span>
                        <NumberFlow
                          value={Math.round(perMonth)}
                          format={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }}
                          transformTiming={{ duration: 400, easing: "ease-out" }}
                          className="text-3xl font-bold"
                        />
                        <span
                          className={cn(
                            "ml-1 text-base",
                            isPopular ? "text-primary-foreground/80" : "text-muted-foreground"
                          )}
                        >
                          /month
                        </span>
                      </div>
                    )}
                    {cycle === "yearly" && savingsPercent > 0 && amount > 0 && (
                      <p
                        className={cn(
                          "mt-1.5 text-xs font-medium",
                          isPopular ? "text-primary-foreground/90" : "text-primary"
                        )}
                      >
                        Discounted for yearly billing
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5">
                    {benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm">
                        <Check
                          className={cn(
                            "mt-0.5 size-4 shrink-0",
                            isPopular ? "text-primary-foreground" : "text-primary"
                          )}
                        />
                        <span className={isPopular ? "text-primary-foreground/95" : "text-foreground"}>{b}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-0">
                  {amount === 0 ? (
                    <Button
                      variant={isPopular ? "secondary" : "outline"}
                      className={cn(
                        "w-full rounded-xl font-medium",
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
                        "w-full rounded-xl font-medium",
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
      )}

      {/* Enterprise: full-width row below */}
      {enterprisePlans.length > 0 && (
        <div className="flex justify-start">
          {enterprisePlans.map((plan) => {
            const benefits = buildBenefits(plan);
            return (
              <Card
                key={plan.id}
                className="border-border bg-card relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border-2 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-foreground text-2xl font-bold tracking-tight">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-5 pb-6">
                  <div className="text-foreground text-3xl font-bold">Custom</div>
                  <ul className="space-y-2.5">
                    {benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm">
                        <Check className="text-primary mt-0.5 size-4 shrink-0" />
                        <span className="text-foreground">{b}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full rounded-xl font-medium" size="lg" asChild>
                    <Link href="/contact">Book a meeting</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { PlanSchema };
