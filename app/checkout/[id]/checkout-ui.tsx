"use client";

import * as React from "react";

import { AnimatedCheckmark } from "@/components/icon";
import { PhoneNumber, PhoneNumberField } from "@/components/phone-number-field";
import { TextField } from "@/components/text-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCheckout } from "@/contexts/checkout-context";
import { useCookieState } from "@/hooks/use-cookie-state";
import { truncate } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Info, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as RHF from "react-hook-form";

export default function CheckoutUI() {
  const {
    id: checkoutId,
    checkout,
    isLoading,
    isPaid,
    isFailed,
    hasDetails,
    form,
    updateDetails,
    wallet,
    banner,
  } = useCheckout();

  if (isLoading) return <Checkout.Skeleton />;
  if (!checkout) return notFound();
  if (isPaid) return <Checkout.Success checkout={checkout} checkoutId={checkoutId} />;
  if (isFailed) return <Checkout.Error checkoutId={checkoutId} onRetry={() => window.location.reload()} />;

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {banner.show && checkout.environment === "testnet" && (
        <div className="bg-primary text-primary-foreground animate-in fade-in slide-in-from-top-1 relative py-1.5 text-center text-xs font-medium">
          <div className="flex items-center justify-center gap-2">
            <Info className="text-muted h-4 w-4" />
            <span>Test mode</span>
          </div>
          <button onClick={() => banner.setShow(false)} className="absolute top-1/2 right-4 -translate-y-1/2">
            <X className="size-4" />
          </button>
        </div>
      )}

      <main className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 items-start gap-8 px-4 py-10 sm:gap-10 sm:px-6 lg:max-w-6xl lg:grid-cols-[1fr_1.1fr] lg:gap-12 lg:px-8">
        <div className="space-y-6 lg:sticky lg:top-12">
          <div className="bg-card overflow-hidden rounded-2xl border shadow-sm lg:min-w-[360px]">
            {(checkout.organizationName || checkout.organizationLogo) && (
              <div className="flex items-center gap-3 border-b px-6 py-4">
                {checkout.organizationLogo && (
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={checkout.organizationLogo}
                      alt=""
                      width={40}
                      height={40}
                      className="size-full object-contain p-1"
                    />
                  </div>
                )}
                <span className="text-muted-foreground text-sm font-medium">
                  {checkout.organizationName || "Merchant"}
                </span>
              </div>
            )}
            {checkout.productImage && (
              <div className="bg-muted/30 relative aspect-video w-full border-b">
                <Image src={checkout.productImage} alt="" fill className="object-cover" />
              </div>
            )}
            <div className="space-y-5 p-6 sm:p-8">
              <div>
                <p className="text-muted-foreground mb-1 text-[11px] font-bold tracking-widest uppercase">Paying for</p>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {checkout.productName || "Direct Payment"}
                </h2>
              </div>
              {checkout.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">{checkout.description}</p>
              )}
              <Separator />
              <div className="text-3xl font-black tracking-tighter sm:text-4xl">
                {checkout.finalAmount}{" "}
                <span className="text-muted-foreground text-lg font-medium">{checkout.assetCode}</span>
                {checkout.productType === "subscription" && (
                  <span className="text-muted-foreground ml-1 text-sm font-normal">/ {checkout.recurringPeriod}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <Card className="border-primary/10 overflow-hidden rounded-2xl shadow-xl lg:min-w-[400px]">
          <CardContent className="space-y-8 p-6 sm:p-8 lg:p-10">
            <div className="space-y-6">
              {checkout.customerImage && (
                <div className="flex items-center gap-3">
                  <div className="border-border bg-muted relative size-12 shrink-0 overflow-hidden rounded-full border-2">
                    <Image src={checkout.customerImage} alt="" fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase">Paying as</p>
                    <p className="text-foreground truncate text-sm font-medium">
                      {checkout.customerEmail || "Customer"}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <RHF.Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id={field.name}
                      label="Billing Email"
                      disabled={hasDetails}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <RHF.Controller
                  name="phoneNumber"
                  control={form.control}
                  render={({ field, fieldState }) => {
                    const fieldValue: PhoneNumber = {
                      number: field.value?.number || "",
                      countryCode: field.value?.countryCode || "US",
                    };
                    return (
                      <PhoneNumberField
                        value={fieldValue}
                        onChange={field.onChange}
                        id={field.name}
                        label="Phone Number"
                        disabled={hasDetails}
                        error={(fieldState.error as any)?.number?.message}
                        groupClassName="w-full shadow-none"
                      />
                    );
                  }}
                />
              </div>

              <AnimatePresence mode="wait">
                {!hasDetails ? (
                  <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Button
                      className="h-12 w-full font-bold"
                      onClick={form.handleSubmit((d) => updateDetails.mutate(d))}
                      isLoading={updateDetails.isPending}
                    >
                      Continue to Payment
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Button
                        type="button"
                        className="h-14 w-full text-lg font-bold shadow-lg"
                        onClick={wallet.handleWalletPay}
                        isLoading={wallet.isProcessing}
                      >
                        {wallet.connectedAddress
                          ? `Pay as ${truncate(wallet.connectedAddress, { start: 4, end: 4 })}`
                          : "Connect Wallet"}
                      </Button>
                      {wallet.connectedAddress && !wallet.isProcessing && (
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground w-full text-center text-xs underline-offset-2 transition-colors hover:underline"
                          onClick={() => wallet.kit.connectWallet()}
                        >
                          Change wallet
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </main>

      <Checkout.Footer />
    </div>
  );
}

const Checkout = {
  Success: ({ checkout, checkoutId }: any) => {
    const [seenIds, setSeenIds] = useCookieState<string[]>("checkout_seen", []);
    const isFirstVisit = !seenIds.includes(checkoutId);

    React.useEffect(() => {
      if (isFirstVisit && checkoutId) setSeenIds((prev) => (prev.includes(checkoutId) ? prev : [...prev, checkoutId]));
    }, [checkoutId, isFirstVisit, setSeenIds]);

    React.useEffect(() => {
      if (!isFirstVisit || !checkout?.redirectUrl) return;
      const t = setTimeout(() => {
        window.location.href = checkout.redirectUrl!;
      }, 2000);
      return () => clearTimeout(t);
    }, [isFirstVisit, checkout?.redirectUrl]);

    return (
      <div className="bg-background animate-in fade-in flex min-h-screen items-center justify-center p-6 duration-500">
        <div className="w-full max-w-lg space-y-8 text-center">
          {isFirstVisit && <AnimatedCheckmark />}
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-normal sm:text-4xl">
              {isFirstVisit ? "Payment received" : "Checkout"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isFirstVisit ? "This checkout has been completed." : "This checkout has been completed or expired."}
            </p>
          </div>
          {isFirstVisit && (
            <div className="bg-muted/50 space-y-4 rounded-2xl border p-6 text-left sm:p-8">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-muted-foreground shrink-0 font-medium">Order ID</span>
                <span className="text-right font-mono break-all">{checkoutId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">Status</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Paid
                </Badge>
              </div>
            </div>
          )}
          {isFirstVisit && checkout?.redirectUrl && (
            <p className="text-muted-foreground text-sm">Redirecting you shortly…</p>
          )}
        </div>
      </div>
    );
  },

  Error: ({ checkoutId, onRetry }: any) => (
    <div className="bg-background animate-in zoom-in-95 flex min-h-screen flex-col items-center justify-center p-6 text-center duration-300">
      <div className="w-full max-w-lg space-y-8">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="text-destructive size-10" />
        </div>
        <div className="space-y-2">
          <b className="text-3xl font-bold tracking-tight sm:text-4xl">Payment Failed</b>
          <p className="text-muted-foreground">We couldn&apos;t verify your transaction on the ledger.</p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6 text-left sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground shrink-0 text-xs font-bold tracking-widest uppercase">
              Reference
            </span>
            <span className="text-right font-mono text-sm break-all">{checkoutId}</span>
          </div>
        </div>
        <Button onClick={onRetry} className="h-12 w-full font-bold" variant="outline" size="lg">
          Try Again
        </Button>
      </div>
    </div>
  ),

  Skeleton: () => (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-4 py-10 sm:gap-10 sm:px-6 lg:max-w-6xl lg:grid-cols-[1fr_1.1fr] lg:gap-12 lg:px-8">
      <div className="space-y-6 lg:sticky lg:top-12">
        <div className="bg-card overflow-hidden rounded-2xl border">
          <Skeleton className="h-16 w-full rounded-none border-b" />
          <Skeleton className="aspect-video w-full rounded-none border-b" />
          <div className="space-y-4 p-6 sm:p-8">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-3/4" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
      <div className="bg-card overflow-hidden rounded-2xl border">
        <div className="space-y-6 p-6 sm:p-8 lg:p-10">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </div>
  ),

  Footer: () => (
    <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 border-t px-4 py-12 grayscale transition-all sm:flex-row lg:px-8">
      <div className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
        © {new Date().getFullYear()} Stellar Tools
      </div>
      <div className="flex gap-6 text-[10px] font-bold tracking-tighter uppercase">
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/support">Support</Link>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase">Powered by</span>
        <Image src="/images/integrations/stellar-official.png" alt="" width={16} height={16} />
      </div>
    </footer>
  ),
};
