'use client';

import { useState } from 'react';

export default function SettlementManagement() {
  const [selectedCategory, setSelectedCategory] = useState<'therapist' | 'company' | 'guides' | null>(null);

  const categories = [
    {
      id: 'therapist',
      title: '🧘 테라피스트 정산',
      description: '테라피스트의 월간 정산, 급여, 수익 현황을 관리합니다',
      icon: '💆',
      href: '/therapist-settlement',
      color: 'from-blue-400 to-blue-600',
      stats: '월간 급여 정산',
    },
    {
      id: 'company',
      title: '🏢 업체 정산',
      description: '가맹점의 월간 정산 현황과 매출액을 관리합니다',
      icon: '💼',
      href: '/admin/monthly-settlement',
      color: 'from-green-400 to-green-600',
      stats: '월간 수익 정산',
    },
    {
      id: 'guides',
      title: '📖 가이드 & 정책',
      description: '정산 규칙, 수수료, 정책 등을 확인합니다',
      icon: '📚',
      href: '/admin/guides',
      color: 'from-purple-400 to-purple-600',
      stats: '정산 규칙 및 안내',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">💰</div>
            <div>
              <h1 className="text-4xl font-bold">정산 관리</h1>
              <p className="text-blue-100 text-sm mt-1">테라피스트, 업체, 가이드 통합 정산 관리</p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto p-8">
        {/* 정산 카테고리 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {categories.map((category) => (
            <a
              key={category.id}
              href={category.href}
              className="group"
            >
              <div className={`bg-gradient-to-br ${category.color} rounded-2xl p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer h-full`}>
                {/* 아이콘 */}
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {category.icon}
                </div>

                {/* 제목 */}
                <h2 className="text-2xl font-bold mb-2 group-hover:translate-x-1 transition-transform">
                  {category.title}
                </h2>

                {/* 설명 */}
                <p className="text-sm text-white/90 mb-4 leading-relaxed">
                  {category.description}
                </p>

                {/* 통계 */}
                <div className="border-t border-white/30 pt-4 mt-4">
                  <p className="text-xs font-semibold text-white/70">
                    {category.stats}
                  </p>
                </div>

                {/* 화살표 */}
                <div className="mt-6 flex items-center gap-2 text-sm font-bold group-hover:gap-3 transition-all">
                  <span>이동</span>
                  <span className="text-lg">→</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* 정산 관련 정보 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>📋</span> 정산 안내
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 테라피스트 정산 안내 */}
            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
              <h3 className="font-bold text-gray-900 mb-3">테라피스트 정산</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• 월간 급여 현황 확인</li>
                <li>• 세션 수익 상세 조회</li>
                <li>• 수수료 계산 내역</li>
                <li>• 정산 예정 금액</li>
              </ul>
            </div>

            {/* 업체 정산 안내 */}
            <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
              <h3 className="font-bold text-gray-900 mb-3">업체 정산</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• 월간 매출 현황</li>
                <li>• 정산 상세 보고서</li>
                <li>• 수수료 및 수익</li>
                <li>• 거래 내역 조회</li>
              </ul>
            </div>

            {/* 정책 안내 */}
            <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-500">
              <h3 className="font-bold text-gray-900 mb-3">정책 & 가이드</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• 정산 규칙 및 기준</li>
                <li>• 수수료 체계</li>
                <li>• 정산 일정</li>
                <li>• FAQ & 문의</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 빠른 링크 */}
        <div className="mt-12 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-2xl p-8 border border-indigo-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🔗 빠른 접근</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a
              href="/"
              className="bg-white hover:bg-indigo-50 text-gray-900 hover:text-indigo-600 font-bold py-3 px-4 rounded-lg text-center transition-all hover:shadow-md"
            >
              🏠 홈
            </a>
            <a
              href="/monitor"
              className="bg-white hover:bg-indigo-50 text-gray-900 hover:text-indigo-600 font-bold py-3 px-4 rounded-lg text-center transition-all hover:shadow-md"
            >
              📊 모니터
            </a>
            <a
              href="/admin"
              className="bg-white hover:bg-indigo-50 text-gray-900 hover:text-indigo-600 font-bold py-3 px-4 rounded-lg text-center transition-all hover:shadow-md"
            >
              👥 어드민
            </a>
            <a
              href="/therapist-settlement"
              className="bg-white hover:bg-indigo-50 text-gray-900 hover:text-indigo-600 font-bold py-3 px-4 rounded-lg text-center transition-all hover:shadow-md"
            >
              💰 테라피스트
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
