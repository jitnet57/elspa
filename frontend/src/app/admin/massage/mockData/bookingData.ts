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
// 테라피스트
// ============================================================
export const therapists: Therapist[] = [
  {
    id: 'THER-001',
    name: 'Maria Christina Santos',
    specialties: ['Thai Massage', 'Swedish', 'Deep Tissue'],
    avatar: 'MS',
    status: 'busy',
    experience: 8,
    rating: 4.9,
  },
  {
    id: 'THER-002',
    name: 'Jennifer Cruz',
    specialties: ['Aromatherapy', 'Relaxation', 'Foot Massage'],
    avatar: 'JC',
    status: 'available',
    experience: 6,
    rating: 4.8,
  },
  {
    id: 'THER-003',
    name: 'Rosa Maria Gonzalez',
    specialties: ['Facial', 'Hot Stone', 'Reflexology'],
    avatar: 'RG',
    status: 'busy',
    experience: 7,
    rating: 4.7,
  },
  {
    id: 'THER-004',
    name: 'Lucia Mendoza',
    specialties: ['Sports Massage', 'Swedish', 'Shiatsu'],
    avatar: 'LM',
    status: 'available',
    experience: 5,
    rating: 4.6,
  },
  {
    id: 'THER-005',
    name: 'Angela Lopez',
    specialties: ['Thai Massage', 'Pregnancy Massage', 'Relaxation'],
    avatar: 'AL',
    status: 'break',
    experience: 9,
    rating: 5.0,
  },
];

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
// 시간대별 예약 (2026-05-26)
// ============================================================
export const bookings: TimeSlot[] = [
  // Morning
  {
    id: 'BK-001',
    bedId: 'BED-001',
    therapistId: 'THER-001',
    startTime: '08:00',
    endTime: '09:00',
    serviceId: 'SVC-001',
    clientName: 'John Smith',
    clientPhone: '555-0001',
    status: 'completed',
    date: '2026-05-26',
    notes: 'Regular customer',
  },
  {
    id: 'BK-002',
    bedId: 'BED-001',
    therapistId: 'THER-001',
    startTime: '09:15',
    endTime: '10:15',
    serviceId: 'SVC-002',
    clientName: 'Maria Johnson',
    clientPhone: '555-0002',
    status: 'confirmed',
    date: '2026-05-26',
    notes: '',
  },
  {
    id: 'BK-003',
    bedId: 'BED-003',
    therapistId: 'THER-003',
    startTime: '09:00',
    endTime: '10:00',
    serviceId: 'SVC-005',
    clientName: 'Lisa Wong',
    clientPhone: '555-0003',
    status: 'confirmed',
    date: '2026-05-26',
    notes: 'First-time client',
  },
  {
    id: 'BK-004',
    bedId: 'BED-002',
    therapistId: 'THER-002',
    startTime: '10:00',
    endTime: '10:45',
    serviceId: 'SVC-004',
    clientName: 'Robert Brown',
    clientPhone: '555-0004',
    status: 'confirmed',
    date: '2026-05-26',
    notes: '',
  },

  // Afternoon
  {
    id: 'BK-005',
    bedId: 'BED-004',
    therapistId: 'THER-004',
    startTime: '13:00',
    endTime: '14:30',
    serviceId: 'SVC-003',
    clientName: 'James Davis',
    clientPhone: '555-0005',
    status: 'pending',
    date: '2026-05-26',
    notes: 'Request for evening massage',
  },
  {
    id: 'BK-006',
    bedId: 'BED-001',
    therapistId: 'THER-001',
    startTime: '14:00',
    endTime: '15:00',
    serviceId: 'SVC-001',
    clientName: 'Emily Chen',
    clientPhone: '555-0006',
    status: 'confirmed',
    date: '2026-05-26',
    notes: '',
  },
  {
    id: 'BK-007',
    bedId: 'BED-002',
    therapistId: 'THER-002',
    startTime: '15:00',
    endTime: '16:00',
    serviceId: 'SVC-002',
    clientName: 'David Garcia',
    clientPhone: '555-0007',
    status: 'confirmed',
    date: '2026-05-26',
    notes: 'Recurring appointment',
  },

  // Evening
  {
    id: 'BK-008',
    bedId: 'BED-004',
    therapistId: 'THER-005',
    startTime: '17:00',
    endTime: '18:00',
    serviceId: 'SVC-002',
    clientName: 'Amanda White',
    clientPhone: '555-0008',
    status: 'confirmed',
    date: '2026-05-26',
    notes: '',
  },
  {
    id: 'BK-009',
    bedId: 'BED-003',
    therapistId: 'THER-003',
    startTime: '17:30',
    endTime: '18:30',
    serviceId: 'SVC-007',
    clientName: 'Paul Miller',
    clientPhone: '555-0009',
    status: 'confirmed',
    date: '2026-05-26',
    notes: 'VIP customer',
  },
];

// ============================================================
// 통계
// ============================================================
export const bookingSummary = {
  totalBookings: bookings.length,
  confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
  pendingBookings: bookings.filter(b => b.status === 'pending').length,
  completedBookings: bookings.filter(b => b.status === 'completed').length,
  totalRevenue: bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => {
      const service = massageServices.find(s => s.id === b.serviceId);
      return sum + (service?.price || 0);
    }, 0),
  availableTherapists: therapists.filter(t => t.status === 'available').length,
  availableBeds: therapyBeds.filter(b => b.status === 'available').length,
};

// ============================================================
// 유틸리티 함수
// ============================================================
export const getBedsByRoom = (roomId: 'room1' | 'room2' | 'room3' | 'room4'): TherapyBed[] => {
  return therapyBeds.filter(bed => bed.room === roomId);
};
