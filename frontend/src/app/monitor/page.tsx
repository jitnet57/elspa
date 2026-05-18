'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { WalkInBookingRequest } from '@/components/WalkInBookingModal';
import { useMonitorPolling, classifyBedsByRoom } from '@/hooks/useMonitorPolling';
import { useFullStoreSync } from '@/hooks/useStoreSync';
import { useStore } from '@/lib/store/store';
import { getTranslations } from '@/lib/translations';
import { NotificationCenter } from '@/components/NotificationCenter';
import { useWalkInMatching, getServiceDuration } from '@/hooks/useWalkInMatching';
import { MobileHeader } from '@/components/MobileHeader';

// 동적 로드할 컴포넌트들
const WalkInBookingModal = dynamic(
  () => import('@/components/WalkInBookingModal').then(mod => ({ default: mod.WalkInBookingModal })),
  { loading: () => null }
);

const MobileDrawer = dynamic(() => import('@/components/MobileDrawer').then(mod => ({ default: mod.MobileDrawer })), {
  loading: () => null,
});

const MobileBedCard = dynamic(() => import('@/components/MobileBedCard').then(mod => ({ default: mod.MobileBedCard })), {
  loading: () => null,
});

const MobileBottomTabBar = dynamic(() => import('@/components/MobileBottomTabBar').then(mod => ({ default: mod.MobileBottomTabBar })), {
  loading: () => null,
});

const WalkInQueuePanel = dynamic(() => import('@/components/WalkInQueuePanel').then(mod => ({ default: mod.WalkInQueuePanel })), {
  loading: () => null,
});

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

