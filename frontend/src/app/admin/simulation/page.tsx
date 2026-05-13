'use client';

import { useState } from 'react';

interface MatchingCandidate {
  id: number;
  name: string;
  score: number;
  expertise: number;
  distance: number;
  rating: number;
  currentStatus: string;
  availableAt: string;
}

interface SimulationResult {
  candidates: MatchingCandidate[];
  estimatedStartTime: string;
  estimatedEndTime: string;
  selectedBed: string;
  waitingTime: string;
  message: string;
}

const SERVICES = [
  { id: 'swedish', name: '스웨디시 마사지', duration: 60 },
  { id: 'thai', name: '타이 마사지', duration: 90 },
  { id: 'hotstone', name: '핫스톤 테라피', duration: 60 },
  { id: 'foot', name: '발 마사지', duration: 30 },
  { id: 'aromatherapy', name: '아로마테라피', duration: 60 },
  { id: 'couple', name: '커플 패키지', duration: 120 },
];

const THERAPISTS = [
  { id: 1, name: '박유진', specialty: '스웨디시 전문' },
  { id: 2, name: '최정은', specialty: '타이 마사지' },
  { id: 3, name: '이소영', specialty: '핫스톤 테라피' },
  { id: 4, name: '김태희', specialty: '발 마사지' },
  { id: 5, name: '강지연', specialty: '아로마테라피' },
  { id: 6, name: '박민경', specialty: '종합' },
];

