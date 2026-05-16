'use client';

import { useState } from 'react';

interface TherapistFairnessData {
  name: string;
  rating: number;
  bookingsToday: number;
  bookingsWeek: number;
  bookingsMonth: number;
  hoursWorkedToday: number;
  hoursWorkedWeek: number;
  fairnessScore: number;
  workloadPercentage: number;
  restMinutesToday: number;
  earningsMonth: number;
  status: 'ideal' | 'overloaded' | 'underutilized' | 'new';
}

const THERAPIST_FAIRNESS: TherapistFairnessData[] = [
  {
    name: 'Jessica',
    rating: 4.9,
    bookingsToday: 4,
    bookingsWeek: 18,
    bookingsMonth: 45,
    hoursWorkedToday: 7.5,
    hoursWorkedWeek: 32,
    fairnessScore: 35,
    workloadPercentage: 180,
    restMinutesToday: 45,
    earningsMonth: 5000000,
    status: 'overloaded',
  },
  {
    name: 'Sarah',
    rating: 4.8,
    bookingsToday: 2,
    bookingsWeek: 10,
    bookingsMonth: 32,
    hoursWorkedToday: 5.0,
    hoursWorkedWeek: 24,
    fairnessScore: 65,
    workloadPercentage: 130,
    restMinutesToday: 90,
    earningsMonth: 3500000,
    status: 'ideal',
  },
  {
    name: 'Emma',
    rating: 4.6,
    bookingsToday: 1,
    bookingsWeek: 5,
    bookingsMonth: 18,
    hoursWorkedToday: 2.5,
    hoursWorkedWeek: 12,
    fairnessScore: 82,
    workloadPercentage: 70,
    restMinutesToday: 210,
    earningsMonth: 2200000,
    status: 'underutilized',
  },
  {
    name: '이준호',
    rating: 3.8,
    bookingsToday: 2,
    bookingsWeek: 8,
    bookingsMonth: 12,
    hoursWorkedToday: 4.0,
    hoursWorkedWeek: 16,
    fairnessScore: 90,
    workloadPercentage: 45,
    restMinutesToday: 150,
    earningsMonth: 1500000,
    status: 'new',
  },
  {
    name: 'Amanda',
    rating: 4.7,
    bookingsToday: 3,
    bookingsWeek: 12,
    bookingsMonth: 25,
    hoursWorkedToday: 6.0,
    hoursWorkedWeek: 28,
    fairnessScore: 75,
    workloadPercentage: 95,
    restMinutesToday: 120,
    earningsMonth: 2800000,
    status: 'ideal',
  },
];

const FAIRNESS_POLICY_RULES = [
  {
    rule: '3시간 연속 근무 제한',
    description: '3시간 연속으로 일한 후 15분 강제 휴식',
    frequency: '매시간 체크',
    status: '✓ 시행 중',
  },
  {
    rule: '8시간 일일 최대',
    description: '하루 8시간 이상 근무 금지',
    frequency: '일일 체크',
    status: '✓ 시행 중',
  },
  {
    rule: '공평한 일감 분배',
    description: '평균 대비 편차 ±20% 범위 유지',
    frequency: '실시간 체크',
    status: '⚠️ 모니터링',
  },
  {
    rule: '신입 기회 보장',
    description: '신입 테라피스트 월 최소 15건 배정',
    frequency: '월간 체크',
    status: '✓ 달성',
  },
];

