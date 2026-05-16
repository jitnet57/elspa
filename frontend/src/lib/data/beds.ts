// 실제 침대 데이터 (86개)
// 마사지룸1: 30개, 마사지룸2: 30개, VIP룸: 16개, 커플룸: 10개

export interface BedData {
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

export const REAL_BEDS: BedData[] = [
  // 마사지룸1 (1-30번)
  ...Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    bed_number: i + 1,
    room_zone: '마사지룸1',
    status: 'available' as const,
  })),

  // 마사지룸2 (31-60번)
  ...Array.from({ length: 30 }, (_, i) => ({
    id: 31 + i,
    bed_number: i + 1,
    room_zone: '마사지룸2',
    status: 'available' as const,
  })),

  // VIP룸 (61-76번)
  ...Array.from({ length: 16 }, (_, i) => ({
    id: 61 + i,
    bed_number: i + 1,
    room_zone: 'VIP룸',
    status: 'available' as const,
  })),

  // 커플룸 (77-86번)
  ...Array.from({ length: 10 }, (_, i) => ({
    id: 77 + i,
    bed_number: i + 1,
    room_zone: '커플룸',
    status: 'available' as const,
  })),
];
