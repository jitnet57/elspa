import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Cloudflare Workers compatibility
  experimental: {
    isrMemoryCacheSize: 0,
  },
};

export default nextConfig;
