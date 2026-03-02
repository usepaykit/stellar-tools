import { Toaster } from "@/components/ui/toast";
import { Providers } from "@/providers";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import {  DM_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  variable: "--font-instrument-serif",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "StellarTools | Stripe for Stellar",
  description: "Drop-in payment adapters for your stack. Accept fast, low-cost crypto payments in minutes",
  openGraph: {
    title: "StellarTools | Stripe for Stellar",
    description: "Drop-in payment adapters for your stack. Accept fast, low-cost crypto payments in minutes",
    images: [
      {
        url: "/images/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "StellarTools - Stripe alternative for Stellar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StellarTools | Stripe for Stellar",
    description: "Drop-in payment adapters for your stack. Accept fast, low-cost crypto payments in minutes",
    images: ["/images/og-image.jpeg"],
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${jetBrainsMono.variable} ${instrumentSerif.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );

}
