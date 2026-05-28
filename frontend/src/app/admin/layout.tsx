'use client';

import { useEffect, useState } from 'react';
import { useAdminGate } from '@/lib/store/admin-gate-store';
import AdminLoginScreen from './_components/AdminLoginScreen';
import AdminShell from './_components/AdminShell';

// ============================================================
// 📌 컴포넌트명: AdminLayout
// 📋 목적: 모든 /admin/* 라우트의 인증 게이트 레이아웃
// 🔧 기능: 로그인 상태 검증, hydration 가드
// 📅 작성일: 2026-05-28
// ============================================================

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdminAuthenticated } = useAdminGate();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Always render AdminShell on server (SSR), only check auth on client
  if (!isClient) {
    return <AdminShell>{children}</AdminShell>;
  }

  // On client, check authentication state
  if (!isAdminAuthenticated) {
    return <AdminLoginScreen />;
  }

  return <AdminShell>{children}</AdminShell>;
}
