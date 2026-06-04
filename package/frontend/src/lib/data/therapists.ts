// 테라피스트 60명 가상 데이터

export interface TherapistData {
  id: number;
  name: string;
  specialty: string;
  status: 'checked_in' | 'checked_out';
  rating: number;
  totalClients: number;
  totalRevenue: string;
  commissionRate: number;
  checkedInAt?: string;
  checkedOutAt?: string;
  phone: string;
  email: string;
}

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

function generateTherapists(): TherapistData[] {
  const therapists: TherapistData[] = [];

  for (let i = 1; i <= 60; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const specialty = specialties[Math.floor(Math.random() * specialties.length)];
    const isCheckedIn = Math.random() > 0.3; // 70% 출근
    const rating = (Math.random() * 0.5 + 4.5).toFixed(1); // 4.5~5.0
    const clients = Math.floor(Math.random() * 60 + 10); // 10~70명
    const revenue = `₱${(clients * 50000 + Math.random() * 1000000).toLocaleString('ko-KR')}`;

    therapists.push({
      id: i,
      name: `${firstName}${lastName}`,
      specialty,
      status: isCheckedIn ? 'checked_in' : 'checked_out',
      rating: parseFloat(rating as string),
      totalClients: clients,
      totalRevenue: revenue,
      commissionRate: 40,
      checkedInAt: isCheckedIn
        ? `${String(Math.floor(Math.random() * 2) + 9).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
        : undefined,
      checkedOutAt: !isCheckedIn
        ? `${String(Math.floor(Math.random() * 4) + 17).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
        : undefined,
      phone: `010-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      email: `therapist${i}@elspa.com`,
    });
  }

  return therapists;
}

export const REAL_THERAPISTS = generateTherapists();

