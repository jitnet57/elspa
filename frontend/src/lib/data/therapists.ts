// ============================================================
// 📌 테라피스트 데이터: 40명 실제 데이터
// 📋 목적: ElSpa의 실제 테라피스트 정보
// 📅 작성일: 2026-06-05
// ============================================================

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

const therapistRecords: Array<{
  id: number;
  name: string;
  specialty: string;
  rating: number;
  commissionRate: number;
}> = [
  // 1ST시트 (1-18, 40% 수수료)
  { id: 1, name: 'SUL AMOR TORREON', specialty: '스웨디시', rating: 4.1, commissionRate: 0.4 },
  { id: 2, name: 'FATIMA TAMPAN', specialty: '타이마사지', rating: 4.2, commissionRate: 0.4 },
  { id: 3, name: 'NARSING ATILLO', specialty: '핫스톤', rating: 4.0, commissionRate: 0.4 },
  { id: 4, name: 'JANEL IGOT', specialty: '발마사지', rating: 4.3, commissionRate: 0.4 },
  { id: 5, name: 'JENALYN BACULE', specialty: '아로마테라피', rating: 4.1, commissionRate: 0.4 },
  { id: 6, name: 'JESSICA FRANCIS', specialty: '종합', rating: 4.2, commissionRate: 0.4 },
  { id: 7, name: 'WELLA CABALHUG', specialty: '스웨디시', rating: 4.0, commissionRate: 0.4 },
  { id: 8, name: 'WILFREDA ROSAS', specialty: '타이마사지', rating: 4.4, commissionRate: 0.4 },
  { id: 9, name: 'ROSELYN TAMSE', specialty: '핫스톤', rating: 4.2, commissionRate: 0.4 },
  { id: 10, name: 'CRISTY DEJITO', specialty: '발마사지', rating: 4.1, commissionRate: 0.4 },
  { id: 11, name: 'SHEILA', specialty: '아로마테라피', rating: 4.3, commissionRate: 0.4 },
  { id: 12, name: 'WILMA BENSIG', specialty: '종합', rating: 4.0, commissionRate: 0.4 },
  { id: 13, name: 'GINA DESTURA', specialty: '스웨디시', rating: 4.2, commissionRate: 0.4 },
  { id: 14, name: 'JOY', specialty: '타이마사지', rating: 4.1, commissionRate: 0.4 },
  { id: 15, name: 'ARCELEY PEJO', specialty: '핫스톤', rating: 4.3, commissionRate: 0.4 },
  { id: 16, name: 'EVELYN DINAPO', specialty: '발마사지', rating: 4.0, commissionRate: 0.4 },
  { id: 17, name: 'RITCHEL UMBLERO', specialty: '아로마테라피', rating: 4.2, commissionRate: 0.4 },
  { id: 18, name: 'LAURA CALLINO', specialty: '종합', rating: 4.4, commissionRate: 0.4 },

  // 2ND시트 (19-36, 45% 수수료)
  { id: 19, name: 'ADELAIDA ESCOBIDO', specialty: '스웨디시', rating: 4.1, commissionRate: 0.45 },
  { id: 20, name: 'JANICE', specialty: '타이마사지', rating: 4.2, commissionRate: 0.45 },
  { id: 21, name: 'JENNY', specialty: '핫스톤', rating: 4.0, commissionRate: 0.45 },
  { id: 22, name: 'JOSEPHINE', specialty: '발마사지', rating: 4.3, commissionRate: 0.45 },
  { id: 23, name: 'TURA', specialty: '아로마테라피', rating: 4.1, commissionRate: 0.45 },
  { id: 24, name: 'TAMPUS', specialty: '종합', rating: 4.2, commissionRate: 0.45 },
  { id: 25, name: 'PEREZ', specialty: '스웨디시', rating: 4.0, commissionRate: 0.45 },
  { id: 26, name: 'LIZA', specialty: '타이마사지', rating: 4.4, commissionRate: 0.45 },
  { id: 27, name: 'RUDELYN', specialty: '핫스톤', rating: 4.2, commissionRate: 0.45 },
  { id: 28, name: 'MARY ANN', specialty: '발마사지', rating: 4.1, commissionRate: 0.45 },
  { id: 29, name: 'MJ', specialty: '아로마테라피', rating: 4.3, commissionRate: 0.45 },
  { id: 30, name: 'EKIT', specialty: '종합', rating: 4.0, commissionRate: 0.45 },
  { id: 31, name: 'FARA', specialty: '스웨디시', rating: 4.2, commissionRate: 0.45 },
  { id: 32, name: 'NENETH', specialty: '타이마사지', rating: 4.1, commissionRate: 0.45 },
  { id: 33, name: 'MARY', specialty: '핫스톤', rating: 4.3, commissionRate: 0.45 },
  { id: 34, name: 'LENNY', specialty: '발마사지', rating: 4.0, commissionRate: 0.45 },
  { id: 35, name: 'MARICEL', specialty: '아로마테라피', rating: 4.2, commissionRate: 0.45 },
  { id: 36, name: 'JUVY', specialty: '종합', rating: 4.3, commissionRate: 0.45 },

  // 3RD시트 (37-40, 50% 수수료)
  { id: 37, name: 'CRISTINA', specialty: '스웨디시', rating: 4.1, commissionRate: 0.5 },
  { id: 38, name: 'ROSELA', specialty: '타이마사지', rating: 4.2, commissionRate: 0.5 },
  { id: 39, name: 'MAHUSAY', specialty: '핫스톤', rating: 4.0, commissionRate: 0.5 },
  { id: 40, name: 'ARA', specialty: '발마사지', rating: 4.3, commissionRate: 0.5 },
];

function generateTherapists(): TherapistData[] {
  const therapists: TherapistData[] = [];

  for (const record of therapistRecords) {
    const isCheckedIn = Math.random() > 0.3; // 70% 출근
    const clients = Math.floor(Math.random() * 60 + 10); // 10~70명
    const revenue = `₱${(clients * 50000 + Math.random() * 1000000).toLocaleString('ko-KR')}`;

    therapists.push({
      id: record.id,
      name: record.name,
      specialty: record.specialty,
      status: isCheckedIn ? 'checked_in' : 'checked_out',
      rating: record.rating,
      totalClients: clients,
      totalRevenue: revenue,
      commissionRate: record.commissionRate,
      checkedInAt: isCheckedIn
        ? `${String(Math.floor(Math.random() * 2) + 9).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
        : undefined,
      checkedOutAt: !isCheckedIn
        ? `${String(Math.floor(Math.random() * 4) + 17).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
        : undefined,
      phone: `+63-${String(Math.floor(Math.random() * 1000000000)).padStart(10, '0')}`,
      email: `${record.name.toLowerCase().replace(/\s+/g, '.')}@elspa.com`,
    });
  }

  return therapists;
}

export const REAL_THERAPISTS = generateTherapists();

