'use client';

import { useState } from 'react';

export default function AdminPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('비밀번호가 틀렸습니다');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md border border-blue-200">
          <div className="text-center mb-8">
            <div className="text-4xl sm:text-5xl mb-4">🔐</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">어드민 로그인</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors text-sm sm:text-base"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  const adminMenus = [
    {
      category: '👥 테라피스트',
      items: [
        { name: '테라피스트 관리', href: '/admin/therapists', icon: '👨‍⚕️' },
        { name: '📅 일일 스케줄', href: '/admin/therapist-schedule', icon: '📅' },
        { name: '🎯 매칭 제어판', href: '/admin/matching', icon: '🎯' },
      ],
    },
    {
      category: '🏢 업체 관리',
      items: [
        { name: '업체 관리', href: '/admin/companies', icon: '🏢' },
        { name: '정산 현황', href: '/admin/monthly-settlement', icon: '💰' },
        { name: '정산 보고서', href: '/admin/settlement-report', icon: '📊' },
      ],
    },
    {
      category: '📈 분석 & 감사',
      items: [
        { name: '공정성 대시보드', href: '/admin/fairness-dashboard', icon: '⚖️' },
        { name: '결제 정보', href: '/admin/billing', icon: '💳' },
        { name: '변경 로그', href: '/admin/change-logs', icon: '📋' },
      ],
    },
    {
      category: '📚 참고',
      items: [
        { name: '배포 안내', href: '/flowchart', icon: '📍' },
        { name: '업체 가이드', href: '/admin/guides', icon: '📖' },
        { name: '정책', href: '/admin/policies', icon: '⚙️' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-400 to-blue-300 text-white p-4 sm:p-6 lg:p-8 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="text-3xl sm:text-4xl">👥</div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">어드민 대시보드</h1>
              <p className="text-blue-100 text-sm sm:text-base">ELSPA 관리 시스템</p>
            </div>
          </div>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="w-full sm:w-auto px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm font-bold transition-colors"
          >
            🚪 로그아웃
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6 sm:space-y-8">
          {adminMenus.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{section.category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {section.items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="bg-white border border-gray-200 hover:border-blue-300 rounded-lg p-4 sm:p-6 transition-all hover:shadow-md group hover:bg-blue-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-2xl sm:text-3xl mb-2">{item.icon}</div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </div>
                      <div className="text-xl sm:text-2xl opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2 text-gray-400">
                        →
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 바로가기 */}
        <div className="mt-8 sm:mt-12 bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">🔗 주요 링크</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <a
              href="/monitor"
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 sm:p-4 rounded-lg text-center text-xs sm:text-sm font-bold transition-colors"
            >
              📊 카운터
            </a>
            <a
              href="/"
              className="bg-gray-400 hover:bg-gray-500 text-white p-3 sm:p-4 rounded-lg text-center text-xs sm:text-sm font-bold transition-colors"
            >
              🏠 홈
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
