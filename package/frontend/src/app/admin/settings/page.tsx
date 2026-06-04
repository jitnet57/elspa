'use client';

import React from 'react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';

// ============================================================
// 📌 페이지명: AdminSettingsPage
// 📋 목적: 관리자 설정 메인 페이지 (메뉴 허브)
// 🔧 기능: 데이터 임포트, 정책 설정, 기타 관리 옵션
// 📅 작성일: 2026-06-02
// ============================================================

interface SettingsMenuItem {
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  icon: string;
  href: string;
  color: string;
  badge?: string;
}

export default function AdminSettingsPage() {
  const t = useT();

  const settingsItems: SettingsMenuItem[] = [
    {
      title: 'Import Data',
      titleKo: '데이터 임포트',
      description: 'Import employee, therapist, and customer data from Excel files',
      descriptionKo: 'Excel 파일에서 직원, 테라피스트, 고객 데이터를 가져옵니다',
      icon: '📥',
      href: '/admin/settings/import',
      color: 'from-cyan-500 to-blue-500',
      badge: 'NEW',
    },
    {
      title: 'Policies',
      titleKo: '정책 설정',
      description: 'Configure business policies, commission rates, and rules',
      descriptionKo: '수수료율, 수당, 정책 등을 설정합니다',
      icon: '⚙️',
      href: '/admin/policies',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'Audit Logs',
      titleKo: '감사 로그',
      description: 'View system activity and user actions',
      descriptionKo: '시스템 활동 및 사용자 작업 로그를 확인합니다',
      icon: '📋',
      href: '/admin/audit-logs',
      color: 'from-violet-500 to-fuchsia-500',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-4xl font-black text-[#8aebff] drop-shadow-[0_0_8px_rgba(138,235,255,0.4)]">
          ⚙️ Settings & Management
        </h1>
        <p className="text-indigo-300/70">
          관리자 설정, 정책 관리, 데이터 임포트 등을 한곳에서 관리합니다.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsItems.map((item, idx) => (
          <Link
            key={idx}
            href={item.href}
            className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/3 backdrop-blur-sm hover:border-white/20 transition-all duration-300 p-6"
          >
            {/* Background Gradient */}
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${item.color}`}
            ></div>

            {/* Content */}
            <div className="relative z-10 space-y-4">
              {/* Icon & Badge */}
              <div className="flex items-start justify-between">
                <span className="text-4xl">{item.icon}</span>
                {item.badge && (
                  <span className="px-2 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Title */}
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {t(item.title, item.titleKo)}
                </h3>
                <p className="text-sm text-indigo-300/70 group-hover:text-indigo-300/90 transition-colors mt-1">
                  {t(item.description, item.descriptionKo)}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm group-hover:gap-3 transition-all">
                <span>Open</span>
                <span className="text-lg">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
          <p className="text-xs font-bold text-cyan-300/70 uppercase tracking-widest">
            Last Import
          </p>
          <p className="text-xl font-black text-cyan-400 mt-2">2026-06-02</p>
          <p className="text-xs text-indigo-300/50 mt-1">1,250 records</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
          <p className="text-xs font-bold text-indigo-300/70 uppercase tracking-widest">
            Active Policies
          </p>
          <p className="text-xl font-black text-indigo-400 mt-2">12</p>
          <p className="text-xs text-indigo-300/50 mt-1">All verified</p>
        </div>

        <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <p className="text-xs font-bold text-purple-300/70 uppercase tracking-widest">
            Audit Events
          </p>
          <p className="text-xl font-black text-purple-400 mt-2">348</p>
          <p className="text-xs text-indigo-300/50 mt-1">This month</p>
        </div>

        <div className="bg-gradient-to-br from-fuchsia-500/20 to-rose-500/10 border border-rose-500/20 rounded-lg p-4">
          <p className="text-xs font-bold text-rose-300/70 uppercase tracking-widest">
            System Status
          </p>
          <p className="text-xl font-black text-emerald-400 mt-2">✓ Online</p>
          <p className="text-xs text-indigo-300/50 mt-1">All services up</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 text-sm text-indigo-300">
        <p className="font-bold mb-2">💡 팁</p>
        <ul className="space-y-1 text-indigo-300/70 list-disc list-inside">
          <li>
            대량 데이터를 임포트하려면{' '}
            <Link href="/admin/settings/import" className="text-cyan-400 hover:text-cyan-300">
              Import Data
            </Link>
            를 사용하세요
          </li>
          <li>모든 임포트 작업은 감사 로그에 기록됩니다</li>
          <li>임포트 전에 데이터 형식을 확인하세요</li>
        </ul>
      </div>
    </div>
  );
}
