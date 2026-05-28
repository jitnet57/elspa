'use client';

import { therapyBeds, getBedsByRoom, type TherapyBed } from '@/app/admin/massage/mockData/bookingData';

/**
 * 📌 컴포넌트: BedLayoutView
 * 📋 목적: 30개 침대를 2개 마사지룸으로 분류하여 실시간 상태 표시
 * 🎨 레이아웃: 각 룸당 15개 침대, 5열 그리드
 * 📅 작성일: 2026-05-28
 */

export default function BedLayoutView() {
  const room1Beds = getBedsByRoom('room1');
  const room2Beds = getBedsByRoom('room2');

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
      {/* 마사지룸1 */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <span>🛏️ 마사지룸1</span>
          <span className="text-sm text-gray-400">({room1Beds.length}개 침대)</span>
        </h2>
        <div className="grid grid-cols-5 gap-3">
          {room1Beds.map(bed => (
            <BedCard key={bed.id} bed={bed} />
          ))}
        </div>
      </div>

      {/* 마사지룸2 */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <span>🛏️ 마사지룸2</span>
          <span className="text-sm text-gray-400">({room2Beds.length}개 침대)</span>
        </h2>
        <div className="grid grid-cols-5 gap-3">
          {room2Beds.map(bed => (
            <BedCard key={bed.id} bed={bed} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 📌 컴포넌트: BedCard
 * 📋 목적: 개별 침대 상태 카드 표시
 * 🎨 색상: available(초록), occupied(파랑), cleaning(황색), maintenance(회색)
 */
function BedCard({ bed }: { bed: TherapyBed }) {
  // 상태별 색상 매핑
  const statusColorMap: Record<string, string> = {
    available: 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30',
    occupied: 'bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30',
    cleaning: 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30',
    maintenance: 'bg-gray-500/20 border-gray-500/50 text-gray-400 hover:bg-gray-500/30',
  };

  const statusLabelMap: Record<string, string> = {
    available: '✅ 가능',
    occupied: '🔵 사용 중',
    cleaning: '🟡 청소 중',
    maintenance: '🔧 점검 중',
  };

  const typeColorMap: Record<string, string> = {
    massage: '💆 마사지',
    spa: '🌊 스파',
    facial: '✨ 페이셜',
    premium: '👑 프리미엄',
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 transition cursor-pointer ${statusColorMap[bed.status]} min-h-[160px] flex flex-col justify-between`}
    >
      {/* 침대 번호 */}
      <div>
        <div className="font-bold text-lg">{bed.name}</div>
        <div className="text-xs mt-1 opacity-70">{typeColorMap[bed.type]}</div>
      </div>

      {/* 상태 표시 */}
      <div>
        <div className="text-xs font-semibold mt-2">{statusLabelMap[bed.status]}</div>

        {/* 점유 시 세부 정보 */}
        {bed.status === 'occupied' && bed.therapistId && (
          <div className="text-xs mt-2 space-y-1 border-t border-current/20 pt-2 opacity-90">
            <div>테라: {bed.therapistId}</div>
            <div>{bed.serviceName}</div>
            <div className="font-bold text-green-300">종료: {bed.endTime}</div>
          </div>
        )}
      </div>
    </div>
  );
}
