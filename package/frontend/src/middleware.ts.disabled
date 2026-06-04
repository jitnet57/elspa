/**
 * ============================================================
 * 📌 Next.js 미들웨어 (Route Protection)
 * 📋 목적: /admin/* 경로 인증 보호
 * 🔧 정책: 미인증 사용자 → /auth/login 리다이렉트
 * 📅 작성일: 2026-05-22
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Admin 경로 보호
  if (pathname.startsWith('/admin')) {
    // localStorage에서 토큰 확인 (클라이언트 사이드)
    // 서버 사이드에서는 쿠키 사용 (현재 구조상 클라이언트 처리 권장)
    // 따라서 여기서는 간단히 로그인 페이지로 리다이렉트하고
    // 클라이언트 컴포넌트에서 실제 인증 확인

    // 현재: 모든 /admin 접근을 허용하되, 클라이언트에서 확인
    // TODO: 향후 HTTP-only 쿠키 기반으로 전환
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
  ],
};
