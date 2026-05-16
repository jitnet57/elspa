'use client';

import { useState, useEffect } from 'react';
import { useMonitorPolling, classifyBedsByRoom } from '@/hooks/useMonitorPolling';
import { useFullStoreSync } from '@/hooks/useStoreSync';
import { useStore } from '@/lib/store/store';
import { NotificationCenter } from '@/components/NotificationCenter';
import { WalkInBookingModal, type WalkInBookingRequest } from '@/components/WalkInBookingModal';
import { useWalkInMatching, getServiceDuration } from '@/hooks/useWalkInMatching';
import { MobileDrawer } from '@/components/MobileDrawer';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBedCard } from '@/components/MobileBedCard';
import { MobileBottomTabBar } from '@/components/MobileBottomTabBar';
import { WalkInQueuePanel } from '@/components/WalkInQueuePanel';

interface ScheduleSession {
  id: string;
  therapistId: number;
  serviceType: 'swedish' | 'thai' | 'hotstone' | 'foot' | 'aroma' | 'break' | 'available';
  startHour: number;
  endHour: number;
  customerName?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
}

interface ScheduleTherapist {
  id: number;
  name: string;
  status: 'available' | 'in_session' | 'break' | 'off_duty';
  avatarColor: string;
  sessions: ScheduleSession[];
}

const SCHEDULE_SERVICE_CONFIG = {
  swedish:   { label: 'Swedish Massage', bg: 'bg-blue-100 border-blue-300 text-blue-700', icon: '💆' },
  thai:      { label: 'Thai Massage', bg: 'bg-green-100 border-green-300 text-green-700', icon: '🙏' },
  hotstone:  { label: 'Hot Stone', bg: 'bg-orange-100 border-orange-300 text-orange-700', icon: '🪨' },
  foot:      { label: 'Foot Massage', bg: 'bg-teal-100 border-teal-300 text-teal-700', icon: '🦶' },
  aroma:     { label: 'Aromatherapy', bg: 'bg-purple-100 border-purple-300 text-purple-700', icon: '🌸' },
  break:     { label: 'Break', bg: 'bg-yellow-200 border-yellow-400 text-yellow-800', icon: '☕' },
  available: { label: 'Available', bg: 'bg-green-50 border-green-200 text-green-600', icon: '' },
} as const;

const SCHEDULE_STATUS_BADGE = {
  available: { dot: '●', color: 'text-green-500' },
  in_session: { dot: '●', color: 'text-blue-500' },
  break: { dot: '◑', color: 'text-yellow-500' },
  off_duty: { dot: '◌', color: 'text-gray-400' },
} as const;

const SCHEDULE_STATUS_LABEL = {
  available: 'Available',
  in_session: 'In Session',
  break: 'Break',
  off_duty: 'Off Duty',
} as const;

