/**
 * 테라피스트별 예약자 리스트 패널
 * 모니터 페이지의 우측에 표시
 */

import { Therapist } from '@/lib/store/types';

interface Booking {
  id: number;
  customer_name: string;
  service_type: string;
  scheduled_at: string;
  status: string;
  therapist_name?: string;
}

interface ReservationPanelProps {
  selectedTherapistId: number | null;
  therapists: Therapist[];
  bookings: Booking[];
}

export function TherapistReservationPanel({
  selectedTherapistId,
  therapists,
  bookings,
}: ReservationPanelProps) {
  const selectedTherapist = therapists.find(t => t.id === selectedTherapistId);

  if (!selectedTherapist) {
    return (
      <div className="w-80 bg-gray-900 border-l border-gray-700 p-4 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-bold mb-2">👤</p>
          <p>테라피스트를 선택해주세요</p>
        </div>
      </div>
    );
  }

  // 선택된 테라피스트의 예약만 필터링
  const therapistBookings = bookings.filter(
    b => b.therapist_name === selectedTherapist.name
  );

  // 상태별로 정렬 (confirmed > matched > requested)
  const sortedBookings = [...therapistBookings].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      confirmed: 0,
      matched: 1,
      requested: 2,
      completed: 3,
    };
    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { label: '확정', color: 'bg-green-600 text-white', icon: '✓' };
      case 'matched':
        return { label: '매칭', color: 'bg-blue-600 text-white', icon: '◆' };
      case 'requested':
        return { label: '요청', color: 'bg-yellow-600 text-white', icon: '◉' };
      case 'completed':
        return { label: '완료', color: 'bg-gray-600 text-white', icon: '◎' };
      default:
        return { label: status, color: 'bg-gray-600 text-white', icon: '○' };
    }
  };

  const getServiceIcon = (serviceType: string) => {
    const icons: Record<string, string> = {
      swedish: '💆',
      thai: '🧘',
      hotstone: '🔥',
      foot: '🦶',
      aroma: '🌸',
    };
    return icons[serviceType] || '✋';
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-96 bg-gray-900 border-l border-gray-700 p-4 overflow-y-auto max-h-screen flex flex-col">
      {/* 헤더 */}
      <div className="mb-4 pb-4 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-2xl">💆</div>
          <div>
            <h3 className="text-lg font-bold text-white">{selectedTherapist.name}</h3>
            <p className="text-xs text-gray-400">{selectedTherapist.specialty}</p>
          </div>
        </div>

        {/* 상태 배지 */}
        <div className="flex gap-2 items-center mt-2">
          <div className={`px-2 py-1 rounded text-xs font-bold ${getStatusBadge(selectedTherapist.status).color}`}>
            {getStatusBadge(selectedTherapist.status).icon} {getStatusBadge(selectedTherapist.status).label}
          </div>
          {selectedTherapist.remaining_minutes && selectedTherapist.status === 'in_service' && (
            <div className="px-2 py-1 rounded text-xs font-bold bg-blue-600 text-white">
              ⏱ {selectedTherapist.remaining_minutes}분 남음
            </div>
          )}
        </div>

        {/* 예약 수 */}
        <div className="mt-2 text-sm text-gray-400">
          <span className="font-bold text-white">{sortedBookings.length}</span>건의 예약
        </div>
      </div>

      {/* 예약 리스트 */}
      {sortedBookings.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-2">
          {sortedBookings.map((booking, idx) => {
            const statusBadge = getStatusBadge(booking.status);
            return (
              <div
                key={booking.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-gray-500 transition-colors"
              >
                {/* 순번 + 예약번호 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                      #{idx + 1}
                    </div>
                    <span className="text-xs text-gray-500">예약 ID: {booking.id}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${statusBadge.color}`}>
                    {statusBadge.icon} {statusBadge.label}
                  </span>
                </div>

                {/* 고객명 + 서비스 */}
                <div className="mb-2">
                  <p className="font-bold text-white text-sm">{booking.customer_name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {getServiceIcon(booking.service_type)} {booking.service_type}
                  </p>
                </div>

                {/* 예약 시간 */}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-700">
                  <span>{formatDate(booking.scheduled_at)}</span>
                  <span className="font-mono font-bold text-blue-400">{formatTime(booking.scheduled_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center text-gray-500">
          <div>
            <p className="text-lg mb-1">📋</p>
            <p className="text-sm">이 테라피스트의</p>
            <p className="text-sm">예약이 없습니다</p>
          </div>
        </div>
      )}

      {/* 요약 */}
      <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>확정 예약:</span>
          <span className="text-green-400 font-bold">
            {sortedBookings.filter(b => b.status === 'confirmed').length}건
          </span>
        </div>
        <div className="flex justify-between">
          <span>매칭 대기:</span>
          <span className="text-blue-400 font-bold">
            {sortedBookings.filter(b => b.status === 'matched').length}건
          </span>
        </div>
        <div className="flex justify-between">
          <span>요청 중:</span>
          <span className="text-yellow-400 font-bold">
            {sortedBookings.filter(b => b.status === 'requested').length}건
          </span>
        </div>
      </div>
    </div>
  );
}
