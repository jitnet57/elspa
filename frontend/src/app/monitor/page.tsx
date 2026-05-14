'use client';

import { useState, useEffect } from 'react';
import { useMonitorPolling, classifyBedsByRoom } from '@/hooks/useMonitorPolling';
import { useFullStoreSync } from '@/hooks/useStoreSync';
import { useStore } from '@/lib/store/store';
import { NotificationCenter } from '@/components/NotificationCenter';
import { WalkInBookingModal, type WalkInBookingRequest } from '@/components/WalkInBookingModal';
import { TherapistReservationPanel } from '@/components/TherapistReservationPanel';
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
  checked_in_at?: string;
}

interface ScheduleSlot {
  therapistId: number;
  therapistName: string;
  startHour: number;
  startMin: number;
  durationMin: number;
  serviceName: string;
  bedNumber?: number;
  customerName?: string;
  status: 'in_service' | 'reserved' | 'break';
}

interface Stats {
  available: number;
  reserved: number;
  in_service: number;
  cleaning: number;
}

// 더 이상 필요 없음 (Mock API에서 제공)
// 📌 테라피스트별 스케줄 데이터 생성 (Mock - 실제 시간 반영)
const generateTherapistSchedules = (therapists: Therapist[], beds: Bed[]): ScheduleSlot[] => {
  const schedules: ScheduleSlot[] = [];
  const serviceTypes = ['스웨디시 마사지', '타이 마사지', '핫스톤', '발마사지', '아로마테라피'];
  const durations = [30, 45, 60, 90];
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  therapists.forEach((therapist, idx) => {
    // 현재 진행 중인 세션 찾기
    const currentBed = beds.find(b => b.therapist_name === therapist.name && b.status === 'in_service');

    if (currentBed && currentBed.starts_at) {
      const [hours, minutes] = currentBed.starts_at.split(':').map(Number);
      schedules.push({
        therapistId: therapist.id,
        therapistName: therapist.name,
        startHour: hours,
        startMin: minutes,
        durationMin: therapist.remaining_minutes || 60,
        serviceName: currentBed.service_name || '서비스중',
        bedNumber: currentBed.bed_number,
        customerName: currentBed.customer_name,
        status: 'in_service',
      });
    }

    // 향후 예약 세션 - 현재 시간 기준으로 분산 배치
    const numUpcomingSessions = 2 + (idx % 2); // 2~3개 세션
    for (let i = 0; i < numUpcomingSessions; i++) {
      const offsetHours = 1.5 + i * 1.5; // 1.5시간, 3시간, 4.5시간 뒤
      const futureTime = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
      const futureHour = futureTime.getHours();
      const futureMin = futureTime.getMinutes();

      // 营業時間(09:00~21:00) 내에만 배치
      if (futureHour >= 9 && futureHour < 21) {
        schedules.push({
          therapistId: therapist.id,
          therapistName: therapist.name,
          startHour: futureHour,
          startMin: Math.floor(futureMin / 30) * 30, // 30분 단위로 반올림
          durationMin: durations[Math.floor(Math.random() * durations.length)],
          serviceName: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
          bedNumber: Math.floor(Math.random() * 30) + 1,
          customerName: ['김민준', '이수연', '정현준'][Math.floor(Math.random() * 3)],
          status: 'reserved',
        });
      }
    }

    // 휴식 시간 (mock) - 현재 시간 기준
    if (therapist.status === 'resting') {
      schedules.push({
        therapistId: therapist.id,
        therapistName: therapist.name,
        startHour: currentHour,
        startMin: Math.floor(currentMin / 30) * 30,
        durationMin: 30,
        serviceName: '휴식',
        status: 'break',
      });
    }
  });

  return schedules;
};

