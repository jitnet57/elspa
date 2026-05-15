'use client';

import { useState } from 'react';

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState('dashboard');

  const stats = [
    { label: '활성 테라피스트', value: '12', icon: '👥', change: '+2', changeType: 'positive' },
    { label: '오늘 예약', value: '24', icon: '📅', change: '+8', changeType: 'positive' },
    { label: '월 매출', value: '₩4.8M', icon: '💰', change: '+12%', changeType: 'positive' },
    { label: '고객 만족도', value: '4.8★', icon: '⭐', change: '+0.2', changeType: 'positive' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
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

        <nav className="space-y-2 mb-8">
          <p className="text-xs font-bold text-gray-600 px-4 mb-3">📊 어드민</p>
          {[
            { id: 'dashboard', label: '📈 대시보드', href: '/' },
            { id: 'monitor', label: '🖥️ 카운터 모니터', href: '/monitor' },
            { id: 'companies', label: '🏢 업체 관리', href: '/admin/companies' },
          ].map((item) => (
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

        <div className="pt-8 border-t border-stone-200">
          <p className="text-xs text-gray-500 font-light">v 2.1.0</p>
        </div>
      </aside>

      <main className="ml-72 p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-2 tracking-tight">
              ElSpa Dashboard
            </h1>
            <p className="text-sm text-gray-500 font-light">
              {new Date().toLocaleDateString('ko-KR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 hover:shadow-md hover:border-stone-200 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{stat.icon}</div>
                <div className={`text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700`}>
                  {stat.change}
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2 font-light">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">✅ 배포 완료!</h2>
          <p className="text-gray-600 mb-4">
            ElSpa Manager가 Cloudflare Pages에 성공적으로 배포되었습니다.
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✓ 모바일 반응형 UI 적용</li>
            <li>✓ 외부 링크 새 탭에서 열기</li>
            <li>✓ 인앱 브라우저 감지 및 리다이렉트</li>
            <li>✓ 25개 페이지 정적 생성</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