const MOCK_SCHEDULE_THERAPISTS: ScheduleTherapist[] = [
  {
    id: 1, name: 'Anna', status: 'available', avatarColor: 'from-orange-400 to-orange-600',
    sessions: [
      { id: 'a1', therapistId: 1, serviceType: 'available', startHour: 9, endHour: 10.5, status: 'scheduled' },
      { id: 'a2', therapistId: 1, serviceType: 'available', startHour: 16, endHour: 21, status: 'scheduled' },
    ],
  },
  {
    id: 2, name: 'Bella', status: 'in_session', avatarColor: 'from-pink-400 to-pink-600',
    sessions: [
      { id: 'b1', therapistId: 2, serviceType: 'swedish', startHour: 10, endHour: 12, customerName: '김민준', status: 'in_progress' },
      { id: 'b2', therapistId: 2, serviceType: 'aroma', startHour: 12.5, endHour: 14.5, customerName: '이수연', status: 'scheduled' },
      { id: 'b3', therapistId: 2, serviceType: 'hotstone', startHour: 15, endHour: 17, customerName: '박지은', status: 'scheduled' },
    ],
  },
  {
    id: 3, name: 'Cathy', status: 'in_session', avatarColor: 'from-amber-400 to-amber-600',
    sessions: [
      { id: 'c1', therapistId: 3, serviceType: 'foot', startHour: 9.5, endHour: 11.5, customerName: '최준호', status: 'completed' },
      { id: 'c2', therapistId: 3, serviceType: 'thai', startHour: 12, endHour: 14, customerName: '강지은', status: 'in_progress' },
      { id: 'c3', therapistId: 3, serviceType: 'swedish', startHour: 14.5, endHour: 16.5, customerName: '이준영', status: 'scheduled' },
    ],
  },
  {
    id: 4, name: 'Daisy', status: 'break', avatarColor: 'from-yellow-400 to-yellow-600',
    sessions: [
      { id: 'd0', therapistId: 4, serviceType: 'break', startHour: 9, endHour: 10, status: 'scheduled' },
      { id: 'd1', therapistId: 4, serviceType: 'aroma', startHour: 10, endHour: 12, customerName: '김수현', status: 'scheduled' },
      { id: 'd2', therapistId: 4, serviceType: 'hotstone', startHour: 13, endHour: 15, customerName: '박민수', status: 'scheduled' },
    ],
  },
  {
    id: 5, name: 'Ella', status: 'in_session', avatarColor: 'from-green-400 to-green-600',
    sessions: [
      { id: 'e1', therapistId: 5, serviceType: 'thai', startHour: 11, endHour: 13, customerName: '이영희', status: 'in_progress' },
      { id: 'e2', therapistId: 5, serviceType: 'swedish', startHour: 13.5, endHour: 15.5, customerName: '정현준', status: 'scheduled' },
      { id: 'e3', therapistId: 5, serviceType: 'aroma', startHour: 16, endHour: 18, customerName: '박유진', status: 'scheduled' },
    ],
  },
  {
    id: 6, name: 'Fatima', status: 'available', avatarColor: 'from-purple-400 to-purple-600',
    sessions: [
      { id: 'f1', therapistId: 6, serviceType: 'available', startHour: 9, endHour: 11, status: 'scheduled' },
      { id: 'f2', therapistId: 6, serviceType: 'available', startHour: 16, endHour: 21, status: 'scheduled' },
    ],
  },
  {
    id: 7, name: 'Gina', status: 'off_duty', avatarColor: 'from-gray-400 to-gray-600',
    sessions: [],
  },
  {
    id: 8, name: 'Hana', status: 'in_session', avatarColor: 'from-teal-400 to-teal-600',
    sessions: [
      { id: 'h1', therapistId: 8, serviceType: 'foot', startHour: 10.5, endHour: 12, customerName: '임다현', status: 'in_progress' },
      { id: 'h2', therapistId: 8, serviceType: 'thai', startHour: 13, endHour: 15, customerName: '유지원', status: 'scheduled' },
      { id: 'h3', therapistId: 8, serviceType: 'hotstone', startHour: 15.5, endHour: 17.5, customerName: '강지연', status: 'scheduled' },
    ],
  },
];

