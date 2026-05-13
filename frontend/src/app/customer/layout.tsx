'use client';

import { useState } from 'react';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeNav, setActiveNav] = useState('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-stone-200 shadow-sm z-40">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
              ✨
            </div>
            <div className="text-xl font-bold text-gray-900 tracking-tight">ELSPA</div>
            <span className="text-xs text-gray-500 ml-2 font-light">Customer</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              📞 031-1234-5678
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium shadow-md">
              로그인
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-20 h-[calc(100vh-80px)] w-64 bg-gradient-to-b from-stone-100 to-stone-50 border-r border-stone-200 overflow-y-auto p-6 shadow-sm">
        <nav className="space-y-1">
          {[
            { id: 'home', label: '홈', icon: '◊' },
            { id: 'services', label: '서비스 둘러보기', icon: '◊' },
            { id: 'booking', label: '예약하기', icon: '◊' },
            { id: 'mypage', label: '마이페이지', icon: '◊' },
            { id: 'reviews', label: '후기 & 평점', icon: '◊' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeNav === item.id
                  ? 'bg-white text-gray-900 shadow-md border border-stone-200'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <span className="text-gray-400 text-xs">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-10 pt-8 border-t border-stone-200">
          <div className="p-4 bg-white rounded-lg border border-stone-200 shadow-sm">
            <p className="text-xs font-bold text-gray-900 mb-2">⭐ VIP 혜택</p>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed font-light">
              프리미엄 회원이 되어 매월 5% 할인과 우선 예약 혜택을 받으세요!
            </p>
            <button className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all shadow-md">
              업그레이드
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6 font-light">© 2026 ElSpa</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 mt-20 p-8">
        {children}
      </main>
    </div>
  );
}
