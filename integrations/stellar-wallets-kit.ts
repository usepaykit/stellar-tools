"use client";

import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";
import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { activeAddress } from "@creit-tech/stellar-wallets-kit/state";
import { KitEventStateUpdated, KitEventType, Networks, SwkAppTheme } from "@creit-tech/stellar-wallets-kit/types";

type WalletConnectionCallback = (address: string | null) => void;

export class StellarWalletsKitApi {
  private static instance: StellarWalletsKitApi | null = null;
  private isInitialized = false;
  private connectionCallbacks: Set<WalletConnectionCallback> = new Set();
  private eventUnsubscriber: (() => void) | null = null;

  private constructor() {}

  static getInstance(): StellarWalletsKitApi {
    if (!StellarWalletsKitApi.instance) {
      StellarWalletsKitApi.instance = new StellarWalletsKitApi();
    }
    return StellarWalletsKitApi.instance;
  }

  private $cssvar = (name: string): string => {
    if (typeof window === "undefined") return "";
    return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim() || "";
  };

  get theme(): SwkAppTheme {
    return {
      background: this.$cssvar("stellar-wallet-background"),
      "background-secondary": this.$cssvar("stellar-wallet-background-secondary"),
      "foreground-strong": this.$cssvar("stellar-wallet-foreground-strong"),
      foreground: this.$cssvar("stellar-wallet-foreground"),
      "foreground-secondary": this.$cssvar("stellar-wallet-foreground-secondary"),
      primary: this.$cssvar("stellar-wallet-primary"),
      "primary-foreground": this.$cssvar("stellar-wallet-primary-foreground"),
      transparent: this.$cssvar("stellar-wallet-transparent"),
      lighter: this.$cssvar("stellar-wallet-lighter"),
      light: this.$cssvar("stellar-wallet-light"),
      "light-gray": this.$cssvar("stellar-wallet-light-gray"),
      gray: this.$cssvar("stellar-wallet-gray"),
      danger: this.$cssvar("stellar-wallet-danger"),
      border: this.$cssvar("stellar-wallet-border"),
      shadow: this.$cssvar("stellar-wallet-shadow"),
      "border-radius": this.$cssvar("stellar-wallet-border-radius"),
      "font-family": this.$cssvar("stellar-wallet-font-family"),
    };
  }

  init(options?: { network?: Networks }): void {
    if (this.isInitialized) return;
    if (typeof window === "undefined") return;

    StellarWalletsKit.init({
      modules: defaultModules(),
      theme: this.theme,
      network: options?.network || Networks.TESTNET,
    });

    this.eventUnsubscriber = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event: KitEventStateUpdated) => {
      const address = event.payload.address || null;
      this.connectionCallbacks.forEach((cb) => cb(address));
    });

    this.isInitialized = true;
  }

  async connectWallet(): Promise<{ address: string }> {
    this.ensureInitialized();
    return await StellarWalletsKit.authModal();
  }

  getAddressSync(): string | null {
    if (typeof window === "undefined") return null;
    return activeAddress.value || null;
  }

  isConnected(): boolean {
    return this.getAddressSync() !== null;
  }

  async signTransaction(
    xdr: string,
    options?: { networkPassphrase?: string; address?: string }
  ): Promise<{ signedTxXdr: string; signerAddress?: string }> {
    this.ensureInitialized();
    return await StellarWalletsKit.signTransaction(xdr, options);
  }

  async disconnect(): Promise<void> {
    this.ensureInitialized();
    await StellarWalletsKit.disconnect();
  }

  onConnectionChange(callback: WalletConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    // Immediately call with current state
    if (typeof window !== "undefined") {
      callback(this.getAddressSync());
    }
    return () => this.connectionCallbacks.delete(callback);
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error("StellarWalletsKitApi must be initialized. Call init() first.");
    }
  }
}

export const stellarWalletsKit = StellarWalletsKitApi.getInstance();
