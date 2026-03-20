import * as React from "react";

import { putCheckout, retrieveCheckoutAndCustomer } from "@/actions/checkout";
import { sweepAndProcessPayment } from "@/actions/payment";
import { finalizeSubscriptionCheckout, prepareSubscriptionApproval } from "@/actions/subscription-checkout";
import { phoneNumberFromString, phoneNumberSchema, phoneNumberToString } from "@/components/phone-number-field";
import { toast } from "@/components/ui/toast";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { StellarWalletsKitApi } from "@/integrations/stellar-wallets-kit";
import { zodResolver } from "@hookform/resolvers/zod";
import { Networks } from "@stellar/stellar-sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as RHF from "react-hook-form";
import { z as Schema } from "zod";

const checkoutSchema = Schema.object({ email: Schema.email("Required"), phoneNumber: phoneNumberSchema });

type CheckoutFormData = Schema.infer<typeof checkoutSchema>;

export const useCheckout = (checkoutId: string) => {
  const queryClient = useQueryClient();
  const [showBanner, setShowBanner] = React.useState(true);
  const [connectedAddress, setConnectedAddress] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [merchantTrustlineError, setMerchantTrustlineError] = React.useState<string | null>(null);

  const { data: checkout, isLoading } = useQuery({
    queryKey: ["checkout", checkoutId],
    queryFn: () => retrieveCheckoutAndCustomer(checkoutId),
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
    if (!checkout) return;

    stellarWalletsKit.init({
      network: checkout.environment === "testnet" ? Networks.TESTNET : Networks.PUBLIC,
      checkoutDescription: checkout.description,
    });

    return () => {
      stellarWalletsKit.disconnect();
    };
  }, [checkout?.environment, stellarWalletsKit]);

  React.useEffect(() => {
    if (!checkout?.merchantPublicKey || !checkout.assetCode || checkout.assetCode === "XLM") return;

    const checkTrustline = async () => {
      const stellar = new StellarCoreApi(checkout.environment);
      const result = await stellar.checkTrustline(
        checkout.merchantPublicKey!,
        checkout.assetCode!,
        checkout.assetIssuer!
      );
      setMerchantTrustlineError(
        result.isOk() && !result.value
          ? `The merchant hasn't set up their wallet to receive ${checkout.assetCode} yet.`
          : null
      );
    };
    checkTrustline();
  }, [checkout]);

  const handleWalletPay = async () => {
    if (!stellarWalletsKit.isConnected()) return await stellarWalletsKit.connectWallet();

    setIsProcessing(true);
    try {
      const address = stellarWalletsKit.getAddressSync()!;

      if (checkout!.productType === "subscription") {
        // Step 1: Server builds a Soroban `approve` tx (engine contract as spender)
        const prepared = await prepareSubscriptionApproval(checkoutId, address);
        if ("error" in prepared) throw new Error(prepared.error);

        // Step 2: Customer signs the approval with their wallet
        const { signedTxXdr } = await stellarWalletsKit.signTransaction(prepared.xdr, { address });

        // Step 3: Server submits approval + calls `start` on the engine (first payment via transfer_from)
        const result = await finalizeSubscriptionCheckout(checkoutId, signedTxXdr);
        if (!result.success) throw new Error(result.error ?? "Subscription setup failed");
      } else {
        // One-time payment: classic Stellar payment via Horizon
        const stellar = new StellarCoreApi(checkout!.environment);
        const result = await stellar.processWalletPayment(
          {
            sourcePublicKey: address,
            destination: checkout!.merchantPublicKey,
            amount: checkout!.finalAmount.toString(),
            memo: checkoutId,
            assetCode: checkout!.assetCode ?? undefined,
            assetIssuer: checkout!.assetIssuer ?? undefined,
          },
          async (xdr) => (await stellarWalletsKit.signTransaction(xdr, { address })).signedTxXdr
        );

        if (result.isErr()) throw new Error(result.error.message);
        await sweepAndProcessPayment(checkoutId);
      }

      queryClient.invalidateQueries({ queryKey: ["checkout", checkoutId] });
    } catch (e: any) {
      toast.error(e.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    checkout,
    isLoading,
    isPaid,
    isFailed,
    hasDetails,
    form,
    updateDetails,
    merchantTrustlineError,
    wallet: { connectedAddress, isProcessing, handleWalletPay, kit: stellarWalletsKit },
    banner: { showBanner, setShowBanner },
  };
};
