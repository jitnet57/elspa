import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages를 위한 정적 생성
  output: "export",

  // 이미지 최적화
  images: {
    unoptimized: true,
  },

  // ✅ 성능 최적화
  compress: true,

  // ✅ 번들 분석 및 최적화
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },

  // ✅ 성능 모니터링
  experimental: {
    optimizePackageImports: [
      "recharts",
      "lodash",
      "@radix-ui/react-dialog",
    ],
  },
};

export default nextConfig;
