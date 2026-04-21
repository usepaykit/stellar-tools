export const MARKETPLACE_APP_ICON =
  "https://8rcejvvfub.ufs.sh/f/PUZcIXo3ao8IPsLj37o3ao8IZxzlbRpBGytrnMmufWPXUHvi";

export type MarketplaceApp = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  publisher: string;
  visibleOn: string;
  worksWith: string[];
  pricing: string;
  languages: string;
  supportEmail: string;
  supportSiteUrl: string;
  companyWebsiteUrl: string;
  features: { title: string; description: string }[];
};

export const MARKETPLACE_APPS: MarketplaceApp[] = [
  {
    id: "ledger-link",
    name: "LedgerLink",
    tagline: "Sync on-chain activity with customer records and automate reconciliation.",
    category: "Accounting",
    publisher: "Stellar Labs Example Inc.",
    visibleOn: "StellarTools Dashboard",
    worksWith: [
      "Payments",
      "Customers",
      "Subscriptions",
      "Payout",
      "Dashboard home",
    ],
    pricing: "Free",
    languages: "English (United States)",
    supportEmail: "support@example.com",
    supportSiteUrl: "https://example.com/support",
    companyWebsiteUrl: "https://example.com",
    features: [
      {
        title: "Connect your workspace in one click",
        description:
          "OAuth into LedgerLink and map organizations without exporting CSVs. Customer IDs stay aligned with StellarTools so your team sees one source of truth.",
      },
      {
        title: "Real-time balance and payout insights",
        description:
          "Surface wallet snapshots next to invoices and subscriptions. Get alerts when payouts diverge from expected on-chain movements.",
      },
    ],
  },
  {
    id: "orbit-support",
    name: "Orbit Support",
    tagline: "Turn disputes and tickets into structured workflows tied to transactions.",
    category: "Customer support",
    publisher: "Orbit Apps LLC",
    visibleOn: "StellarTools Dashboard",
    worksWith: ["Transactions", "Customers", "Subscriptions"],
    pricing: "Free trial, then usage-based",
    languages: "English (United States)",
    supportEmail: "hello@orbit.example",
    supportSiteUrl: "https://orbit.example/help",
    companyWebsiteUrl: "https://orbit.example",
    features: [
      {
        title: "Open cases from any transaction row",
        description:
          "Raise a dispute or support case without leaving the dashboard. Orbit pulls the transaction context automatically.",
      },
      {
        title: "Shared timeline with your team",
        description:
          "Comment, assign owners, and resolve cases with a clear audit trail linked back to StellarTools IDs.",
      },
    ],
  },
  {
    id: "nova-analytics",
    name: "Nova Analytics",
    tagline: "Cohort and revenue charts built for Stellar-native businesses.",
    category: "Analytics",
    publisher: "Nova Data Co.",
    visibleOn: "StellarTools Dashboard",
    worksWith: ["Dashboard home", "Usage", "Subscriptions", "Products"],
    pricing: "Free",
    languages: "English (United States)",
    supportEmail: "support@nova.example",
    supportSiteUrl: "https://nova.example/docs",
    companyWebsiteUrl: "https://nova.example",
    features: [
      {
        title: "Plug-and-play dashboards",
        description:
          "Drop Nova onto your overview page. Charts respect testnet vs mainnet and your current organization context.",
      },
      {
        title: "Export-ready reports",
        description:
          "Download weekly or monthly summaries for investors and ops without rebuilding spreadsheets.",
      },
    ],
  },
];

export function getMarketplaceApp(id: string) {
  return MARKETPLACE_APPS.find((a) => a.id === id);
}
