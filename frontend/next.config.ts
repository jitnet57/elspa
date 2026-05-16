import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages를 위한 정적 생성
  output: "export",
  // 이미지 최적화 비활성화 (정적 배포용)
  images: {
    unoptimized: true,
  },
  // 성능 최적화
  compress: true,
  // 번들 분석 및 최적화
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
  // Turbopack 설정 (Next.js 16)
  turbopack: {},
};

export default nextConfig;
