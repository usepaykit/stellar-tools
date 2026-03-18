"use client";

import * as React from "react";

import { useTheme } from "next-themes";
import Image, { ImageProps } from "next/image";

type LogoProps = Omit<ImageProps, "src" | "alt"> & {
  lightSrc?: string;
  darkSrc?: string;
  alt?: string;
};

export function Logo({
  lightSrc = "/images/logo-light.png",
  darkSrc = "/images/logo-dark.png",
  alt = "StellarTools",
  ...props
}: LogoProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  const resolved = mounted ? (theme === "system" ? systemTheme : theme) : "light";

  // When site/theme is light -> use dark logo (dark text), and vice versa.
  const src = resolved === "light" ? darkSrc : lightSrc;

  return <Image src={src} alt={String(alt)} {...props} />;
}

export default Logo;
