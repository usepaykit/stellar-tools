"use client";

import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";
import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { activeAddress } from "@creit-tech/stellar-wallets-kit/state";
import { KitEventStateUpdated, KitEventType, Networks } from "@creit-tech/stellar-wallets-kit/types";

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

  // Convert oklch to hex for compatibility
  private oklchToHex(oklchString: string): string {
    // Fallback colors that match your design
    const colorMap: Record<string, string> = {
      "stellar-wallet-background": "#fafafa",
      "stellar-wallet-background-secondary": "#f4f4f5",
      "stellar-wallet-foreground-strong": "#09090b",
      "stellar-wallet-foreground": "#09090b",
      "stellar-wallet-foreground-secondary": "#71717a",
      "stellar-wallet-primary": "#7c3aed",
      "stellar-wallet-primary-foreground": "#ffffff",
      "stellar-wallet-transparent": "transparent",
      "stellar-wallet-lighter": "#fafafa",
      "stellar-wallet-light": "#f4f4f5",
      "stellar-wallet-light-gray": "#71717a",
      "stellar-wallet-gray": "#71717a",
      "stellar-wallet-danger": "#ef4444",
      "stellar-wallet-border": "#e4e4e7",
      "stellar-wallet-shadow": "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      "stellar-wallet-border-radius": "0.5rem",
      "stellar-wallet-font-family": "var(--font-sans)",
    };

    return colorMap[oklchString] || "#000000";
  }

  get theme() {
    return {
      background: this.oklchToHex("stellar-wallet-background"),
      "background-secondary": this.oklchToHex("stellar-wallet-background-secondary"),
      "foreground-strong": this.oklchToHex("stellar-wallet-foreground-strong"),
      foreground: this.oklchToHex("stellar-wallet-foreground"),
      "foreground-secondary": this.oklchToHex("stellar-wallet-foreground-secondary"),
      primary: this.oklchToHex("stellar-wallet-primary"),
      "primary-foreground": this.oklchToHex("stellar-wallet-primary-foreground"),
      transparent: this.oklchToHex("stellar-wallet-transparent"),
      lighter: this.oklchToHex("stellar-wallet-lighter"),
      light: this.oklchToHex("stellar-wallet-light"),
      "light-gray": this.oklchToHex("stellar-wallet-light-gray"),
      gray: this.oklchToHex("stellar-wallet-gray"),
      danger: this.oklchToHex("stellar-wallet-danger"),
      border: this.oklchToHex("stellar-wallet-border"),
      shadow: this.oklchToHex("stellar-wallet-shadow"),
      "border-radius": "0.5rem",
      "font-family": "inherit",
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

  // Add method to change network dynamically
  setNetwork(network: Networks): void {
    if (typeof window === "undefined") return;

    // Disconnect first
    if (this.isConnected()) {
      StellarWalletsKit.disconnect();
    }

    // Reinitialize with new network
    this.isInitialized = false;
    this.init({ network });
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

  cleanup(): void {
    if (this.eventUnsubscriber) {
      this.eventUnsubscriber();
      this.eventUnsubscriber = null;
    }
    this.connectionCallbacks.clear();
    this.isInitialized = false;
  }
}

export const stellarWalletsKit = StellarWalletsKitApi.getInstance();
