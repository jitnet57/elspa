import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ============================================================
  // 📌 환경 변수 주입 (빌드 타임)
  // 📋 Cloudflare Pages에서 환경 변수 미인식 문제 해결
  // ============================================================
  env: {
    NEXT_PUBLIC_API_URL: 'https://elspa-api-production.jitnet57.workers.dev',
  },

  reactStrictMode: true,

  // ============================================================
  // 📌 TypeScript 검사 스킵 (route group 호환성 이슈)
  // 📋 Next.js 16에서 (landing) 같은 route group에 대한 타입 검사 오류 회피
  // ============================================================
  typescript: {
    ignoreBuildErrors: true,
  },

  // ============================================================
  // 📌 배포 설정 (Cloudflare Pages)
  // 📋 API Routes 지원을 위해 export 모드 비활성화
  // ============================================================
  // output: "export", ← API Routes 사용으로 비활성화
  trailingSlash: false,

  // ============================================================
  // 📌 이미지 최적화
  // 📋 Cloudflare Pages의 동적 기능 제약으로 unoptimized 사용
  // ============================================================
  images: {
    unoptimized: true,
    // WebP 포맷 지원 (모던 브라우저)
    formats: ["image/avif", "image/webp"],
  },

  // ============================================================
  // 📌 압축 설정
  // 📋 Gzip 및 Brotli 압축 활성화
  // ============================================================
  compress: true,

  // ============================================================
  // 📌 온디맨드 엔트리 최적화
  // 📋 개발 서버 메모리 효율성 향상
  // ============================================================
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,  // 25초 비활성 후 메모리 해제
    pagesBufferLength: 5,        // 미리 로드할 페이지 수
  },

  // ============================================================
  // 📌 패키지 임포트 최적화
  // 📋 나머지 자동 분해를 통한 번들 분할
  // ============================================================
  experimental: {
    optimizePackageImports: [
      "recharts",         // 차트 라이브러리
      "lodash",           // 유틸리티 라이브러리
      "@radix-ui/react-dialog",  // UI 컴포넌트
      "three",            // 3D 렌더링 (분할 로드)
      "zustand",          // 상태 관리
      "@tanstack/react-query",  // 데이터 페칭
    ],
  },

  // ============================================================
  // 📌 Webpack 번들 분석
  // 📋 production 빌드 시 번들 크기 분석
  // ============================================================
  webpack: (config, { isServer }) => {
    if (process.env.ANALYZE === "true") {
      const { BundleAnalyzerPlugin } = require("@next/bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          enabled: true,
          openAnalyzer: false,
          reportFilename: isServer ? "../bundles/server.html" : "../bundles/client.html",
        })
      );
    }
    return config;
  },

  // ============================================================
  // 📌 SWC 최적화 (Next.js 16에서는 자동 적용)
  // 📋 swcMinify는 Next.js 16에서 deprecated되었으므로 제거
  // ============================================================

  // ============================================================
  // 📌 Turbopack 성능 설정
  // 📋 Next.js 16 Turbopack 번들러 최적화
  // ============================================================
  turbopack: {
    // 타입스크립트 검사 활성화
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
};

export default nextConfig;
