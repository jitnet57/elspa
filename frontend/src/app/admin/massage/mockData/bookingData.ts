/**
 * 마사지 예약 Mock 데이터
 * 베드, 테라피스트, 예약 정보
 * 작성일: 2026-05-26
 */

export interface TherapyBed {
  id: string;
  name: string;
  roomNumber: string;
  type: 'massage' | 'spa' | 'facial' | 'premium';
  status: 'available' | 'occupied' | 'maintenance';
  capacity: number;
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

// ============================================================
// 베드/시술실
// ============================================================
export const therapyBeds: TherapyBed[] = [
  {
    id: 'BED-001',
    name: 'Room A',
    roomNumber: 'A-1',
    type: 'massage',
    status: 'occupied',
    capacity: 1,
  },
  {
    id: 'BED-002',
    name: 'Room B',
    roomNumber: 'B-1',
    type: 'massage',
    status: 'available',
    capacity: 1,
  },
  {
    id: 'BED-003',
    name: 'Room C',
    roomNumber: 'C-1',
    type: 'massage',
    status: 'occupied',
    capacity: 1,
  },
  {
    id: 'BED-004',
    name: 'Premium Suite',
    roomNumber: 'P-1',
    type: 'premium',
    status: 'available',
    capacity: 2,
  },
  {
    id: 'BED-005',
    name: 'Spa Room',
    roomNumber: 'S-1',
    type: 'spa',
    status: 'maintenance',
    capacity: 2,
  },
  {
    id: 'BED-006',
    name: 'Facial Room',
    roomNumber: 'F-1',
    type: 'facial',
    status: 'available',
    capacity: 1,
  },
];

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
