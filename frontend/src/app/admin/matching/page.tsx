'use client';

import { useState, useEffect } from 'react';

interface Booking {
  id: number;
  customer_name: string;
  service_name: string;
  reserved_time: string;
  status: 'pending' | 'matched' | 'confirmed';
}

interface MatchingCandidate {
  id: number;
  name: string;
  score: number;
  specialty: string;
  status?: 'idle' | 'in_service' | 'resting';
}

interface Therapist {
  id: number;
  name: string;
  status: 'idle' | 'in_service' | 'resting' | 'off_duty';
  checked_in_at?: string;
  rating: number;
  specialty?: string;
  score?: number;
}

interface Notification {
  id: number;
  type: 'session_ending' | 'match_ready' | 'therapist_checkin' | 'wait_alert';
  message: string;
  therapist_name?: string;
  timestamp: Date;
  icon: string;
}

interface Selection {
  booking_id: number;
  therapist_id: number;
  selection_type: 'ai_recommended' | 'ai_alternative' | 'manual_override';
  selection_reason?: string;
}

// 더미 데이터
const mockBookings: Booking[] = [
  {
    id: 1,
    customer_name: '김민준',
    service_name: '스웨디시 60분',
    reserved_time: '14:30',
    status: 'pending',
  },
  {
    id: 2,
    customer_name: '이수연',
    service_name: '타이 마사지 90분',
    reserved_time: '15:00',
    status: 'pending',
  },
  {
    id: 3,
    customer_name: '정현준',
    service_name: '발마사지 30분',
    reserved_time: '15:30',
    status: 'pending',
  },
];

const mockTherapists: Therapist[] = [
  { id: 1, name: '박유진', status: 'in_service', rating: 4.9, specialty: '스웨디시 전문' },
  { id: 2, name: '최정은', status: 'in_service', rating: 4.7, specialty: '타이마사지 전문' },
  { id: 3, name: '이소영', status: 'idle', rating: 4.8, specialty: '핫스톤 전문' },
  { id: 4, name: '김태희', status: 'in_service', rating: 4.6, specialty: '발마사지 전문' },
  { id: 5, name: '강지연', status: 'resting', rating: 4.7, specialty: '아로마테라피' },
  { id: 6, name: '박민경', status: 'idle', rating: 4.8, specialty: '종합' },
];

const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'session_ending',
    message: '김태희 - 5분 후 종료 예정',
    therapist_name: '김태희',
    timestamp: new Date(),
    icon: '⚠️',
  },
  {
    id: 2,
    type: 'therapist_checkin',
    message: '이소영 테라피스트 체크인',
    therapist_name: '이소영',
    timestamp: new Date(Date.now() - 60000),
    icon: '✅',
  },
  {
    id: 3,
    type: 'wait_alert',
    message: '박지은 고객 14:30 예약',
    timestamp: new Date(Date.now() - 120000),
    icon: '📋',
  },
];

