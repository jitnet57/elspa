'use client';

import { useState } from 'react';

interface MatchingMode {
  id: string;
  name: string;
  description: string;
  formula: string;
  weights: Record<string, number>;
  useCase: string[];
  pros: string[];
  cons: string[];
  color: string;
  example?: {
    candidate: string;
    scores: Record<string, number>;
    total: number;
  }[];
}

const MATCHING_MODES: MatchingMode[] = [
  {
    id: 'basic',
    name: '기본 모드 (70/20/10)',
    description: '고객 만족도를 최우선으로 하는 전통적인 매칭 알고리즘',
    formula: '점수 = (전문성 × 70%) + (거리/시간 × 20%) + (평점 × 10%)',
    weights: {
      expertise: 70,
      distance: 20,
      rating: 10,
      fairness: 0,
    },
    useCase: [
      'VIP 고객 (재방문율 높음)',
      '특수 서비스 (커플 마사지, 맞춤 서비스)',
      '중요한 고객 만족도가 최우선',
    ],
    pros: [
      '✓ 최고의 테라피스트 무조건 배정',
      '✓ 고객 만족도 최대화',
      '✓ 서비스 품질 보장',
    ],
    cons: [
      '✗ 인기 테라피스트에게 일이 집중',
      '✗ 신입 테라피스트 기회 부족',
      '✗ 테라피스트 간 수익 불균형',
    ],
    color: 'bg-blue-50 border-blue-200',
    example: [
      {
        candidate: 'Jessica',
        scores: { expertise: 66.5, distance: 17, rating: 8.8 },
        total: 92.3,
      },
      {
        candidate: 'Sarah',
        scores: { expertise: 63, distance: 12, rating: 9.2 },
        total: 84.2,
      },
      {
        candidate: 'Emma',
        scores: { expertise: 59.5, distance: 14, rating: 8.5 },
        total: 82.0,
      },
    ],
  },
  {
    id: 'fairness',
    name: '공정성 모드 (40/20/10/30)',
    description: '테라피스트 간 업무 분배를 균등하게 하는 공정한 매칭',
    formula: '점수 = (전문성 × 40%) + (거리/시간 × 20%) + (평점 × 10%) + (업무분배도 × 30%)',
    weights: {
      expertise: 40,
      distance: 20,
      rating: 10,
      fairness: 30,
    },
    useCase: [
      '일반 시간대 (11:00~18:00)',
      '일상적인 예약',
      '테라피스트 간 일감 균등 분배 필요',
    ],
    pros: [
      '✓ 모든 테라피스트가 공평한 기회 제공',
      '✓ 신입 테라피스트도 배정 가능',
      '✓ 테라피스트 수익 균형 개선',
      '✓ 동기 부여 향상',
    ],
    cons: [
      '✗ 가끔 최적이 아닌 테라피스트 배정',
      '✗ 고객 만족도 미세하게 하락 가능',
    ],
    color: 'bg-green-50 border-green-200',
    example: [
      {
        candidate: 'Emma (1건만 받음)',
        scores: { expertise: 34, distance: 15, rating: 8.5, fairness: 28.5 },
        total: 86.0,
      },
      {
        candidate: 'Jessica (4건 받음)',
        scores: { expertise: 38, distance: 17, rating: 8.8, fairness: 6 },
        total: 69.8,
      },
    ],
  },
  {
    id: 'newtherapist',
    name: '신입 부스트 모드',
    description: '신입 테라피스트에게 경험 기회를 집중 제공',
    formula: '점수 = (기본 점수) + 신입 보너스(+20점)',
    weights: {
      expertise: 70,
      distance: 20,
      rating: 10,
      fairness: 0,
      newTherapistBonus: 20,
    },
    useCase: [
      '신입 테라피스트 육성 기간 (첫 6개월)',
      '신입에게 충분한 경험 제공 필요',
      '신입의 평점 구축 기간',
    ],
    pros: [
      '✓ 신입도 적극적으로 배정받음',
      '✓ 신입이 경험을 쌓을 기회 보장',
      '✓ 신입 평점 향상 가속화',
      '✓ 인력 교육 효율화',
    ],
    cons: [
      '✗ 임시방편으로 보일 수 있음',
      '✗ 일부 고객 만족도 저하 가능',
    ],
    color: 'bg-amber-50 border-amber-200',
    example: [
      {
        candidate: '이준호 (신입, 1개월)',
        scores: { expertise: 49, distance: 16, rating: 3.5, newTherapistBonus: 20 },
        total: 88.5,
      },
    ],
  },
  {
    id: 'hybrid',
    name: '혼합 모드 (시간대별 자동 전환)',
    description: '시간대와 상황에 따라 알고리즘을 자동으로 전환',
    formula: '상황에 따라 위 3가지 모드 자동 적용',
    weights: {
      expertise: 0,
      distance: 0,
      rating: 0,
      fairness: 0,
    },
    useCase: [
      '상황에 따라 유연한 운영 필요',
      '하루 종일 다양한 고객 타입 대응',
      '가장 현실적인 운영 방식',
    ],
    pros: [
      '✓ 최적의 유연성 제공',
      '✓ 시간대별 최적 전략 자동 적용',
      '✓ VIP/일반/신입 모두 대응 가능',
      '✓ 상황에 맞는 최고의 결정',
    ],
    cons: [
      '✗ 설정이 복잡할 수 있음',
      '✗ 관리자의 이해도 필요',
    ],
    color: 'bg-purple-50 border-purple-200',
  },
];

