'use client';

import { useState, useEffect } from 'react';
import { useMonitorPolling, classifyBedsByRoom } from '@/hooks/useMonitorPolling';
import { useFullStoreSync } from '@/hooks/useStoreSync';
import { useStore } from '@/lib/store/store';
import { NotificationCenter } from '@/components/NotificationCenter';
import { WalkInBookingModal, type WalkInBookingRequest } from '@/components/WalkInBookingModal';
import { useWalkInMatching, getServiceDuration } from '@/hooks/useWalkInMatching';

interface Bed {
  id: number;
  bed_number: number;
  room_zone: string;
  status: 'available' | 'reserved' | 'in_service' | 'cleaning';
  customer_name?: string;
  therapist_name?: string;
  service_name?: string;
  starts_at?: string;
  ends_at?: string;
}

interface Therapist {
  id: number;
  name: string;
  status: 'idle' | 'in_service' | 'resting' | 'checked_out';
  current_bed?: number;
  remaining_minutes?: number;
  specialty?: string;
}

interface Stats {
  available: number;
  reserved: number;
  in_service: number;
  cleaning: number;
}

// 더 이상 필요 없음 (Mock API에서 제공)
const generateMockBeds = (): Bed[] => {
  const beds: Bed[] = [];
  let bedId = 1;
  const customerNames = ['김민준', '이수연', '정현준', '박지은', '최준호', '강지은', '이준영', '김수현', '박민수', '이영희'];
  const therapistNames = ['박유진', '최정은', '이소영', '김태희', '강지연', '박민경', '임다현', '유지원'];
  const serviceNames = ['스웨디시 60분', '타이마사지 90분', '핫스톤 60분', '발마사지 30분', '아로마테라피 45분'];

  for (let i = 1; i <= 30; i++) {
    const status = ['available', 'reserved', 'in_service', 'cleaning'][Math.floor(Math.random() * 4)] as any;
    beds.push({
      id: bedId,
      bed_number: i,
      room_zone: '마사지룸1',
      status: status,
      customer_name: (status === 'in_service' || status === 'reserved') ? customerNames[Math.floor(Math.random() * customerNames.length)] : undefined,
      therapist_name: (status === 'in_service' || status === 'reserved') ? therapistNames[Math.floor(Math.random() * therapistNames.length)] : undefined,
      service_name: serviceNames[Math.floor(Math.random() * serviceNames.length)],
      starts_at: status === 'in_service' ? new Date(Date.now() - 10 * 60000).toLocaleTimeString('ko-KR', {hour12: false}) : undefined,
      ends_at: status === 'in_service' ? new Date(Date.now() + 30 * 60000).toLocaleTimeString('ko-KR', {hour12: false}) : undefined,
    });
    bedId++;
  }

  for (let i = 1; i <= 30; i++) {
    const status = ['available', 'reserved', 'in_service', 'cleaning'][Math.floor(Math.random() * 4)] as any;
    beds.push({
      id: bedId,
      bed_number: i,
      room_zone: '마사지룸2',
      status: status,
      customer_name: (status === 'in_service' || status === 'reserved') ? customerNames[Math.floor(Math.random() * customerNames.length)] : undefined,
      therapist_name: (status === 'in_service' || status === 'reserved') ? therapistNames[Math.floor(Math.random() * therapistNames.length)] : undefined,
      service_name: serviceNames[Math.floor(Math.random() * serviceNames.length)],
      starts_at: status === 'in_service' ? new Date(Date.now() - 10 * 60000).toLocaleTimeString('ko-KR', {hour12: false}) : undefined,
      ends_at: status === 'in_service' ? new Date(Date.now() + 30 * 60000).toLocaleTimeString('ko-KR', {hour12: false}) : undefined,
    });
    bedId++;
  }

  for (let i = 1; i <= 16; i++) {
    const status = ['available', 'reserved', 'in_service', 'cleaning'][Math.floor(Math.random() * 4)] as any;
    beds.push({
      id: bedId,
      bed_number: i,
      room_zone: 'VIP룸',
      status: status,
      customer_name: (status === 'in_service' || status === 'reserved') ? customerNames[Math.floor(Math.random() * customerNames.length)] : undefined,
      therapist_name: (status === 'in_service' || status === 'reserved') ? therapistNames[Math.floor(Math.random() * therapistNames.length)] : undefined,
      service_name: serviceNames[Math.floor(Math.random() * serviceNames.length)],
      starts_at: status === 'in_service' ? new Date(Date.now() - 10 * 60000).toLocaleTimeString('ko-KR', {hour12: false}) : undefined,
      ends_at: status === 'in_service' ? new Date(Date.now() + 30 * 60000).toLocaleTimeString('ko-KR', {hour12: false}) : undefined,
    });
    bedId++;
  }

  for (let i = 1; i <= 10; i++) {
    const status = ['available', 'reserved', 'in_service', 'cleaning'][Math.floor(Math.random() * 4)] as any;
    beds.push({
      id: bedId,
      bed_number: i,
      room_zone: '커플룸',
      status: status,
      customer_name: (status === 'in_service' || status === 'reserved') ? customerNames[Math.floor(Math.random() * customerNames.length)] : undefined,
      therapist_name: (status === 'in_service' || status === 'reserved') ? therapistNames[Math.floor(Math.random() * therapistNames.length)] : undefined,
      service_name: serviceNames[Math.floor(Math.random() * serviceNames.length)],
      starts_at: status === 'in_service' ? new Date(Date.now() - 10 * 60000).toLocaleTimeString('ko-KR', {hour12: false}) : undefined,
      ends_at: status === 'in_service' ? new Date(Date.now() + 30 * 60000).toLocaleTimeString('ko-KR', {hour12: false}) : undefined,
    });
    bedId++;
  }

  return beds;
};

