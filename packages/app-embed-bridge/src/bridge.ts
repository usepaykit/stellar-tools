import { Network as StellarToolsNetwork } from "@stellartools/core";

export type BridgeContext = {
  organizationId: string;
  environment: StellarToolsNetwork;
  pathname: string;
  theme: "light" | "dark";
  installationId: string;
};

export const stellar = {
  init: (onUpdate?: (context: Partial<BridgeContext>) => void) => {
    if (typeof window === "undefined") return null;

    const params = new URLSearchParams(window.location.search);
    const context: BridgeContext = {
      organizationId: params.get("orgId")!,
      environment: params.get("env") as any,
      pathname: params.get("pathname")!,
      theme: params.get("theme") as any,
      installationId: params.get("instId")!,
    };

    // 2. Setup Auto-Resize
    const observer = new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height;
      window.parent.postMessage({ type: "stellar:resize", payload: { height } }, "*");
    });
    observer.observe(document.body);

    // 3. Listen for Host Updates (e.g. merchant navigated to a new page)
    window.addEventListener("message", (event) => {
      const { type, payload } = event.data;
      if (type === "stellar:context_update") {
        onUpdate?.(payload);
      }
    });

    return context;
  },

  navigate: (url: string) => {
    window.parent.postMessage({ type: "stellar:navigate", payload: { url } }, "*");
  },

  reload: () => {
    window.parent.postMessage({ type: "stellar:reload" }, "*");
  },
};