export default function SimulationPage() {
  const [serviceId, setServiceId] = useState('swedish');
  const [preferredTherapist, setPreferredTherapist] = useState('');
  const [timeOption, setTimeOption] = useState('now');
  const [customTime, setCustomTime] = useState('14:00');
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const selectedService = SERVICES.find(s => s.id === serviceId);

  const generateMockResult = (): SimulationResult => {
    const now = new Date();
    const waitMinutes = Math.floor(Math.random() * 45) + 5;
    const startTime = new Date(now.getTime() + waitMinutes * 60000);
    const endTime = new Date(startTime.getTime() + (selectedService?.duration || 60) * 60000);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }).replace(/:\d{2}$/, match => match);
    };

    const candidates: MatchingCandidate[] = [
      {
        id: 3,
        name: '이소영',
        score: 92,
        expertise: 95,
        distance: 85,
        rating: 88,
        currentStatus: '대기중 (idle)',
        availableAt: '즉시',
      },
      {
        id: 2,
        name: '최정은',
        score: 87,
        expertise: 88,
        distance: 78,
        rating: 85,
        currentStatus: '마사지중 (15분)',
        availableAt: '약 15분 후',
      },
      {
        id: 1,
        name: '박유진',
        score: 81,
        expertise: 90,
        distance: 72,
        rating: 92,
        currentStatus: '휴식중',
        availableAt: '약 5분 후',
      },
    ];

    return {
      candidates,
      estimatedStartTime: formatTime(startTime),
      estimatedEndTime: formatTime(endTime),
      selectedBed: 'B' + String(Math.floor(Math.random() * 40) + 1).padStart(2, '0'),
      waitingTime: `${waitMinutes}분`,
      message: `이소영 테라피스트가 현재 대기 중입니다. 즉시 매칭 가능합니다.`,
    };
  };

  const handleSimulate = () => {
    setSimulating(true);
    setTimeout(() => {
      setResult(generateMockResult());
      setSimulating(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            What-if 매칭 시뮬레이션
          </h1>
          <p className="text-lg text-gray-600 font-light">
            고객 조건을 입력하면 AI가 최적의 테라피스트를 추천합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 입력 영역 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">조건 설정</h2>

              {/* 서비스 선택 */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  📋 서비스 선택
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500 font-light"
                >
                  {SERVICES.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.duration}분)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2 font-light">
                  선택한 서비스: <span className="font-semibold">{selectedService?.duration}분</span>
                </p>
              </div>

              {/* 테라피스트 선호도 */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  👥 선호 테라피스트 (선택)
                </label>
                <select
                  value={preferredTherapist}
                  onChange={(e) => setPreferredTherapist(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500 font-light"
                >
                  <option value="">선호하는 테라피스트 없음</option>
                  {THERAPISTS.map(therapist => (
                    <option key={therapist.id} value={therapist.id.toString()}>
                      {therapist.name} - {therapist.specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* 시간 선택 */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  ⏰ 예약 시간
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="timeOption"
                      value="now"
                      checked={timeOption === 'now'}
                      onChange={(e) => setTimeOption(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm font-light text-gray-700">지금 (워크인 고객)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="timeOption"
                      value="custom"
                      checked={timeOption === 'custom'}
                      onChange={(e) => setTimeOption(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm font-light text-gray-700">특정 시간</span>
                  </label>
                </div>

                {timeOption === 'custom' && (
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500 font-light mt-3"
                  />
                )}
              </div>

              {/* 시뮬레이션 버튼 */}
              <button
                onClick={handleSimulate}
                disabled={simulating}
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md"
              >
                {simulating ? '🔄 시뮬레이션 중...' : '🚀 시뮬레이션 실행'}
              </button>

              {/* 안내 */}
              <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs font-bold text-orange-900 mb-1">💡 팁</p>
                <p className="text-xs text-orange-800 font-light">
                  시뮬레이션 결과는 DB에 반영되지 않습니다. 순수 조회 목적입니다.
                </p>
              </div>
            </div>
          </div>

          {/* 결과 영역 */}
          <div className="lg:col-span-2">
            {!result ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-stone-100 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-gray-500 font-light text-lg">
                    조건을 설정하고 "시뮬레이션 실행" 버튼을 클릭하세요.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 요약 정보 */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-gray-500 font-light mb-1">서비스</p>
                      <p className="text-lg font-bold text-gray-900">{selectedService?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-light mb-1">예상 대기 시간</p>
                      <p className="text-lg font-bold text-orange-600">{result.waitingTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-light mb-1">예상 시작 시간</p>
                      <p className="text-lg font-bold text-gray-900">{result.estimatedStartTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-light mb-1">예상 종료 시간</p>
                      <p className="text-lg font-bold text-gray-900">{result.estimatedEndTime}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 font-light mb-1">배정 침대</p>
                      <p className="text-2xl font-bold text-blue-600">{result.selectedBed}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900 font-light">{result.message}</p>
                  </div>
                </div>

                {/* 추천 테라피스트들 */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">🏆 AI 추천 테라피스트</h3>

                  {result.candidates.map((candidate, idx) => (
                    <div key={candidate.id} className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-all">
                      {/* 순위 배지 */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                              ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-700'}
                            `}>
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                            </div>
                            <div>
                              <p className="text-xl font-bold text-gray-900">{candidate.name}</p>
                              <p className="text-xs text-gray-500 font-light">{THERAPISTS.find(t => t.id === candidate.id)?.specialty}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-orange-600">{candidate.score}</div>
                          <p className="text-xs text-gray-500">매칭점수</p>
                        </div>
                      </div>

                      {/* 점수 세분화 */}
                      <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600 font-light mb-1">전문성</p>
                          <div className="flex items-end gap-1">
                            <span className="text-lg font-bold text-gray-900">{candidate.expertise}</span>
                            <span className="text-xs text-gray-500">/ 100</span>
                          </div>
                          <div className="w-full h-1 bg-stone-200 rounded-full mt-1">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${candidate.expertise}%` }} />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-light mb-1">거리/시간</p>
                          <div className="flex items-end gap-1">
                            <span className="text-lg font-bold text-gray-900">{candidate.distance}</span>
                            <span className="text-xs text-gray-500">/ 100</span>
                          </div>
                          <div className="w-full h-1 bg-stone-200 rounded-full mt-1">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${candidate.distance}%` }} />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-light mb-1">평점</p>
                          <div className="flex items-end gap-1">
                            <span className="text-lg font-bold text-gray-900">{candidate.rating}</span>
                            <span className="text-xs text-gray-500">/ 100</span>
                          </div>
                          <div className="w-full h-1 bg-stone-200 rounded-full mt-1">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${candidate.rating}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* 현재 상태 */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-900 font-light">
                            현재: <span className="font-semibold">{candidate.currentStatus}</span>
                          </p>
                          <p className="text-sm text-orange-600 font-light">
                            가용: <span className="font-semibold">{candidate.availableAt}</span>
                          </p>
                        </div>

                        {idx === 0 && (
                          <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg font-semibold transition-all shadow-md text-sm">
                            ✓ 이 테라피스트 배정
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 다시 시뮬레이션 */}
                <button
                  onClick={() => setResult(null)}
                  className="w-full px-6 py-3 bg-stone-100 text-gray-900 rounded-lg hover:bg-stone-200 font-semibold transition-colors"
                >
                  ← 조건 다시 설정
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
