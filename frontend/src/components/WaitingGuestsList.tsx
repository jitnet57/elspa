/**
 * 대기자 목록 패널
 * 모니터 페이지의 테라피스트 뷰에서 좌측에 표시
 */

interface WalkInGuest {
  id: string;
  queue_number: number;
  service_type: string;
  customer_name?: string;
  created_at: string;
  status: 'waiting' | 'assigned' | 'cancelled';
  assigned_therapist_id?: number;
}

interface WaitingGuestsListProps {
  walkInQueue: WalkInGuest[];
  therapists: Array<{ id: number; name: string }>;
  onCancel?: (guestId: string) => void;
  onDelete?: (guestId: string) => void;
  onAssign?: (guestId: string) => void;
}

export function WaitingGuestsList({
  walkInQueue,
  therapists,
  onCancel,
  onDelete,
  onAssign,
}: WaitingGuestsListProps) {
  const waitingGuests = walkInQueue.filter(g => g.status === 'waiting');
  const assignedGuests = walkInQueue.filter(g => g.status === 'assigned');

  const getTherapistName = (therapistId?: number) => {
    if (!therapistId) return '배정 대기';
    return therapists.find(t => t.id === therapistId)?.name || '알 수 없음';
  };

  const getServiceIcon = (serviceType: string) => {
    const icons: Record<string, string> = {
      swedish: '💆',
      thai: '🧘',
      hotstone: '🔥',
      foot: '🦶',
      aroma: '🌸',
    };
    return icons[serviceType.toLowerCase()] || '✋';
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 p-4 overflow-y-auto max-h-screen flex flex-col">
      {/* 헤더 */}
      <div className="mb-4 pb-4 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white mb-2">👥 대기 손님</h3>
        <div className="flex gap-2 text-xs">
          <div className="px-2 py-1 rounded bg-amber-600/30 text-amber-400">
            ⏳ 대기: <span className="font-bold">{waitingGuests.length}</span>명
          </div>
          <div className="px-2 py-1 rounded bg-purple-600/30 text-purple-400">
            ✓ 배정: <span className="font-bold">{assignedGuests.length}</span>명
          </div>
        </div>
      </div>

      {/* 대기 중인 손님 */}
      {waitingGuests.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          <h4 className="text-sm font-bold text-amber-400 mb-2">⏳ 대기 중</h4>
          {waitingGuests.map((guest) => (
            <div
              key={guest.id}
              className="bg-amber-900/20 border border-amber-700 rounded-lg p-3 hover:bg-amber-900/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm font-bold">
                    #{guest.queue_number}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{guest.customer_name || '손님'}</p>
                    <p className="text-xs text-amber-300">{formatTime(guest.created_at)} 등록</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-amber-200">
                  <span>{getServiceIcon(guest.service_type)}</span>
                  <span>{guest.service_type}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onAssign?.(guest.id)}
                    className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  >
                    배정
                  </button>
                  <button
                    onClick={() => onCancel?.(guest.id)}
                    className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center text-gray-400 mb-4">
          <div>
            <p className="text-lg mb-1">✨</p>
            <p className="text-sm">대기 손님이</p>
            <p className="text-sm">없습니다</p>
          </div>
        </div>
      )}

      {/* 배정된 손님 */}
      {assignedGuests.length > 0 && (
        <div className="pt-4 border-t border-gray-700">
          <h4 className="text-sm font-bold text-purple-400 mb-2">✓ 배정됨</h4>
          <div className="space-y-2">
            {assignedGuests.map((guest) => (
              <div
                key={guest.id}
                className="bg-purple-900/20 border border-purple-700 rounded-lg p-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-sm">#{guest.queue_number} {guest.customer_name || '손님'}</span>
                  <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">
                    {getTherapistName(guest.assigned_therapist_id)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-purple-300">
                    {getServiceIcon(guest.service_type)} {guest.service_type}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onCancel?.(guest.id)}
                      className="px-2 py-0.5 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => onDelete?.(guest.id)}
                      className="px-2 py-0.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
