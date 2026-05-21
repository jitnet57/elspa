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
  swcMinify: true,

  // ✅ 번들 분석 및 최적화
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },

  // ✅ Turbopack 설정 (Next.js 16)
  turbopack: {
    // 캐싱 활성화
    cache: {
      memoryLimit: 512,
    },
  },

  // ✅ 웹팩 최적화
  webpack: (config, { isServer }) => {
    // Tree shaking 및 번들 크기 감소
    config.optimization = {
      ...config.optimization,
      minimize: true,
    };

    return config;
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
