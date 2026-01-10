import React from "react";

import { Github, Heart, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function FooterSection() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Integrations", href: "#integrations" },
      { name: "Pricing", href: "#pricing" },
      { name: "Documentation", href: "/dashboard/documentation" },
    ],
    resources: [
      { name: "API Reference", href: "/dashboard/documentation" },
      { name: "Guides", href: "/dashboard/documentation" },
      { name: "Blog", href: "#" },
      { name: "Support", href: "#" },
    ],
    company: [
      { name: "About", href: "#" },
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Contact", href: "#" },
    ],
  };

  return (
    <footer className="border-border bg-background relative border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Brand Section */}
            <div className="lg:col-span-4">
              <Link href="/" className="mb-4 flex items-center gap-2">
                <div className="relative h-10 w-10">
                  <Image
                    src="/images/logo-light.png"
                    alt="Stellar Tools"
                    width={40}
                    height={40}
                    className="h-full w-full object-contain dark:hidden"
                  />
                  <Image
                    src="/images/logo-dark.png"
                    alt="Stellar Tools"
                    width={40}
                    height={40}
                    className="hidden h-full w-full object-contain dark:block"
                  />
                </div>
                <span className="font-rosemary text-foreground text-xl font-semibold">
                  Stellar Tools
                </span>
              </Link>
              <p className="text-muted-foreground mb-6 max-w-sm text-sm leading-relaxed">
                Drop-in payment adapters for your stack. Accept fast, low-cost
                crypto payments in minutes.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/usepaykit/stellar-tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a
                  href="https://x.com/usepaykit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="lg:col-span-2">
              <h3 className="text-foreground mb-4 text-sm font-semibold">
                Product
              </h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div className="lg:col-span-2">
              <h3 className="text-foreground mb-4 text-sm font-semibold">
                Resources
              </h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div className="lg:col-span-2">
              <h3 className="text-foreground mb-4 text-sm font-semibold">
                Company
              </h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Section */}
            <div className="lg:col-span-2">
              <h3 className="text-foreground mb-4 text-sm font-semibold">
                Get Started
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Start accepting Stellar payments in minutes.
              </p>
              <Link
                href="/signup"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-border border-t py-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span>© {currentYear} StellarTools. All rights reserved.</span>
            </div>
            <Link
              href="https://usepaykit.dev"
              target="_blank"
              className="text-muted-foreground flex items-center gap-1 text-sm"
            >
              <span>Made with</span>
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              <span>by</span>
              <span className="text-foreground font-semibold">Paykit</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
