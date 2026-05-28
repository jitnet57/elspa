'use client';

import { therapyBeds, getBedsByRoom, type TherapyBed } from '@/app/admin/massage/mockData/bookingData';

/**
 * 📌 컴포넌트: BedLayoutView
 * 📋 목적: 86개 침대를 4개 마사지룸으로 분류하여 실시간 상태 표시
 * 🎨 레이아웃: 마사지실1(30), 마사지실2(30), VIP실(14), 기타실(12) - 10열 그리드
 * 📅 작성일: 2026-05-28
 */

export default function BedLayoutView() {
  const room1Beds = getBedsByRoom('room1');
  const room2Beds = getBedsByRoom('room2');
  const room3Beds = getBedsByRoom('room3');
  const room4Beds = getBedsByRoom('room4');

  const rooms = [
    { id: 'room1', name: '마사지룸1', beds: room1Beds },
    { id: 'room2', name: '마사지룸2', beds: room2Beds },
    { id: 'room3', name: 'VIP실', beds: room3Beds },
    { id: 'room4', name: '기타실', beds: room4Beds },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
      {rooms.map(room => (
        <div key={room.id}>
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            {room.name} ({room.beds.length})
          </h2>
          <div className="grid grid-cols-10 gap-2">
            {room.beds.map(bed => (
              <BedCard key={bed.id} bed={bed} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 📌 컴포넌트: BedCard
 * 📋 목적: 개별 침대 상태 카드 표시
 * 🎨 색상: available(초록), occupied(파랑), cleaning(황색), maintenance(회색)
 */
function BedCard({ bed }: { bed: TherapyBed }) {
  const statusColorMap: Record<string, string> = {
    available: 'bg-green-500 text-white hover:bg-green-600',
    occupied: 'bg-blue-500 text-white hover:bg-blue-600',
    cleaning: 'bg-amber-500 text-white hover:bg-amber-600',
    maintenance: 'bg-gray-500 text-white hover:bg-gray-600',
  };

  const typeMap: Record<string, string> = {
    massage: 'Massage',
    spa: 'Spa',
    facial: 'Facial',
    premium: 'Premium',
  };

  return (
    <div
      className={`px-2 py-2 rounded font-bold text-center text-sm transition cursor-pointer ${statusColorMap[bed.status]}`}
    >
      <div className="text-xs font-bold">Bed {bed.name.split('-')[1]}</div>
      <div className="text-xs">{typeMap[bed.type]}</div>
    </div>
  );
}
