"use client";

import NumberFlow from '@number-flow/react';
import { ArrowRight } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";


const TRANSACTION_MILESTONES = [
  { value: 0.001, label: "1K" },
  { value: 0.005, label: "5K" },
  { value: 0.01, label: "10K" },
  { value: 0.05, label: "50K" },
  { value: 0.1, label: "100K" },
  { value: 0.5, label: "500K" },
  { value: 1, label: "1M" },
  { value: 2, label: "2M" },
  { value: 5, label: "5M" },
  { value: 10, label: "10M" },
  { value: 15, label: "15M" },
  { value: 20, label: "20M" },
  { value: 25, label: "20M+" },
] as const;

const PRICING_CONFIG = {
  FREE_TIER: 1_000,
  BASE_PRICE_PER_1K: 0.28,
  VOLUME_DISCOUNTS: [
    { threshold: 15_000_000, discount: 0.3 },
    { threshold: 10_000_000, discount: 0.2 },
    { threshold: 5_000_000, discount: 0.1 },
  ],
} as const;

const NUMBER_FLOW_CONFIG = {
  price: {
    transformTiming: { duration: 500, easing: "ease-out" as const },
    spinTiming: { duration: 500, easing: "ease-out" as const },
    opacityTiming: { duration: 300, easing: "ease-out" as const },
  },
  per1K: {
    transformTiming: { duration: 400, easing: "ease-out" as const },
    spinTiming: { duration: 400, easing: "ease-out" as const },
    opacityTiming: { duration: 250, easing: "ease-out" as const },
  },
} as const;


interface PricingResult {
  totalCost: number;
  per1K: number;
}

interface TransactionMilestone {
  value: number;
  label: string;
}

export interface SubscriptionCalcProps {
  title?: string;
  description?: string;
  disclaimer?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  className?: string;
}


const calculatePrice = (transactions: number): PricingResult => {
  if (transactions <= PRICING_CONFIG.FREE_TIER) {
    return { totalCost: 0, per1K: 0 };
  }

  const paidTransactions = transactions - PRICING_CONFIG.FREE_TIER;
  const basePrice = (paidTransactions / 1000) * PRICING_CONFIG.BASE_PRICE_PER_1K;

  const discount = PRICING_CONFIG.VOLUME_DISCOUNTS.find(
    (vd) => transactions >= vd.threshold
  )?.discount ?? 0;

  const totalCost = basePrice * (1 - discount);
  const per1K = PRICING_CONFIG.BASE_PRICE_PER_1K * (1 - discount);

  return { totalCost, per1K };
};

const findSliderIndex = (
  volumeInMillions: number,
  milestones: readonly TransactionMilestone[]
): number => {
  const index = milestones.findIndex((m) => m.value >= volumeInMillions);
  return index === -1 ? milestones.length - 1 : index;
};


interface PriceDisplayProps {
  totalCost: number;
  per1K: number;
  isMaxVolume: boolean;
}

