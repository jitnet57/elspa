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
  duration: number; // minutes
  price: number;
  description: string;
  therapistRequired: boolean;
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
// 마사지 서비스
// ============================================================
export const massageServices: MassageService[] = [
  {
    id: 'SVC-001',
    name: 'Thai Massage',
    duration: 60,
    price: 800,
    description: 'Traditional Thai massage with stretching',
    therapistRequired: true,
  },
  {
    id: 'SVC-002',
    name: 'Swedish Massage',
    duration: 60,
    price: 750,
    description: 'Relaxing full body massage',
    therapistRequired: true,
  },
  {
    id: 'SVC-003',
    name: 'Deep Tissue',
    duration: 90,
    price: 1200,
    description: 'Intense muscle tension release',
    therapistRequired: true,
  },
  {
    id: 'SVC-004',
    name: 'Foot Massage',
    duration: 45,
    price: 500,
    description: 'Reflexology foot massage',
    therapistRequired: true,
  },
  {
    id: 'SVC-005',
    name: 'Facial Treatment',
    duration: 60,
    price: 1000,
    description: 'Relaxing facial spa treatment',
    therapistRequired: true,
  },
  {
    id: 'SVC-006',
    name: 'Aromatherapy',
    duration: 45,
    price: 600,
    description: 'Relaxation with essential oils',
    therapistRequired: false,
  },
  {
    id: 'SVC-007',
    name: 'Hot Stone Massage',
    duration: 75,
    price: 1100,
    description: 'Heated stones for muscle relief',
    therapistRequired: true,
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
