/**
 * 마사지 예약 Mock 데이터
 * 베드, 테라피스트, 예약 정보
 * 작성일: 2026-05-26
 */

export interface TherapyBed {
  id: string;
  name: string;
  roomNumber: string;
  room: 'room1' | 'room2' | 'room3' | 'room4';
  type: 'massage' | 'spa' | 'facial' | 'premium';
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  capacity: number;
  therapistId?: string;
  serviceName?: string;
  endTime?: string;
}

export interface Therapist {
  id: string;
  name: string;
  specialties: string[];
  avatar: string;
  status: 'available' | 'busy' | 'break' | 'offline';
  experience: number; // years
  rating: number; // 1-5
}

export interface MassageService {
  id: string;
  name: string;
  duration: number; // minutes (기본값 또는 첫 번째 옵션)
  price: number; // 기본값 또는 첫 번째 옵션 가격
  description: string;
  therapistRequired: boolean;
  // 시간별 가격 옵션 (선택사항)
  durationOptions?: Array<{ duration: number; price: number }>;
}

export interface TimeSlot {
  id: string;
  bedId: string;
  therapistId: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  serviceId: string;
  clientName: string;
  clientPhone: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  date: string; // YYYY-MM-DD
  notes: string;
}

export interface BedGroup {
  id: string;
  name: string;
  description?: string;
  bedIds: string[]; // bed IDs in this group
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 86개 베드 생성 함수: 마사지실1(30), 마사지실2(30), VIP실(14), 기타실(12)
// ============================================================
const generateBeds = (): TherapyBed[] => {
  const beds: TherapyBed[] = [];
  let bedId = 1;

  // 마사지실1 (A-1 ~ A-30, room1)
  for (let i = 1; i <= 30; i++) {
    const isOccupied = i === 1 || i === 4 || i === 7;
    beds.push({
      id: `BED-${String(bedId).padStart(3, '0')}`,
      name: `A-${i}`,
      roomNumber: `Room1-A${i}`,
      room: 'room1',
      type: i % 5 === 0 ? 'spa' : i % 12 === 0 ? 'premium' : i % 8 === 0 ? 'facial' : 'massage',
      status: i === 5 || i === 26 ? 'cleaning' : isOccupied ? 'occupied' : 'available',
      capacity: i % 12 === 0 ? 2 : 1,
      ...(i === 1 && { therapistId: 'THER-001', serviceName: 'Thai Massage', endTime: '10:15' }),
      ...(i === 4 && { therapistId: 'THER-002', serviceName: 'Swedish Massage', endTime: '14:00' }),
      ...(i === 7 && { therapistId: 'THER-003', serviceName: 'Aromatherapy', endTime: '15:30' }),
    });
    bedId++;
  }

  // 마사지실2 (B-1 ~ B-30, room2)
  for (let i = 1; i <= 30; i++) {
    const isOccupied = i === 2 || i === 7;
    beds.push({
      id: `BED-${String(bedId).padStart(3, '0')}`,
      name: `B-${i}`,
      roomNumber: `Room2-B${i}`,
      room: 'room2',
      type: i % 5 === 0 ? 'spa' : i % 10 === 0 ? 'premium' : i % 8 === 0 ? 'facial' : 'massage',
      status: i === 11 ? 'cleaning' : isOccupied ? 'occupied' : 'available',
      capacity: i % 10 === 0 ? 2 : 1,
      ...(i === 2 && { therapistId: 'THER-004', serviceName: 'Deep Tissue', endTime: '16:30' }),
      ...(i === 7 && { therapistId: 'THER-005', serviceName: 'Hot Stone', endTime: '17:45' }),
    });
    bedId++;
  }

  // VIP실 (V-1 ~ V-14, room3)
  for (let i = 1; i <= 14; i++) {
    beds.push({
      id: `BED-${String(bedId).padStart(3, '0')}`,
      name: `V-${i}`,
      roomNumber: `VIP-V${i}`,
      room: 'room3',
      type: 'premium',
      status: 'available',
      capacity: 2,
    });
    bedId++;
  }

  // 기타실 (E-1 ~ E-12, room4)
  for (let i = 1; i <= 12; i++) {
    beds.push({
      id: `BED-${String(bedId).padStart(3, '0')}`,
      name: `E-${i}`,
      roomNumber: `ETC-E${i}`,
      room: 'room4',
      type: 'massage',
      status: 'available',
      capacity: 1,
    });
    bedId++;
  }

  return beds;
};

export const therapyBeds: TherapyBed[] = generateBeds();

// ============================================================
// 테라피스트 (초기화)
// ============================================================
export const therapists: Therapist[] = [];

// ============================================================
// 마사지 서비스 — EL SPA 메뉴판 기준 (2026-06-03)
// 시간별 가격 옵션 포함 (60m / 90m / 120m)
// ============================================================
export const massageServices: MassageService[] = [
  // ── 스톤 마사지 ───────────────────────────────────────────
  {
    id: 'SVC-001',
    name: 'Hawaii Pink Stone',
    duration: 90,
    price: 2500,
    description: '하와이안 핑크 스톤 마사지',
    therapistRequired: true,
    durationOptions: [
      { duration: 90, price: 2500 },
      { duration: 120, price: 3300 },
    ],
  },
  {
    id: 'SVC-002',
    name: 'Vulcaner Black Stone (Hot)',
    duration: 90,
    price: 1700,
    description: '불카너 블랙 스톤 (핫) 마사지',
    therapistRequired: true,
    durationOptions: [
      { duration: 90, price: 1700 },
      { duration: 120, price: 2200 },
    ],
  },

  // ── 테라피 ───────────────────────────────────────────────
  {
    id: 'SVC-003',
    name: 'Hibang (Traditional)',
    duration: 60,
    price: 1700,
    description: '전통 히방 마사지',
    therapistRequired: true,
    durationOptions: [
      { duration: 60, price: 1700 },
      { duration: 90, price: 2200 },
    ],
  },
  {
    id: 'SVC-004',
    name: 'Smooth Coconut',
    duration: 60,
    price: 1300,
    description: '곱은 코코넛 오일 마사지',
    therapistRequired: true,
    durationOptions: [
      { duration: 60, price: 1300 },
      { duration: 90, price: 1700 },
      { duration: 120, price: 2200 },
    ],
  },
  {
    id: 'SVC-005',
    name: 'Clinical Full Body',
    duration: 60,
    price: 1300,
    description: '임상부 전용 마사지',
    therapistRequired: true,
    durationOptions: [
      { duration: 60, price: 1300 },
      { duration: 90, price: 1700 },
      { duration: 120, price: 2200 },
    ],
  },

  // ── 피부 진정 ───────────────────────────────────────────
  {
    id: 'SVC-006',
    name: 'Green Jade Stone (Cold)',
    duration: 90,
    price: 1700,
    description: '그린 제이드 스톤 (콜드) 마사지',
    therapistRequired: true,
    durationOptions: [
      { duration: 90, price: 1700 },
      { duration: 120, price: 2200 },
    ],
  },
  {
    id: 'SVC-007',
    name: 'Aloe (Cold)',
    duration: 60,
    price: 1300,
    description: '알로에 (콜드) 마사지',
    therapistRequired: true,
    durationOptions: [
      { duration: 60, price: 1300 },
      { duration: 90, price: 1700 },
      { duration: 120, price: 2200 },
    ],
  },

  // ── 기본 마사지 ───────────────────────────────────────────
  {
    id: 'SVC-008',
    name: 'Aroma Massage',
    duration: 60,
    price: 1100,
    description: '아로마 마사지',
    therapistRequired: false,
    durationOptions: [
      { duration: 60, price: 1100 },
      { duration: 90, price: 1500 },
      { duration: 120, price: 2200 },
    ],
  },
  {
    id: 'SVC-009',
    name: 'Dry Massage',
    duration: 60,
    price: 1100,
    description: '드라이 마사지',
    therapistRequired: true,
    durationOptions: [
      { duration: 60, price: 1100 },
      { duration: 90, price: 1500 },
      { duration: 120, price: 2200 },
    ],
  },
  {
    id: 'SVC-010',
    name: 'Coconut Oil Massage',
    duration: 60,
    price: 1100,
    description: '코코넛 오일 마사지',
    therapistRequired: true,
    durationOptions: [
      { duration: 60, price: 1100 },
      { duration: 90, price: 1500 },
      { duration: 120, price: 2200 },
    ],
  },
  {
    id: 'SVC-011',
    name: 'Corporate Massage',
    duration: 60,
    price: 700,
    description: '정장 마사지 (짧은 시간)',
    therapistRequired: true,
    durationOptions: [
      { duration: 60, price: 700 },
      { duration: 90, price: 900 },
      { duration: 120, price: 1100 },
    ],
  },

  // ── 발 마사지 ───────────────────────────────────────────
  {
    id: 'SVC-012',
    name: 'Foot Pack (Scrub + Massage)',
    duration: 60,
    price: 1300,
    description: '발광풋팩 (풋 스크럽 + 발 마사지)',
    therapistRequired: true,
    durationOptions: [
      { duration: 60, price: 1300 },
    ],
  },
  {
    id: 'SVC-013',
    name: 'Basic Foot Massage',
    duration: 60,
    price: 900,
    description: '발 마사지 (기본)',
    therapistRequired: true,
    durationOptions: [
      { duration: 60, price: 900 },
      { duration: 90, price: 1300 },
    ],
  },
];

// ============================================================
// 시간대별 예약 (초기화)
// ============================================================
export const bookings: TimeSlot[] = [];

// ============================================================
// 통계 (초기화)
// ============================================================
export const bookingSummary = {
  totalBookings: bookings.length,
  confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
  pendingBookings: bookings.filter(b => b.status === 'pending').length,
  completedBookings: bookings.filter(b => b.status === 'completed').length,
  totalRevenue: 0,
  availableTherapists: therapists.filter(t => t.status === 'available').length,
  availableBeds: therapyBeds.filter(b => b.status === 'available').length,
};

// ============================================================
// 유틸리티 함수
// ============================================================
export const getBedsByRoom = (roomId: 'room1' | 'room2' | 'room3' | 'room4'): TherapyBed[] => {
  return therapyBeds.filter(bed => bed.room === roomId);
};
