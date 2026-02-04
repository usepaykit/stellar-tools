import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /*
     {@experimental}
     Bypass optimization to fix production loading (sharp/optimization can fail on some hosts)
     {@link https://nextjs.org/docs/app/building-your-application/configuring/images#unoptimized}
     */
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "*.pngaaa.com",
      },
    ],
  },
};

export default nextConfig;
