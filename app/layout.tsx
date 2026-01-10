import { Toaster } from "@/components/ui/toast";
import { Providers } from "@/providers";
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
  title: "StellarTools | Stripe for Stellar",
  description:
    "Drop-in payment adapters for your stack. Accept fast, low-cost crypto payments in minutes",
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
        <Providers>
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