export default function FairnessDashboardPage() {
  const [selectedMetric, setSelectedMetric] = useState<'bookings' | 'fairness' | 'earnings'>('bookings');
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('month');

  const avgBookings = Math.round(
    THERAPIST_FAIRNESS.reduce((sum, t) => {
      if (selectedPeriod === 'day') return sum + t.bookingsToday;
      if (selectedPeriod === 'week') return sum + t.bookingsWeek;
      return sum + t.bookingsMonth;
    }, 0) / THERAPIST_FAIRNESS.length
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ideal':
        return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      case 'overloaded':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'underutilized':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'new':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-stone-50 border-stone-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ideal':
        return '✓ 적정';
      case 'overloaded':
        return '⚠️ 과로';
      case 'underutilized':
        return '◐ 저활용';
      case 'new':
        return '⭐ 신입';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            📊 공정성 모니터링 대시보드
          </h1>
          <p className="text-lg text-gray-600 font-light">
            테라피스트 팀의 공정한 일감 분배와 건강 상태를 실시간으로 모니터링합니다
          </p>
        </div>

        {/* 필터 & 통계 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {/* 기간 선택 */}
          <div className="bg-white rounded-xl p-4 border border-stone-200">
            <p className="text-xs text-gray-600 font-light mb-3">기간</p>
            <div className="space-y-2">
              {[
                { id: 'day', label: '오늘' },
                { id: 'week', label: '이번 주' },
                { id: 'month', label: '이번 달' },
              ].map(period => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id as any)}
                  className={`w-full px-3 py-2 rounded text-sm font-semibold transition-all ${
                    selectedPeriod === period.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-stone-100 text-gray-700 hover:bg-stone-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* 메트릭 선택 */}
          <div className="bg-white rounded-xl p-4 border border-stone-200 lg:col-span-3">
            <p className="text-xs text-gray-600 font-light mb-3">분석 메트릭</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bookings', label: '📋 일감 분배' },
                { id: 'fairness', label: '⚖️ 공정성 점수' },
                { id: 'earnings', label: '💰 수익' },
              ].map(metric => (
                <button
                  key={metric.id}
                  onClick={() => setSelectedMetric(metric.id as any)}
                  className={`px-4 py-2 rounded text-sm font-semibold transition-all ${
                    selectedMetric === metric.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-stone-100 text-gray-700 hover:bg-stone-200'
                  }`}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 메인 분석 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {/* 팀 통계 */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
              <p className="text-xs text-gray-600 font-light mb-2">평균 일감 (현재 기간)</p>
              <p className="text-3xl font-bold text-blue-600 mb-2">{avgBookings}</p>
              <p className="text-xs text-gray-600 font-light">예약 건수</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
              <p className="text-xs text-gray-600 font-light mb-2">팀 크기</p>
              <p className="text-3xl font-bold text-emerald-600 mb-2">{THERAPIST_FAIRNESS.length}</p>
              <p className="text-xs text-gray-600 font-light">명의 테라피스트</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
              <p className="text-xs text-gray-600 font-light mb-2">공정성 평가</p>
              <p className="text-3xl font-bold text-purple-600 mb-2">
                {(
                  THERAPIST_FAIRNESS.reduce((sum, t) => sum + t.fairnessScore, 0) /
                  THERAPIST_FAIRNESS.length
                ).toFixed(1)}
              </p>
              <p className="text-xs text-gray-600 font-light">/ 100점</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
              <p className="text-sm font-bold text-emerald-900 mb-2">✓ 상태: 정상</p>
              <p className="text-xs text-emerald-800 font-light">
                모든 규칙이 준수 중이며 팀이 건강합니다.
              </p>
            </div>
          </div>

          {/* 테라피스트 순위 */}
          <div className="lg:col-span-3 bg-white rounded-xl p-8 shadow-sm border border-stone-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedMetric === 'bookings' && '📋 일감 분배 현황'}
              {selectedMetric === 'fairness' && '⚖️ 공정성 순위'}
              {selectedMetric === 'earnings' && '💰 수익 분포'}
            </h2>

            <div className="space-y-4">
              {THERAPIST_FAIRNESS.map((therapist, idx) => {
                let value: number;
                let maxValue: number;
                let color: string;

                if (selectedMetric === 'bookings') {
                  if (selectedPeriod === 'day') {
                    value = therapist.bookingsToday;
                    maxValue = Math.max(...THERAPIST_FAIRNESS.map(t => t.bookingsToday));
                  } else if (selectedPeriod === 'week') {
                    value = therapist.bookingsWeek;
                    maxValue = Math.max(...THERAPIST_FAIRNESS.map(t => t.bookingsWeek));
                  } else {
                    value = therapist.bookingsMonth;
                    maxValue = Math.max(...THERAPIST_FAIRNESS.map(t => t.bookingsMonth));
                  }
                  color = 'bg-blue-500';
                } else if (selectedMetric === 'fairness') {
                  value = therapist.fairnessScore;
                  maxValue = 100;
                  color = 'bg-emerald-500';
                } else {
                  value = therapist.earningsMonth / 1000000;
                  maxValue = Math.max(...THERAPIST_FAIRNESS.map(t => t.earningsMonth / 1000000));
                  color = 'bg-purple-500';
                }

                const percentage = (value / maxValue) * 100;

                return (
                  <div
                    key={therapist.name}
                    className={`p-4 rounded-lg border-2 ${getStatusColor(therapist.status)}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-sm">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '•'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{therapist.name}</p>
                          <p className="text-xs font-semibold">
                            {getStatusLabel(therapist.status)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">
                          {selectedMetric === 'bookings' && `${value}건`}
                          {selectedMetric === 'fairness' && `${value.toFixed(0)}/100`}
                          {selectedMetric === 'earnings' && `₱${value.toFixed(1)}M`}
                        </p>
                        <p className="text-xs text-gray-600">
                          ⭐ {therapist.rating.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-semibold w-12 text-right">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 공정성 규칙 모니터링 */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🛡️ 공정성 규칙 준수 현황
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {FAIRNESS_POLICY_RULES.map((rule, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-lg border-2 ${
                  rule.status.includes('✓')
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <p className="font-bold text-gray-900 mb-2">{rule.rule}</p>
                <p className="text-xs text-gray-600 font-light mb-3">{rule.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">{rule.frequency}</p>
                  <span className="text-sm font-bold">{rule.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 주의 항목 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 과로 경보 */}
          <div className="bg-red-50 rounded-xl p-8 border-2 border-red-200">
            <h3 className="text-xl font-bold text-red-900 mb-4">⚠️ 과로 경보</h3>
            <div className="space-y-3">
              {THERAPIST_FAIRNESS.filter(t => t.status === 'overloaded').map(therapist => (
                <div key={therapist.name} className="bg-white rounded-lg p-4 border border-red-200">
                  <p className="font-bold text-gray-900 mb-1">{therapist.name}</p>
                  <p className="text-xs text-gray-600 font-light mb-2">
                    오늘 {therapist.hoursWorkedToday}시간 근무 | 휴식 {therapist.restMinutesToday}분
                  </p>
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600">
                      강제 휴식 지정
                    </button>
                    <button className="flex-1 px-3 py-2 bg-stone-200 text-gray-900 rounded text-xs font-semibold hover:bg-stone-300">
                      상담
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 저활용 & 신입 */}
          <div className="bg-blue-50 rounded-xl p-8 border-2 border-blue-200">
            <h3 className="text-xl font-bold text-blue-900 mb-4">💡 육성 & 활용</h3>
            <div className="space-y-3">
              {THERAPIST_FAIRNESS.filter(t =>
                t.status === 'underutilized' || t.status === 'new'
              ).map(therapist => (
                <div key={therapist.name} className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="font-bold text-gray-900 mb-1">{therapist.name}</p>
                  <p className="text-xs text-gray-600 font-light mb-2">
                    {therapist.status === 'new' ? '신입 (신입 부스트 모드)' : '저활용 (더 많은 기회 제공 필요)'}
                  </p>
                  <button className="w-full px-3 py-2 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600">
                    다음 예약 우선 배정
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 정책 설명 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📚 공정성 정책의 목표
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <p className="font-bold text-blue-900 mb-2">고객 만족도 ✓</p>
              <p className="text-sm text-gray-700 font-light">
                기본 모드로 최고 품질의 서비스 제공. 모든 테라피스트는 충분히 휴식하고 있어 서비스 품질 보장.
              </p>
            </div>
            <div>
              <p className="font-bold text-purple-900 mb-2">테라피스트 건강 ✓</p>
              <p className="text-sm text-gray-700 font-light">
                3시간 연속근무 제한, 8시간 일일 최대 규칙으로 피로도 관리. 모두가 동등한 기회와 수익 제공.
              </p>
            </div>
            <div>
              <p className="font-bold text-blue-900 mb-2">회사 지속성 ✓</p>
              <p className="text-sm text-gray-700 font-light">
                인력 이직률 감소, 신입 성장, 팀 응집력 강화. 장기적 성공을 위한 투자.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

