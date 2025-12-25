import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/toast";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rosemary = localFont({
  src: "../public/fonts/rosemary.ttf",
  variable: "--font-rosemary",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stellar Tools - Bring Stellar Payments to Every Platform",
  description:
    "Unified adapters for BetterAuth, Medusa, Shopify, Clerk, Convex, Trigger.dev, WordPress, AI SDKs, and more—make crypto-native payments seamless for your users.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rosemary.variable} antialiased`}
      >
        <QueryProvider>
          {children}
          <Toaster position="bottom-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
