'use client';

import { useState } from 'react';

interface TherapistMetrics {
  id: number;
  name: string;
  rating: number;
  bookingsThisMonth: number;
  avgBookingsPerDay: number;
  totalEarningsMonth: number;
  fairnessScore: number; // 0-100
  workDistributionPercentage: number;
  onboardingMonths: number;
  status: 'active' | 'new' | 'senior';
  trend: 'up' | 'down' | 'stable';
}

const THERAPIST_DATA: TherapistMetrics[] = [
  {
    id: 1,
    name: 'Jessica',
    rating: 4.9,
    bookingsThisMonth: 45,
    avgBookingsPerDay: 1.5,
    totalEarningsMonth: 5000000,
    fairnessScore: 40, // 많이 받아서 낮음
    workDistributionPercentage: 180, // 기준의 180%
    onboardingMonths: 36,
    status: 'senior',
    trend: 'stable',
  },
  {
    id: 2,
    name: 'Sarah',
    rating: 4.8,
    bookingsThisMonth: 32,
    avgBookingsPerDay: 1.1,
    totalEarningsMonth: 3500000,
    fairnessScore: 65,
    workDistributionPercentage: 130,
    onboardingMonths: 24,
    status: 'active',
    trend: 'up',
  },
  {
    id: 3,
    name: 'Emma',
    rating: 4.6,
    bookingsThisMonth: 18,
    avgBookingsPerDay: 0.6,
    totalEarningsMonth: 2200000,
    fairnessScore: 82,
    workDistributionPercentage: 70,
    onboardingMonths: 18,
    status: 'active',
    trend: 'down',
  },
  {
    id: 4,
    name: '이준호',
    rating: 3.8,
    bookingsThisMonth: 12,
    avgBookingsPerDay: 0.4,
    totalEarningsMonth: 1500000,
    fairnessScore: 95,
    workDistributionPercentage: 45,
    onboardingMonths: 2,
    status: 'new',
    trend: 'up',
  },
  {
    id: 5,
    name: 'Amanda',
    rating: 4.7,
    bookingsThisMonth: 25,
    avgBookingsPerDay: 0.8,
    totalEarningsMonth: 2800000,
    fairnessScore: 75,
    workDistributionPercentage: 95,
    onboardingMonths: 12,
    status: 'active',
    trend: 'stable',
  },
];

const POLICY_MODES = [
  {
    name: '기본 모드 (70/20/10)',
    description: '고객 만족도 우선',
    impact: '평점 높은 테라피스트에게 유리',
  },
  {
    name: '공정성 모드 (40/20/10/30)',
    description: '공정한 일감 분배',
    impact: '모든 테라피스트에게 균등한 기회',
  },
  {
    name: '신입 부스트',
    description: '신입 집중 육성',
    impact: '신입에게 +20점 보너스',
  },
];

