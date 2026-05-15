'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store/store';

export function WalkInQueuePanel() {
  const { walkInQueue, removeFromQueue } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const waitingGuests = walkInQueue.filter(g => g.status === 'waiting');
  const assignedGuests = walkInQueue.filter(g => g.status === 'assigned');

  const handleRemove = (guestId: string) => {
    if (confirm('이 손님을 목록에서 제거하시겠습니까?')) {
      removeFromQueue(guestId);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-bold text-blue-400 mb-4">
        📋 워크인 대기 ({waitingGuests.length}명)
      </h3>

      {/* 대기 손님 목록 */}
      {waitingGuests.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">
          <div>👏 대기 손님이 없습니다</div>
          <div className="text-xs mt-2 text-gray-500">
            [+ 워크인 추가] 버튼으로 손님을 추가하세요
          </div>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {waitingGuests.map((guest, idx) => (
            <div
              key={guest.id}
              className="bg-gray-700 rounded p-3 cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={() =>
                setExpandedId(expandedId === guest.id ? null : guest.id)
              }
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-1">
                <div className="font-bold text-white">
                  #{guest.queue_number} {guest.customer_name || '손님'}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(guest.id);
                  }}
                  className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  title="제거"
                >
                  ✕
                </button>
              </div>

              {/* 기본 정보 */}
              <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
                <div>
                  💆 <span className="text-blue-300">{guest.service_type}</span>
                </div>
                <div className="text-yellow-300">
                  {new Date(guest.created_at).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {/* 확장된 상세 정보 */}
              {expandedId === guest.id && (
                <div className="border-t border-gray-600 mt-2 pt-2 text-xs text-gray-400 space-y-1">
                  {guest.requested_therapist_id && (
                    <div>
                      👤 선호 테라피스트: ID {guest.requested_therapist_id}
                    </div>
                  )}
                  <div>
                    ⏱️ 대기 시간:{' '}
                    {Math.round(
                      (Date.now() - new Date(guest.created_at).getTime()) / 60000
                    )}{' '}
                    분
                  </div>
                  <div>
                    상태:{' '}
                    <span className="text-yellow-300">
                      {guest.status === 'waiting' ? '🟡 대기중' : '🟢 배정됨'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 배정된 손님 섹션 */}
      {assignedGuests.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-green-400 mb-2 uppercase">
            ✅ 배정 완료 ({assignedGuests.length}명)
          </h4>
          <div className="space-y-1 text-xs">
            {assignedGuests.map(guest => (
              <div
                key={guest.id}
                className="bg-green-900/20 border border-green-700/30 rounded p-2 text-green-300"
              >
                <div className="flex justify-between items-center">
                  <div className="font-semibold">
                    #{guest.queue_number} {guest.customer_name || '손님'}
                  </div>
                  <button
                    onClick={() => handleRemove(guest.id)}
                    className="text-xs px-1 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
