"use client";

import * as React from "react";

import { retrieveCheckoutAndCustomer } from "@/actions/checkout";
import { AnimatedCheckmark } from "@/components/icon";
import { type PhoneNumber, PhoneNumberField } from "@/components/phone-number-field";
import { TextField } from "@/components/text-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { StellarWalletsKitApi } from "@/integrations/stellar-wallets-kit";
import { cn, truncate } from "@/lib/utils";
import { BeautifulQRCode } from "@beautiful-qr-code/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiClient } from "@stellartools/core";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import * as RHF from "react-hook-form";
import { z } from "zod";

const createCheckoutSchema = (hasEmail: boolean, hasPhone: boolean) =>
  z.object({
    email: hasEmail ? z.string().optional() : z.email("Required"),
    phoneNumber: hasPhone
      ? z.unknown().optional()
      : z.object({
          number: z.string().min(10, "Invalid phone"),
          countryCode: z.string().default("US"),
        }),
  });

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-2 px-1 py-1">
    <Badge variant="secondary" className="font-mono text-[10px]">
      {value}
    </Badge>
    <span className="text-muted-foreground text-[10px] font-bold tracking-tighter uppercase">{label}</span>
  </div>
);

export default function CheckoutPage() {
  const { id: checkoutId } = useParams<{ id: string }>();
  const [showBanner, setShowBanner] = React.useState(true);
  const [connectedAddress, setConnectedAddress] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const stellarWalletsKit = StellarWalletsKitApi.getInstance();

  const { data: checkout, isLoading } = useQuery({
    queryKey: ["checkout", checkoutId],
    queryFn: () => retrieveCheckoutAndCustomer(checkoutId),
  });

  const form = RHF.useForm({
    resolver: zodResolver(createCheckoutSchema(!!checkout?.hasEmail, !!checkout?.hasPhone)),
    defaultValues: { email: "", phoneNumber: { number: "", countryCode: "US" } },
    mode: "onChange",
  });

  const paymentURI = React.useMemo(() => {
    if (!form.formState.isValid || !checkout?.merchantPublicKey) return null;

    const intervals: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };

    const days = intervals[checkout.recurringPeriod || ""] || 0;
    const expiry = days ? new Date(Date.now() + days * 864e5) : null;

    return new StellarCoreApi(checkout.environment).makeCheckoutURI({
      id: checkoutId,
      network: checkout.environment,
      productId: checkout.productId!,
      currentPeriodEnd: expiry,
      assetCode: checkout.assetCode,
      assetIssuer: checkout.assetIssuer,
      destination: checkout.merchantPublicKey,
      amount: checkout.finalAmount.toString(),
      memo: `ORD-${checkoutId}`,
      type: checkout.productType,
    });
  }, [form.formState.isValid, checkout, checkoutId]);

  // 2. Wallet Connection listener
  React.useEffect(() => {
    return stellarWalletsKit.onConnectionChange(setConnectedAddress);
  }, [stellarWalletsKit]);

  if (isLoading) return <Skeleton className="h-screen w-full" />;
  if (!checkout) return notFound();

  const handlePay = async () => {
    if (!stellarWalletsKit.isConnected()) return toast.error("Connect wallet first");
    setIsProcessing(true);
    try {
      const address = stellarWalletsKit.getAddressSync()!;
      const stellar = new StellarCoreApi(checkout.environment);

      const result = await stellar.processWalletPayment(
        {
          sourcePublicKey: address,
          destination: checkout.merchantPublicKey,
          amount: checkout.finalAmount.toString(),
          memo: `ORD-${checkoutId}`,
        },
        async (xdr) => {
          const { signedTxXdr } = await stellarWalletsKit.signTransaction(xdr, { address });
          return signedTxXdr;
        }
      );

      if (result.isErr()) throw new Error(result.error.message);

      const api = new ApiClient({
        baseUrl: process.env.NEXT_PUBLIC_APP_URL!,
        headers: {},
      });

      await api.post<{ status: boolean; error?: string }>("/api/verify-wallet-payment", {
        body: JSON.stringify({
          txHash: result.value?.hash,
          checkoutId,
          organizationId: checkout.organizationId,
          environment: checkout.environment,
        }),
      });

      setIsSuccess(true);
    } catch (e: any) {
      toast.error(e.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return <CheckoutSuccess checkout={checkout} checkoutId={checkoutId} customerEmail={checkout.customerEmail} />;
  }

  return (
    <div className="bg-background min-h-screen">
      {showBanner && (
        <div className="bg-primary relative p-3 text-center">
          <p className="text-primary-foreground text-xs font-medium">
            Verify your details to generate your secure payment QR code
          </p>
          <button
            onClick={() => setShowBanner(false)}
            className="text-primary-foreground/50 absolute top-1/2 right-4 -translate-y-1/2 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <main className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-12 lg:grid-cols-2">
        <div className="space-y-8">
          <div className="bg-card space-y-4 rounded-xl border p-8 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{checkout.productName || "Product Checkout"}</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {checkout.description || "Facilitated by Stellar Tools Secure Checkout."}
              </p>
            </div>
            <Separator />
            <div className="text-3xl font-black tracking-tighter">
              {checkout.finalAmount}{" "}
              <span className="text-muted-foreground text-lg font-medium">{checkout.assetCode}</span>
              {checkout.productType === "subscription" && (
                <span className="text-muted-foreground ml-1 text-sm font-normal">/ {checkout.recurringPeriod}</span>
              )}
            </div>
          </div>
          <div className="bg-muted/50 relative aspect-[4/3] overflow-hidden rounded-2xl border shadow-inner">
            <Image src="/images/checkoutimage.png" alt="Checkout" fill className="object-cover opacity-90" />
          </div>
        </div>

        <Card className="border-primary/10 shadow-2xl">
          <CardContent className="space-y-8 p-8">
            <form onSubmit={form.handleSubmit(handlePay)} className="space-y-6">
              <div className="space-y-4">
                {checkout.hasEmail ? (
                  <InfoRow label="Verified Email" value={checkout.customerEmail!} />
                ) : (
                  <RHF.Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        id={field.name}
                        value={field.value || ""}
                        label="Billing Email"
                        placeholder="you@example.com"
                        error={error?.message}
                      />
                    )}
                  />
                )}

                {checkout.hasPhone ? (
                  <InfoRow label="Verified Phone" value={checkout.customerPhone!} />
                ) : (
                  <RHF.Controller
                    name="phoneNumber"
                    control={form.control}
                    render={({ field, fieldState: { error } }) => (
                      <PhoneNumberField
                        id={field.name}
                        value={field.value as PhoneNumber}
                        onChange={field.onChange}
                        label="Phone Number"
                        error={(error as any)?.number?.message}
                      />
                    )}
                  />
                )}
              </div>

              <div className="space-y-6">
                <div
                  className={cn(
                    "flex justify-center transition-all duration-500",
                    !form.formState.isValid && "pointer-events-none opacity-20 blur-md grayscale"
                  )}
                >
                  <div className="rounded-2xl border-2 border-dashed bg-white p-3 shadow-sm">
                    <BeautifulQRCode
                      data={paymentURI ?? "-".repeat(10)}
                      foregroundColor="#000000"
                      backgroundColor="#ffffff"
                      radius={1}
                      padding={1}
                      className="size-50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <Separator className="flex-1" />
                  <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                    or connect wallet
                  </span>
                  <Separator className="flex-1" />
                </div>

                <Button
                  type="button"
                  variant="default"
                  className="shadow-primary/20 h-14 w-full text-lg font-bold shadow-lg"
                  onClick={() => stellarWalletsKit.connectWallet()}
                  isLoading={isProcessing}
                >
                  {connectedAddress ? `Pay as ${truncate(connectedAddress, { start: 4, end: 4 })}` : "Connect Wallet"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 border-t px-4 py-12 opacity-60 grayscale transition-all hover:grayscale-0 sm:flex-row">
        <div className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
          © {new Date().getFullYear()} Stellar Tools Engine
        </div>
        <div className="flex gap-6 text-[10px] font-bold tracking-tighter uppercase">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/support">Support</Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[10px] font-bold uppercase">Secured by</span>
          <Image src="/images/integrations/stellar-official.png" alt="Stellar" width={16} height={16} />
        </div>
      </footer>
    </div>
  );
}

const CheckoutSuccess = ({ checkout, checkoutId, customerEmail }: any) => {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <AnimatedCheckmark />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Thank you for your purchase!</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {checkout.successMessage || "Your payment was processed successfully."}
          </p>
        </div>

        <div className="bg-muted/50 space-y-3 rounded-2xl border p-6 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-medium">Order ID</span>
            <span className="font-mono font-bold">{truncate(checkoutId, { start: 8, end: 0 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-medium">Status</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
              Paid
            </Badge>
          </div>
        </div>

        {checkout.successUrl && (
          <div className="pt-4">
            <Button asChild className="h-12 w-full text-base font-bold" size="lg">
              <Link href={checkout.successUrl}>Continue to {checkout.productName}</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