export default function MatchingPage() {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [therapists, setTherapists] = useState<Therapist[]>(mockTherapists);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [matchingResults, setMatchingResults] = useState<{ [key: number]: MatchingCandidate[] }>({});
  const [showingMatches, setShowingMatches] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState<'ai' | 'all_therapists' | 'policy_change'>('ai');
  const [selections, setSelections] = useState<Selection[]>([]);
  const [selectionReason, setSelectionReason] = useState<string>('');
  const [selectedPolicy, setSelectedPolicy] = useState<string>('balanced');

  const checkedInCount = therapists.filter(t => t.status !== 'off_duty').length;
  const idleCount = therapists.filter(t => t.status === 'idle').length;
  const inServiceCount = therapists.filter(t => t.status === 'in_service').length;
  const restingCount = therapists.filter(t => t.status === 'resting').length;

  // 매칭 시뮬레이션
  const handleMatching = (bookingId: number) => {
    const candidates: MatchingCandidate[] = [
      {
        id: 3,
        name: '이소영',
        score: 92,
        specialty: '핫스톤 전문',
        status: 'idle',
      },
      {
        id: 1,
        name: '박유진',
        score: 87,
        specialty: '스웨디시 전문',
        status: 'in_service',
      },
      {
        id: 6,
        name: '박민경',
        score: 81,
        specialty: '종합',
        status: 'idle',
      },
    ];

    setMatchingResults(prev => ({
      ...prev,
      [bookingId]: candidates,
    }));
    setShowingMatches(bookingId);
    setSelectionMode('ai');
    setSelectionReason('');

    // 예약 상태 업데이트
    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, status: 'matched' } : b))
    );
  };

  const handleSelectTherapist = (bookingId: number, therapistId: number, type: 'ai_recommended' | 'ai_alternative' | 'manual_override') => {
    // Selection 기록
    const selection: Selection = {
      booking_id: bookingId,
      therapist_id: therapistId,
      selection_type: type,
      selection_reason: type === 'manual_override' || type === 'ai_alternative' ? selectionReason : undefined,
    };

    setSelections(prev => [...prev, selection]);

    // 예약 상태 업데이트
    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, status: 'confirmed' } : b))
    );

    // 알림 추가
    const selectedTherapist = therapists.find(t => t.id === therapistId);
    const newNotification: Notification = {
      id: notifications.length + 1,
      type: 'match_ready',
      message: `${selectedTherapist?.name} → 예약 #${bookingId} 배정됨 (${type === 'ai_recommended' ? 'AI추천' : type === 'ai_alternative' ? 'AI대안' : '수동선택'})`,
      timestamp: new Date(),
      icon: '✓',
    };
    setNotifications(prev => [newNotification, ...prev]);

    setShowingMatches(null);
    setSelectionMode('ai');
    setSelectionReason('');
  };

  const handleRecalculateWithPolicy = (bookingId: number) => {
    const newCandidates: MatchingCandidate[] = [
      {
        id: 2,
        name: '최정은',
        score: 88,
        specialty: '타이마사지 전문',
        status: 'in_service',
      },
      {
        id: 5,
        name: '강지연',
        score: 84,
        specialty: '아로마테라피',
        status: 'resting',
      },
      {
        id: 4,
        name: '김태희',
        score: 79,
        specialty: '발마사지 전문',
        status: 'in_service',
      },
    ];

    setMatchingResults(prev => ({
      ...prev,
      [bookingId]: newCandidates,
    }));
    setSelectionMode('ai');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            실시간 매칭 제어판
          </h1>
          <p className="text-lg text-gray-600 font-light">
            AI가 제안한 테라피스트를 확인하고 배정하세요
          </p>
        </div>

        {/* 메인 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* 좌측: 대기 예약 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100 sticky top-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">대기 예약</h2>
                <p className="text-xs text-gray-500 mt-1 font-light">총 {bookings.length}건</p>
              </div>

              <div className="space-y-4">
                {bookings.map((booking, idx) => {
                  const statusLabel = {
                    pending: '매칭 대기',
                    matched: '매칭 제안',
                    confirmed: '확정됨',
                  };

                  const statusColor = {
                    pending: 'bg-red-100 text-red-700',
                    matched: 'bg-yellow-100 text-yellow-700',
                    confirmed: 'bg-green-100 text-green-700',
                  };

                  return (
                    <div
                      key={booking.id}
                      className="p-4 border border-stone-100 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{booking.customer_name}</p>
                          <p className="text-xs text-gray-500 font-light mt-0.5">
                            {booking.service_name}
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${statusColor[booking.status]}`}>
                          {statusLabel[booking.status]}
                        </span>
                      </div>

                      <p className="text-sm text-orange-600 font-semibold mb-3">
                        {booking.reserved_time}
                      </p>

                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleMatching(booking.id)}
                          className="w-full px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg font-semibold transition-all shadow-md text-sm"
                        >
                          🚀 매칭 실행
                        </button>
                      )}

                      {booking.status === 'confirmed' && (
                        <div className="text-xs text-green-600 font-semibold text-center">
                          ✓ 배정 완료
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 중앙: AI 매칭 제안 & 선택 옵션 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
              {showingMatches === null ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <div className="text-6xl mb-4">🎯</div>
                    <p className="text-gray-500 font-light">
                      왼쪽에서 예약을 선택하면<br />AI 매칭 제안이 표시됩니다
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectionMode === 'ai' ? 'AI 매칭 제안' : selectionMode === 'all_therapists' ? '전체 테라피스트' : '정책 변경'}
                  </h2>
                  <p className="text-xs text-gray-500 mb-6 font-light">
                    예약 #{showingMatches}
                  </p>

                  {/* AI 매칭 제안 모드 */}
                  {selectionMode === 'ai' && (
                    <>
                      <div className="space-y-3 mb-6">
                        {(matchingResults[showingMatches] || []).map((candidate, idx) => (
                          <div
                            key={candidate.id}
                            className={`p-4 rounded-lg border-2 transition-all
                              ${idx === 0
                                ? 'bg-yellow-50 border-yellow-500'
                                : 'bg-stone-50 border-stone-200 hover:border-orange-300'
                              }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`
                                    w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm
                                    ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-600'}
                                  `}>
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                  </span>
                                  <div>
                                    <p className="font-bold text-gray-900">{candidate.name}</p>
                                    <p className="text-xs text-gray-500 font-light">{candidate.specialty}</p>
                                  </div>
                                </div>
                              </div>
                              <span className={`text-2xl font-bold ${idx === 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
                                {candidate.score}
                              </span>
                            </div>

                            <button
                              onClick={() => handleSelectTherapist(showingMatches, candidate.id, idx === 0 ? 'ai_recommended' : 'ai_alternative')}
                              className={`w-full px-3 py-2 rounded-lg font-semibold transition-all text-sm
                                ${idx === 0
                                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg shadow-md'
                                  : 'bg-stone-100 text-gray-900 hover:bg-stone-200'
                                }`}
                            >
                              {idx === 0 ? '✓ 이 테라피스트 배정' : '선택'}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* 선택 옵션 */}
                      <div className="space-y-2 pt-4 border-t border-stone-200">
                        <button
                          onClick={() => setSelectionMode('all_therapists')}
                          className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-semibold transition-colors text-sm"
                        >
                          ⬇️ 모든 테라피스트 보기
                        </button>
                        <button
                          onClick={() => setSelectionMode('policy_change')}
                          className="w-full px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-semibold transition-colors text-sm"
                        >
                          🔧 정책 변경 후 재계산
                        </button>
                      </div>
                    </>
                  )}

                  {/* 전체 테라피스트 선택 모드 */}
                  {selectionMode === 'all_therapists' && (
                    <>
                      <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                        {therapists.map(therapist => (
                          <div key={therapist.id} className="p-3 rounded-lg border border-stone-200 hover:bg-orange-50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 text-sm">{therapist.name}</p>
                                <p className="text-xs text-gray-500">{therapist.specialty}</p>
                              </div>
                              <span className="text-xs font-bold text-orange-600">⭐ {therapist.rating}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className={`px-2 py-1 rounded text-white font-semibold
                                ${therapist.status === 'idle' ? 'bg-emerald-500' : therapist.status === 'in_service' ? 'bg-blue-500' : 'bg-gray-500'}`}>
                                {therapist.status === 'idle' ? '대기중' : therapist.status === 'in_service' ? '마사지중' : '휴식중'}
                              </span>
                              <button
                                onClick={() => {
                                  setSelectionReason('');
                                  handleSelectTherapist(showingMatches, therapist.id, 'manual_override');
                                }}
                                className="px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 text-xs font-semibold"
                              >
                                선택
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setSelectionMode('ai')}
                        className="w-full px-3 py-2 bg-stone-100 text-gray-900 rounded-lg hover:bg-stone-200 font-semibold transition-colors text-sm"
                      >
                        ← AI 제안으로 돌아가기
                      </button>
                    </>
                  )}

                  {/* 정책 변경 모드 */}
                  {selectionMode === 'policy_change' && (
                    <>
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900 font-light mb-4">정책을 선택하면 AI가 새로운 매칭 후보를 제시합니다</p>
                        <select
                          value={selectedPolicy}
                          onChange={(e) => setSelectedPolicy(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg font-semibold text-gray-900 text-sm mb-4"
                        >
                          <option value="balanced">균형 모드 (전문성 70% / 시간 20% / 평점 10%)</option>
                          <option value="fairness">공정성 모드 (전문성 40% / 시간 20% / 평점 10% / 공정성 30%)</option>
                          <option value="new_boost">신규 테라피스트 부스트 (신규 우대)</option>
                          <option value="availability">가용시간 우선 (빠른 배정)</option>
                        </select>
                        <button
                          onClick={() => {
                            handleRecalculateWithPolicy(showingMatches);
                          }}
                          className="w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg font-semibold transition-all shadow-md text-sm"
                        >
                          📊 정책으로 재계산
                        </button>
                      </div>
                      <button
                        onClick={() => setSelectionMode('ai')}
                        className="w-full px-3 py-2 bg-stone-100 text-gray-900 rounded-lg hover:bg-stone-200 font-semibold transition-colors text-sm"
                      >
                        ← AI 제안으로 돌아가기
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setShowingMatches(null)}
                    className="w-full mt-4 px-3 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-semibold transition-colors text-sm"
                  >
                    ✕ 닫기
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 우측: 출근 현황 & 알림 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 출근 현황 */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">오늘 출근 현황</h2>

              <div className="space-y-3">
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-xs text-gray-600 font-light mb-1">출근</p>
                  <p className="text-2xl font-bold text-gray-900">{checkedInCount}명</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-light mb-1">대기중</p>
                  <p className="text-2xl font-bold text-emerald-600">{idleCount}명</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-light mb-1">마사지중</p>
                  <p className="text-2xl font-bold text-blue-600">{inServiceCount}명</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 font-light mb-1">휴식중</p>
                  <p className="text-2xl font-bold text-gray-600">{restingCount}명</p>
                </div>
              </div>

              <button className="w-full mt-4 px-4 py-2 bg-stone-100 text-gray-900 rounded-lg hover:bg-stone-200 font-semibold transition-colors text-sm">
                📋 출근 관리
              </button>
            </div>

            {/* 알림 */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">알림</h2>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-500 font-light py-8">알림이 없습니다</p>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className="p-3 rounded-lg border border-stone-200 hover:bg-orange-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{notif.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 font-light">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notif.timestamp.toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 테라피스트 목록 */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">전체 테라피스트</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {therapists.map(therapist => {
              const statusColor = {
                idle: 'bg-emerald-100 border-emerald-500',
                in_service: 'bg-blue-100 border-blue-500',
                resting: 'bg-gray-100 border-gray-500',
                off_duty: 'bg-stone-100 border-stone-500',
              };

              const statusLabel = {
                idle: '대기중',
                in_service: '마사지중',
                resting: '휴식중',
                off_duty: '퇴근',
              };

              return (
                <div
                  key={therapist.id}
                  className={`p-4 rounded-lg border-2 text-center ${statusColor[therapist.status]}`}
                >
                  <p className="font-semibold text-gray-900">{therapist.name}</p>
                  <p className="text-xs text-gray-600 font-light mt-1">
                    {statusLabel[therapist.status]}
                  </p>
                  <p className="text-sm font-bold text-orange-600 mt-2">⭐ {therapist.rating.toFixed(1)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
