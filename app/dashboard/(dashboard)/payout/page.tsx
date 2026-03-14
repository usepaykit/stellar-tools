"use client";

import * as React from "react";

import { retrieveAssets } from "@/actions/asset";
import { retrievePayouts } from "@/actions/payout";
import { AppModal } from "@/components/app-modal";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import { NumberField } from "@/components/number-field";
import { SelectInput } from "@/components/select+input";
import { TextField } from "@/components/text-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { PayoutStatus } from "@/constant/schema.client";
import { Asset, Payout } from "@/db";
import { useAssetRates } from "@/hooks/use-asset-rates";
import { useOrgContext, useOrgQuery } from "@/hooks/use-org-query";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowRight,
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronsUpDown,
  Circle,
  Clock,
  Coins,
  ExternalLink,
  Info,
  Loader2,
  Plus,
  Wallet,
  XCircle,
} from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import * as RHF from "react-hook-form";
import { z } from "zod";

import { generateAndDownloadReceipt } from "./[id]/page";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StellarBalance = {
  balance: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
};

type AnchorTransaction = {
  id: string;
  status: string;
  amount_in?: string;
  amount_out?: string;
  amount_out_asset?: string;
  amount_fee?: string;
  withdraw_anchor_account?: string;
  withdraw_memo?: string;
  withdraw_memo_type?: string;
  message?: string;
  more_info_url?: string;
};

type AnchorSession = {
  url: string;
  id: string;
  transferServer: string;
  anchorJwt: string;
};

type BankStep = "select" | "interactive" | "sending" | "tracking" | "complete";

const SUPPORTED_PAYOUT_COUNTRIES = ["NGN", "GHS"] as const;

type CurrencyItem = { code: string; name: string };
const currencyNames = new Intl.DisplayNames(["en"], { type: "currency" });

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const StatusBadge = ({ status }: { status: PayoutStatus }) => {
  const variants = {
    pending: {
      className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
      icon: Clock,
      label: "Pending",
    },
    succeeded: {
      className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      icon: CheckCircle2,
      label: "Succeeded",
    },
    failed: {
      className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      icon: XCircle,
      label: "Failed",
    },
  };

  const variant = variants[status];
  const Icon = variant.icon;

  return (
    <Badge variant="outline" className={cn("gap-1.5 border", variant.className)}>
      <Icon className="h-3 w-3" />
      {variant.label}
    </Badge>
  );
};

