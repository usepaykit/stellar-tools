import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "*.pngaaa.com",
      },
      {
        protocol: "https",
        hostname: "*.usestellartools.dev",
      },
      {
        protocol: "https",
        hostname: "*.vercel.app",
      },
    ],
  },
};

export default nextConfig;
