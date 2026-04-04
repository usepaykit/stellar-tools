"use client";

import * as React from "react";

import { Spinner } from "@/components/spinner";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";
import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { activeAddress } from "@creit-tech/stellar-wallets-kit/state";
import {
  KitEventType,
  Networks,
  SwkAppDarkTheme,
  SwkAppLightTheme,
  type SwkAppTheme,
} from "@creit-tech/stellar-wallets-kit/types";
import { type Root, createRoot } from "react-dom/client";

type WalletConnectionCallback = (address: string | null) => void;

export class StellarWalletsKitApi {
  private static instance: StellarWalletsKitApi;
  private isInitialized = false;
  private connectionCallbacks = new Set<WalletConnectionCallback>();
  private unsubscriber: (() => void) | null = null;
  private host: HTMLDivElement | null = null;

  private constructor() {}

  static getInstance(): StellarWalletsKitApi {
    return (this.instance ??= new StellarWalletsKitApi());
  }

  init(options?: { network?: Networks }): void {
    if (typeof window === "undefined") return;

    this.unsubscriber?.();
    const network = options?.network ?? Networks.TESTNET;
    const isPublic = network === Networks.PUBLIC;

    StellarWalletsKit.init({
      network,
      modules: [...defaultModules()],
      theme: this.buildTheme(),
    });

    this.unsubscriber = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (ev) => {
      const address = ev.payload.address || null;
      this.connectionCallbacks.forEach((cb) => cb(address));
    });

    this.isInitialized = true;
  }

  async connectWallet(): Promise<{ address: string }> {
    this.ensureInitialized();
    const authPromise = StellarWalletsKit.authModal({ container: undefined });
    return await authPromise;
  }

  getAddressSync = () => (typeof window !== "undefined" ? activeAddress.value || null : null);
  isConnected = () => this.getAddressSync() !== null;

  async signTransaction(xdr: string, opts?: { networkPassphrase?: string; address?: string }) {
    this.ensureInitialized();
    return StellarWalletsKit.signTransaction(xdr, opts);
  }

  async disconnect(): Promise<void> {
    if (!this.isInitialized) return;
    await StellarWalletsKit.disconnect();
    this.unsubscriber?.();
    this.host?.classList.remove("open");
    this.isInitialized = false;
  }

  onConnectionChange(callback: WalletConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    if (typeof window !== "undefined") callback(this.getAddressSync());
    return () => this.connectionCallbacks.delete(callback);
  }

  private ensureInitialized() {
    if (!this.isInitialized) throw new Error("StellarWalletsKitApi not initialized");
  }

  private buildTheme(): SwkAppTheme {
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    const fallback = isDark ? SwkAppDarkTheme : SwkAppLightTheme;
    const style = getComputedStyle(document.documentElement);

    const keys: (keyof SwkAppTheme)[] = [
      "background",
      "background-secondary",
      "foreground-strong",
      "foreground",
      "foreground-secondary",
      "primary",
      "primary-foreground",
      "transparent",
      "lighter",
      "light",
      "light-gray",
      "gray",
      "danger",
      "border",
      "shadow",
      "border-radius",
      "font-family",
    ];

    return keys.reduce((acc, key) => {
      const cssVar = `--stellar-wallet-${key}`;
      acc[key] = style.getPropertyValue(cssVar).trim() || (fallback[key] as string);
      return acc;
    }, {} as SwkAppTheme);
  }
}

function observeAndInjectSpinner(host: HTMLElement) {
  let spinnerRoot: Root | null = null;
  let rafId = 0;

  const cleanup = () => {
    if (spinnerRoot) {
      try {
        spinnerRoot.unmount();
      } catch {}
      spinnerRoot = null;
    }
  };

  const update = () => {
    const kit = host.querySelector(".stellar-wallets-kit");
    const ul = kit?.querySelector("ul");
    if (!ul) return;

    // If actual wallets are rendered, remove any active spinner
    if (ul.querySelector(":scope > li")) {
      cleanup();
      ul.querySelector(".swk-kit-loading-spinner")?.remove();
      return;
    }

    const loadingDiv = Array.from(ul.querySelectorAll("div")).find(
      (d) => d.textContent?.trim()?.includes("Loading wallets") && d.children.length === 0
    );

    if (loadingDiv && !spinnerRoot) {
      const mount = document.createElement("div");
      mount.className = "swk-kit-loading-spinner";
      loadingDiv.replaceWith(mount);
      spinnerRoot = createRoot(mount);
      spinnerRoot.render(React.createElement(Spinner, { size: 28, strokeColor: "currentColor" }));
    }
  };

  const observer = new MutationObserver(() => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(update);
  });

  observer.observe(host, { subtree: true, childList: true, characterData: true });
  update();

  return () => {
    cancelAnimationFrame(rafId);
    observer.disconnect();
    cleanup();
    host.querySelector(".swk-kit-loading-spinner")?.remove();
  };
}

export const stellarWalletsKit = StellarWalletsKitApi.getInstance();
