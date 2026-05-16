'use client';

import { useState } from 'react';

export default function CustomerAboutMatchingPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: '왜 나는 Jessica이 아닌 다른 테라피스트가 배정되나요?',
      a: '우리는 모든 고객에게 최고의 경험을 제공하면서도, 모든 테라피스트에게 공평한 기회를 주기 위해 "공정성 모드"를 사용합니다. 이는 인기 테라피스트가 과로하지 않도록 보호하고, 덜 알려진 테라피스트가 경험을 쌓을 수 있도록 합니다. 당신이 받는 테라피스트도 높은 평점을 가지고 있으며, 당신의 서비스에 매우 열정적입니다.',
    },
    {
      q: '매칭은 어떻게 이루어지나요?',
      a: '우리의 AI 매칭 시스템은 다음을 고려합니다: (1) 서비스 전문성 (70%) - 당신이 원하는 서비스에 가장 적합한 사람, (2) 가용성 (20%) - 지금 바로 시작할 수 있는지, (3) 평점 (10%) - 고객 만족도. 또한 모든 테라피스트의 일감이 균형을 이루도록 하는 "공정성 점수"도 고려합니다.',
    },
    {
      q: '특정 테라피스트를 요청할 수 있나요?',
      a: '네, 특정 테라피스트를 선호하실 수 있습니다. 하지만 AI 시스템이 제안한 다른 테라피스트도 검토해주세요. 당신이 새로운 서비스나 스타일을 경험할 수 있는 좋은 기회가 될 수 있습니다. 우리는 모든 테라피스트를 신중하게 선발하고 교육합니다.',
    },
    {
      q: '대기 시간이 왜 가끔 길까요?',
      a: '대기 시간은 현재 출근한 테라피스트의 수와 예약 상황에 따라 달라집니다. 우리는 공정성 모드를 사용하여 모든 테라피스트가 과로하지 않도록 합니다. 이는 때때로 최고 인기 테라피스트가 다른 고객을 서비스 중일 수 있다는 뜻입니다. 대신, 당신은 나중에 그 테라피스트를 선택할 수 있습니다.',
    },
    {
      q: '내가 받는 평가는 다른 고객과 공평한가요?',
      a: '네, 완전히 공평합니다. 우리는 모든 테라피스트가 동일한 가이드라인과 서비스 기준을 따르도록 합니다. 평점 시스템은 모든 고객에게 공평하게 적용됩니다. 당신의 피드백은 매우 중요하며, 테라피스트의 개선에 도움이 됩니다.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-red-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 - 모바일 최적화 */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight">
            🤖 AI 매칭 시스템
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 font-light leading-relaxed">
            엘스파의 테라피스트 자동 매칭이 어떻게 작동하고, 왜 공평한지 설명합니다.
          </p>
        </div>

        {/* 핵심 개념 - 모바일 최적화 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 shadow-sm border border-stone-100 hover:shadow-md hover:scale-105 transition-all duration-300">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🎯</div>
            <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">고객 만족도</h3>
            <p className="text-xs sm:text-sm text-gray-700 font-light">
              당신의 요청 서비스에 가장 잘 맞는 테라피스트를 찾습니다.
            </p>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 shadow-sm border border-stone-100 hover:shadow-md hover:scale-105 transition-all duration-300">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">⚖️</div>
            <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">공정한 분배</h3>
            <p className="text-xs sm:text-sm text-gray-700 font-light">
              모든 팀원에게 일감을 공평하게 나눕니다.
            </p>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 shadow-sm border border-stone-100 hover:shadow-md hover:scale-105 transition-all duration-300">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🌟</div>
            <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">품질 보증</h3>
            <p className="text-xs sm:text-sm text-gray-700 font-light">
              높은 교육 수준을 유지합니다.
            </p>
          </div>
        </div>

        {/* 매칭 프로세스 - 모바일 최적화 */}
        <div className="bg-white rounded-2xl sm:rounded-xl p-6 sm:p-8 shadow-sm border border-stone-100 mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
            📋 예약 처리 과정
          </h2>

          <div className="space-y-4 sm:space-y-6">
            {[
              {
                step: 1,
                title: '예약 요청',
                description: '서비스, 시간, 선호도를 입력합니다.',
              },
              {
                step: 2,
                title: 'AI 분석',
                description:
                  '전문성, 가용성, 평점을 평가합니다.',
              },
              {
                step: 3,
                title: '상위 3명 추천',
                description:
                  '점수가 높은 3명의 후보를 봅니다.',
              },
              {
                step: 4,
                title: '최적 배정',
                description:
                  '최고 점수를 가진 테라피스트를 배정합니다.',
              },
              {
                step: 5,
                title: '확정 & 알림',
                description:
                  '예약 확정 후 알림이 전달됩니다.',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3 sm:gap-6">
                <div className="flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <span className="font-bold text-white text-sm sm:text-base">{item.step}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-700 font-light">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 매칭 점수 설명 */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-8 border-2 border-orange-200 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🏆 매칭 점수는 어떻게 계산되나요?
          </h2>

          <div className="space-y-6">
            {[
              {
                weight: 70,
                name: '전문성',
                icon: '🎓',
                description:
                  '당신이 요청한 서비스에 대한 테라피스트의 전문성과 경험. 예: 스웨디시 마사지를 원하면 스웨디시 전문가가 높은 점수를 받습니다.',
              },
              {
                weight: 20,
                name: '가용성',
                icon: '⏰',
                description:
                  '테라피스트가 얼마나 빨리 시작할 수 있는지. 지금 바로 가능하면 100점, 30분 후면 60점, 1시간 후면 20점입니다.',
              },
              {
                weight: 10,
                name: '평점',
                icon: '⭐',
                description:
                  '이전 고객들의 평가. 이는 테라피스트의 서비스 품질을 나타냅니다.',
              },
            ].map((component, idx) => (
              <div key={idx} className="p-6 bg-white rounded-lg border border-orange-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{component.icon}</span>
                    <div>
                      <p className="font-bold text-gray-900">{component.name}</p>
                      <p className="text-xs text-gray-600">가중치</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-orange-600">{component.weight}%</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 font-light">{component.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border border-orange-200">
            <p className="text-sm text-gray-900">
              <span className="font-bold">예시:</span> 스웨디시 마사지를 예약했을 때
            </p>
            <ul className="text-xs text-gray-700 font-light mt-3 space-y-1 ml-4">
              <li>🎓 스웨디시 전문가 점수 95점 × 70% = 66.5점</li>
              <li>⏰ 지금 시작 가능 점수 85점 × 20% = 17점</li>
              <li>⭐ 평점 4.8/5.0 점수 88점 × 10% = 8.8점</li>
              <li className="border-t border-stone-300 pt-1 mt-2 font-semibold">
                = 최종 점수 92.3점 ✓ (최고 추천!)
              </li>
            </ul>
          </div>
        </div>

        {/* 공정성 모드 설명 */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border-2 border-green-200 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ⚖️ "공정성 모드"는 무엇인가요?
          </h2>

          <p className="text-gray-700 font-light mb-6">
            우리는 고객 만족도와 테라피스트의 공정한 대우 사이의 균형을 맞추기 위해
            "공정성 모드"를 사용합니다.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-3">❌ 공정성 없음</h3>
              <div className="p-4 bg-white rounded-lg border border-red-200">
                <p className="text-sm text-gray-700 font-light mb-3">
                  인기 있는 테라피스트는:
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✗ 매일 8시간 이상 마사지</li>
                  <li>✗ 피로와 스트레스</li>
                  <li>✗ 이직 위험</li>
                  <li>✗ 서비스 품질 저하</li>
                </ul>

                <p className="text-sm text-gray-700 font-light mt-4 mb-3">
                  덜 알려진 테라피스트는:
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✗ 하루 2시간만 일함</li>
                  <li>✗ 경험 기회 부족</li>
                  <li>✗ 평점 향상 불가능</li>
                  <li>✗ 낮은 수익</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3">✓ 공정성 모드</h3>
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <p className="text-sm text-gray-700 font-light mb-3">
                  모든 테라피스트는:
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ 일감이 균형잡혀 있음</li>
                  <li>✓ 적절한 휴식 시간</li>
                  <li>✓ 공평한 수익 기회</li>
                  <li>✓ 높은 서비스 품질 유지</li>
                </ul>

                <p className="text-sm text-gray-700 font-light mt-4 mb-3">
                  모든 고객은:
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ 여전히 최고 품질 서비스</li>
                  <li>✓ 새로운 테라피스트 경험</li>
                  <li>✓ 다양한 스타일과 기법</li>
                  <li>✓ 예약 가능성 높음</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-green-900 mb-2">
              💡 쉽게 말해서:
            </p>
            <p className="text-sm text-gray-700 font-light">
              모든 테라피스트가 행복하고 건강하면, 모든 고객도 최고의 서비스를 받을 수 있습니다.
              우리는 장기적인 만족도와 지속 가능한 서비스를 추구합니다.
            </p>
          </div>
        </div>

        {/* FAQ - 모바일 최적화 */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            ❓ 자주 묻는 질문
          </h2>

          <div className="space-y-2 sm:space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg border border-stone-200 overflow-hidden hover:shadow-md transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-6 text-left hover:bg-stone-50 transition-colors flex items-start justify-between gap-3 sm:gap-4"
                >
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm">{faq.q}</p>
                  <span className={`text-lg flex-shrink-0 transition-transform ${
                    expandedFaq === idx ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </span>
                </button>

                {expandedFaq === idx && (
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-stone-50 border-t border-stone-200">
                    <p className="text-xs sm:text-sm text-gray-700 font-light leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 최종 메시지 */}
        <div className="bg-gradient-to-br from-pink-100 to-red-100 rounded-xl p-8 border-2 border-red-300 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            💝 당신의 만족도가 우리의 목표입니다
          </h2>
          <p className="text-gray-700 font-light mb-6">
            모든 테라피스트가 건강하고 행복할 때,
            <br />
            우리는 당신에게 최고의 서비스를 제공할 수 있습니다.
            <br />
            <br />
            질문이나 피드백이 있으신가요?
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
            고객 지원 문의하기
          </button>
        </div>
      </div>
    </div>
  );
}