const PayoutMethodDisplay = ({ method }: { method: Payout["walletAddress"] }) => (
  <div className="flex items-center gap-2">
    <Wallet className="text-muted-foreground h-4 w-4" />
    <span className="font-mono text-sm">
      {method.slice(0, 8)}...{method.slice(-4)}
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// Table columns
// ---------------------------------------------------------------------------

const columns: ColumnDef<Payout>[] = [
  {
    accessorKey: "date",
    header: () => (
      <div className="flex items-center gap-2">
        <Calendar className="text-muted-foreground h-4 w-4" />
        <span>Date</span>
      </div>
    ),
    cell: ({ row }) => <div className="text-sm">{moment(row.original.createdAt).format("DD MMM YYYY")}</div>,
  },
  {
    accessorKey: "walletAddress",
    header: () => (
      <div className="flex items-center gap-2">
        <Wallet className="text-muted-foreground h-4 w-4" />
        <span>Payout method</span>
      </div>
    ),
    cell: ({ row }) => <PayoutMethodDisplay method={row.original.walletAddress} />,
  },
  {
    accessorKey: "status",
    header: () => (
      <div className="flex items-center gap-2">
        <Circle className="text-muted-foreground h-4 w-4" />
        <span>Status</span>
      </div>
    ),
    cell: ({ row }) => <StatusBadge status={row.original.status as PayoutStatus} />,
  },
  {
    accessorKey: "amount",
    header: () => (
      <div className="flex items-center gap-2">
        <Coins className="text-muted-foreground h-4 w-4" />
        <span>Amount</span>
      </div>
    ),
    cell: ({ row }) => <div className="text-sm font-medium">{row.original.amount} XLM</div>,
  },
];

// ---------------------------------------------------------------------------
// Bank / Anchor payout flow
// ---------------------------------------------------------------------------

function AnchorStatusRow({ done, active, label }: { done: boolean; active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
          done && "border-green-500 bg-green-500/10",
          active && !done && "border-primary bg-primary/10",
          !done && !active && "border-border bg-muted"
        )}
      >
        {done ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        ) : active ? (
          <Loader2 className="text-primary h-3 w-3 animate-spin" />
        ) : (
          <div className="bg-muted-foreground/30 h-2 w-2 rounded-full" />
        )}
      </div>
      <span
        className={cn(
          "text-sm",
          done && "text-foreground font-medium",
          active && !done && "text-foreground",
          !done && !active && "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}

/** Parse a fetch response safely — handles HTML error pages from Next.js */
async function safeJson(resp: Response) {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server error (${resp.status}). Please restart the dev server if this persists.`);
  }
}

function BankPayoutFlow({
  onClose,
  onSuccess,
  initialCurrencyCode,
}: {
  onClose: () => void;
  onSuccess: () => void;
  initialCurrencyCode?: string;
}) {
  const { data: org } = useOrgContext();

  const { data: orgAssets = [] } = useQuery<Asset[]>({
    queryKey: ["assets", org?.id, org?.environment],
    queryFn: () => retrieveAssets(org!.environment),
    enabled: !!org?.id,
  });

  // Auto-pick best stablecoin — merchant never sees this choice
  const selectedAsset = React.useMemo(() => {
    if (orgAssets.length === 0) return undefined;
    return orgAssets.find((a) => a.code === "USDC") ?? orgAssets.find((a) => a.code === "USDT") ?? orgAssets[0];
  }, [orgAssets]);

  const { rateMap, fiatRates, isLoading: isRatesLoading, selectedCurrency: cookieCurrencyCode } = useAssetRates(
    selectedAsset ? [{ code: selectedAsset.code, issuer: selectedAsset.issuer ?? "native" }] : []
  );
  const currencyCode = initialCurrencyCode ?? cookieCurrencyCode;

  // Amount as a string to feed SelectInput; stored separately as a number for calculations
  const [inputValue, setInputValue] = React.useState({ amount: "", option: currencyCode });

  const [step, setStep] = React.useState<BankStep>("select");
  const [session, setSession] = React.useState<AnchorSession | null>(null);
  const [anchorTx, setAnchorTx] = React.useState<AnchorTransaction | null>(null);
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPolling, setIsPolling] = React.useState(false);

  const pollIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = React.useRef<AnchorSession | null>(null);

  React.useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Keep option in sync when initialCurrencyCode or cookie changes
  React.useEffect(() => {
    setInputValue((v) => ({ ...v, option: currencyCode }));
  }, [currencyCode]);

  // Fetch org's on-chain balances
  const { data: stellarBalances = [] } = useQuery<StellarBalance[]>({
    queryKey: ["balance", org?.id, org?.environment, org?.token],
    queryFn: async () => {
      const resp = await fetch("/api/balance", { headers: { "x-auth-token": org!.token } });
      const json = await safeJson(resp);
      return json.data as StellarBalance[];
    },
    enabled: !!org?.token,
    staleTime: 60 * 1000,
  });

  // Balance in asset units for the auto-selected asset
  const assetBalance = React.useMemo(() => {
    if (!selectedAsset || stellarBalances.length === 0) return null;
    const match = selectedAsset.issuer
      ? stellarBalances.find((b) => b.asset_code === selectedAsset.code && b.asset_issuer === selectedAsset.issuer)
      : stellarBalances.find((b) => b.asset_type === "native");
    return match ? parseFloat(match.balance) : 0;
  }, [selectedAsset, stellarBalances]);

  // localAmount → asset units:  assetAmount = localAmount / rateMap[assetCode]
  const localAmount = parseFloat(inputValue.amount) || 0;
  const assetCode = selectedAsset?.code;
  const assetAmount = React.useMemo(() => {
    if (!localAmount || !assetCode) return null;
    const rate = rateMap[assetCode] ?? 0;
    if (rate <= 0) return null;
    return parseFloat((localAmount / rate).toFixed(7));
  }, [localAmount, assetCode, rateMap]);

  // Max withdrawable in local currency & validation error
  const maxLocalAmount = React.useMemo(() => {
    if (assetBalance === null || !assetCode) return null;
    const rate = rateMap[assetCode] ?? 0;
    if (rate <= 0) return null;
    return parseFloat((assetBalance * rate).toFixed(2));
  }, [assetBalance, assetCode, rateMap]);

  const amountError =
    localAmount > 0 && maxLocalAmount !== null && localAmount > maxLocalAmount
      ? `Exceeds balance. Max: ${maxLocalAmount.toLocaleString()} ${currencyCode}`
      : undefined;

  // -- Step 1: Initiate via SEP-10 + SEP-24 (server picks the anchor) --
  const initiateWithdrawal = async () => {
    if (!assetAmount || !selectedAsset || !org?.token) return;
    setIsLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/anchor/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": org.token },
        body: JSON.stringify({ assetCode: selectedAsset.code, amount: assetAmount.toString() }),
      });
      const data = await safeJson(resp);
      if (!resp.ok) throw new Error(data.error || "Failed to connect to payout provider");
      const s = data.data as AnchorSession;
      setSession(s);
      sessionRef.current = s;
      setStep("interactive");
    } catch (e: any) {
      setError(e.message || "Failed to connect to payout provider");
    } finally {
      setIsLoading(false);
    }
  };

  // -- Step 2: Open anchor popup where user enters their bank / mobile money details --
  const openAnchorPopup = () => {
    if (!sessionRef.current) return;
    window.open(sessionRef.current.url, "anchor_popup", "width=600,height=700,left=200,top=100");

    // Anchor fires postMessage when user completes the form in the popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.transaction) {
        window.removeEventListener("message", handleMessage);
        startPolling();
      }
    };
    window.addEventListener("message", handleMessage);

    // Also poll regardless — covers anchors that don't fire postMessage
    startPolling();
  };

  // -- Polling --
  const startPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setIsPolling(true);
    pollIntervalRef.current = setInterval(pollOnce, 5000);
  };

  const pollOnce = async () => {
    const s = sessionRef.current;
    if (!s || !org?.token) return;
    try {
      const resp = await fetch("/api/anchor/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": org.token },
        body: JSON.stringify({ transferServer: s.transferServer, id: s.id, anchorJwt: s.anchorJwt }),
      });
      const data = await safeJson(resp);
      const tx: AnchorTransaction = data.data;
      setAnchorTx(tx);

      if (tx.status === "pending_user_transfer_start") {
        clearInterval(pollIntervalRef.current!);
        setIsPolling(false);
        setStep("sending");
        await sendPaymentToAnchor(tx);
      } else if (tx.status === "completed") {
        clearInterval(pollIntervalRef.current!);
        setIsPolling(false);
        setStep("complete");
      } else if (["error", "refunded", "expired", "no_market", "too_small", "too_large"].includes(tx.status)) {
        clearInterval(pollIntervalRef.current!);
        setIsPolling(false);
        setError(`Payout failed: ${tx.message ?? tx.status}`);
      }
    } catch {
      // Silent – retry on next tick
    }
  };

  // -- Step 3: Send the on-chain Stellar payment to the anchor's account --
  const sendPaymentToAnchor = async (tx: AnchorTransaction) => {
    if (!tx.withdraw_anchor_account || !selectedAsset?.id || !assetAmount || !org?.token) {
      setError("Missing payment details from provider. Please try again.");
      return;
    }
    try {
      const resp = await fetch("/api/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": org.token },
        body: JSON.stringify({
          amount: assetAmount,
          walletAddress: tx.withdraw_anchor_account,
          memo: tx.withdraw_memo ?? undefined,
          assetId: selectedAsset.id,
        }),
      });
      const data = await safeJson(resp);
      if (!resp.ok) throw new Error(data.error || "Failed to send payment");
      setStep("tracking");
      startPolling();
    } catch (e: any) {
      setError(e.message || "Failed to send payment");
    }
  };

  // ---- Render ----

  const currencyOptions = React.useMemo(
    () => (fiatRates ? Object.keys(fiatRates).sort() : [currencyCode]),
    [fiatRates, currencyCode]
  );

  if (step === "select") {
    return (
      <div className="space-y-5">
        <SelectInput
          id="bankAmount"
          label="How much do you want to withdraw?"
          value={inputValue}
          onChange={setInputValue}
          options={currencyOptions}
          isLoading={isRatesLoading || !selectedAsset}
          disabled={isRatesLoading || !selectedAsset}
          placeholder={isRatesLoading ? "Loading rate…" : "0.00"}
          optionsDisabled={!!initialCurrencyCode}
          error={amountError}
        />

        {assetAmount && !isRatesLoading && !amountError && (
          <p className="text-muted-foreground -mt-2 text-xs">
            ≈ {assetAmount} {selectedAsset?.code}
          </p>
        )}

        {error && (
          <div className="border-destructive/30 bg-destructive/10 rounded-md border px-4 py-3">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={initiateWithdrawal} disabled={isLoading || !assetAmount || isRatesLoading || !!amountError}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "interactive") {
    return (
      <div className="space-y-5">
        <div className="bg-primary/5 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="text-primary mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Enter your bank details</p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                A secure portal will open. Enter your bank account or mobile money number there, then return here. The
                payment will be sent automatically once you&apos;re done.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <AnchorStatusRow done active={false} label="Connected to payout provider" />
          <AnchorStatusRow done={false} active={!isPolling} label="Open portal to enter bank details" />
          <AnchorStatusRow done={false} active={isPolling} label="Waiting for bank details…" />
          <AnchorStatusRow done={false} active={false} label="Send funds" />
          <AnchorStatusRow done={false} active={false} label="Payout processed" />
        </div>

        {anchorTx?.message && (
          <p className="text-muted-foreground text-xs">
            Provider says: <span className="font-medium">{anchorTx.message}</span>
          </p>
        )}

        {error && (
          <div className="border-destructive/30 bg-destructive/10 rounded-md border px-4 py-3">
            <p className="text-destructive text-sm">{error}</p>
            <Button
              variant="link"
              size="sm"
              className="text-destructive mt-1 h-auto p-0 text-xs"
              onClick={() => {
                setError("");
                setStep("select");
              }}
            >
              Go back
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={openAnchorPopup}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Payout Portal
          </Button>
        </div>
      </div>
    );
  }

  if (step === "sending") {
    return (
      <div className="space-y-5">
        <div className="space-y-3">
          <AnchorStatusRow done active={false} label="Connected to payout provider" />
          <AnchorStatusRow done active={false} label="Bank details submitted" />
          <AnchorStatusRow done={false} active label={`Sending funds…`} />
          <AnchorStatusRow done={false} active={false} label="Payout processed" />
        </div>
        {error && (
          <div className="border-destructive/30 bg-destructive/10 rounded-md border px-4 py-3">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}
      </div>
    );
  }

  if (step === "tracking") {
    const statusLabel: Record<string, string> = {
      pending_external: "Processing your fiat payout…",
      pending_anchor: "Preparing your payout…",
      pending_stellar: "Confirming on Stellar…",
      pending_trust: "Awaiting trust line…",
    };

    return (
      <div className="space-y-5">
        <div className="space-y-3">
          <AnchorStatusRow done active={false} label="Connected to payout provider" />
          <AnchorStatusRow done active={false} label="Bank details submitted" />
          <AnchorStatusRow done active={false} label="Funds sent" />
          <AnchorStatusRow
            done={false}
            active
            label={anchorTx ? (statusLabel[anchorTx.status] ?? `Processing…`) : "Processing…"}
          />
        </div>

        {anchorTx?.amount_out && anchorTx.amount_out_asset && (
          <div className="bg-primary/5 rounded-lg border p-4">
            <p className="text-muted-foreground text-xs">Expected payout</p>
            <p className="text-foreground mt-1 text-xl font-bold">
              {anchorTx.amount_out}{" "}
              <span className="text-muted-foreground text-sm font-normal">
                {anchorTx.amount_out_asset.replace("iso4217:", "")}
              </span>
            </p>
          </div>
        )}

        <p className="text-muted-foreground text-xs">
          You can safely close this modal — the payout will continue in the background.
        </p>

        <div className="flex justify-end border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-green-500 bg-green-500/10">
            <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-foreground text-base font-semibold">Payout complete!</p>
            {anchorTx?.amount_out && anchorTx.amount_out_asset && (
              <p className="text-muted-foreground mt-1 text-sm">
                <span className="text-foreground font-medium">
                  {anchorTx.amount_out} {anchorTx.amount_out_asset.replace("iso4217:", "")}
                </span>{" "}
                has been sent to your bank account.
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end border-t pt-4">
          <Button onClick={onSuccess}>Done</Button>
        </div>
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Wallet payout modal content
// ---------------------------------------------------------------------------

const requestPayoutSchema = z
  .object({
    paymentMethod: z.enum(["wallet", "bank"]),
    amount: z.number().optional(),
    walletAddress: z.string(),
    memo: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod === "wallet") {
        return data.amount !== undefined && !isNaN(data.amount) && data.amount > 0;
      }
      return true;
    },
    { message: "Amount must be greater than 0", path: ["amount"] }
  );

type RequestPayoutFormData = z.infer<typeof requestPayoutSchema>;

function RequestPayoutModalContent({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const form = RHF.useForm<RequestPayoutFormData>({
    resolver: zodResolver(requestPayoutSchema),
    defaultValues: { paymentMethod: "wallet", amount: undefined, walletAddress: "", memo: "" },
  });

  const [bankCountryOpen, setBankCountryOpen] = React.useState(false);
  const [selectedBankCountry, setSelectedBankCountry] = React.useState<string>("");

  const { fiatRates, isLoading: isRatesLoading } = useAssetRates([{ code: "XLM", issuer: "native" }]);

  const currencyItems = React.useMemo<CurrencyItem[]>(() => {
    if (!fiatRates) return [];
    return Object.keys(fiatRates)
      .map((code) => ({ code, name: currencyNames.of(code) ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [fiatRates]);

  const isBankCountrySupported =
    !!selectedBankCountry && SUPPORTED_PAYOUT_COUNTRIES.includes(selectedBankCountry as (typeof SUPPORTED_PAYOUT_COUNTRIES)[number]);

  React.useEffect(() => {
    form.reset({ paymentMethod: "wallet", amount: undefined, walletAddress: "", memo: "" });
  }, [form]);

  const requestPayoutMutation = useMutation({
    mutationFn: async (data: RequestPayoutFormData) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      toast.success("Payout request submitted successfully!");
      form.reset();
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to submit payout request");
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        value={form.watch("paymentMethod")}
        onValueChange={(v) => {
          form.setValue("paymentMethod", v as "wallet" | "bank");
          form.clearErrors();
          if (v === "bank") setSelectedBankCountry("");
        }}
      >
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="wallet" className="gap-2">
            <Wallet className="h-4 w-4" />
            Wallet Address
          </TabsTrigger>
          <TabsTrigger value="bank" className="gap-2">
            <Banknote className="h-4 w-4" />
            Local Bank / Mobile Money
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="mt-6 space-y-5">
          <RHF.Controller
            control={form.control}
            name="amount"
            render={({ field, fieldState: { error } }) => (
              <NumberField
                id="amount"
                value={field.value}
                onChange={field.onChange}
                label="Amount"
                allowDecimal
                error={error?.message}
                placeholder="0.00"
                className="shadow-none"
              />
            )}
          />
          <RHF.Controller
            control={form.control}
            name="walletAddress"
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                id="walletAddress"
                label="Wallet Address"
                error={error?.message}
                placeholder="GABCDEF1234567890..."
                className="shadow-none"
              />
            )}
          />
          <RHF.Controller
            control={form.control}
            name="memo"
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                id={field.name}
                value={field.value as string}
                label="Memo (Optional)"
                error={error?.message}
                placeholder="Add a memo for this payout"
                className="shadow-none"
              />
            )}
          />
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose} disabled={requestPayoutMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit((data) => requestPayoutMutation.mutate(data))}
              disabled={requestPayoutMutation.isPending}
            >
              {requestPayoutMutation.isPending ? "Submitting..." : "Request Payout"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-muted-foreground text-xs font-medium">Country (currency)</label>
              <Popover open={bankCountryOpen} onOpenChange={setBankCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={bankCountryOpen}
                    className="border-input h-9 w-full justify-between font-normal"
                  >
                    {isRatesLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : selectedBankCountry ? (
                      <span className="truncate">
                        {currencyItems.find((c) => c.code === selectedBankCountry)?.name ?? selectedBankCountry} (
                        {selectedBankCountry})
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Select country</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start" onWheel={(e) => e.stopPropagation()}>
                  <Command>
                    <CommandInput placeholder="Search currency..." />
                    <CommandList className="max-h-[240px]">
                      <CommandEmpty>No currency found.</CommandEmpty>
                      <CommandGroup>
                        {currencyItems.map((item) => (
                          <CommandItem
                            key={item.code}
                            value={`${item.name} ${item.code}`.toLowerCase()}
                            onSelect={() => {
                              setSelectedBankCountry(item.code);
                              setBankCountryOpen(false);
                            }}
                          >
                            <span
                              className={cn(
                                "flex-1 truncate text-sm",
                                selectedBankCountry === item.code && "font-medium"
                              )}
                            >
                              {item.name} ({item.code})
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-muted-foreground text-xs">
              Available for payout: {SUPPORTED_PAYOUT_COUNTRIES.join(", ")}
            </p>
            {selectedBankCountry && !isBankCountrySupported && (
              <div className="bg-muted/50 flex gap-2 rounded-md border px-3 py-2">
                <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Your country is not available yet. We&apos;re working hard to support more countries.
                </p>
              </div>
            )}
          </div>
          {isBankCountrySupported ? (
            <div className="mt-6 border-t pt-6">
              <BankPayoutFlow
                onClose={onClose}
                onSuccess={onSuccess}
                initialCurrencyCode={selectedBankCountry}
              />
            </div>
          ) : (
            <div className="space-y-4 border-t pt-4">
              {selectedBankCountry && !isBankCountrySupported && (
                <p className="text-muted-foreground text-xs">
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs font-medium"
                    asChild
                  >
                    <a href="mailto:support@stellartools.dev?subject=Request%20payout%20country%20support" target="_blank" rel="noopener noreferrer">
                      Reach out to request support for your country
                    </a>
                  </Button>
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button disabled>
                  Request Payout
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PayoutPage() {
  const router = useRouter();

  const { data: payoutList = [], isLoading } = useOrgQuery(["payouts"], () => retrievePayouts());

  const openRequestModal = () => {
    AppModal.open({
      title: "Request Payout",
      content: <RequestPayoutModalContent onClose={AppModal.close} onSuccess={AppModal.close} />,
      footer: null,
      size: "medium",
      showCloseButton: true,
    });
  };

  const tableActions: TableAction<Payout>[] = [
    {
      label: "View Details",
      onClick: (row) => router.push(`/payout/${row.id}`),
    },
    {
      label: "Download Receipt",
      onClick: async (row) => {
        const downloadPromise = generateAndDownloadReceipt(row, "StellarTools");
        toast.promise(downloadPromise, {
          loading: "Generating receipt...",
          success: "Receipt downloaded successfully",
          error: "Failed to download receipt",
        });
      },
    },
  ];

  return (
    <DashboardSidebar>
      <DashboardSidebarInset>
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Payout history</h1>
              <p className="text-muted-foreground mt-1 text-sm">See the payout history for this store</p>
            </div>
            <Button onClick={openRequestModal}>
              <Plus className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </div>

          <DataTable
            className="border-x-0"
            columns={columns}
            data={payoutList}
            actions={tableActions}
            onRowClick={(row) => router.push(`/payout/${row.id}`)}
            isLoading={isLoading}
          />

          <div className="text-muted-foreground text-sm">
            {payoutList.length} result{payoutList.length !== 1 ? "s" : ""}
          </div>
        </div>
      </DashboardSidebarInset>
    </DashboardSidebar>
  );
}