const PriceDisplay = React.memo<PriceDisplayProps>(({ totalCost, per1K, isMaxVolume }) => {
  const safePrice = React.useMemo(() => {
    return isNaN(totalCost) || !isFinite(totalCost) ? 0 : totalCost;
  }, [totalCost]);

  if (isMaxVolume) {
    return (
      <div className="text-left space-y-4 py-4">
        <h3 className="text-3xl font-bold text-foreground">Let&apos;s Chat</h3>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
          Higher volume plans are just better served with a human touch and volume discounts. Get in touch for pricing that best serves your business goals.
        </p>
      </div>
    );
  }

  return (
    <div className="text-left space-y-2 py-4">
      <div className="flex items-baseline justify-start gap-2">
        <div
          className="text-5xl font-bold tracking-tight text-foreground"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          <NumberFlow
            value={safePrice}
            format={{
              style: "currency",
              currency: "XLM",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }}
            {...NUMBER_FLOW_CONFIG.price}
            respectMotionPreference={true}
          />
        </div>
      </div>
      {per1K > 0 && (
        <div className="pt-2 flex justify-start">
          <Badge variant="outline" className="text-xs inline-flex items-center gap-1">
            <NumberFlow
              value={per1K}
              format={{
                style: "currency",
                currency: "XLM",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
              {...NUMBER_FLOW_CONFIG.per1K}
              respectMotionPreference={true}
            />
            <span>per 1K events</span>
          </Badge>
        </div>
      )}
      {safePrice === 0 && (
        <div className="pt-2 flex justify-start">
          <Badge variant="secondary" className="text-xs">
            First 1K transactions free
          </Badge>
        </div>
      )}
    </div>
  );
});

PriceDisplay.displayName = "PriceDisplay";

interface VolumeSliderProps {
  milestones: readonly TransactionMilestone[];
  currentIndex: number;
  onValueChange: (value: number[]) => void;
}

const VolumeSlider = React.memo<VolumeSliderProps>(
  ({ milestones, currentIndex, onValueChange }) => {
    const activeTrackWidth = React.useMemo(
      () => `${(currentIndex / (milestones.length - 1)) * 100}%`,
      [currentIndex, milestones.length]
    );

    return (
      <div className="space-y-6">
        <div className="space-y-6">
          <div className="relative pb-8">
            <div className="relative h-1.5 w-full mb-6">
              <div className="absolute inset-0 bg-muted/60 rounded-full" />
              <div
                className="absolute h-full bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: activeTrackWidth }}
              />
              <div className="absolute inset-0 flex items-center justify-between">
                {milestones.map((_, index) => {
                  const isActive = index <= currentIndex;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "relative z-10 rounded-full transition-all duration-300",
                        isActive ? "size-2 bg-primary" : "size-2 bg-muted-foreground/50"
                      )}
                    />
                  );
                })}
              </div>
            </div>

            <div className="absolute top-7 left-0 right-0">
              {milestones.map((milestone, index) => {
                const totalMilestones = milestones.length;
                const dotPosition = (index / (totalMilestones - 1)) * 100;
                
                return (
                  <span
                    key={index}
                    className={cn(
                      "absolute text-xs transition-all duration-300 whitespace-nowrap -translate-x-1/2",
                      index === currentIndex
                        ? "text-foreground font-bold"
                        : "text-muted-foreground"
                    )}
                    style={{ left: `${dotPosition}%` }}
                  >
                    {milestone.label}
                  </span>
                );
              })}
            </div>

            <div className="absolute top-0 left-0 right-0 flex items-center h-1.5">
              <Slider
                value={[currentIndex]}
                onValueChange={onValueChange}
                min={0}
                max={milestones.length - 1}
                step={1}
                className="w-full [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-background [&_[data-slot=slider-thumb]]:bg-primary [&_[data-slot=slider-thumb]]:shadow-lg [&_[data-slot=slider-thumb]]:shadow-primary/30 [&_[data-slot=slider-thumb]]:ring-2 [&_[data-slot=slider-thumb]]:ring-background/50 [&_[data-slot=slider-thumb]]:hover:scale-110 [&_[data-slot=slider-thumb]]:transition-all [&_[data-slot=slider-track]]:bg-transparent [&_[data-slot=slider-range]]:bg-transparent"
              />
            </div>
          </div>
        </div>
        <Label className="text-start block text-sm font-medium">
          Select event volume
        </Label>
      </div>
    );
  }
);

VolumeSlider.displayName = "VolumeSlider";


export default function SubscriptionCalc({
  title = "Estimate your Growth plan price*",
  description = "Use the slider to estimate your Growth plan price.",
  disclaimer = "* You may be on a legacy plan with different pricing",
  ctaText = "Buy Online",
  onCtaClick,
  className,
}: SubscriptionCalcProps) {
  const [transactionVolume, setTransactionVolume] = React.useState<number[]>([0.001]);

  const transactionsInMillions = transactionVolume[0];
  const totalTransactions = transactionsInMillions * 1_000_000;

  const pricing = React.useMemo(
    () => calculatePrice(totalTransactions),
    [totalTransactions]
  );

  const sliderIndex = React.useMemo(
    () => findSliderIndex(transactionsInMillions, TRANSACTION_MILESTONES),
    [transactionsInMillions]
  );

  const handleSliderChange = React.useCallback(
    (value: number[]) => {
      const index = Math.min(value[0], TRANSACTION_MILESTONES.length - 1);
      const milestone = TRANSACTION_MILESTONES[index];
      setTransactionVolume([milestone.value]);
    },
    []
  );

  const isMaxVolume = sliderIndex === TRANSACTION_MILESTONES.length - 1;
  const buttonText = isMaxVolume ? "Contact Sales" : ctaText;

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-start">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">{title}</h2>
          <p className="text-muted-foreground text-base leading-relaxed">{description}</p>
          {disclaimer && (
            <p className="text-muted-foreground/70 text-sm mt-4">{disclaimer}</p>
          )}
        </div>

        <Card className="border-primary/20 bg-linear-to-br from-card via-card to-primary/5 shadow-none w-full">
          <CardContent className="p-8 space-y-8">
            <PriceDisplay
              totalCost={pricing.totalCost}
              per1K={pricing.per1K}
              isMaxVolume={isMaxVolume}
            />

            <VolumeSlider
              milestones={TRANSACTION_MILESTONES}
              currentIndex={sliderIndex}
              onValueChange={handleSliderChange}
            />

            <Button
              className="w-full h-12 text-base font-semibold transition-all bg-background border-2 border-primary/50 text-primary hover:bg-background/90 hover:border-primary shadow-sm"
              size="lg"
              variant="outline"
              onClick={onCtaClick}
            >
              {buttonText}
              <ArrowRight className="ml-2 size-4 text-primary" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