// No longer needed (Provided by Mock API)
const generateMockBeds = (): Bed[] => {
  const beds: Bed[] = [];
  let bedId = 1;
  const customerNames = ['Min Jun Kim', 'Su Yeon Lee', 'Hyun Jun Jung', 'Ji Eun Park', 'Jun Ho Choi', 'Ji Eun Kang', 'Jun Young Lee', 'Su Hyun Kim', 'Min Su Park', 'Young Hee Lee'];
  const therapistNames = ['Yujin Park', 'Jung Eun Choi', 'So Young Lee', 'Tae Hee Kim', 'Ji Yeon Kang', 'Min Kyung Park', 'Da Hyun Lim', 'Ji Won Yu'];
  const serviceNames = ['Swedish 60 min', 'Thai Massage 90 min', 'Hot Stone 60 min', 'Foot Massage 30 min', 'Aromatherapy 45 min'];

  for (let i = 1; i <= 30; i++) {
    const status = ['available', 'reserved', 'in_service', 'cleaning'][Math.floor(Math.random() * 4)] as any;
    beds.push({
      id: bedId,
      bed_number: i,
      room_zone: 'Massage Room 1',
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
      room_zone: 'Massage Room 2',
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
      room_zone: 'VIP Room',
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
      room_zone: 'Couple Room',
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
  { id: 1, name: 'Elena Park', status: 'in_service', current_bed: 5, remaining_minutes: 17, specialty: 'Swedish' },
  { id: 2, name: 'Jessica Choi', status: 'in_service', current_bed: 12, remaining_minutes: 32, specialty: 'Thai Massage' },
  { id: 3, name: 'Sophie Lee', status: 'idle', specialty: 'Hot Stone' },
  { id: 4, name: 'Grace Kim', status: 'in_service', current_bed: 18, remaining_minutes: 5, specialty: 'Foot Massage' },
  { id: 5, name: 'Michelle Kang', status: 'resting', remaining_minutes: 10, specialty: 'Aromatherapy' },
  { id: 6, name: 'Victoria Park', status: 'idle', specialty: 'General' },
  { id: 7, name: 'Hannah Lim', status: 'idle', specialty: 'Stone Therapy' },
  { id: 8, name: 'Rachel Yoo', status: 'in_service', current_bed: 28, remaining_minutes: 22, specialty: 'Thai Massage' },
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
      return 'Available';
    case 'reserved':
      return 'Reserved';
    case 'in_service':
      return 'In Service';
    case 'cleaning':
      return 'Cleaning';
    default:
      return 'Unknown';
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

  // 📌 Multi-language support
  const { language } = useStore();
  const t = getTranslations(language);

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

  // 📌 Walk-in guest matching hook
  const { walkInBookings, createWalkInBooking } = useWalkInMatching();

  // 📌 Walk-in modal state
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  // 📌 Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // 📌 Status change (password confirmation) modal
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    bedId: null as number | null,
    newStatus: null as string | null,
    password: '',
    error: '',
  });

  // Read data from Zustand store
  const {
    beds: storeBeds,
    therapists: storeTherapists,
    selectedBedId,
    isDetailModalOpen,
    openDetailModal,
    closeDetailModal,
    addChangeLog,
  } = useStore();

  // Use store if latest, otherwise use polling data
  const beds = storeBeds.length > 0 ? storeBeds : pollingBeds;
  const therapists = storeTherapists.length > 0 ? storeTherapists : pollingTherapists;

  const [currentTime, setCurrentTime] = useState<string>('');
  const [viewMode, setViewMode] = useState<'beds' | 'schedule'>('beds');
  const [scheduleDate, setScheduleDate] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Classify beds by room
  const bedsByRoom = classifyBedsByRoom(beds);

  const BedGrid = ({ roomBeds }: { roomBeds: Bed[] }) => (
    <div className="grid grid-cols-10 gap-1">
      {roomBeds.map(bed => (
        <div key={bed.id} className="relative">
          <button
            onClick={() => {
              // If bed is empty, open walk-in modal directly
              if (bed.status === 'available') {
                useStore.setState({ selectedBedId: bed.id });
                setIsWalkInModalOpen(true);
              } else {
                // Otherwise, open detail information modal
                openDetailModal(bed.id);
              }
            }}
            className={`w-full h-16 ${getStatusColor(bed.status)} rounded-lg text-white text-xs font-bold hover:opacity-80 hover:scale-105 transition-all flex flex-col items-center justify-center p-1 border-2 ${
              selectedBedId === bed.id ? 'border-yellow-400' : 'border-gray-700'
            } cursor-pointer`}
            title={bed.status === 'available' ? 'Click to add Massage' : 'Click for details'}
          >
            <div className="font-bold">Bed {bed.bed_number}</div>
            {bed.status === 'in_service' && bed.customer_name && (
              <div className="text-xs truncate w-full text-center">{bed.customer_name}</div>
            )}
            {bed.status === 'reserved' && bed.customer_name && (
              <div className="text-xs truncate w-full text-center">{bed.customer_name}</div>
            )}
            {bed.status === 'available' && (
              <div className="text-xs font-bold">➕ Massage</div>
            )}
          </button>
        </div>
      ))}
    </div>
  );

  // Modal component
  const DetailModal = () => {
    if (!isDetailModalOpen || !selectedBedId) return null;

    const selectedBed = beds.find(b => b.id === selectedBedId);
    if (!selectedBed) return null;

    const remainingTime = selectedBed.ends_at
      ? Math.max(0, Math.floor((new Date(selectedBed.ends_at).getTime() - Date.now()) / 60000))
      : 0;

    const getStatusDisplay = () => {
      const statusMap: { [key: string]: { label: string; color: string; emoji: string } } = {
        'in_service': { label: t.bedStatus.inService, color: 'text-blue-400', emoji: '🔵' },
        'reserved': { label: t.bedStatus.reserved, color: 'text-orange-400', emoji: '🟠' },
        'available': { label: t.bedStatus.available, color: 'text-green-400', emoji: '🟢' },
        'cleaning': { label: t.bedStatus.cleaning, color: 'text-gray-400', emoji: '⚫' },
      };
      const status = statusMap[selectedBed.status] || { label: t.bedStatus.unknown, color: 'text-gray-500', emoji: '❓' };
      return `${status.emoji} ${status.label}`;
    };

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full border-2 border-blue-300 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Bed {selectedBed.bed_number}</h2>
            <button
              onClick={() => closeDetailModal()}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 mb-6">
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <div className="text-gray-600 text-sm font-semibold">Location</div>
              <div className="text-lg font-bold text-gray-900">{selectedBed.room_zone}</div>
            </div>

            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <div className="text-gray-600 text-sm font-semibold">Status</div>
              <div className="text-lg font-bold text-gray-900">{getStatusDisplay()}</div>
            </div>

            {selectedBed.customer_name && (
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <div className="text-gray-600 text-sm font-semibold">👤 Customer</div>
                <div className="text-lg font-bold text-gray-900">{selectedBed.customer_name}</div>
              </div>
            )}

            {selectedBed.therapist_name && (
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <div className="text-gray-600 text-sm font-semibold">💆 Therapist</div>
                <div className="text-lg font-bold text-gray-900">{selectedBed.therapist_name}</div>
              </div>
            )}

            {selectedBed.service_name && (
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <div className="text-gray-600 text-sm font-semibold">💆‍♀️ Service</div>
                <div className="text-lg font-bold text-gray-900">{selectedBed.service_name}</div>
              </div>
            )}

            {selectedBed.starts_at && (
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <div className="text-gray-600 text-sm font-semibold">⏰ Start Time</div>
                <div className="text-lg font-bold text-gray-900">{selectedBed.starts_at}</div>
              </div>
            )}

            {selectedBed.ends_at && (
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <div className="text-gray-600 text-sm font-semibold">⏱️ End Time</div>
                <div className="text-lg font-bold text-gray-900">{selectedBed.ends_at}</div>
              </div>
            )}

            {selectedBed.status === 'in_service' && (
              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-300">
                <div className="text-blue-700 text-sm font-semibold">⏳ Remaining</div>
                <div className="text-2xl font-bold text-blue-600">{remainingTime} min</div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {selectedBed.status === 'available' && (
              <button
                onClick={() => {
                  setIsWalkInModalOpen(true);
                  closeDetailModal();
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 rounded-lg transition-all hover:shadow-lg"
              >
                ➕ {language === 'en' ? 'Start Massage' : 'Massage 시작'}
              </button>
            )}

            {(selectedBed.status === 'in_service' || selectedBed.status === 'reserved') && (
              <>
                <button
                  onClick={() => handleBedStatusChange(selectedBed.id, 'available')}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 rounded-lg transition-all hover:shadow-lg"
                  title="Change status to Available (requires password)"
                >
                  ✓ {language === 'en' ? 'Mark Available' : '사용가능으로 변경'}
                </button>
                {selectedBed.status === 'in_service' && (
                  <button
                    onClick={() => handleBedStatusChange(selectedBed.id, 'cleaning')}
                    className="flex-1 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white font-bold py-2 rounded-lg transition-all hover:shadow-lg"
                    title="Change status to Cleaning (requires password)"
                  >
                    🧹 {language === 'en' ? 'Cleaning' : '정리중'}
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => closeDetailModal()}
              className={`${
                selectedBed.status !== 'available' && selectedBed.status !== 'in_service' && selectedBed.status !== 'reserved'
                  ? 'w-full'
                  : 'flex-1'
              } bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded-lg transition-colors`}
            >
              {language === 'en' ? 'Close' : '닫기'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">🔄 Loading Real-time Data...</div>
          <div className="text-gray-400">Polling bed status every 5 seconds.</div>
        </div>
      </div>
    );
  }

  // 오류 상태 표시
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4 text-red-400">❌ Data Retrieval Error</div>
          <div className="text-gray-400">{error.message}</div>
        </div>
      </div>
    );
  }

  // ============================================================
  // 📌 상태 변경 핸들러
  // ============================================================
  const handleBedStatusChange = (bedId: number, newStatus: string) => {
    // 비밀번호 모달 열기
    setPasswordModal({
      isOpen: true,
      bedId,
      newStatus,
      password: '',
      error: '',
    });
  };

  const handlePasswordConfirm = () => {
    const ADMIN_PASSWORD = '1234'; // 실제로는 API에서 검증

    if (passwordModal.password !== ADMIN_PASSWORD) {
      setPasswordModal(prev => ({ ...prev, error: 'Invalid password' }));
      return;
    }

    // 기존 상태 찾기
    const bed = beds.find(b => b.id === passwordModal.bedId);
    if (!bed) return;

    const previousStatus = bed.status;
    const newStatus = passwordModal.newStatus || 'available';

    // 상태 변경 로그 기록
    addChangeLog({
      bedId: passwordModal.bedId!,
      bedNumber: bed.bed_number,
      previousStatus,
      newStatus,
      previousCustomer: bed.customer_name,
      adminName: 'Admin User', // 실제로는 현재 로그인한 관리자 이름
      reason: `Status changed from ${previousStatus} to ${newStatus}`,
    });

    // 실제 상태 변경 (API 호출)
    console.log(`✅ Bed ${bed.bed_number}: ${previousStatus} → ${newStatus}`);

    // 모달 닫기
    setPasswordModal({
      isOpen: false,
      bedId: null,
      newStatus: null,
      password: '',
      error: '',
    });
    closeDetailModal();
  };

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

    // Success notification
    console.log(`✅ Walk-in Booking Confirmed: ${bookingId}`);
    alert(`✅ Walk-in guest has been booked.\nBeds: ${data.suggestedBeds.join(', ')}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <NotificationCenter />

      {/* 📌 모바일 헤더 */}
      <MobileHeader
        onMenuClick={() => setIsMobileDrawerOpen(true)}
        title="✨ ELSPA Monitor"
        rightContent={<div className="text-xl font-mono">{currentTime}</div>}
      />

      {/* 📌 모바일 드로어 (Therapist 현황) */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-blue-400 border-b border-gray-700 pb-2">
            Therapist Status
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Checked In: {therapistStats.checkedIn} / Total: {therapistStats.total}</span>
              <span className="text-green-400 font-bold">Waiting: {therapistStats.idle}</span>
            </div>
            <div className="text-gray-400 text-xs">
              In Service: {therapistStats.in_service} | Break: {therapistStats.resting}
            </div>
          </div>

          {/* 예측 Information */}
          {predictions && (
            <div className="bg-blue-900/30 p-3 rounded border-l-4 border-blue-500">
              <div className="text-xs text-gray-400 mb-1">⏳ Average Wait Time</div>
              <div className="text-lg font-bold text-blue-400">{predictions.average_wait_minutes || 0} min</div>
              {predictions.next_available_therapist && (
                <div className="text-xs text-gray-400 mt-2">
                  Next Available: <span className="text-green-400 font-bold">{predictions.next_available_therapist.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Therapist 목록 */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <div className="text-xs font-bold text-gray-300 border-b border-gray-700 pb-2">
              All Therapists
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
                    {therapist.status === 'idle' ? '[Available Now]' : ''}
                    {therapist.status === 'in_service' && `${therapist.remaining_minutes} min ↓`}
                    {therapist.status === 'resting' && '[Break]'}
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
        <div className="bg-white border-b border-gray-200 p-4 flex gap-2 justify-between items-center sticky top-12 lg:top-0 z-30 shadow-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('beds')}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                viewMode === 'beds'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🛏️ Real-time Bed Mode
            </button>
            <button
              onClick={() => setViewMode('schedule')}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                viewMode === 'schedule'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Therapist Daily Schedule
            </button>
          </div>

          {/* 언어 선택 & 어드민 아이콘 */}
          <div className="flex items-center gap-2">
            {/* 언어 선택 버튼 */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => useStore.setState({ language: 'en' })}
                className={`px-3 py-1 rounded font-bold transition-all text-sm ${
                  useStore.getState().language === 'en'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => useStore.setState({ language: 'ko' })}
                className={`px-3 py-1 rounded font-bold transition-all text-sm ${
                  useStore.getState().language === 'ko'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                KO
              </button>
            </div>

            {/* 어드민 아이콘 버튼 */}
            <a
              href="/admin"
              className="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-700 hover:text-gray-900 hover:shadow-md"
              title="Admin Page"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
          </div>
        </div>

        {/* 데스크톱용 헤더 */}
        <div className="hidden lg:block mb-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">✨ ELSPA Real-time Monitor</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                🔄 Polls: {refetchCount} | ⏱️ {lastRefetch?.toLocaleTimeString('en-US', { hour12: false })}
              </div>
              {/* 📌 워크인 추가 버튼 (침대 모드에서만) */}
              {viewMode === 'beds' && (
                <button
                  onClick={() => setIsWalkInModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg transition-all hover:shadow-lg"
                >
                  + Add Walk-in
                </button>
              )}
              <div className="text-2xl font-mono text-gray-900 bg-gray-100 px-4 py-1 rounded-lg">{currentTime}</div>
            </div>
          </div>
          {viewMode === 'beds' && (
            <div className="grid grid-cols-4 gap-4 text-lg">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                <div className="text-green-700 font-bold text-sm">Available</div>
                <div className="text-3xl font-bold text-green-600">{bedStats.available}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                <div className="text-blue-700 font-bold text-sm">In Service</div>
                <div className="text-3xl font-bold text-blue-600">{bedStats.in_service}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 text-center">
                <div className="text-orange-700 font-bold text-sm">Reserved</div>
                <div className="text-3xl font-bold text-orange-600">{bedStats.reserved}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-300 text-center">
                <div className="text-gray-700 font-bold text-sm">Cleaning</div>
                <div className="text-3xl font-bold text-gray-600">{bedStats.cleaning}</div>
              </div>
            </div>
          )}
        </div>

        {/* 모바일용 헤더 (침대 모드) */}
        {viewMode === 'beds' && (
          <div className="lg:hidden mb-4 bg-white p-4 rounded-lg mx-4 mt-4 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
                <div className="text-green-700 font-bold text-xs">Available</div>
                <div className="text-2xl font-bold text-green-600">{bedStats.available}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
                <div className="text-blue-700 font-bold text-xs">In Service</div>
                <div className="text-2xl font-bold text-blue-600">{bedStats.in_service}</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center border border-orange-200">
                <div className="text-orange-700 font-bold text-xs">Reserved</div>
                <div className="text-2xl font-bold text-orange-600">{bedStats.reserved}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-300">
                <div className="text-gray-700 font-bold text-xs">Cleaning</div>
                <div className="text-2xl font-bold text-gray-600">{bedStats.cleaning}</div>
              </div>
            </div>
          </div>
        )}

        {/* 데스크톱 레이아웃 (침대 모드) */}
        {viewMode === 'beds' && (
        <div className="hidden lg:grid grid-cols-5 gap-6 p-6 bg-gradient-to-br from-white to-gray-50">
          <div className="col-span-3 space-y-6">
            {Object.entries(bedsByRoom).map(([roomName, roomBeds]) =>
              roomBeds.length > 0 ? (
                <div key={roomName} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 border-b border-gray-200 pb-3">{roomName} ({roomBeds.length})</h2>
                  <BedGrid roomBeds={roomBeds} />
                </div>
              ) : null
            )}
          </div>

          <div className="col-span-2 space-y-4">
            {/* Therapist 현황 카드 */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Therapist Status</h2>

              <div className="grid grid-cols-2 gap-3 mb-5 pb-4 border-b border-gray-200">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Checked In</div>
                  <div className="text-2xl font-bold text-green-600">{therapistStats.checkedIn}/{therapistStats.total}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Waiting</div>
                  <div className="text-2xl font-bold text-blue-600">{therapistStats.idle}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="text-gray-700">In Service: <span className="font-bold">{therapistStats.in_service}</span></div>
                <div className="text-gray-700">Break: <span className="font-bold">{therapistStats.resting}</span></div>
              </div>
            </div>

            {/* 예측 Information */}
            {predictions && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-600 mb-2">⏳ Average Wait Time</div>
                <div className="text-3xl font-bold text-blue-700 mb-3">{predictions.average_wait_minutes || 0} min</div>
                {predictions.next_available_therapist && (
                  <div className="text-sm text-gray-700">
                    다음 가용: <span className="font-bold text-green-600">{predictions.next_available_therapist.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Therapist 목록 */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">Therapist 상태</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {therapists.map(therapist => (
                  <div key={therapist.id} className={`p-3 rounded-lg border transition ${
                    therapist.status === 'idle' ? 'bg-green-50 border-green-200' :
                    therapist.status === 'in_service' ? 'bg-blue-50 border-blue-200' :
                    therapist.status === 'resting' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg ${
                          therapist.status === 'idle' ? 'text-green-600' :
                          therapist.status === 'in_service' ? 'text-blue-600' :
                          therapist.status === 'resting' ? 'text-yellow-600' :
                          'text-gray-500'
                        }`}>
                          {therapist.status === 'idle' && '●'}
                          {therapist.status === 'in_service' && '◆'}
                          {therapist.status === 'resting' && '○'}
                          {therapist.status === 'checked_out' && '✕'}
                        </span>
                        <span className="font-bold text-sm text-gray-900">{therapist.name}</span>
                      </div>
                      <span className={`text-xs font-bold ${
                        therapist.status === 'idle' ? 'text-green-600' :
                        therapist.status === 'in_service' ? 'text-blue-600' :
                        therapist.status === 'resting' ? 'text-yellow-600' :
                        'text-gray-500'
                      }`}>
                        {therapist.status === 'idle' ? '[즉시가용]' : ''}
                        {therapist.status === 'in_service' && `B${therapist.current_bed}`}
                        {therapist.status === 'resting' && '[휴식중]'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1 ml-7">{therapist.specialty}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 다음 배정 대상 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200">
              <div className="font-bold text-gray-900">다음 배정 대상</div>
              <div className="text-lg font-bold text-purple-600 mt-2">이소영</div>
              <div className="text-sm text-gray-600">(즉시 가능)</div>
            </div>
          </div>
        </div>
        )}

        {/* 워크인 대기 패널 */}
        {viewMode === 'beds' && <WalkInQueuePanel />}

        {/* 모바일 레이아웃 (침대 모드) */}
        {viewMode === 'beds' && (
        <div className="lg:hidden px-4 pb-32 space-y-5 mt-4 bg-gradient-to-b from-white to-gray-50 -mx-4 px-4 py-4">
          {Object.entries(bedsByRoom).map(([roomName, roomBeds]) =>
            roomBeds.length > 0 ? (
              <div key={roomName}>
                <h2 className="text-lg font-bold mb-3 text-gray-900 sticky top-12 bg-white/95 py-2 px-2 -mx-2 rounded-lg border-b border-gray-200">
                  {roomName} ({roomBeds.length}개)
                </h2>
                <div className="space-y-3">
                  {roomBeds.map(bed => (
                    <div
                      key={bed.id}
                      onClick={() => openDetailModal(bed.id)}
                      className="cursor-pointer active:scale-95 transition-transform"
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
        <div className="hidden lg:block mt-8 p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">침대 상태 범례</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-6 h-6 bg-green-500 rounded-lg flex-shrink-0"></div>
              <span className="text-sm text-gray-700">비어있음 (사용 가능)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-6 h-6 bg-blue-500 rounded-lg flex-shrink-0"></div>
              <span className="text-sm text-gray-700">서비스중 (타이머)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="w-6 h-6 bg-orange-500 rounded-lg animate-pulse flex-shrink-0"></div>
              <span className="text-sm text-gray-700">예약됨 (Customer 곧 도착)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-300">
              <div className="w-6 h-6 bg-gray-500 rounded-lg flex-shrink-0"></div>
              <span className="text-sm text-gray-700">정리중 (청소/정리)</span>
            </div>
          </div>
        </div>
        )}

        {/* 일일 스케줄 모드 */}
        {viewMode === 'schedule' && (
        <div className="p-4 lg:p-8 space-y-6 bg-white rounded-lg">
          {/* 헤더 */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-400 to-blue-300 p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-4">
              <button onClick={() => setScheduleDate(d => new Date(d.getTime() - 86400000))} className="text-2xl text-blue-700 hover:text-blue-900 transition">&lt;</button>
              <span className="text-xl font-bold text-blue-900 min-w-[300px]">{scheduleDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', weekday: 'short' })}</span>
              <button onClick={() => setScheduleDate(d => new Date(d.getTime() + 86400000))} className="text-2xl text-blue-700 hover:text-blue-900 transition">&gt;</button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsWalkInModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm rounded-lg transition-all hover:shadow-lg"
              >
                + {language === 'en' ? 'Start New Massage' : 'Massage 시작'}
              </button>
            </div>
          </div>

          {/* 스케줄 그리드 */}
          <div className="bg-white rounded-lg overflow-x-auto border border-gray-200 max-h-[60vh] overflow-y-auto">
            <div className="inline-block min-w-full">
              {/* 헤더 - 고정 */}
              <div className="flex border-b border-gray-200 sticky top-0 bg-white z-20">
                <div className="w-40 flex-shrink-0 px-4 py-3 font-bold text-gray-700 bg-gray-50 sticky left-0 z-30">{t.scheduleLabels.therapists}</div>
                <div className="flex bg-white">
                  {Array.from({ length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 px-2 py-3 text-center text-sm font-bold text-gray-600 border-r border-gray-200 bg-gray-50"
                      style={{ width: SCHEDULE_COLUMN_WIDTH }}
                    >
                      {String(SCHEDULE_START_HOUR + i).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Therapist 행 */}
              {MOCK_SCHEDULE_THERAPISTS.map(therapist => (
                <div key={therapist.id} className="flex border-b border-gray-200 hover:bg-gray-50 transition">
                  {/* Therapist Information */}
                  <div className="w-40 flex-shrink-0 px-4 py-4 bg-gray-50 sticky left-0 z-5 border-r border-gray-200 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${therapist.avatarColor} flex items-center justify-center text-white font-bold text-sm`}>
                      {therapist.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{therapist.name}</div>
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
                          className="flex-shrink-0 px-1 py-4 border-r border-gray-200 relative bg-white hover:bg-gray-50 transition"
                          style={{ width: SCHEDULE_COLUMN_WIDTH }}
                        >
                          {cellSessions.map(session => (
                            <div
                              key={session.id}
                              className={`absolute rounded-md border-2 text-xs p-1 text-gray-700 ${SCHEDULE_SERVICE_CONFIG[session.serviceType as keyof typeof SCHEDULE_SERVICE_CONFIG].bg}`}
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

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-700">
            💡 <span className="text-blue-900 font-semibold">모니터에서 일정을 보기만 할 수 있습니다. 상세 편집은 어드민 사이트를 사용하세요.</span>
          </div>
        </div>
        )}
      </div>

      {/* 모바일 하단 탭 바 */}
      <MobileBottomTabBar
        tabs={[
          { label: '모니터', icon: '📊', href: '/monitor', active: true },
          { label: 'Therapist', icon: '👥', href: '/admin/therapists' },
          { label: '배정', icon: '⚙️', href: '/admin/matching' },
        ]}
        onWalkInAdd={() => setIsWalkInModalOpen(true)}
      />

      {/* 상세 Information 모달 */}
      <DetailModal />

      {/* 비밀번호 확인 모달 */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full border-2 border-red-300 shadow-2xl">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              🔐 {language === 'en' ? 'Security Confirmation' : '보안 확인'}
            </h2>

            <p className="text-gray-600 mb-4">
              {language === 'en'
                ? 'Enter admin password to change bed status'
                : '침대 상태를 변경하려면 관리자 비밀번호를 입력하세요'}
            </p>

            <input
              type="password"
              value={passwordModal.password}
              onChange={(e) =>
                setPasswordModal(prev => ({
                  ...prev,
                  password: e.target.value,
                  error: '',
                }))
              }
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordConfirm()}
              placeholder={language === 'en' ? 'Enter password' : '비밀번호 입력'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />

            {passwordModal.error && (
              <p className="text-red-600 text-sm mb-4">❌ {passwordModal.error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setPasswordModal({
                    isOpen: false,
                    bedId: null,
                    newStatus: null,
                    password: '',
                    error: '',
                  })
                }
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded-lg transition-colors"
              >
                {language === 'en' ? 'Cancel' : '취소'}
              </button>
              <button
                onClick={handlePasswordConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors"
              >
                {language === 'en' ? 'Confirm' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
