import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages를 위한 정적 생성
  output: "export",
  // 이미지 최적화 비활성화 (정적 배포용)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