export default function TherapistFairnessPage() {
  const [selectedTherapist, setSelectedTherapist] = useState<number>(1);
  const [selectedMode, setSelectedMode] = useState<number>(0);
  const therapist = THERAPIST_DATA.find(t => t.id === selectedTherapist);

  const avgBookings = Math.round(
    THERAPIST_DATA.reduce((sum, t) => sum + t.bookingsThisMonth, 0) / THERAPIST_DATA.length
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            📊 테라피스트 공정성 대시보드
          </h1>
          <p className="text-lg text-gray-600 font-light">
            매칭 정책이 당신의 일감과 수익에 어떻게 영향을 미치는지 확인하세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* 좌측: 테라피스트 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">팀 현황</h2>

              <div className="space-y-3 mb-6">
                {THERAPIST_DATA.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTherapist(t.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left
                      ${
                        selectedTherapist === t.id
                          ? 'bg-emerald-50 border-emerald-500'
                          : 'bg-stone-50 border-stone-200 hover:border-emerald-300'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">{t.name}</p>
                      <span className="text-sm font-bold">
                        {t.status === 'senior' && '👑'}
                        {t.status === 'new' && '⭐'}
                        {t.status === 'active' && '✓'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-600">⭐ {t.rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-xs text-gray-600">{t.bookingsThisMonth}건</span>
                    </div>
                    <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          t.status === 'new' ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min((t.bookingsThisMonth / avgBookings) * 100, 100)}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>

              {/* 통계 요약 */}
              <div className="pt-6 border-t border-stone-200">
                <p className="text-sm text-gray-600 font-light mb-3">팀 통계</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">평균 일감 (월)</span>
                    <span className="text-sm font-semibold text-gray-900">{avgBookings}건</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">팀 규모</span>
                    <span className="text-sm font-semibold text-gray-900">{THERAPIST_DATA.length}명</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 중앙: 선택된 테라피스트 상세 정보 */}
          {therapist && (
            <div className="lg:col-span-2 space-y-6">
              {/* 프로필 */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{therapist.name}</h2>
                    <p className="text-gray-600 font-light">
                      경력: {therapist.onboardingMonths}개월
                      {therapist.status === 'new' && ' (신입 집중 육성 기간)'}
                      {therapist.status === 'senior' && ' (경력직)'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-emerald-600 mb-1">⭐ {therapist.rating.toFixed(1)}</p>
                    <p className="text-sm text-gray-600">평점</p>
                  </div>
                </div>

                {/* 공정성 점수 */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-6 mb-6 border border-emerald-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 font-light mb-1">공정성 점수</p>
                      <p className="text-4xl font-bold text-emerald-600">{therapist.fairnessScore}/100</p>
                    </div>
                    <div className="text-center">
                      <div className="text-6xl mb-2">
                        {therapist.fairnessScore >= 80 ? '✓' : therapist.fairnessScore >= 60 ? '◐' : '✗'}
                      </div>
                      <p className="text-xs text-gray-600 font-light">
                        {therapist.fairnessScore >= 80
                          ? '매우 공정함'
                          : therapist.fairnessScore >= 60
                          ? '공정함'
                          : '재검토 필요'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 font-light">
                    💡 이 점수는 팀 평균 대비 일감 분배의 공정성을 나타냅니다.
                    낮은 점수는 더 많은 일을 받았다는 뜻이므로,
                    공정성 모드에서는 다른 팀원에게 기회가 먼저 제공됩니다.
                  </p>
                </div>

                {/* 주요 메트릭스 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-stone-50 rounded-lg p-4 text-center border border-stone-200">
                    <p className="text-xs text-gray-600 font-light mb-2">이번 달 일감</p>
                    <p className="text-2xl font-bold text-gray-900">{therapist.bookingsThisMonth}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      평균 대비 {((therapist.bookingsThisMonth / avgBookings) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-stone-50 rounded-lg p-4 text-center border border-stone-200">
                    <p className="text-xs text-gray-600 font-light mb-2">일일 평균 일감</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {therapist.avgBookingsPerDay.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">건/일</p>
                  </div>
                  <div className="bg-stone-50 rounded-lg p-4 text-center border border-stone-200">
                    <p className="text-xs text-gray-600 font-light mb-2">예상 월 수익</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₱{(therapist.totalEarningsMonth / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-xs text-gray-600 mt-1">대략치</p>
                  </div>
                </div>
              </div>

              {/* 공정성 모드별 영향 분석 */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  📋 매칭 정책별 당신의 기회도
                </h3>

                <div className="space-y-4">
                  {POLICY_MODES.map((mode, idx) => {
                    const isNewTherapist = therapist.status === 'new';
                    let opportunity: number;

                    if (idx === 0) {
                      // 기본 모드: 평점에 따라
                      opportunity = (therapist.rating / 5) * 100;
                    } else if (idx === 1) {
                      // 공정성 모드: 공정성 점수에 따라
                      opportunity = therapist.fairnessScore;
                    } else {
                      // 신입 부스트: 신입이면 높음
                      opportunity = isNewTherapist ? 95 : (therapist.rating / 5) * 70;
                    }

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedMode(idx)}
                        className={`p-6 rounded-lg border-2 transition-all cursor-pointer
                          ${
                            selectedMode === idx
                              ? 'bg-emerald-50 border-emerald-500'
                              : 'bg-stone-50 border-stone-200 hover:border-emerald-300'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-gray-900">{mode.name}</p>
                            <p className="text-sm text-gray-600 font-light">{mode.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-emerald-600">
                              {opportunity.toFixed(0)}%
                            </p>
                            <p className="text-xs text-gray-600 font-light">기회도</p>
                          </div>
                        </div>

                        {/* 진행 바 */}
                        <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${opportunity}%` }}
                          />
                        </div>

                        {/* 설명 */}
                        <p className="text-xs text-gray-600 font-light mt-3">{mode.impact}</p>

                        {/* 신입 태그 */}
                        {isNewTherapist && idx === 2 && (
                          <div className="mt-3 p-2 bg-amber-100 rounded border border-amber-200">
                            <p className="text-xs font-semibold text-amber-900">
                              ⭐ 신입 보너스 +20점 적용됨!
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 공정성 이슈 및 해결책 */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🎯 공정성 정책이 해결하는 문제들
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 문제 1 */}
            <div className="p-6 bg-red-50 rounded-lg border-2 border-red-200">
              <h3 className="font-bold text-gray-900 mb-3">❌ 문제 1: 일감 집중</h3>
              <p className="text-sm text-gray-700 font-light mb-3">
                높은 평점의 테라피스트에게만 일이 몰려 수익 불균형 발생
              </p>
              <div className="bg-white rounded p-3 mb-3 text-xs text-gray-600">
                예) 평점 4.9: 월 5배 수익<br />
                &nbsp;&nbsp;&nbsp;&nbsp;평점 4.6: 월 1배 수익
              </div>
              <p className="text-sm font-bold text-red-700">해결책: 공정성 모드 (40/20/10/30)</p>
              <p className="text-xs text-gray-600 font-light mt-2">
                업무 분배도를 30% 가중치로 추가해 모든 사람에게 기회 제공
              </p>
            </div>

            {/* 문제 2 */}
            <div className="p-6 bg-amber-50 rounded-lg border-2 border-amber-200">
              <h3 className="font-bold text-gray-900 mb-3">❌ 문제 2: 신입 기회 부족</h3>
              <p className="text-sm text-gray-700 font-light mb-3">
                신입은 배정받지 못해 경험을 쌓을 수 없는 악순환
              </p>
              <div className="bg-white rounded p-3 mb-3 text-xs text-gray-600">
                낮은 평점 → 배정 안 됨 → 경험 부족<br/>
                → 평점 올라갈 수 없음 (악순환!)
              </div>
              <p className="text-sm font-bold text-amber-700">해결책: 신입 부스트 모드</p>
              <p className="text-xs text-gray-600 font-light mt-2">
                신입에게 +20점 보너스로 첫 6개월 집중 배정
              </p>
            </div>

            {/* 문제 3 */}
            <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <h3 className="font-bold text-gray-900 mb-3">❌ 문제 3: 과로 방지 부족</h3>
              <p className="text-sm text-gray-700 font-light mb-3">
                일감이 많은 사람은 과로, 적은 사람은 무료함
              </p>
              <div className="bg-white rounded p-3 mb-3 text-xs text-gray-600">
                일감 많음: 피로, 이직 위험<br/>
                일감 적음: 시간 낭비, 불만족
              </div>
              <p className="text-sm font-bold text-blue-700">해결책: 하드 리미트 규칙</p>
              <p className="text-xs text-gray-600 font-light mt-2">
                3시간 연속 작업 후 15분 강제 휴식<br/>
                하루 8시간 최대 근무 제한
              </p>
            </div>
          </div>
        </div>

        {/* 투명성 & 신뢰 */}
        <div className="mt-8 bg-emerald-50 rounded-xl p-8 border-2 border-emerald-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🤝 공정성 정책으로 모두가 승리합니다
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <p className="font-bold text-emerald-900 mb-2">고객 ✓</p>
              <p className="text-sm text-gray-700 font-light">
                기본 모드로 최고의 서비스 경험 보장
              </p>
            </div>
            <div>
              <p className="font-bold text-emerald-900 mb-2">테라피스트 ✓</p>
              <p className="text-sm text-gray-700 font-light">
                공정한 일감 분배와 동일한 수익 기회
              </p>
            </div>
            <div>
              <p className="font-bold text-emerald-900 mb-2">회사 ✓</p>
              <p className="text-sm text-gray-700 font-light">
                팀 전체의 만족도와 충성도 증가
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

