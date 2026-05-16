// 데이터베이스 Seed 파일
// 초기 데이터 설정용 (실제 DB에 적용 시 사용)

export const SEED_BEDS = [
  // 마사지룸1 (1-30번)
  ...Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    bed_number: i + 1,
    room_zone: '마사지룸1',
    status: 'available',
    created_at: new Date(),
    updated_at: new Date(),
  })),

  // 마사지룸2 (31-60번)
  ...Array.from({ length: 30 }, (_, i) => ({
    id: 31 + i,
    bed_number: i + 1,
    room_zone: '마사지룸2',
    status: 'available',
    created_at: new Date(),
    updated_at: new Date(),
  })),

  // VIP룸 (61-76번)
  ...Array.from({ length: 16 }, (_, i) => ({
    id: 61 + i,
    bed_number: i + 1,
    room_zone: 'VIP룸',
    status: 'available',
    created_at: new Date(),
    updated_at: new Date(),
  })),

  // 커플룸 (77-86번)
  ...Array.from({ length: 10 }, (_, i) => ({
    id: 77 + i,
    bed_number: i + 1,
    room_zone: '커플룸',
    status: 'available',
    created_at: new Date(),
    updated_at: new Date(),
  })),
];

const firstNames = [
  '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
  '한', '오', '서', '신', '권', '홍', '손', '유', '황', '안',
];

const lastNames = [
  '미영', '지은', '소영', '태희', '지연', '민경', '다현', '지원', '유진', '정은',
  '수연', '현준', '준호', '준영', '영희', '민수', '다훈', '호준', '유미', '선미',
  '하연', '민지', '지현', '은지', '혜정', '진영', '보라', '유나', '수진', '미경',
];

const specialties = [
  '스웨디시', '타이마사지', '핫스톤', '발마사지', '아로마테라피',
  '경락마사지', '점혈마사지', '디톡스마사지', '이완마사지', '심부조직마사지',
];

export function generateSeedTherapists() {
  const therapists = [];

  for (let i = 1; i <= 60; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const specialty = specialties[Math.floor(Math.random() * specialties.length)];
    const isCheckedIn = Math.random() > 0.3;

    therapists.push({
      id: i,
      name: `${firstName}${lastName}`,
      specialty,
      status: isCheckedIn ? 'checked_in' : 'checked_out',
      rating: parseFloat((Math.random() * 0.5 + 4.5).toFixed(1)),
      total_clients: Math.floor(Math.random() * 60 + 10),
      total_revenue: Math.floor(Math.random() * 2000000 + 500000),
      commission_rate: 40,
      checked_in_at: isCheckedIn ? new Date() : null,
      checked_out_at: !isCheckedIn ? new Date() : null,
      phone: `010-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      email: `therapist${i}@elspa.com`,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  return therapists;
}

export const SEED_THERAPISTS = generateSeedTherapists();

// 사용 예시 (Supabase에 적용):
/*
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function seedDatabase() {
  // 침대 데이터 삽입
  await supabase.from('beds').insert(SEED_BEDS);

  // 테라피스트 데이터 삽입
  await supabase.from('therapists').insert(SEED_THERAPISTS);

  console.log('✅ Seed 데이터 적용 완료');
}

seedDatabase();
*/
