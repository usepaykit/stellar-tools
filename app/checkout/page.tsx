"use client";

import * as React from "react";

import { FullScreenModal } from "@/components/fullscreen-modal";
import { TextField } from "@/components/input-picker";
import {
  PhoneNumber,
  PhoneNumberPicker,
} from "@/components/phone-number-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { BeautifulQRCode } from "@beautiful-qr-code/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as RHF from "react-hook-form";
import { z } from "zod";

const PRICE = 200;

const checkoutSchema = z.object({
  email: z.email(),
  phoneNumber: z.object({
    number: z.string().min(10),
    countryCode: z.string().min(1, "Country code is required"),
  }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface Wallet {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  color: string;
}

const wallets: Wallet[] = [
  {
    id: "albedo",
    name: "Albedo",
    icon: "https://stellar.creit.tech/wallet-icons/albedo.png",
    available: true,
    color: "#4A90E2",
  },
  {
    id: "xbull",
    name: "xBull",
    icon: "https://stellar.creit.tech/wallet-icons/xbull.png",
    available: true,
    color: "#9B59B6",
  },
  {
    id: "freighter",
    name: "Freighter",
    icon: "https://stellar.creit.tech/wallet-icons/freighter.png",
    available: false,
    color: "#9B59B6",
  },
  {
    id: "rabet",
    name: "Rabet",
    icon: "https://stellar.creit.tech/wallet-icons/rabet.png",
    available: false,
    color: "#000000",
  },
  {
    id: "lobstr",
    name: "LOBSTR",
    icon: "https://stellar.creit.tech/wallet-icons/lobstr.png",
    available: false,
    color: "#4A90E2",
  },
  {
    id: "hana",
    name: "Hana Wallet",
    icon: "https://stellar.creit.tech/wallet-icons/hana.png",
    available: false,
    color: "#6B46C1",
  },
];

// Wallet Icon Component
const WalletIcon = ({ wallet }: { wallet: Wallet }) => {
  return (
    <Image
      src={wallet.icon}
      alt={wallet.name}
      width={32}
      height={32}
      className="h-8 w-8 object-contain"
      unoptimized
    />
  );
};

export default function CheckoutPage() {
  const [showBanner, setShowBanner] = React.useState(true);
  const [isWalletModalOpen, setIsWalletModalOpen] = React.useState(false);

  const form = RHF.useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      phoneNumber: { number: "", countryCode: "US" },
    },
  });

  const onSubmit = (data: CheckoutFormData) => {
    console.log({ data });
  };

  const isFormValid = form.formState.isValid;

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
                  <h1 className="text-foreground text-2xl font-semibold">
                    Unlimited Monthly Subscription
                  </h1>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Unlimited Monthly offers a flexible subscription that
                    unlocks premium features like unlimited transactions,
                    priority support, and advanced analytics. Billed monthly and
                    can be canceled anytime.
                  </p>
                </div>

                <div className="border-border border-t pt-4">
                  <p className="text-foreground text-2xl font-semibold">
                    {PRICE} XLM{" "}
                    <span className="text-base font-normal">/ month</span>
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
                <form
                  className="space-y-6"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <RHF.Controller
                    control={form.control}
                    name="email"
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        id="email"
                        type="email"
                        value={field.value}
                        onChange={field.onChange}
                        label="Email"
                        error={error?.message || null}
                        className="w-full shadow-none"
                        placeholder="you@example.com"
                      />
                    )}
                  />

                  <RHF.Controller
                    control={form.control}
                    name="phoneNumber"
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
                              data="http"
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
                      <span className="text-muted-foreground text-sm font-medium">
                        OR
                      </span>
                      <Separator className="flex-1" />
                    </div>

                    <Button
                      type="button"
                      variant="default"
                      className="h-12 w-full shadow-none"
                      size="lg"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsWalletModalOpen(true);
                      }}
                    >
                      Continue with Wallet
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
                  <span>
                    © {new Date().getFullYear()} Stellar Tools. All rights
                    reserved.
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
                  <Link
                    href="/terms"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                  <Link
                    href="/privacy"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/refund"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Refund Policy
                  </Link>
                  <Link
                    href="/support"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Support
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    Powered by
                  </span>
                  <Image
                    src="/images/integrations/stellar-official.png"
                    alt="Stellar"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                  <span className="text-foreground text-xs font-medium">
                    Stellar
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Wallet Connection Modal */}
      <FullScreenModal
        open={isWalletModalOpen}
        onOpenChange={setIsWalletModalOpen}
        title="Connect a Wallet"
        size="small"
        showCloseButton={true}
      >
        <div className="space-y-2">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => {
                if (wallet.available) {
                  console.log(`Connecting to ${wallet.name}...`);
                  // Handle wallet connection here
                  setIsWalletModalOpen(false);
                }
              }}
              disabled={!wallet.available}
              className={cn(
                "group relative flex w-full items-center justify-between rounded-lg border p-4 transition-all duration-200",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                wallet.available
                  ? "border-border bg-card hover:border-primary/50 hover:bg-accent/50 cursor-pointer"
                  : "border-border/50 bg-muted/30 cursor-not-allowed opacity-60"
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all duration-200",
                    wallet.available
                      ? "border-border bg-background group-hover:border-primary/30 group-hover:bg-muted/50"
                      : "border-border/50 bg-muted/50"
                  )}
                >
                  <div className="relative h-8 w-8">
                    <WalletIcon wallet={wallet} />
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <span
                    className={cn(
                      "font-medium transition-colors",
                      wallet.available
                        ? "text-foreground group-hover:text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {wallet.name}
                  </span>
                </div>
              </div>
              {!wallet.available && (
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground border-border/50 shrink-0 rounded-md px-2.5 py-1 text-xs font-normal"
                >
                  Not available
                </Badge>
              )}
              {wallet.available && (
                <div className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 12L10 8L6 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </FullScreenModal>
    </div>
  );
}
