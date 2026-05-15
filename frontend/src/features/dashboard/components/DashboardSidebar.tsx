'use client';

import { useState } from 'react';

export function DashboardSidebar() {
  const [activeNav, setActiveNav] = useState('dashboard');

  const adminItems = [
    { id: 'dashboard', label: '📈 대시보드', href: '/' },
    { id: 'therapist', label: '💼 테라피스트 관리', href: '/admin/matching' },
    { id: 'companies', label: '🏢 업체 관리', href: '/admin/companies' },
    { id: 'guides', label: '👤 가이드 관리', href: '/admin/guides' },
    { id: 'settlement', label: '📊 월정산', href: '/admin/monthly-settlement' },
    { id: 'report', label: '📈 정산 보고서', href: '/admin/settlement-report' },
    { id: 'simulation', label: '🎯 시뮬레이션', href: '/admin/simulation' },
    { id: 'monitor', label: '🖥️ 카운터 모니터', href: '/monitor' },
  ];

  const customerItems = [
    { id: 'services', label: '💆 서비스', href: '/customer/services' },
    { id: 'booking', label: '📅 예약하기', href: '/customer/booking' },
    { id: 'mypage', label: '👤 마이페이지', href: '/customer/mypage' },
    { id: 'reviews', label: '⭐ 리뷰', href: '/customer/reviews' },
  ];

  const docItems = [
    { id: 'flowchart', label: '🔄 워크플로우', href: '/flowchart' },
    { id: 'requirements', label: '📖 요구사항', href: '/requirements' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-stone-100 to-stone-50 border-r border-stone-200 overflow-y-auto p-8 shadow-sm">
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
            ✨
          </div>
          <div className="text-2xl font-bold text-gray-900 tracking-tight">ELSPA</div>
        </div>
        <p className="text-xs text-gray-500 ml-10 font-light tracking-widest">MANAGEMENT SYSTEM</p>
      </div>

      {/* Admin Section */}
      <nav className="space-y-2 mb-8">
        <p className="text-xs font-bold text-gray-600 px-4 mb-3">📊 어드민</p>
        {adminItems.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeNav === item.id
                ? 'bg-white text-gray-900 shadow-md border border-stone-200'
                : 'text-gray-600 hover:bg-white/50'
            }`}
            onClick={() => setActiveNav(item.id)}
          >
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      {/* Customer Section */}
      <nav className="space-y-2 mb-8">
        <p className="text-xs font-bold text-gray-600 px-4 mb-3">👤 고객</p>
        {customerItems.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-white/50 transition-all"
            onClick={() => setActiveNav(item.id)}
          >
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      {/* Documents Section */}
      <nav className="space-y-2 mb-8">
        <p className="text-xs font-bold text-gray-600 px-4 mb-3">📋 문서</p>
        {docItems.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-white/50 transition-all"
            onClick={() => setActiveNav(item.id)}
          >
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      {/* Footer */}
      <div className="pt-8 border-t border-stone-200">
        <div className="p-4 bg-white rounded-lg border border-stone-200 shadow-sm mb-6">
          <p className="text-xs font-bold text-gray-900 mb-2">💡 팁</p>
          <p className="text-xs text-gray-600 leading-relaxed font-light">
            매일 아침 9시에 자동 보고서가 생성됩니다.
          </p>
        </div>
        <p className="text-xs text-gray-500 font-light">v 2.1.0</p>
      </div>
    </aside>
  );
}