const SCHEDULE_START_HOUR = 9;
const SCHEDULE_END_HOUR = 21;
const SCHEDULE_COLUMN_WIDTH = 100;

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

  // 📌 모바일 드로어 상태
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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
  const [viewMode, setViewMode] = useState<'beds' | 'schedule'>('beds');
  const [scheduleDate, setScheduleDate] = useState(new Date());

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
    <div className="min-h-screen bg-gray-900 text-white">
      <NotificationCenter />

      {/* 📌 모바일 헤더 */}
      <MobileHeader
        onMenuClick={() => setIsMobileDrawerOpen(true)}
        title="✨ ELSPA 모니터"
        rightContent={<div className="text-xl font-mono">{currentTime}</div>}
      />

      {/* 📌 모바일 드로어 (테라피스트 현황) */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-blue-400 border-b border-gray-700 pb-2">
            테라피스트 현황
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>출근: {therapistStats.checkedIn}명 / 총 {therapistStats.total}명</span>
              <span className="text-green-400 font-bold">대기: {therapistStats.idle}명</span>
            </div>
            <div className="text-gray-400 text-xs">
              서비스중: {therapistStats.in_service}명 | 휴식: {therapistStats.resting}명
            </div>
          </div>

          {/* 예측 정보 */}
          {predictions && (
            <div className="bg-blue-900/30 p-3 rounded border-l-4 border-blue-500">
              <div className="text-xs text-gray-400 mb-1">⏳ 평균 대기시간</div>
              <div className="text-lg font-bold text-blue-400">{predictions.average_wait_minutes || 0}분</div>
              {predictions.next_available_therapist && (
                <div className="text-xs text-gray-400 mt-2">
                  다음 가용: <span className="text-green-400 font-bold">{predictions.next_available_therapist.name}</span>
                </div>
              )}
            </div>
          )}

          {/* 테라피스트 목록 */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <div className="text-xs font-bold text-gray-300 border-b border-gray-700 pb-2">
              전체 테라피스트
            </div>
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
                    {therapist.status === 'idle' ? '[즉시]' : ''}
                    {therapist.status === 'in_service' && `${therapist.remaining_minutes}분↓`}
                    {therapist.status === 'resting' && '[휴식]'}
                  </span>
                </div>
                <div className="text-gray-400 mt-0.5">{therapist.specialty}</div>
              </div>
            ))}
          </div>
        </div>
      </MobileDrawer>

      {/* 📌 워크인 모달 */}
      <WalkInBookingModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        onSubmit={handleWalkInSubmit}
        availableBeds={pollingBeds.filter(b => b.status === 'available')}
        therapists={pollingTherapists}
      />

      {/* 📌 메인 콘텐츠 */}
      <div className="lg:p-4 p-0">
        {/* 모드 선택 탭 */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex gap-2 sticky top-12 lg:top-0 z-30">
          <button
            onClick={() => setViewMode('beds')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              viewMode === 'beds'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🛏️ 침대 실시간 모드
          </button>
          <button
            onClick={() => setViewMode('schedule')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              viewMode === 'schedule'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📅 테라피스트 일일 스케줄
          </button>
        </div>

        {/* 데스크톱용 헤더 */}
        <div className="hidden lg:block mb-6 bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">✨ ELSPA 실시간 모니터</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                🔄 폴링: {refetchCount}회 | ⏱️ {lastRefetch?.toLocaleTimeString('ko-KR', { hour12: false })}
              </div>
              {/* 📌 워크인 추가 버튼 (침대 모드에서만) */}
              {viewMode === 'beds' && (
                <button
                  onClick={() => setIsWalkInModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all hover:shadow-lg"
                >
                  + 워크인 추가
                </button>
              )}
              <div className="text-2xl font-mono">{currentTime}</div>
            </div>
          </div>
          {viewMode === 'beds' && (
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
          )}
        </div>

        {/* 모바일용 헤더 (침대 모드) */}
        {viewMode === 'beds' && (
          <div className="lg:hidden mb-4 bg-gray-800 p-4 rounded-lg mx-4 mt-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-green-600/30 p-2 rounded text-center">
                <div className="text-green-400 font-bold text-xs">비어있음</div>
                <div className="text-xl font-bold">{bedStats.available}</div>
              </div>
              <div className="bg-blue-600/30 p-2 rounded text-center">
                <div className="text-blue-400 font-bold text-xs">서비스중</div>
                <div className="text-xl font-bold">{bedStats.in_service}</div>
              </div>
              <div className="bg-orange-600/30 p-2 rounded text-center">
                <div className="text-orange-400 font-bold text-xs">예약됨</div>
                <div className="text-xl font-bold">{bedStats.reserved}</div>
              </div>
              <div className="bg-gray-600/30 p-2 rounded text-center">
                <div className="text-gray-400 font-bold text-xs">정리중</div>
                <div className="text-xl font-bold">{bedStats.cleaning}</div>
              </div>
            </div>
          </div>
        )}

        {/* 데스크톱 레이아웃 (침대 모드) */}
        {viewMode === 'beds' && (
        <div className="hidden lg:grid grid-cols-4 gap-6">
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

        {/* 워크인 대기 패널 */}
        <WalkInQueuePanel />
        </div>
        )}

        {/* 모바일 레이아웃 (침대 모드) */}
        {viewMode === 'beds' && (
        <div className="lg:hidden px-4 pb-32 space-y-4 mt-4">
          {Object.entries(bedsByRoom).map(([roomName, roomBeds]) =>
            roomBeds.length > 0 ? (
              <div key={roomName}>
                <h2 className="text-lg font-bold mb-3 text-blue-400 sticky top-0 bg-gray-900 py-2">
                  {roomName} ({roomBeds.length}개)
                </h2>
                <div className="space-y-2">
                  {roomBeds.map(bed => (
                    <div
                      key={bed.id}
                      onClick={() => openDetailModal(bed.id)}
                      className="cursor-pointer"
                    >
                      <MobileBedCard bed={bed} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
        )}

        {/* 범례 - 데스크톱만 (침대 모드) */}
        {viewMode === 'beds' && (
        <div className="hidden lg:block mt-8 p-4 bg-gray-800 rounded-lg text-sm">
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
        )}

        {/* 일일 스케줄 모드 */}
        {viewMode === 'schedule' && (
        <div className="p-4 lg:p-8 space-y-6 bg-gradient-to-br from-blue-900/20 via-blue-800/10 to-blue-900/20 rounded-lg">
          {/* 헤더 */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-4">
              <button onClick={() => setScheduleDate(d => new Date(d.getTime() - 86400000))} className="text-2xl text-white/80 hover:text-white transition">&lt;</button>
              <span className="text-xl font-bold text-white min-w-[300px]">{scheduleDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', weekday: 'short' })}</span>
              <button onClick={() => setScheduleDate(d => new Date(d.getTime() + 86400000))} className="text-2xl text-white/80 hover:text-white transition">&gt;</button>
            </div>
            <a
              href="/admin/therapist-schedule"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-sm rounded transition-colors border border-white/30"
            >
              📅 어드민 상세관리
            </a>
          </div>

          {/* 스케줄 그리드 */}
          <div className="bg-blue-900/30 rounded-lg overflow-x-auto border border-blue-700/50">
            <div className="inline-block min-w-full">
              {/* 헤더 */}
              <div className="flex border-b border-blue-700/50">
                <div className="w-40 flex-shrink-0 px-4 py-3 font-bold text-blue-200 bg-blue-900/40 sticky left-0 z-10">Therapists (8)</div>
                <div className="flex bg-blue-900/30">
                  {Array.from({ length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 px-2 py-3 text-center text-sm font-bold text-blue-300 border-r border-blue-700/50"
                      style={{ width: SCHEDULE_COLUMN_WIDTH }}
                    >
                      {String(SCHEDULE_START_HOUR + i).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* 테라피스트 행 */}
              {MOCK_SCHEDULE_THERAPISTS.map(therapist => (
                <div key={therapist.id} className="flex border-b border-blue-700/50 hover:bg-blue-800/30 transition">
                  {/* 테라피스트 정보 */}
                  <div className="w-40 flex-shrink-0 px-4 py-4 bg-blue-900/30 sticky left-0 z-5 border-r border-blue-700/50 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${therapist.avatarColor} flex items-center justify-center text-white font-bold text-sm`}>
                      {therapist.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-blue-100 text-sm">{therapist.name}</div>
                      <div className={`text-xs ${SCHEDULE_STATUS_BADGE[therapist.status].color}`}>
                        {SCHEDULE_STATUS_BADGE[therapist.status].dot} {SCHEDULE_STATUS_LABEL[therapist.status]}
                      </div>
                    </div>
                  </div>

                  {/* 시간 그리드 */}
                  <div className="flex relative flex-1">
                    {Array.from({ length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR }).map((_, colIndex) => {
                      const hourStart = SCHEDULE_START_HOUR + colIndex;
                      const hourEnd = hourStart + 1;
                      const cellSessions = therapist.sessions.filter(
                        s => !(s.endHour <= hourStart || s.startHour >= hourEnd)
                      );

                      return (
                        <div
                          key={colIndex}
                          className="flex-shrink-0 px-1 py-4 border-r border-blue-700/50 relative bg-blue-900/20 hover:bg-blue-900/40 transition"
                          style={{ width: SCHEDULE_COLUMN_WIDTH }}
                        >
                          {cellSessions.map(session => (
                            <div
                              key={session.id}
                              className={`absolute rounded-md border-2 text-xs p-1 text-white ${SCHEDULE_SERVICE_CONFIG[session.serviceType as keyof typeof SCHEDULE_SERVICE_CONFIG].bg}`}
                              style={{
                                left: `calc(${((session.startHour - hourStart) * SCHEDULE_COLUMN_WIDTH) / 1}px + 2px)`,
                                width: `${(session.endHour - Math.max(session.startHour, hourStart)) * SCHEDULE_COLUMN_WIDTH - 4}px`,
                                top: `${(MOCK_SCHEDULE_THERAPISTS.findIndex(t => t.id === therapist.id) % 2) * 28}px`,
                                zIndex: 2,
                              }}
                            >
                              <div className="font-bold text-xs">{session.startHour % 1 === 0 ? String(session.startHour).padStart(2, '0') : session.startHour}:00</div>
                              {session.customerName && <div className="text-xs truncate">{session.customerName}</div>}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-900/30 border border-blue-700/50 p-4 rounded-lg text-sm text-blue-300">
            💡 <span className="text-blue-100">모니터에서 일정을 보기만 할 수 있습니다. 상세 편집은 어드민 사이트를 사용하세요.</span>
          </div>
        </div>
        )}
      </div>

      {/* 모바일 하단 탭 바 */}
      <MobileBottomTabBar
        tabs={[
          { label: '모니터', icon: '📊', href: '/monitor', active: true },
          { label: '테라피스트', icon: '👥', href: '/admin/therapists' },
          { label: '배정', icon: '⚙️', href: '/admin/matching' },
        ]}
        onWalkInAdd={() => setIsWalkInModalOpen(true)}
      />

      {/* 상세 정보 모달 */}
      <DetailModal />
    </div>
  );
}