const generateMockBeds = (): Bed[] => {
  const beds: Bed[] = [];
  let bedId = 1;
  const customerNames = ['김민준', '이수연', '정현준', '박지은', '최준호', '강지은', '이준영', '김수현', '박민수', '이영희'];
  const therapistNames = ['Sarah', 'Emma', 'Jessica', 'Amanda', 'Michelle', 'Catherine', 'Rachel', 'Rebecca'];
  const serviceNames = ['스웨디시 60분', '타이마사지 90분', '핫스톤 60분', '발마사지 30분', '아로마테라피 45분'];
  const now = new Date();

  for (let i = 1; i <= 30; i++) {
    const status = ['available', 'reserved', 'in_service', 'cleaning'][Math.floor(Math.random() * 4)] as any;
    let starts_at: string | undefined;
    let ends_at: string | undefined;

    if (status === 'in_service') {
      // 현재 시간 기준으로 시작 (몇 분 전부터 시작)
      const startOffset = 5 + Math.floor(Math.random() * 25); // 5~30분 전
      const startTime = new Date(now.getTime() - startOffset * 60000);
      starts_at = startTime.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });

      // 종료 시간 (현재 시간 이후)
      const duration = [30, 45, 60, 90][Math.floor(Math.random() * 4)];
      const endOffset = duration - startOffset; // 남은 시간
      const endTime = new Date(now.getTime() + endOffset * 60000);
      ends_at = endTime.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
    }

    beds.push({
      id: bedId,
      bed_number: i,
      room_zone: '마사지룸1',
      status: status,
      customer_name: (status === 'in_service' || status === 'reserved') ? customerNames[Math.floor(Math.random() * customerNames.length)] : undefined,
      therapist_name: (status === 'in_service' || status === 'reserved') ? therapistNames[Math.floor(Math.random() * therapistNames.length)] : undefined,
      service_name: serviceNames[Math.floor(Math.random() * serviceNames.length)],
      starts_at,
      ends_at,
    });
    bedId++;
  }

  for (let i = 1; i <= 30; i++) {
    const status = ['available', 'reserved', 'in_service', 'cleaning'][Math.floor(Math.random() * 4)] as any;
    let starts_at: string | undefined;
    let ends_at: string | undefined;

    if (status === 'in_service') {
      const startOffset = 5 + Math.floor(Math.random() * 25);
      const startTime = new Date(now.getTime() - startOffset * 60000);
      starts_at = startTime.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });

      const duration = [30, 45, 60, 90][Math.floor(Math.random() * 4)];
      const endOffset = duration - startOffset;
      const endTime = new Date(now.getTime() + endOffset * 60000);
      ends_at = endTime.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
    }

    beds.push({
      id: bedId,
      bed_number: i,
      room_zone: '마사지룸2',
      status: status,
      customer_name: (status === 'in_service' || status === 'reserved') ? customerNames[Math.floor(Math.random() * customerNames.length)] : undefined,
      therapist_name: (status === 'in_service' || status === 'reserved') ? therapistNames[Math.floor(Math.random() * therapistNames.length)] : undefined,
      service_name: serviceNames[Math.floor(Math.random() * serviceNames.length)],
      starts_at,
      ends_at,
    });
    bedId++;
  }

  for (let i = 1; i <= 16; i++) {
    const status = ['available', 'reserved', 'in_service', 'cleaning'][Math.floor(Math.random() * 4)] as any;
    let starts_at: string | undefined;
    let ends_at: string | undefined;

    if (status === 'in_service') {
      const startOffset = 5 + Math.floor(Math.random() * 25);
      const startTime = new Date(now.getTime() - startOffset * 60000);
      starts_at = startTime.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });

      const duration = [30, 45, 60, 90][Math.floor(Math.random() * 4)];
      const endOffset = duration - startOffset;
      const endTime = new Date(now.getTime() + endOffset * 60000);
      ends_at = endTime.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
    }

    beds.push({
      id: bedId,
      bed_number: i,
      room_zone: 'VIP룸',
      status: status,
      customer_name: (status === 'in_service' || status === 'reserved') ? customerNames[Math.floor(Math.random() * customerNames.length)] : undefined,
      therapist_name: (status === 'in_service' || status === 'reserved') ? therapistNames[Math.floor(Math.random() * therapistNames.length)] : undefined,
      service_name: serviceNames[Math.floor(Math.random() * serviceNames.length)],
      starts_at,
      ends_at,
    });
    bedId++;
  }

  for (let i = 1; i <= 10; i++) {
    const status = ['available', 'reserved', 'in_service', 'cleaning'][Math.floor(Math.random() * 4)] as any;
    let starts_at: string | undefined;
    let ends_at: string | undefined;

    if (status === 'in_service') {
      const startOffset = 5 + Math.floor(Math.random() * 25);
      const startTime = new Date(now.getTime() - startOffset * 60000);
      starts_at = startTime.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });

      const duration = [30, 45, 60, 90][Math.floor(Math.random() * 4)];
      const endOffset = duration - startOffset;
      const endTime = new Date(now.getTime() + endOffset * 60000);
      ends_at = endTime.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
    }

    beds.push({
      id: bedId,
      bed_number: i,
      room_zone: '커플룸',
      status: status,
      customer_name: (status === 'in_service' || status === 'reserved') ? customerNames[Math.floor(Math.random() * customerNames.length)] : undefined,
      therapist_name: (status === 'in_service' || status === 'reserved') ? therapistNames[Math.floor(Math.random() * therapistNames.length)] : undefined,
      service_name: serviceNames[Math.floor(Math.random() * serviceNames.length)],
      starts_at,
      ends_at,
    });
    bedId++;
  }

  return beds;
};

