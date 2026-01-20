"use client";

import * as React from "react";

import { retrieveCheckoutAndCustomer } from "@/actions/checkout";
import { PhoneNumber, PhoneNumberPicker } from "@/components/phone-number-picker";
import { TextField } from "@/components/text-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { StellarWalletsKitApi } from "@/integrations/stellar-wallets-kit";
import { cn, truncate } from "@/lib/utils";
import { BeautifulQRCode } from "@beautiful-qr-code/react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as StellarSDK from "@stellar/stellar-sdk";
import { ApiClient } from "@stellartools/core";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import * as RHF from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default function CheckoutPage() {
  const { id: checkoutId } = useParams<{ id: string }>();
  const [showBanner, setShowBanner] = React.useState(true);
  const [connectedAddress, setConnectedAddress] = React.useState<string | null>(null);
  const [paymentURI, setPaymentURI] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const stellarWalletsKit = StellarWalletsKitApi.getInstance();

  const { data: checkoutData, isLoading: isLoadingCheckout } = useQuery({
    queryKey: ["checkout", checkoutId],
    queryFn: () => retrieveCheckoutAndCustomer(checkoutId),
  });

  const checkoutSchema = z
    .object({
      email: z.email().optional().or(z.literal("")),
      phoneNumber: z
        .object({
          number: z.string().optional(),
          countryCode: z.string().default("US"),
        })
        .optional(),
    })
    .refine((data) => checkoutData?.hasEmail || !!data.email, {
      message: "Email is required",
      path: ["email"],
    })
    .refine((data) => checkoutData?.hasPhone || !!data.phoneNumber?.number, {
      message: "Phone number is required",
      path: ["phoneNumber"],
    });

  React.useEffect(() => {
    const unsubscribe = stellarWalletsKit.onConnectionChange((address) => {
      setConnectedAddress(address);
    });

    return unsubscribe;
  }, [stellarWalletsKit]);

  const form = RHF.useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      phoneNumber: { number: "", countryCode: "US" },
    },
  });

  const isFormValid = form.formState.isValid;

  React.useEffect(() => {
    if (isFormValid) {
      if (!checkoutData?.merchantPublicKey) return;

      const stellar = new StellarCoreApi(checkoutData.environment);
      const uri = stellar.makePaymentURI({
        destination: checkoutData.merchantPublicKey,
        amount: checkoutData.finalAmount.toString(),
        memo: `ORD-${checkoutId}`, // MEMO_TEXT
        message: checkoutData.productName,
        callback: `${window.location.origin}/api/payment/callback`,
      });
      setPaymentURI(uri);
    }
  }, [
    isFormValid,
    form,
    checkoutId,
    checkoutData?.merchantPublicKey,
    checkoutData?.environment,
    checkoutData?.productName,
    checkoutData?.finalAmount,
    checkoutData?.productType,
  ]);

  if (isLoadingCheckout) {
    return <Skeleton className="h-full w-full" />;
  }

  if (!checkoutData) return notFound();

  type CheckoutFormData = z.infer<typeof checkoutSchema>;

  const handleConnectWallet = async () => {
    try {
      const isFormValid = await form.trigger();
      if (!isFormValid) return;
      const { address } = await stellarWalletsKit.connectWallet();
      toast.success(`Connected: ${truncate(address, { start: 6, end: 4 })}`);
    } catch (error: any) {
      if (error?.code !== -1) {
        // -1 means user closed modal, not an error
        toast.error(error?.message || "Failed to connect wallet");
      }
    }
  };

  const handleSubmit = async (data: CheckoutFormData) => {
    if (!stellarWalletsKit.isConnected()) {
      toast.error("Please connect a wallet first");
      return;
    }

    setIsProcessing(true);
    try {
      const address = stellarWalletsKit.getAddressSync();

      const isFormValid = await form.trigger();

      if (!isFormValid) return;

      console.log({ data });

      if (!address) {
        throw new Error("No wallet connected");
      }

      const stellar = new StellarCoreApi(checkoutData?.environment);

      const result = await stellar.processWalletPayment(
        {
          sourcePublicKey: address,
          destination: checkoutData.merchantPublicKey,
          amount: checkoutData.finalAmount.toString(),
          memo: `ORD-${checkoutId}`,
          memoType: "text",
        },
        async (xdr) => {
          const { signedTxXdr } = await stellarWalletsKit.signTransaction(xdr, {
            networkPassphrase: StellarSDK.Networks.TESTNET,
            address,
          });
          return signedTxXdr;
        }
      );

      if (result.error) {
        throw new Error(result.error);
      }

      console.log("Transaction result:", result.data);

      const apiClient = new ApiClient({
        baseUrl: process.env.NEXT_PUBLIC_APP_URL!,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY!,
        },
        retryOptions: { max: 3, baseDelay: 1000, debug: false },
      });

      const response = await apiClient.post<{ message: string; success: boolean }>("/api/verify-wallet-payment", {
        body: JSON.stringify({
          txHash: result.data?.hash,
          checkoutId,
          orgId: checkoutData.organizationId,
          env: checkoutData.environment,
        }),
      });

      if (!response.ok) {
        console.log(response.error);
        throw new Error("Failed to verify payment");
      }

      if (!response.value.data?.success) {
        throw new Error(response.value.data?.message);
      }

      toast.success("Payment successful!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Payment error:", errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {showBanner && (
        <div className="relative mx-auto w-full">
          <div className="bg-primary rounded-none bg-cover bg-center bg-no-repeat p-4 text-center">
            <div className="relative flex flex-wrap items-center justify-center gap-2">
              <p className="text-primary-foreground inline-block text-sm">
                Please enter your email and phone number to scan the QR code
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowBanner(false)}
                className="text-primary-foreground hover:text-primary-foreground/70 hover:bg-primary-foreground/10 absolute top-1/2 right-4 h-6 w-6 -translate-y-1/2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-background flex min-h-screen items-center justify-center p-4 py-8">
        <div className="w-full max-w-6xl space-y-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="border-border space-y-4 rounded-lg border p-6">
                <div className="space-y-3">
                  <h1 className="text-foreground text-2xl font-semibold">Unlimited Monthly Subscription</h1>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Unlimited Monthly offers a flexible subscription that unlocks premium features like unlimited
                    transactions, priority support, and advanced analytics. Billed monthly and can be canceled anytime.
                  </p>
                </div>

                <div className="border-border border-t pt-4">
                  <p className="text-foreground text-2xl font-semibold">
                    {checkoutData.finalAmount} XLM{" "}
                    {checkoutData.productType === "subscription" && (
                      <span className="text-base font-normal">/ {checkoutData.recurringPeriod}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="border-border relative w-full overflow-hidden rounded-xl border">
                <Image
                  src="/images/checkoutimage.png"
                  alt="Unlimited Monthly Subscription"
                  width={800}
                  height={600}
                  className="h-auto w-full object-contain object-top-left"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            <Card className="shadow-none">
              <CardContent className="space-y-6 pt-6 pb-6">
                <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
                  {!checkoutData.hasEmail ? (
                    <RHF.Controller
                      name="email"
                      control={form.control}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          value={field.value as string}
                          onChange={field.onChange}
                          id="email"
                          label="Billing Email"
                          error={error?.message}
                          className="w-full shadow-none"
                          placeholder="you@example.com"
                        />
                      )}
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-1 py-2">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {checkoutData.customerEmail}
                      </Badge>
                      <span className="text-muted-foreground text-[10px] font-bold tracking-tighter uppercase">
                        Verified Billing
                      </span>
                    </div>
                  )}

                  {!checkoutData.hasPhone ? (
                    <RHF.Controller
                      name="phoneNumber"
                      control={form.control}
                      render={({ field, fieldState: { error } }) => {
                        const phoneValue: PhoneNumber = {
                          number: field.value?.number || "",
                          countryCode: field.value?.countryCode || "US",
                        };

                        return (
                          <PhoneNumberPicker
                            id="phone"
                            value={phoneValue}
                            onChange={field.onChange}
                            label="Phone number"
                            error={(error as any)?.number?.message}
                            groupClassName="w-full shadow-none"
                          />
                        );
                      }}
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-1 py-2">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {checkoutData.customerPhone}
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="relative">
                      <Card
                        className={cn(
                          "border-border bg-muted/30 border-2 border-dashed shadow-none! transition-all duration-300",
                          !isFormValid ? "opacity-50 blur-sm" : ""
                        )}
                      >
                        <CardContent className="flex flex-col items-center justify-center space-y-4 p-0 shadow-none">
                          <div className="border-border flex items-center justify-center rounded-lg border bg-white p-1">
                            <BeautifulQRCode
                              data={paymentURI ? paymentURI : "http"}
                              foregroundColor="#000000"
                              backgroundColor="#ffffff"
                              radius={1}
                              padding={1}
                              className="size-50"
                            />
                          </div>
                        </CardContent>
                      </Card>
                      {!isFormValid && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" />
                      )}
                    </div>

                    {/* OR Separator */}
                    <div className="flex items-center gap-4">
                      <Separator className="flex-1" />
                      <span className="text-muted-foreground text-sm font-medium">OR</span>
                      <Separator className="flex-1" />
                    </div>

                    <Button
                      type="button"
                      variant="default"
                      className="h-12 w-full shadow-none"
                      size="lg"
                      onClick={handleConnectWallet}
                      disabled={isProcessing}
                      isLoading={isProcessing}
                    >
                      {isProcessing
                        ? "Processing..."
                        : connectedAddress
                          ? `Connected: ${truncate(connectedAddress, { start: 6, end: 4, separator: "..." })}`
                          : "Connect Wallet"}
                    </Button>
                  </div>

                  <p className="text-muted-foreground text-center text-xs leading-relaxed">
                    This order is facilitated by Stellar Tools.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          <footer className="border-border mt-12 border-t pt-8">
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <span>© {new Date().getFullYear()} Stellar Tools. All rights reserved.</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
                  <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                  <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/refund" className="text-muted-foreground hover:text-foreground transition-colors">
                    Refund Policy
                  </Link>
                  <Link href="/support" className="text-muted-foreground hover:text-foreground transition-colors">
                    Support
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Powered by</span>
                  <Image
                    src="/images/integrations/stellar-official.png"
                    alt="Stellar"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                  <span className="text-foreground text-xs font-medium">Stellar</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