const mockTherapists: Therapist[] = [
  { id: 1, name: '박유진', status: 'in_service', current_bed: 5, remaining_minutes: 17, specialty: '스웨디시' },
  { id: 2, name: '최정은', status: 'in_service', current_bed: 12, remaining_minutes: 32, specialty: '타이마사지' },
  { id: 3, name: '이소영', status: 'idle', specialty: '핫스톤' },
  { id: 4, name: '김태희', status: 'in_service', current_bed: 18, remaining_minutes: 5, specialty: '발마사지' },
  { id: 5, name: '강지연', status: 'resting', remaining_minutes: 10, specialty: '아로마테라피' },
  { id: 6, name: '박민경', status: 'idle', specialty: '종합' },
  { id: 7, name: '임다현', status: 'idle', specialty: '스톤 마사지' },
  { id: 8, name: '유지원', status: 'in_service', current_bed: 28, remaining_minutes: 22, specialty: '타이마사지' },
];

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'available':
      return 'bg-green-500';
    case 'reserved':
      return 'bg-orange-500 animate-pulse';
    case 'in_service':
      return 'bg-blue-500';
    case 'cleaning':
      return 'bg-gray-500';
    default:
      return 'bg-gray-300';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'available':
      return '사용가능';
    case 'reserved':
      return '예약됨';
    case 'in_service':
      return '서비스중';
    case 'cleaning':
      return '정리중';
    default:
      return '상태불명';
  }
};

const calculateStats = (beds: Bed[]): Stats => {
  return {
    available: beds.filter(b => b.status === 'available').length,
    reserved: beds.filter(b => b.status === 'reserved').length,
    in_service: beds.filter(b => b.status === 'in_service').length,
    cleaning: beds.filter(b => b.status === 'cleaning').length,
  };
};

