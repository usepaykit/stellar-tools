"use client";

import * as React from "react";

import { putCheckout, retrieveCheckoutAndCustomer } from "@/actions/checkout";
import { AnimatedCheckmark } from "@/components/icon";
import {
  PhoneNumber,
  PhoneNumberField,
  phoneNumberFromString,
  phoneNumberToString,
} from "@/components/phone-number-field";
import { TextField } from "@/components/text-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { StellarWalletsKitApi } from "@/integrations/stellar-wallets-kit";
import { truncate } from "@/lib/utils";
import { BeautifulQRCode } from "@beautiful-qr-code/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiClient } from "@stellartools/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import * as RHF from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const api = new ApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL!, headers: {} });

const checkoutSchema = z.object({
  email: z.email("Required"),
  phoneNumber: z.object({
    number: z.string().min(10, "Invalid phone"),
    countryCode: z.string().default("US"),
  }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { id: checkoutId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showBanner, setShowBanner] = React.useState(true);
  const [connectedAddress, setConnectedAddress] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [paymentURI, setPaymentURI] = React.useState<{
    status: "pending" | "loading" | "success" | "error";
    uri: string | null;
    message?: string | null;
  }>({ status: "pending", uri: null, message: null });

  const { data: checkout, isLoading } = useQuery({
    queryKey: ["checkout", checkoutId],
    queryFn: () => retrieveCheckoutAndCustomer(checkoutId),
    refetchInterval: 10000,
  });

  const form = RHF.useForm({
    resolver: zodResolver(checkoutSchema),
    values: {
      email: checkout?.customerEmail || "",
      phoneNumber: checkout?.customerPhone
        ? phoneNumberFromString(checkout.customerPhone)
        : { number: "", countryCode: "US" },
    },
  });

  const updateDetails = useMutation({
    mutationFn: (data: CheckoutFormData) =>
      putCheckout(
        checkoutId,
        { customerEmail: data.email, customerPhone: phoneNumberToString(data.phoneNumber) },
        checkout?.organizationId,
        checkout?.environment
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checkout", checkoutId] }),
  });

  const isPaid = checkout?.status === "completed";
  const isFailed = checkout?.status === "failed";
  const hasDetails = !!(checkout?.customerEmail && checkout?.customerPhone);

  const stellarWalletsKit = StellarWalletsKitApi.getInstance();
  React.useEffect(() => {
    return stellarWalletsKit.onConnectionChange(setConnectedAddress);
  }, [stellarWalletsKit]);

  React.useEffect(() => {
    if (isPaid || isFailed) return;
    if (!hasDetails || !checkout?.merchantPublicKey) return;

    const fetchURI = async () => {
      setPaymentURI({ status: "loading", uri: null });

      const response = await api.get<{ uri: string } | { error: string }>(
        `checkout/${checkoutId}/uri?environment=${checkout?.environment}`
      );

      if (response.isErr()) {
        setPaymentURI({ status: "error", uri: null });
        return;
      }

      setPaymentURI({
        status: "uri" in response.value ? "success" : "error",
        uri: "uri" in response.value ? response.value.uri : null,
        message: "error" in response.value ? response.value.error : null,
      });
    };

    fetchURI();
  }, [hasDetails, checkout, checkoutId, isPaid, isFailed]);

  if (isLoading) return <Checkout.Skeleton />;
  if (!checkout) return notFound();
  if (isPaid) return <Checkout.Success checkout={checkout} checkoutId={checkoutId} />;
  if (isFailed) return <Checkout.Error checkoutId={checkoutId} onRetry={() => window.location.reload()} />;

  const handleWalletPay = async () => {
    const walletKit = StellarWalletsKitApi.getInstance();
    if (!walletKit.isConnected()) return walletKit.connectWallet();

    setIsProcessing(true);
    try {
      const address = walletKit.getAddressSync()!;
      const stellar = new StellarCoreApi(checkout.environment);
      const result = await stellar.processWalletPayment(
        {
          sourcePublicKey: address,
          destination: checkout.merchantPublicKey,
          amount: checkout.finalAmount.toString(),
          memo: checkoutId,
        },
        async (xdr) => {
          const { signedTxXdr } = await walletKit.signTransaction(xdr, { address });
          // Standard callback logic
          await fetch(`/api/checkout/verify-callback?checkoutId=${checkoutId}`, {
            method: "POST",
            body: JSON.stringify({ xdr: signedTxXdr }),
          });
          return signedTxXdr;
        }
      );
      if (result.isErr()) throw new Error(result.error.message);
    } catch (e: any) {
      toast.error(e.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const showPaymentError = paymentURI.status === "error" && !!paymentURI.message;
  const showQR = paymentURI.status !== "loading" && !showPaymentError;

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {showBanner && checkout.environment === "testnet" && (
        <div className="bg-primary text-primary-foreground animate-in fade-in slide-in-from-top-1 relative p-3 text-center text-xs font-medium">
          Note: Please use a Testnet-compatible wallet like Solar or xBull.
          <button onClick={() => setShowBanner(false)} className="absolute top-1/2 right-4 -translate-y-1/2">
            <X className="size-4" />
          </button>
        </div>
      )}

      <main className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 items-start gap-8 px-4 py-10 sm:gap-10 sm:px-6 lg:max-w-6xl lg:grid-cols-[1fr_1.1fr] lg:gap-12 lg:px-8">
        <div className="space-y-6 lg:sticky lg:top-12">
          <div className="bg-card overflow-hidden rounded-2xl border shadow-sm lg:min-w-[360px]">
            {/* Org branding - Stripe style */}
            {(checkout.organizationName || checkout.organizationLogo) && (
              <div className="flex items-center gap-3 border-b px-6 py-4">
                {checkout.organizationLogo && (
                  <div className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={checkout.organizationLogo}
                      alt={checkout.organizationName || "Merchant"}
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

        {/* Right: Steps Card */}
        <Card className="border-primary/10 overflow-hidden rounded-2xl shadow-xl lg:min-w-[400px]">
          <CardContent className="space-y-8 p-6 sm:p-8 lg:p-10">
            <div className="space-y-6">
              <div className="space-y-4">
                <RHF.Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id={field.name}
                      value={field.value || ""}
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
                    const phoneValue: PhoneNumber = {
                      number: field.value?.number || "",
                      countryCode: field.value?.countryCode || "US",
                    };
                    return (
                      <PhoneNumberField
                        {...field}
                        value={phoneValue}
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
                      onClick={form.handleSubmit((d) => updateDetails.mutate(d as unknown as CheckoutFormData))}
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
                    <div className="flex justify-center py-4">
                      <div className="rounded-2xl border-2 border-dashed bg-white p-3 shadow-sm">
                        {paymentURI.status === "loading" && (
                          <div className="flex size-6 items-center justify-center">
                            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                          </div>
                        )}
                        {showPaymentError && (
                          <div className="bg-destructive/10 flex max-w-[200px] flex-col items-center gap-2 rounded-lg p-4 text-center">
                            <AlertCircle className="text-destructive size-5 shrink-0" />
                            <p className="text-destructive text-xs font-medium">{paymentURI.message}</p>
                          </div>
                        )}
                        {showQR && (
                          <BeautifulQRCode
                            data={paymentURI.uri as string}
                            foregroundColor="#000000"
                            backgroundColor="#ffffff"
                            radius={1}
                            padding={1}
                            className="size-50"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 py-2 opacity-50">
                      <Separator className="flex-1" />
                      <span className="text-[10px] font-black tracking-widest uppercase">or connect wallet</span>
                      <Separator className="flex-1" />
                    </div>

                    <Button
                      type="button"
                      className="h-14 w-full text-lg font-bold shadow-lg"
                      onClick={handleWalletPay}
                      isLoading={isProcessing}
                    >
                      {connectedAddress
                        ? `Pay as ${truncate(connectedAddress, { start: 4, end: 4 })}`
                        : "Connect Wallet"}
                    </Button>
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

// --- Composables ---

const Checkout = {
  Success: ({ checkout, checkoutId }: any) => (
    <div className="bg-background animate-in fade-in flex min-h-screen items-center justify-center p-6 duration-500">
      <div className="w-full max-w-lg space-y-8 text-center">
        <AnimatedCheckmark />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Thank you!</h1>
          <p className="text-muted-foreground text-lg">
            {checkout.successMessage || "Your payment was processed successfully."}
          </p>
        </div>
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
        {checkout.successUrl && (
          <Button asChild className="h-12 w-full text-base font-bold" size="lg">
            <Link href={checkout.successUrl}>Continue to {checkout.productName}</Link>
          </Button>
        )}
      </div>
    </div>
  ),

  Error: ({ checkoutId, onRetry }: any) => (
    <div className="bg-background animate-in zoom-in-95 flex min-h-screen flex-col items-center justify-center p-6 text-center duration-300">
      <div className="w-full max-w-lg space-y-8">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="text-destructive size-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Payment Failed</h1>
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
          <div className="flex justify-center py-4">
            <Skeleton className="h-[200px] w-[200px] rounded-2xl" />
          </div>
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </div>
  ),

  Footer: () => (
    <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 border-t px-4 py-12 opacity-30 grayscale transition-all hover:opacity-100 sm:flex-row lg:px-8">
      <div className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
        © {new Date().getFullYear()} Stellar Tools Engine
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