const mockTherapists: Therapist[] = [
  { id: 1, name: 'Sarah', status: 'in_service', current_bed: 5, remaining_minutes: 17, specialty: 'Swedish Massage', checked_in_at: '09:05' },
  { id: 2, name: 'Emma', status: 'in_service', current_bed: 12, remaining_minutes: 32, specialty: 'Thai Massage', checked_in_at: '09:15' },
  { id: 3, name: 'Jessica', status: 'idle', specialty: 'Hot Stone', checked_in_at: '09:30' },
  { id: 4, name: 'Amanda', status: 'in_service', current_bed: 18, remaining_minutes: 5, specialty: 'Foot Massage', checked_in_at: '09:45' },
  { id: 5, name: 'Michelle', status: 'resting', remaining_minutes: 10, specialty: 'Aromatherapy', checked_in_at: '10:00' },
  { id: 6, name: 'Catherine', status: 'idle', specialty: 'General', checked_in_at: '10:10' },
  { id: 7, name: 'Rachel', status: 'idle', specialty: 'Stone Massage', checked_in_at: '10:20' },
  { id: 8, name: 'Rebecca', status: 'in_service', current_bed: 28, remaining_minutes: 22, specialty: 'Thai Massage', checked_in_at: '10:30' },
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

// 📌 시간을 픽셀 위치로 변환
const timeToPixels = (hour: number, min: number): number => {
  return (hour - 9) * 80 + (min / 60) * 80;
};

// 📌 시간대를 분 단위로 변환
const durationToPixels = (minutes: number): number => {
  return (minutes / 60) * 80;
};

const getScheduleBlockColor = (status: string): string => {
  switch (status) {
    case 'in_service':
      return 'bg-blue-500 border-blue-600';
    case 'reserved':
      return 'bg-orange-500 border-orange-600';
    case 'break':
      return 'bg-gray-500 border-gray-600';
    default:
      return 'bg-gray-400';
  }
};

// 📌 자동 매칭 함수
const autoMatchTherapist = (serviceType: string, therapists: Therapist[], excludeId?: number): Therapist | undefined => {
  const idle = therapists.filter(t => t.status === 'idle' && (!excludeId || t.id !== excludeId));
  if (idle.length === 0) return undefined;

  // specialty 기반 우선순위
  const preferred = idle.filter(t =>
    t.specialty?.toLowerCase().includes(serviceType.toLowerCase()) ||
    serviceType.toLowerCase().includes(t.specialty?.toLowerCase() || '')
  );
  return preferred.length > 0 ? preferred[0] : idle[0];
};

const autoMatchBed = (beds: Bed[], excludeId?: number): Bed | undefined => {
  return beds
    .filter(b => b.status === 'available' && (!excludeId || b.id !== excludeId))
    .sort((a, b) => a.bed_number - b.bed_number)[0];
};

// 📌 워크인 큐 자동 배정 엔진 (출근 순번 기반)
const autoAssignByQueue = (
  requestedTherapistId: number | undefined,
  therapists: Therapist[],
  beds: Bed[]
) => {
  const availableBeds = beds.filter(b => b.status === 'available');

  // 특정 테라피스트 지정된 경우
  if (requestedTherapistId) {
    const therapist = therapists.find(t => t.id === requestedTherapistId && t.status === 'idle');
    if (therapist && availableBeds.length > 0) {
      return { therapist, bed: availableBeds[0] };
    }
  }

  // 출근 순번 기준 자동 배정 (checked_in_at 시간 순)
  const idleByCheckIn = therapists
    .filter(t => t.status === 'idle' && t.checked_in_at)
    .sort((a, b) => (a.checked_in_at || '').localeCompare(b.checked_in_at || ''));

  if (idleByCheckIn.length > 0 && availableBeds.length > 0) {
    return { therapist: idleByCheckIn[0], bed: availableBeds[0] };
  }

  return null;
};

const calculateStats = (beds: Bed[]): Stats => {
  return {
    available: beds.filter(b => b.status === 'available').length,
    reserved: beds.filter(b => b.status === 'reserved').length,
    in_service: beds.filter(b => b.status === 'in_service').length,
    cleaning: beds.filter(b => b.status === 'cleaning').length,
  };
};

// 📌 테라피스트별 스케줄 뷰 컴포넌트
const TherapistScheduleView = ({
  therapists,
  schedules,
  onTherapistClick
}: {
  therapists: Therapist[];
  schedules: ScheduleSlot[];
  onTherapistClick: (therapistId: number) => void;
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentPixels, setCurrentPixels] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ko-KR', { hour12: false }));
      const hour = now.getHours();
      const min = now.getMinutes();
      setCurrentPixels(timeToPixels(hour, min));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000); // 30초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  const HOURS = Array.from({ length: 13 }, (_, i) => 9 + i); // 9:00 ~ 21:00
  const totalWidth = HOURS.length * 80;

  const therapistSchedules = (therapistId: number) => {
    return schedules.filter(s => s.therapistId === therapistId);
  };

  const getTherapistStatus = (therapist: Therapist) => {
    switch (therapist.status) {
      case 'idle':
        return { label: '대기', color: 'text-green-400', icon: '●' };
      case 'in_service':
        return { label: '서비스중', color: 'text-blue-400', icon: '◆' };
      case 'resting':
        return { label: '휴식중', color: 'text-yellow-400', icon: '○' };
      case 'checked_out':
        return { label: '퇴근', color: 'text-gray-500', icon: '✕' };
      default:
        return { label: '미정', color: 'text-gray-400', icon: '?' };
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg overflow-x-auto">
      <h2 className="text-xl font-bold mb-4 text-blue-400">📅 테라피스트별 스케줄 (시간대별)</h2>

      <div className="relative" style={{ minWidth: `${totalWidth + 240}px` }}>
        {/* 📌 상단 시간 축 */}
        <div className="flex mb-2">
          <div className="w-48 flex-shrink-0"></div>
          <div className="flex" style={{ width: `${totalWidth}px` }}>
            {HOURS.map(hour => (
              <div key={hour} className="w-20 h-8 flex items-center justify-center text-xs text-gray-400 border-r border-gray-700">
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        {/* 📌 테라피스트별 행 */}
        <div className="space-y-2 relative">
          {therapists.map(therapist => {
            const status = getTherapistStatus(therapist);
            const slots = therapistSchedules(therapist.id);

            return (
              <div key={therapist.id} className="flex relative h-20 bg-gray-700/30 rounded hover:bg-gray-700/50 cursor-pointer transition-colors" onClick={() => onTherapistClick(therapist.id)}>
                {/* 📌 좌측: 테라피스트 정보 */}
                <div className="w-48 flex-shrink-0 p-2 border-r border-gray-600">
                  <div className="flex items-center gap-1">
                    <span className={status.color}>{status.icon}</span>
                    <span className="font-bold text-white">{therapist.name}</span>
                  </div>
                  <div className={`text-xs mt-1 ${status.color}`}>{status.label}</div>
                  <div className="text-xs text-gray-400">{therapist.specialty}</div>
                </div>

                {/* 📌 우측: 시간대 타임라인 */}
                <div className="relative flex-1 border-l border-gray-600" style={{ width: `${totalWidth}px` }}>
                  {/* 세션 블록들 */}
                  {slots.map((slot, idx) => {
                    const leftPixels = timeToPixels(slot.startHour, slot.startMin);
                    const widthPixels = durationToPixels(slot.durationMin);
                    const isOverflow = leftPixels + widthPixels > totalWidth;

                    return (
                      <div
                        key={idx}
                        className={`absolute top-1 bottom-1 rounded text-xs font-bold text-white border-2 ${getScheduleBlockColor(
                          slot.status
                        )} overflow-hidden`}
                        style={{
                          left: `${leftPixels}px`,
                          width: `${Math.min(widthPixels, totalWidth - leftPixels)}px`,
                          zIndex: slot.status === 'in_service' ? 10 : 5,
                        }}
                        title={`${slot.serviceName} (${slot.durationMin}분)\n${
                          slot.bedNumber ? `침대: B${slot.bedNumber}` : ''
                        }\n${slot.customerName || ''}`}
                      >
                        <div className="px-1 py-0.5 truncate">{slot.serviceName}</div>
                        {slot.bedNumber && <div className="px-1 text-xs truncate">B{slot.bedNumber}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 📌 현재 시간 마커 */}
        {currentPixels >= 0 && currentPixels <= totalWidth && (
          <div
            className="absolute top-0 bottom-0 border-2 border-red-500 pointer-events-none z-20"
            style={{
              left: `${240 + currentPixels}px`,
              height: '100%',
            }}
          >
            <div className="text-xs bg-red-500 text-white px-1">{currentTime}</div>
          </div>
        )}
      </div>

      {/* 📌 범례 */}
      <div className="mt-4 pt-4 border-t border-gray-700 flex gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 bg-blue-500 rounded"></div>
          <span>서비스중</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 bg-orange-500 rounded"></div>
          <span>예약됨</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 bg-gray-500 rounded"></div>
          <span>휴식</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-red-500"></div>
          <span>현재 시간</span>
        </div>
      </div>
    </div>
  );
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

  // 📌 뷰 모드 토글 상태
  const [viewMode, setViewMode] = useState<'beds' | 'therapists'>('beds');

  // 📌 선택된 테라피스트 (우측 패널용)
  const [selectedTherapistId, setSelectedTherapistId] = useState<number | null>(null);

  // 📌 베드/테라피스트 매칭 모달 상태
  const [assigningBedId, setAssigningBedId] = useState<number | null>(null);
  const [assigningTherapistId, setAssigningTherapistId] = useState<number | null>(null);
  const [assignStep, setAssignStep] = useState<'input' | 'matching'>('input');
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [selectedTherapistId_assign, setSelectedTherapistId_assign] = useState<number | null>(null);
  const [selectedBedId_assign, setSelectedBedId_assign] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');

  const SERVICE_TYPES = [
    { key: 'swedish', label: '스웨디시', duration: 60 },
    { key: 'thai', label: '타이', duration: 90 },
    { key: 'hotstone', label: '핫스톤', duration: 60 },
    { key: 'foot', label: '발마사지', duration: 30 },
    { key: 'aroma', label: '아로마', duration: 45 },
  ];

  // Zustand store에서 데이터 읽기
  const {
    beds: storeBeds,
    therapists: storeTherapists,
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

  // 📌 테라피스트별 스케줄 생성
  const schedules = generateTherapistSchedules(therapists, beds);

  const BedGrid = ({ roomBeds }: { roomBeds: Bed[] }) => (
    <div className="grid grid-cols-10 gap-1">
      {roomBeds.map(bed => (
        <div key={bed.id} className="relative">
          <button
            onClick={() => setAssigningBedId(bed.id)}
            className={`w-full h-16 ${getStatusColor(bed.status)} rounded-lg text-white text-xs font-bold hover:opacity-80 hover:scale-105 transition-all flex flex-col items-center justify-center p-1 border-2 ${
              assigningBedId === bed.id ? 'border-yellow-400' : 'border-gray-700'
            } cursor-pointer`}
            title={`클릭하여 배정하기`}
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

  // 📌 통합 대기 큐 패널 (예약 + 워크인)
  const CombinedQueuePanel = () => {
    const { walkInQueue, removeFromQueue, assignGuest } = useStore();
    const { bookings } = useStore();

    // 예약 중에서 "확정" 상태이고 시간이 지난 것들만 대기 큐에 표시
    const readyBookings = bookings.filter(b =>
      b.status === 'confirmed' &&
      new Date(b.scheduled_at) <= new Date()
    );

    const handleAssignWalkIn = (guestId: string) => {
      const guest = walkInQueue.find(g => g.id === guestId);
      if (!guest) return;

      const result = autoAssignByQueue(guest.requested_therapist_id, therapists, beds);
      if (!result) {
        alert('가용 테라피스트 또는 베드가 없습니다.');
        return;
      }

      assignGuest(guestId, result.therapist.id, result.bed.id);

      const bedDuration = getServiceDuration(guest.service_type) || 60;
      const updatedBeds = beds.map(b =>
        b.id === result.bed.id
          ? {
              ...b,
              status: 'in_service' as const,
              customer_name: guest.customer_name,
              therapist_name: result.therapist.name,
              service_name: guest.service_type,
              starts_at: new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }),
              ends_at: new Date(Date.now() + bedDuration * 60000).toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            }
          : b
      );

      const updatedTherapists = therapists.map(t =>
        t.id === result.therapist.id
          ? {
              ...t,
              status: 'in_service' as const,
              current_bed: result.bed.bed_number,
              remaining_minutes: bedDuration,
            }
          : t
      );

      useStore.setState({ beds: updatedBeds, therapists: updatedTherapists });
      alert(`✅ ${guest.customer_name}님을 ${result.therapist.name}에게 배정했습니다.`);
    };

    const handleAssignBooking = (bookingId: number) => {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      // 예약 손님도 유사하게 배정
      const result = autoAssignByQueue(undefined, therapists, beds);
      if (!result) {
        alert('가용 테라피스트 또는 베드가 없습니다.');
        return;
      }

      const bedDuration = booking.service_minutes;
      const updatedBeds = beds.map(b =>
        b.id === result.bed.id
          ? {
              ...b,
              status: 'in_service' as const,
              customer_name: booking.customer_name,
              therapist_name: result.therapist.name,
              service_name: booking.service_type,
              starts_at: new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }),
              ends_at: new Date(Date.now() + bedDuration * 60000).toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            }
          : b
      );

      const updatedTherapists = therapists.map(t =>
        t.id === result.therapist.id
          ? {
              ...t,
              status: 'in_service' as const,
              current_bed: result.bed.bed_number,
              remaining_minutes: bedDuration,
            }
          : t
      );

      useStore.setState({ beds: updatedBeds, therapists: updatedTherapists });
      useStore.getState().updateBookingStatus(bookingId, 'in_progress');
      alert(`✅ ${booking.customer_name}님을 ${result.therapist.name}에게 배정했습니다.`);
    };

    const waitingGuests = walkInQueue.filter(g => g.status === 'waiting');
    const totalQueue = readyBookings.length + waitingGuests.length;

    return (
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h3 className="text-sm font-bold text-blue-400 mb-3">📋 통합 대기 큐 ({totalQueue})</h3>

        {totalQueue === 0 ? (
          <div className="text-xs text-gray-500 p-2">대기 중인 손님 없음</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {/* 예약 손님 우선 */}
            {readyBookings.map((booking) => (
              <div key={`booking-${booking.id}`} className="bg-amber-900/30 p-2 rounded text-xs border-l-2 border-amber-500">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-300">
                    📅 {booking.customer_name}
                  </span>
                  <span className="text-amber-400 text-xs">{booking.service_type}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleAssignBooking(booking.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 rounded transition-colors"
                  >
                    배정
                  </button>
                </div>
              </div>
            ))}

            {/* 워크인 손님 */}
            {waitingGuests.map((guest) => (
              <div key={`walkin-${guest.id}`} className="bg-purple-900/30 p-2 rounded text-xs border-l-2 border-purple-500">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-purple-300">
                    🚶 #{guest.queue_number} {guest.customer_name || 'Guest'}
                  </span>
                  <span className="text-purple-400 text-xs">{guest.service_type}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleAssignWalkIn(guest.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 rounded transition-colors"
                  >
                    배정
                  </button>
                  <button
                    onClick={() => removeFromQueue(guest.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1 rounded transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 📌 테라피스트 배정 모달
  const TherapistAssignModal = () => {
    if (!assigningTherapistId) return null;

    const therapist = therapists.find(t => t.id === assigningTherapistId);
    if (!therapist) return null;

    const closeModal = () => {
      setAssigningTherapistId(null);
      setAssignStep('input');
      setSelectedServiceType('');
      setSelectedBedId_assign(null);
      setCustomerName('');
    };

    const autoBed = autoMatchBed(beds);
    const selectedBed = beds.find(b => b.id === selectedBedId_assign);

    const handleAssign = () => {
      if (!selectedBedId_assign) return;

      const bed = beds.find(b => b.id === selectedBedId_assign);
      if (!bed) return;

      // 베드 및 테라피스트 상태 업데이트
      const updatedBeds = beds.map(b =>
        b.id === bed.id
          ? {
              ...b,
              status: 'in_service' as const,
              customer_name: customerName || 'Guest',
              therapist_name: therapist.name,
              service_name: SERVICE_TYPES.find(s => s.key === selectedServiceType)?.label || selectedServiceType,
              starts_at: new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }),
              ends_at: new Date(Date.now() + (SERVICE_TYPES.find(s => s.key === selectedServiceType)?.duration || 60) * 60000).toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            }
          : b
      );

      const updatedTherapists = therapists.map(t =>
        t.id === therapist.id
          ? {
              ...t,
              status: 'in_service' as const,
              current_bed: bed.bed_number,
              remaining_minutes: SERVICE_TYPES.find(s => s.key === selectedServiceType)?.duration || 60,
            }
          : t
      );

      useStore.setState({ beds: updatedBeds, therapists: updatedTherapists });
      closeModal();
    };

    if (therapist.status === 'in_service') {
      // 서비스중인 테라피스트
      const bed = beds.find(b => b.therapist_name === therapist.name && b.status === 'in_service');
      const remainingTime = bed?.ends_at
        ? Math.max(0, Math.floor((new Date(bed.ends_at).getTime() - Date.now()) / 60000))
        : 0;

      return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border-2 border-blue-500 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-400">💆 {therapist.name}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="bg-blue-900/30 p-3 rounded border-l-4 border-blue-500">
                <div className="text-gray-400 text-sm">상태</div>
                <div className="text-lg font-bold text-blue-400">🔵 서비스중</div>
              </div>
              {bed && (
                <>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">침대</div>
                    <div className="text-lg font-bold text-white">{bed.room_zone} - {bed.bed_number}번</div>
                  </div>
                  {bed.customer_name && (
                    <div className="bg-gray-700 p-3 rounded">
                      <div className="text-gray-400 text-sm">👤 고객</div>
                      <div className="text-lg font-bold text-white">{bed.customer_name}</div>
                    </div>
                  )}
                  {bed.service_name && (
                    <div className="bg-gray-700 p-3 rounded">
                      <div className="text-gray-400 text-sm">서비스</div>
                      <div className="text-lg font-bold text-white">{bed.service_name}</div>
                    </div>
                  )}
                  <div className="bg-blue-900/50 p-3 rounded border-l-4 border-blue-500">
                    <div className="text-gray-400 text-sm">⏳ 남은 시간</div>
                    <div className="text-2xl font-bold text-blue-400">{remainingTime}분</div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={closeModal}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      );
    }

    // idle 테라피스트 - 배정 플로우
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full border-2 border-green-500 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-green-400">💆 {therapist.name}</h2>
            <button onClick={closeModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
          </div>

          {assignStep === 'input' ? (
            // Step 1: 입력
            <div className="space-y-4">
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-gray-400 text-sm mb-2">전문분야</div>
                <div className="text-white font-bold">{therapist.specialty}</div>
              </div>

              <div>
                <div className="text-gray-300 font-bold mb-2">서비스 선택</div>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_TYPES.map(svc => (
                    <button
                      key={svc.key}
                      onClick={() => setSelectedServiceType(svc.key)}
                      className={`p-2 rounded text-sm font-bold transition-colors ${
                        selectedServiceType === svc.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {svc.label} ({svc.duration}분)
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-bold mb-2 block">고객명 (선택)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="손님 이름..."
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (selectedServiceType) {
                      setSelectedBedId_assign(autoBed?.id || null);
                      setAssignStep('matching');
                    }
                  }}
                  disabled={!selectedServiceType}
                  className={`flex-1 font-bold py-2 rounded transition-colors ${
                    selectedServiceType
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  침대 배정
                </button>
              </div>
            </div>
          ) : (
            // Step 2: 침대 선택
            <div className="space-y-4">
              <div className="bg-blue-900/30 p-3 rounded border-l-4 border-blue-500">
                <div className="text-gray-400 text-sm mb-2">✨ 추천 침대</div>
                <div className="text-white font-bold">
                  {autoBed ? `${autoBed.room_zone} - ${autoBed.bed_number}번` : '추천 없음'}
                </div>
              </div>

              <div>
                <div className="text-gray-300 font-bold mb-2">가용 침대</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {beds
                    .filter(b => b.status === 'available')
                    .sort((a, b) => a.bed_number - b.bed_number)
                    .map(bed => (
                      <button
                        key={bed.id}
                        onClick={() => setSelectedBedId_assign(bed.id)}
                        className={`w-full p-2 rounded text-sm transition-colors text-left ${
                          selectedBedId_assign === bed.id
                            ? 'bg-blue-600 text-white border-2 border-blue-400'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent'
                        }`}
                      >
                        <div className="font-bold">{bed.room_zone} - {bed.bed_number}번</div>
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setAssignStep('input')}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded transition-colors"
                >
                  뒤로
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!selectedBedId_assign}
                  className={`flex-1 font-bold py-2 rounded transition-colors ${
                    selectedBedId_assign
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  배정 확정
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 📌 베드 배정 모달
  const BedAssignModal = () => {
    if (!assigningBedId) return null;

    const bed = beds.find(b => b.id === assigningBedId);
    if (!bed) return null;

    const closeModal = () => {
      setAssigningBedId(null);
      setAssignStep('input');
      setSelectedServiceType('');
      setSelectedTherapistId(null);
      setCustomerName('');
    };

    const autoTherapist = selectedServiceType
      ? autoMatchTherapist(selectedServiceType, therapists)
      : null;

    const handleAssign = () => {
      if (!selectedTherapistId_assign) return;

      const therapist = therapists.find(t => t.id === selectedTherapistId_assign);
      if (!therapist) return;

      // 베드 및 테라피스트 상태 업데이트
      const updatedBeds = beds.map(b =>
        b.id === bed.id
          ? {
              ...b,
              status: 'in_service' as const,
              customer_name: customerName || 'Guest',
              therapist_name: therapist.name,
              service_name: SERVICE_TYPES.find(s => s.key === selectedServiceType)?.label || selectedServiceType,
              starts_at: new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }),
              ends_at: new Date(Date.now() + (SERVICE_TYPES.find(s => s.key === selectedServiceType)?.duration || 60) * 60000).toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            }
          : b
      );

      const updatedTherapists = therapists.map(t =>
        t.id === selectedTherapistId_assign
          ? {
              ...t,
              status: 'in_service' as const,
              current_bed: bed.bed_number,
              remaining_minutes: SERVICE_TYPES.find(s => s.key === selectedServiceType)?.duration || 60,
            }
          : t
      );

      // 상태 업데이트
      useStore.setState({ beds: updatedBeds, therapists: updatedTherapists });
      closeModal();
    };

    if (bed.status === 'in_service') {
      // 서비스중인 베드 - 현재 세션 정보만 표시
      const remainingTime = bed.ends_at
        ? Math.max(0, Math.floor((new Date(bed.ends_at).getTime() - Date.now()) / 60000))
        : 0;

      return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border-2 border-blue-500 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-400">🛏️ {bed.room_zone} - {bed.bed_number}번</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="bg-blue-900/30 p-3 rounded border-l-4 border-blue-500">
                <div className="text-gray-400 text-sm">상태</div>
                <div className="text-lg font-bold text-blue-400">🔵 서비스중</div>
              </div>
              {bed.customer_name && (
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-gray-400 text-sm">👤 고객</div>
                  <div className="text-lg font-bold text-white">{bed.customer_name}</div>
                </div>
              )}
              {bed.therapist_name && (
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-gray-400 text-sm">💆 테라피스트</div>
                  <div className="text-lg font-bold text-white">{bed.therapist_name}</div>
                </div>
              )}
              {bed.service_name && (
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-gray-400 text-sm">서비스</div>
                  <div className="text-lg font-bold text-white">{bed.service_name}</div>
                </div>
              )}
              <div className="bg-blue-900/50 p-3 rounded border-l-4 border-blue-500">
                <div className="text-gray-400 text-sm">⏳ 남은 시간</div>
                <div className="text-2xl font-bold text-blue-400">{remainingTime}분</div>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      );
    }

    // available / reserved 베드 - 배정 플로우
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full border-2 border-green-500 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-green-400">🛏️ {bed.room_zone} - {bed.bed_number}번</h2>
            <button onClick={closeModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
          </div>

          {assignStep === 'input' ? (
            // Step 1: 입력
            <div className="space-y-4">
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-gray-400 text-sm mb-2">상태</div>
                <div className="text-green-400">🟢 사용 가능</div>
              </div>

              <div>
                <div className="text-gray-300 font-bold mb-2">서비스 선택</div>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_TYPES.map(svc => (
                    <button
                      key={svc.key}
                      onClick={() => setSelectedServiceType(svc.key)}
                      className={`p-2 rounded text-sm font-bold transition-colors ${
                        selectedServiceType === svc.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {svc.label} ({svc.duration}분)
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-bold mb-2 block">고객명 (선택)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="손님 이름..."
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (selectedServiceType) {
                      setSelectedTherapistId(autoTherapist?.id || null);
                      setAssignStep('matching');
                    }
                  }}
                  disabled={!selectedServiceType}
                  className={`flex-1 font-bold py-2 rounded transition-colors ${
                    selectedServiceType
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  테라피스트 배정
                </button>
              </div>
            </div>
          ) : (
            // Step 2: 매칭 확인/수정
            <div className="space-y-4">
              <div className="bg-blue-900/30 p-3 rounded border-l-4 border-blue-500">
                <div className="text-gray-400 text-sm mb-2">✨ 추천 테라피스트</div>
                <div className="text-white font-bold">
                  {autoTherapist ? `${autoTherapist.name} (${autoTherapist.specialty})` : '추천 없음'}
                </div>
              </div>

              <div>
                <div className="text-gray-300 font-bold mb-2">대기 중인 테라피스트</div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {therapists
                    .filter(t => t.status === 'idle')
                    .map(therapist => (
                      <button
                        key={therapist.id}
                        onClick={() => setSelectedTherapistId_assign(therapist.id)}
                        className={`p-2 rounded text-sm transition-colors ${
                          selectedTherapistId_assign === therapist.id
                            ? 'bg-blue-600 text-white border-2 border-blue-400'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent'
                        }`}
                      >
                        <div className="font-bold">{therapist.name}</div>
                        <div className="text-xs">{therapist.specialty}</div>
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setAssignStep('input')}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded transition-colors"
                >
                  뒤로
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!selectedTherapistId_assign}
                  className={`flex-1 font-bold py-2 rounded transition-colors ${
                    selectedTherapistId_assign
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  배정 확정
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 데이터가 없고 로딩 중이면
  if (isLoading && beds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">🔄 데이터 로드 중...</div>
          <div className="text-gray-400">첫 로드 중입니다.</div>
        </div>
      </div>
    );
  }

  // 오류 상태이지만 로컬 데이터가 있으면 계속 표시
  if (error && beds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4 text-red-400">❌ 연결 오류</div>
          <div className="text-gray-400">저장된 데이터가 없습니다. 네트워크를 확인해주세요.</div>
        </div>
      </div>
    );
  }

  // 오류가 있으면 상단에 경고 배너 표시
  const isUsingStaleData = error && beds.length > 0;

  // ============================================================
  // 📌 워크인 모달 제출 핸들러
  // ============================================================
  const handleWalkInSubmit = (data: WalkInBookingRequest) => {
    const { addToQueue } = useStore.getState();

    // 워크인 큐에 추가
    const guestId = addToQueue({
      service_type: data.serviceType,
      customer_name: data.customerName || 'Walk-in Guest',
      requested_therapist_id: data.requested_therapist_id,
    });

    // 성공 알림
    console.log(`✅ 워크인 손님 큐 추가 완료: ${guestId}`);
    alert(`✅ 워크인 손님이 대기열에 추가되었습니다.\n(${data.customerName || 'Walk-in Guest'})`);
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

        {/* 📌 뷰 모드 토글 탭 */}
        <div className="flex gap-2 mb-4 border-b border-gray-700">
          <button
            onClick={() => setViewMode('beds')}
            className={`px-4 py-2 font-bold transition-colors ${
              viewMode === 'beds'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🛏️ 베드별 보기
          </button>
          <button
            onClick={() => setViewMode('therapists')}
            className={`px-4 py-2 font-bold transition-colors ${
              viewMode === 'therapists'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📅 테라피스트별 스케줄
          </button>
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

      {/* 📌 뷰 모드별 콘텐츠 */}
      {viewMode === 'beds' ? (
        // 베드별 보기 (기존 레이아웃)
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

          {/* 📌 통합 대기 큐 패널 */}
          <CombinedQueuePanel />

            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="bg-blue-900/30 p-3 rounded text-sm">
                <div className="font-bold text-blue-300">다음 배정 대상</div>
                <div className="mt-1">Jessica (즉시 가능)</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // 테라피스트별 스케줄 보기 + 예약자 리스트 패널
        <div className="flex gap-0 overflow-hidden">
          <div className="flex-1">
            <TherapistScheduleView
              therapists={therapists}
              schedules={schedules}
              onTherapistClick={therapistId => {
                setSelectedTherapistId(therapistId);
                setAssigningTherapistId(therapistId);
              }}
            />
          </div>
          <TherapistReservationPanel
            selectedTherapistId={selectedTherapistId}
            therapists={therapists}
            bookings={bookings}
          />
        </div>
      )}

      {/* 📌 범례 (베드별 보기에서만 표시) */}
      {viewMode === 'beds' && (
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
      )}

      {/* 📌 베드 배정 모달 */}
      <BedAssignModal />

      {/* 📌 테라피스트 배정 모달 */}
      <TherapistAssignModal />
    </div>
  );
}