export default function MonitorPage() {
  // React Query 폴링 + Zustand store 동기화
  useFullStoreSync();

  // LANGGRAPH Node 1-4: BedsPolling + TherapistsPolling + Stats + Predictions
  const {
    beds: pollingBeds,
    therapists: pollingTherapists,
    bedStats,
    therapistStats,
    predictions,
    isLoading,
    error,
    refetchCount,
    lastRefetch,
  } = useMonitorPolling();

  // 📌 워크인 손님 매칭 훅
  const { walkInBookings, createWalkInBooking } = useWalkInMatching();

  // 📌 워크인 모달 상태
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  // Zustand store에서 데이터 읽기
  const {
    beds: storeBeds,
    therapists: storeTherapists,
    selectedBedId,
    isDetailModalOpen,
    openDetailModal,
    closeDetailModal,
  } = useStore();

  // Store가 최신이면 store 사용, 아니면 polling 데이터 사용
  const beds = storeBeds.length > 0 ? storeBeds : pollingBeds;
  const therapists = storeTherapists.length > 0 ? storeTherapists : pollingTherapists;

  const [currentTime, setCurrentTime] = useState<string>('');

  // 현재 시각 매초 갱신
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ko-KR', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Room별 침대 분류
  const bedsByRoom = classifyBedsByRoom(beds);

  const BedGrid = ({ roomBeds }: { roomBeds: Bed[] }) => (
    <div className="grid grid-cols-10 gap-1">
      {roomBeds.map(bed => (
        <div key={bed.id} className="relative">
          <button
            onClick={() => openDetailModal(bed.id)}
            className={`w-full h-16 ${getStatusColor(bed.status)} rounded-lg text-white text-xs font-bold hover:opacity-80 hover:scale-105 transition-all flex flex-col items-center justify-center p-1 border-2 ${
              selectedBedId === bed.id ? 'border-yellow-400' : 'border-gray-700'
            } cursor-pointer`}
            title={`클릭하여 상세 정보 보기`}
          >
            <div className="font-bold">{bed.bed_number}번</div>
            {bed.status === 'in_service' && bed.customer_name && (
              <div className="text-xs truncate w-full text-center">{bed.customer_name}</div>
            )}
            {bed.status === 'reserved' && bed.customer_name && (
              <div className="text-xs truncate w-full text-center">{bed.customer_name}</div>
            )}
          </button>
        </div>
      ))}
    </div>
  );

  // 모달 컴포넌트
  const DetailModal = () => {
    if (!isDetailModalOpen || !selectedBedId) return null;

    const selectedBed = beds.find(b => b.id === selectedBedId);
    if (!selectedBed) return null;

    const remainingTime = selectedBed.ends_at
      ? Math.max(0, Math.floor((new Date(selectedBed.ends_at).getTime() - Date.now()) / 60000))
      : 0;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border-2 border-blue-500 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-blue-400">침대 {selectedBed.bed_number}번</h2>
            <button
              onClick={() => closeDetailModal()}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 mb-6">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-gray-400 text-sm">위치</div>
              <div className="text-lg font-bold text-white">{selectedBed.room_zone}</div>
            </div>

            <div className="bg-gray-700 p-3 rounded">
              <div className="text-gray-400 text-sm">상태</div>
              <div className="text-lg font-bold">
                {selectedBed.status === 'in_service' && <span className="text-blue-400">🔵 서비스중</span>}
                {selectedBed.status === 'reserved' && <span className="text-orange-400">🟠 예약됨</span>}
                {selectedBed.status === 'available' && <span className="text-green-400">🟢 사용가능</span>}
                {selectedBed.status === 'cleaning' && <span className="text-gray-400">⚫ 정리중</span>}
              </div>
            </div>

            {selectedBed.customer_name && (
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-gray-400 text-sm">👤 고객</div>
                <div className="text-lg font-bold text-white">{selectedBed.customer_name}</div>
              </div>
            )}

            {selectedBed.therapist_name && (
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-gray-400 text-sm">💆 테라피스트</div>
                <div className="text-lg font-bold text-white">{selectedBed.therapist_name}</div>
              </div>
            )}

            {selectedBed.service_name && (
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-gray-400 text-sm">💆‍♀️ 서비스</div>
                <div className="text-lg font-bold text-white">{selectedBed.service_name}</div>
              </div>
            )}

            {selectedBed.starts_at && (
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-gray-400 text-sm">⏰ 시작 시간</div>
                <div className="text-lg font-bold text-white">{selectedBed.starts_at}</div>
              </div>
            )}

            {selectedBed.ends_at && (
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-gray-400 text-sm">⏱️ 종료 예정</div>
                <div className="text-lg font-bold text-white">{selectedBed.ends_at}</div>
              </div>
            )}

            {selectedBed.status === 'in_service' && (
              <div className="bg-blue-900/50 p-3 rounded border-l-4 border-blue-500">
                <div className="text-gray-400 text-sm">⏳ 남은 시간</div>
                <div className="text-2xl font-bold text-blue-400">{remainingTime}분</div>
              </div>
            )}
          </div>

          <button
            onClick={() => closeDetailModal()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    );
  };

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">🔄 실시간 데이터 로드 중...</div>
          <div className="text-gray-400">5초 폴링으로 침대 상태를 조회하고 있습니다.</div>
        </div>
      </div>
    );
  }

  // 오류 상태 표시
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4 text-red-400">❌ 데이터 조회 오류</div>
          <div className="text-gray-400">{error.message}</div>
        </div>
      </div>
    );
  }

  // ============================================================
  // 📌 워크인 모달 제출 핸들러
  // ============================================================
  const handleWalkInSubmit = (data: WalkInBookingRequest) => {
    const duration = getServiceDuration(data.serviceType);
    const bookingId = createWalkInBooking({
      count: data.suggestedBeds.length,
      serviceType: data.serviceType,
      bedIds: data.suggestedBeds,
      therapistIds: data.suggestedTherapists,
      estimatedDuration: duration,
    });

    // 성공 알림
    console.log(`✅ 워크인 손님 예약 완료: ${bookingId}`);
    alert(`✅ 워크인 손님이 예약되었습니다.\n베드: ${data.suggestedBeds.join(', ')}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <NotificationCenter />

      {/* 📌 워크인 모달 */}
      <WalkInBookingModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        onSubmit={handleWalkInSubmit}
        availableBeds={pollingBeds.filter(b => b.status === 'available')}
        therapists={pollingTherapists}
      />
      <div className="mb-6 bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">✨ ELSPA 실시간 모니터</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              🔄 폴링: {refetchCount}회 | ⏱️ {lastRefetch?.toLocaleTimeString('ko-KR', { hour12: false })}
            </div>
            {/* 📌 워크인 추가 버튼 */}
            <button
              onClick={() => setIsWalkInModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all hover:shadow-lg"
            >
              + 워크인 추가
            </button>
            <div className="text-2xl font-mono">{currentTime}</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 text-lg">
          <div className="bg-green-600/30 p-3 rounded text-center">
            <div className="text-green-400 font-bold">비어있음</div>
            <div className="text-2xl font-bold">{bedStats.available}</div>
          </div>
          <div className="bg-blue-600/30 p-3 rounded text-center">
            <div className="text-blue-400 font-bold">서비스중</div>
            <div className="text-2xl font-bold">{bedStats.in_service}</div>
          </div>
          <div className="bg-orange-600/30 p-3 rounded text-center">
            <div className="text-orange-400 font-bold">예약됨</div>
            <div className="text-2xl font-bold">{bedStats.reserved}</div>
          </div>
          <div className="bg-gray-600/30 p-3 rounded text-center">
            <div className="text-gray-400 font-bold">정리중</div>
            <div className="text-2xl font-bold">{bedStats.cleaning}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3 space-y-6">
          {Object.entries(bedsByRoom).map(([roomName, roomBeds]) =>
            roomBeds.length > 0 ? (
              <div key={roomName} className="bg-gray-800 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-3 text-blue-400">{roomName} ({roomBeds.length}개)</h2>
                <BedGrid roomBeds={roomBeds} />
              </div>
            ) : null
          )}
        </div>

        <div className="bg-gray-800 p-4 rounded-lg h-fit sticky top-4">
          <h2 className="text-xl font-bold mb-4 text-blue-400">테라피스트 현황</h2>

          <div className="space-y-2 mb-6 pb-4 border-b border-gray-700">
            <div className="flex justify-between text-sm">
              <span>출근: {therapistStats.checkedIn}명 / 총 {therapistStats.total}명</span>
              <span className="text-green-400 font-bold">대기: {therapistStats.idle}명</span>
            </div>
            <div className="text-sm text-gray-400">
              서비스중: {therapistStats.in_service}명 | 휴식: {therapistStats.resting}명
            </div>
          </div>

          {/* 예측 정보 표시 */}
          {predictions && (
            <div className="mb-4 bg-blue-900/30 p-3 rounded border-l-4 border-blue-500">
              <div className="text-xs text-gray-400 mb-1">⏳ 평균 대기시간</div>
              <div className="text-lg font-bold text-blue-400">{predictions.average_wait_minutes || 0}분</div>
              {predictions.next_available_therapist && (
                <div className="text-xs text-gray-400 mt-2">
                  다음 가용: <span className="text-green-400 font-bold">{predictions.next_available_therapist.name}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {therapists.map(therapist => (
              <div key={therapist.id} className="bg-gray-700 p-2 rounded text-xs hover:bg-gray-600 transition">
                <div className="flex items-center justify-between">
                  <div>
                    {therapist.status === 'idle' && '●'}
                    {therapist.status === 'in_service' && '◆'}
                    {therapist.status === 'resting' && '○'}
                    {therapist.status === 'checked_out' && '✕'}
                    {' '}
                    <span className="font-bold">{therapist.name}</span>
                  </div>
                  <span className={
                    therapist.status === 'idle' ? 'text-green-400' :
                    therapist.status === 'in_service' ? 'text-blue-400' :
                    therapist.status === 'resting' ? 'text-yellow-400' :
                    'text-gray-500'
                  }>
                    {therapist.status === 'idle' ? '[즉시가용]' : ''}
                    {therapist.status === 'in_service' && `B${therapist.current_bed} | ${therapist.remaining_minutes}분↓`}
                    {therapist.status === 'resting' && '[휴식중]'}
                  </span>
                </div>
                <div className="text-gray-400 mt-1">{therapist.specialty}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="bg-blue-900/30 p-3 rounded text-sm">
              <div className="font-bold text-blue-300">다음 배정 대상</div>
              <div className="mt-1">이소영 (즉시 가능)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded-lg text-sm">
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span>비어있음 (사용 가능)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded"></div>
            <span>서비스중 (타이머)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded animate-pulse"></div>
            <span>예약됨 (고객 곧 도착)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-500 rounded"></div>
            <span>정리중 (청소/정리)</span>
          </div>
        </div>
      </div>

      {/* 상세 정보 모달 */}
      <DetailModal />
    </div>
  );
}