export default function PoliciesPage() {
  const [selectedMode, setSelectedMode] = useState<string>('basic');
  const selectedModeData = MATCHING_MODES.find(m => m.id === selectedMode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50 to-amber-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            📋 매칭 정책 관리
          </h1>
          <p className="text-lg text-gray-600 font-light">
            테라피스트 매칭 알고리즘 모드를 선택하고 현황을 모니터링하세요
          </p>
        </div>

        {/* 모드 선택 카드 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {MATCHING_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`p-6 rounded-xl border-2 transition-all text-left
                ${
                  selectedMode === mode.id
                    ? `${mode.color} border-current shadow-lg scale-105`
                    : 'bg-white border-stone-200 hover:border-orange-300'
                }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900">{mode.name}</h3>
                {selectedMode === mode.id && (
                  <span className="text-xl">✓</span>
                )}
              </div>
              <p className="text-xs text-gray-600 font-light">
                {mode.description.split(' ')[0]}
              </p>
            </button>
          ))}
        </div>

        {selectedModeData && (
          <>
            {/* 선택된 모드 상세 정보 */}
            <div className={`${selectedModeData.color} rounded-xl p-8 mb-8 border-2`}>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  {selectedModeData.name}
                </h2>
                <p className="text-lg text-gray-700 font-light mb-4">
                  {selectedModeData.description}
                </p>

                {/* 공식 */}
                <div className="bg-white/80 rounded-lg p-4 mb-6 border border-stone-200">
                  <p className="text-sm text-gray-600 font-light mb-2">📐 매칭 공식</p>
                  <p className="font-mono text-sm text-gray-900 font-semibold">
                    {selectedModeData.formula}
                  </p>
                </div>

                {/* 가중치 표시 */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  {Object.entries(selectedModeData.weights).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      expertise: '전문성',
                      distance: '거리/시간',
                      rating: '평점',
                      fairness: '공정성',
                      newTherapistBonus: '신입보너스',
                    };
                    return value > 0 ? (
                      <div key={key} className="bg-white/60 rounded-lg p-3 text-center border border-stone-200">
                        <p className="text-xs text-gray-600 font-light">{labels[key]}</p>
                        <p className="text-2xl font-bold text-orange-600">{value}%</p>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* 사용 시기 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 사용 시기 */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">📌 사용 시기</h3>
                  <ul className="space-y-2">
                    {selectedModeData.useCase.map((use, idx) => (
                      <li key={idx} className="text-sm text-gray-700 font-light flex gap-2">
                        <span className="text-orange-600">•</span>
                        {use}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 장점 */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">✅ 장점</h3>
                  <ul className="space-y-2">
                    {selectedModeData.pros.map((pro, idx) => (
                      <li key={idx} className="text-sm text-gray-700 font-light">
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 단점 */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">⚠️ 단점</h3>
                  <ul className="space-y-2">
                    {selectedModeData.cons.map((con, idx) => (
                      <li key={idx} className="text-sm text-gray-700 font-light">
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 예시 */}
            {selectedModeData.example && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100 mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  🎯 매칭 예시: 고객 "김민준" - 스웨디시 60분 예약
                </h3>

                <div className="space-y-4">
                  {selectedModeData.example.map((ex, idx) => (
                    <div
                      key={idx}
                      className={`p-6 rounded-lg border-2
                        ${idx === 0
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-stone-50 border-stone-200'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-bold text-lg text-gray-900">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {ex.candidate}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-orange-600">
                            {ex.total.toFixed(1)}점
                          </p>
                          <p className="text-xs text-gray-500">최종 점수</p>
                        </div>
                      </div>

                      {/* 점수 상세 */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {Object.entries(ex.scores).map(([key, score]) => {
                          const labels: Record<string, string> = {
                            expertise: '전문성',
                            distance: '거리/시간',
                            rating: '평점',
                            fairness: '공정성',
                            newTherapistBonus: '신입보너스',
                          };
                          return (
                            <div key={key} className="bg-white rounded p-3 text-center">
                              <p className="text-xs text-gray-600 font-light mb-1">
                                {labels[key]}
                              </p>
                              <p className="font-bold text-gray-900">{score}점</p>
                              <div className="w-full h-1.5 bg-stone-200 rounded-full mt-2">
                                <div
                                  className="h-full bg-orange-500 rounded-full"
                                  style={{ width: `${Math.min(score / 10, 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {idx === 0 && (
                        <div className="mt-4 pt-4 border-t border-yellow-200">
                          <p className="text-sm font-semibold text-yellow-900">
                            ✓ 이 테라피스트로 배정됨
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 혼합 모드 상세 */}
            {selectedMode === 'hybrid' && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  ⏰ 시간대별 자동 정책 전환
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      time: '08:00 - 11:00',
                      mode: '기본 모드 (70/20/10)',
                      reason: '이른 아침 고객: 최고의 서비스 제공',
                      icon: '🌅',
                    },
                    {
                      time: '11:00 - 13:00',
                      mode: '공정성 모드 (40/20/10/30)',
                      reason: '점심 피크타임: 모든 테라피스트에게 기회',
                      icon: '☀️',
                    },
                    {
                      time: '13:00 - 18:00',
                      mode: '혼합 모드',
                      reason: '일반 시간대: 상황에 따라 유연 조정',
                      icon: '🌤️',
                    },
                    {
                      time: '18:00 - 22:00',
                      mode: '신입 부스트 모드',
                      reason: '저녁: 신입 집중 육성',
                      icon: '🌙',
                    },
                  ].map((slot, idx) => (
                    <div key={idx} className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-600 font-light mb-1">
                            <span className="text-lg">{slot.icon}</span> {slot.time}
                          </p>
                          <p className="font-bold text-gray-900 mb-1">{slot.mode}</p>
                          <p className="text-sm text-gray-600 font-light">{slot.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 특수 상황 */}
                  <div className="mt-6 pt-6 border-t-2 border-stone-300">
                    <p className="font-bold text-gray-900 mb-4">🚨 특수 상황</p>
                    <div className="space-y-3">
                      {[
                        { condition: 'VIP 고객', action: '항상 기본 모드' },
                        { condition: '예약 부족', action: '공정성 모드로 강화' },
                        { condition: '신입 평점 < 4.0', action: '신입 부스트 자동 활성화' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="text-sm text-orange-600 font-bold">→</div>
                          <div>
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">{item.condition}:</span> {item.action}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 현재 정책 현황 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
            <p className="text-sm text-gray-600 font-light mb-2">현재 활성 모드</p>
            <p className="text-2xl font-bold text-orange-600 mb-4">
              {selectedModeData?.name.split('(')[0].trim()}
            </p>
            <button className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm">
              이 모드로 적용
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
            <p className="text-sm text-gray-600 font-light mb-2">오늘의 매칭 횟수</p>
            <p className="text-2xl font-bold text-blue-600 mb-4">24건</p>
            <p className="text-xs text-gray-500 font-light">지난 7일 평균: 21.3건</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
            <p className="text-sm text-gray-600 font-light mb-2">평균 고객 만족도</p>
            <p className="text-2xl font-bold text-green-600 mb-4">⭐ 4.7 / 5.0</p>
            <p className="text-xs text-gray-500 font-light">지난 7일 평균: 4.65</p>
          </div>
        </div>
      </div>
    </div>
  );
}
