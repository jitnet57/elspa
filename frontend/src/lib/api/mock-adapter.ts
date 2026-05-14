/**
 * Mock API Adapter - Stream A: 데이터 레이어 (Data Layer)
 *
 * 목적: Team E(DB), F(매칭), G(API)가 완성되기 전에
 * Team A-D(Frontend)가 mock 데이터로 개발할 수 있도록 제공
 *
 * 대규모 시스템 시뮬레이션:
 *   - 일일 1,000건 거래
 *   - 90명 테라피스트
 *   - 6가지 서비스
 *   - 시간대별 분포 및 거래 분석
 *
 * 사용법:
 *   import { mockApiAdapter } from '@/lib/api/mock-adapter'
 *   const beds = await mockApiAdapter.getBeds()
 *   const dailyData = await mockApiAdapter.getDailySettlement()
 *
 * 전환:
 *   실제 API 완성 후 이 파일을 삭제하고
 *   import { apiClient } from '@/lib/api/client' 로 변경
 */

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

interface TherapistSettlement {
  therapistId: number;
  name: string;
  sessionCount: number;
  totalRevenue: number;
  totalCommission: number;
  commissionRate: number;
}

interface Transaction {
  id: string;
  therapistId: number;
  therapistName: string;
  serviceType: string;
  price: number;
  commission: number;
  startTime: string;
  endTime: string;
  status: 'completed';
}

interface DailySettlement {
  totalRevenue: number;
  totalCommission: number;
  netProfit: number;
  sessionCount: number;
  timestamp: string;
}

interface ServiceBreakdown {
  serviceType: string;
  count: number;
  revenue: number;
  percentage: number;
}

interface HourlySales {
  hour: number;
  count: number;
  revenue: number;
}

interface MatchingProposal {
  therapist_id: number;
  therapist_name: string;
  specialty: string;
  score: number;
  availability: string;
}

interface MatchingConfirmation {
  bed_id: number;
  therapist_id: number;
  booking_id: number;
  confirmed_at: string;
}

// ============================================================
// 대규모 데이터 풀 (Stream A: 데이터 레이어)
// ============================================================

/**
 * 📌 THERAPIST_POOL_90
 * 90명의 테라피스트 풀
 * - 경력별 수수료율: 신입(40%), 중급(45%), 경력(50%)
 * - 평점: 4.0~4.9 범위의 자연스러운 분포
 * - 전문분야: 6가지 마사지 서비스 전문화
 */
const THERAPIST_POOL_90: Array<{
  id: number;
  name: string;
  specialty: string;
  rating: number;
  commissionRate: number;
}> = [
  // 신입 (1-30, 40% 수수료)
  { id: 1, name: '김민지', specialty: '스웨디시', rating: 4.1, commissionRate: 0.4 },
  { id: 2, name: '이수연', specialty: '타이마사지', rating: 4.2, commissionRate: 0.4 },
  { id: 3, name: '박지은', specialty: '핫스톤', rating: 4.0, commissionRate: 0.4 },
  { id: 4, name: '최혜리', specialty: '발마사지', rating: 4.3, commissionRate: 0.4 },
  { id: 5, name: '정유진', specialty: '아로마테라피', rating: 4.1, commissionRate: 0.4 },
  { id: 6, name: '강민경', specialty: '종합', rating: 4.2, commissionRate: 0.4 },
  { id: 7, name: '임다현', specialty: '스웨디시', rating: 4.0, commissionRate: 0.4 },
  { id: 8, name: '유지원', specialty: '타이마사지', rating: 4.4, commissionRate: 0.4 },
  { id: 9, name: '조예은', specialty: '핫스톤', rating: 4.2, commissionRate: 0.4 },
  { id: 10, name: '송지현', specialty: '발마사지', rating: 4.1, commissionRate: 0.4 },
  { id: 11, name: '한소영', specialty: '아로마테라피', rating: 4.3, commissionRate: 0.4 },
  { id: 12, name: '백지연', specialty: '종합', rating: 4.0, commissionRate: 0.4 },
  { id: 13, name: '이민주', specialty: '스웨디시', rating: 4.2, commissionRate: 0.4 },
  { id: 14, name: '서은혜', specialty: '타이마사지', rating: 4.1, commissionRate: 0.4 },
  { id: 15, name: '권지윤', specialty: '핫스톤', rating: 4.3, commissionRate: 0.4 },
  { id: 16, name: '윤하은', specialty: '발마사지', rating: 4.0, commissionRate: 0.4 },
  { id: 17, name: '현수아', specialty: '아로마테라피', rating: 4.2, commissionRate: 0.4 },
  { id: 18, name: '장나영', specialty: '종합', rating: 4.4, commissionRate: 0.4 },
  { id: 19, name: '노유미', specialty: '스웨디시', rating: 4.1, commissionRate: 0.4 },
  { id: 20, name: '진혜지', specialty: '타이마사지', rating: 4.0, commissionRate: 0.4 },
  { id: 21, name: '각지훈', specialty: '핫스톤', rating: 4.2, commissionRate: 0.4 },
  { id: 22, name: '김선호', specialty: '발마사지', rating: 4.3, commissionRate: 0.4 },
  { id: 23, name: '이준호', specialty: '아로마테라피', rating: 4.1, commissionRate: 0.4 },
  { id: 24, name: '박태완', specialty: '종합', rating: 4.0, commissionRate: 0.4 },
  { id: 25, name: '최동욱', specialty: '스웨디시', rating: 4.2, commissionRate: 0.4 },
  { id: 26, name: '정재윤', specialty: '타이마사지', rating: 4.4, commissionRate: 0.4 },
  { id: 27, name: '강민호', specialty: '핫스톤', rating: 4.1, commissionRate: 0.4 },
  { id: 28, name: '임준석', specialty: '발마사지', rating: 4.2, commissionRate: 0.4 },
  { id: 29, name: '유현철', specialty: '아로마테라피', rating: 4.0, commissionRate: 0.4 },
  { id: 30, name: '조성훈', specialty: '종합', rating: 4.3, commissionRate: 0.4 },

  // 중급 (31-65, 45% 수수료)
  { id: 31, name: 'Sarah', specialty: '스웨디시', rating: 4.5, commissionRate: 0.45 },
  { id: 32, name: 'Emma', specialty: '타이마사지', rating: 4.6, commissionRate: 0.45 },
  { id: 33, name: 'Jessica', specialty: '핫스톤', rating: 4.4, commissionRate: 0.45 },
  { id: 34, name: 'Amanda', specialty: '발마사지', rating: 4.5, commissionRate: 0.45 },
  { id: 35, name: '강지연', specialty: '아로마테라피', rating: 4.3, commissionRate: 0.45 },
  { id: 36, name: '박민경', specialty: '종합', rating: 4.6, commissionRate: 0.45 },
  { id: 37, name: '임다현', specialty: '스웨디시', rating: 4.4, commissionRate: 0.45 },
  { id: 38, name: '유지원', specialty: '타이마사지', rating: 4.5, commissionRate: 0.45 },
  { id: 39, name: '조예은', specialty: '핫스톤', rating: 4.3, commissionRate: 0.45 },
  { id: 40, name: '송지현', specialty: '발마사지', rating: 4.6, commissionRate: 0.45 },
  { id: 41, name: '한소영', specialty: '아로마테라피', rating: 4.5, commissionRate: 0.45 },
  { id: 42, name: '백지연', specialty: '종합', rating: 4.4, commissionRate: 0.45 },
  { id: 43, name: '이민주', specialty: '스웨디시', rating: 4.3, commissionRate: 0.45 },
  { id: 44, name: '서은혜', specialty: '타이마사지', rating: 4.5, commissionRate: 0.45 },
  { id: 45, name: '권지윤', specialty: '핫스톤', rating: 4.6, commissionRate: 0.45 },
  { id: 46, name: '윤하은', specialty: '발마사지', rating: 4.4, commissionRate: 0.45 },
  { id: 47, name: '현수아', specialty: '아로마테라피', rating: 4.5, commissionRate: 0.45 },
  { id: 48, name: '장나영', specialty: '종합', rating: 4.3, commissionRate: 0.45 },
  { id: 49, name: '노유미', specialty: '스웨디시', rating: 4.6, commissionRate: 0.45 },
  { id: 50, name: '진혜지', specialty: '타이마사지', rating: 4.5, commissionRate: 0.45 },
  { id: 51, name: '각지훈', specialty: '핫스톤', rating: 4.4, commissionRate: 0.45 },
  { id: 52, name: '김선호', specialty: '발마사지', rating: 4.3, commissionRate: 0.45 },
  { id: 53, name: '이준호', specialty: '아로마테라피', rating: 4.5, commissionRate: 0.45 },
  { id: 54, name: '박태완', specialty: '종합', rating: 4.6, commissionRate: 0.45 },
  { id: 55, name: '최동욱', specialty: '스웨디시', rating: 4.4, commissionRate: 0.45 },
  { id: 56, name: '정재윤', specialty: '타이마사지', rating: 4.5, commissionRate: 0.45 },
  { id: 57, name: '강민호', specialty: '핫스톤', rating: 4.3, commissionRate: 0.45 },
  { id: 58, name: '임준석', specialty: '발마사지', rating: 4.6, commissionRate: 0.45 },
  { id: 59, name: '유현철', specialty: '아로마테라피', rating: 4.5, commissionRate: 0.45 },
  { id: 60, name: '조성훈', specialty: '종합', rating: 4.4, commissionRate: 0.45 },
  { id: 61, name: '원지연', specialty: '스웨디시', rating: 4.3, commissionRate: 0.45 },
  { id: 62, name: '윤미영', specialty: '타이마사지', rating: 4.5, commissionRate: 0.45 },
  { id: 63, name: '김효정', specialty: '핫스톤', rating: 4.6, commissionRate: 0.45 },
  { id: 64, name: '이나현', specialty: '발마사지', rating: 4.4, commissionRate: 0.45 },
  { id: 65, name: '박수현', specialty: '아로마테라피', rating: 4.5, commissionRate: 0.45 },

  // 경력 (66-90, 50% 수수료)
  { id: 66, name: '최미영', specialty: '스웨디시', rating: 4.7, commissionRate: 0.5 },
  { id: 67, name: '정은지', specialty: '타이마사지', rating: 4.8, commissionRate: 0.5 },
  { id: 68, name: '이은희', specialty: '핫스톤', rating: 4.6, commissionRate: 0.5 },
  { id: 69, name: '김현진', specialty: '발마사지', rating: 4.7, commissionRate: 0.5 },
  { id: 70, name: '강유진', specialty: '아로마테라피', rating: 4.9, commissionRate: 0.5 },
  { id: 71, name: '박정윤', specialty: '종합', rating: 4.8, commissionRate: 0.5 },
  { id: 72, name: '임소희', specialty: '스웨디시', rating: 4.7, commissionRate: 0.5 },
  { id: 73, name: '유정현', specialty: '타이마사지', rating: 4.6, commissionRate: 0.5 },
  { id: 74, name: '조해인', specialty: '핫스톤', rating: 4.8, commissionRate: 0.5 },
  { id: 75, name: '송민지', specialty: '발마사지', rating: 4.7, commissionRate: 0.5 },
  { id: 76, name: '한지수', specialty: '아로마테라피', rating: 4.9, commissionRate: 0.5 },
  { id: 77, name: '백은정', specialty: '종합', rating: 4.6, commissionRate: 0.5 },
  { id: 78, name: '이혜준', specialty: '스웨디시', rating: 4.7, commissionRate: 0.5 },
  { id: 79, name: '서나리', specialty: '타이마사지', rating: 4.8, commissionRate: 0.5 },
  { id: 80, name: '권수현', specialty: '핫스톤', rating: 4.7, commissionRate: 0.5 },
  { id: 81, name: '윤혜지', specialty: '발마사지', rating: 4.6, commissionRate: 0.5 },
  { id: 82, name: '현민지', specialty: '아로마테라피', rating: 4.9, commissionRate: 0.5 },
  { id: 83, name: '장은영', specialty: '종합', rating: 4.8, commissionRate: 0.5 },
  { id: 84, name: '노지현', specialty: '스웨디시', rating: 4.7, commissionRate: 0.5 },
  { id: 85, name: '진은경', specialty: '타이마사지', rating: 4.6, commissionRate: 0.5 },
  { id: 86, name: '각승현', specialty: '핫스톤', rating: 4.9, commissionRate: 0.5 },
  { id: 87, name: '김정훈', specialty: '발마사지', rating: 4.7, commissionRate: 0.5 },
  { id: 88, name: '이태호', specialty: '아로마테라피', rating: 4.8, commissionRate: 0.5 },
  { id: 89, name: '박성민', specialty: '종합', rating: 4.7, commissionRate: 0.5 },
  { id: 90, name: '최준호', specialty: '스웨디시', rating: 4.9, commissionRate: 0.5 },
];

/**
 * 📌 SERVICE_PRICES
 * 6가지 마사지 서비스 가격표
 * - 기본 수수료: 45% (특정 테라피스트의 경험도에 따라 변동)
 * - 세션별 예상 수익: 36,000 ~ 60,000원
 */
const SERVICE_PRICES: Record<
  string,
  { duration: number; price: number; commission: number }
> = {
  '스웨디시 60분': { duration: 60, price: 80000, commission: 0.45 },
  '타이마사지 90분': { duration: 90, price: 120000, commission: 0.45 },
  '핫스톤 60분': { duration: 60, price: 100000, commission: 0.45 },
  '발마사지 30분': { duration: 30, price: 50000, commission: 0.45 },
  '아로마테라피 45분': { duration: 45, price: 70000, commission: 0.45 },
  '종합 90분': { duration: 90, price: 140000, commission: 0.45 },
};

/**
 * 📌 generateDailyTransactions(count)
 * 일일 거래 데이터 생성
 *
 * 분포 로직:
 *   - 시간대: 09:00~22:00 (13시간, 영업 시간)
 *   - 시간별 분포:
 *     * 09:00~11:00: 20% (비수기 아침)
 *     * 11:00~14:00: 30% (점심 시간, 가장 바쁜 시간)
 *     * 14:00~18:00: 25% (오후)
 *     * 18:00~22:00: 25% (저녁)
 *
 *   - 서비스 믹스:
 *     * 스웨디시 60분: 35% (가장 인기)
 *     * 타이마사지 90분: 25%
 *     * 핫스톤 60분: 15%
 *     * 발마사지 30분: 15%
 *     * 아로마테라피 45분: 10% (프리미엄)
 *     * 종합 90분: 0% (데이터셋에선 생략)
 */
const generateDailyTransactions = (count: number = 1000): Transaction[] => {
  const transactions: Transaction[] = [];
  const serviceTypes = Object.keys(SERVICE_PRICES);

  // 시간별 배치 확률 (09:00~22:00)
  const hourlyDistribution = [
    // 09:00~11:00 (20%)
    { startHour: 9, endHour: 11, weight: 0.2 },
    // 11:00~14:00 (30%)
    { startHour: 11, endHour: 14, weight: 0.3 },
    // 14:00~18:00 (25%)
    { startHour: 14, endHour: 18, weight: 0.25 },
    // 18:00~22:00 (25%)
    { startHour: 18, endHour: 22, weight: 0.25 },
  ];

  // 서비스 믹스 확률
  const serviceMix: Record<string, number> = {
    '스웨디시 60분': 0.35,
    '타이마사지 90분': 0.25,
    '핫스톤 60분': 0.15,
    '발마사지 30분': 0.15,
    '아로마테라피 45분': 0.1,
  };

  for (let i = 0; i < count; i++) {
    // 시간대 선택
    const hourRandom = Math.random();
    let selectedHour = 9;
    let cumulativeWeight = 0;

    for (const dist of hourlyDistribution) {
      cumulativeWeight += dist.weight;
      if (hourRandom <= cumulativeWeight) {
        selectedHour =
          dist.startHour + Math.floor(Math.random() * (dist.endHour - dist.startHour));
        break;
      }
    }

    // 분 설정 (00~59 랜덤)
    const minute = Math.floor(Math.random() * 60);
    const startTime = new Date();
    startTime.setHours(selectedHour, minute, 0, 0);

    // 서비스 타입 선택
    const serviceRandom = Math.random();
    let selectedService = '스웨디시 60분';
    let cumulativeServiceWeight = 0;

    for (const [service, weight] of Object.entries(serviceMix)) {
      cumulativeServiceWeight += weight;
      if (serviceRandom <= cumulativeServiceWeight) {
        selectedService = service;
        break;
      }
    }

    const serviceInfo = SERVICE_PRICES[selectedService];
    const endTime = new Date(startTime.getTime() + serviceInfo.duration * 60000);

    // 테라피스트 랜덤 선택 (1~90)
    const therapistId = Math.floor(Math.random() * 90) + 1;
    const therapist = THERAPIST_POOL_90.find(t => t.id === therapistId)!;

    // 실제 수수료율은 테라피스트의 경험도를 따름
    const actualCommission = therapist.commissionRate;

    transactions.push({
      id: `TXN-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
      therapistId,
      therapistName: therapist.name,
      serviceType: selectedService,
      price: serviceInfo.price,
      commission: Math.round(serviceInfo.price * actualCommission),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: 'completed',
    });
  }

  return transactions;
};

// ============================================================
// 모의 데이터 생성
// ============================================================

const generateMockBeds = (): Bed[] => {
  const beds: Bed[] = [];
  let bedId = 1;

  // 1000/day를 86개 침대에 분산: 약 11.6회/침대/일
  // 실시간 상태는 확률 기반으로 생성
  const customerNames = [
    '김민준', '이수연', '정현준', '박지은', '최준호',
    '강지은', '이준영', '김수현', '박민수', '이영희',
    '이현욱', '정민우', '박소윤', '최지연', '강준영',
    '임태호', '유수정', '조은혜', '송준호', '한지윤',
    '윤준모', '현윤지', '장호준', '노현준', '진지수',
    '각민준', '김영우', '이효진', '박민철', '최수진'
  ];

  // 침대 상태 조회 시, THERAPIST_POOL_90에서 랜덤 선택 (성능상 8명 표시, 실제는 90명)
  const displayTherapistNames = [
    'Sarah', 'Emma', 'Jessica', 'Amanda', '강지연',
    '박민경', '임다현', '유지원'
  ];

  const serviceNames = Object.keys(SERVICE_PRICES);

  const roomConfigs = [
    { name: '마사지룸1', count: 30 },
    { name: '마사지룸2', count: 30 },
    { name: 'VIP룸', count: 16 },
    { name: '커플룸', count: 10 }
  ];

  for (const room of roomConfigs) {
    for (let i = 1; i <= room.count; i++) {
      const statusRandom = Math.random();
      let status: Bed['status'];

      // 분포: available 50%, in_service 30%, reserved 10%, cleaning 10%
      if (statusRandom < 0.5) status = 'available';
      else if (statusRandom < 0.8) status = 'in_service';
      else if (statusRandom < 0.9) status = 'reserved';
      else status = 'cleaning';

      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60000);
      const thirtyMinutesLater = new Date(now.getTime() + 30 * 60000);

      beds.push({
        id: bedId++,
        bed_number: i,
        room_zone: room.name,
        status,
        customer_name:
          status === 'in_service' || status === 'reserved'
            ? customerNames[Math.floor(Math.random() * customerNames.length)]
            : undefined,
        therapist_name:
          status === 'in_service' || status === 'reserved'
            ? displayTherapistNames[Math.floor(Math.random() * displayTherapistNames.length)]
            : undefined,
        service_name:
          status === 'in_service' || status === 'reserved'
            ? serviceNames[Math.floor(Math.random() * serviceNames.length)]
            : undefined,
        starts_at:
          status === 'in_service'
            ? tenMinutesAgo.toLocaleTimeString('ko-KR', { hour12: false })
            : undefined,
        ends_at:
          status === 'in_service'
            ? thirtyMinutesLater.toLocaleTimeString('ko-KR', { hour12: false })
            : undefined,
      });
    }
  }

  return beds;
};

/**
 * 📌 generateMockTherapists()
 * /monitor 페이지 성능을 위해 상위 8명의 테라피스트만 반환
 * (실제 시스템은 THERAPIST_POOL_90에서 모든 90명 관리)
 */
const generateMockTherapists = (): Therapist[] => {
  // THERAPIST_POOL_90의 상위 경력자 8명 (ID: 31-38)
  return [
    {
      id: 31,
      name: 'Sarah',
      status: 'in_service',
      current_bed: 5,
      remaining_minutes: 17,
      specialty: '스웨디시'
    },
    {
      id: 32,
      name: 'Emma',
      status: 'in_service',
      current_bed: 12,
      remaining_minutes: 32,
      specialty: '타이마사지'
    },
    {
      id: 33,
      name: 'Jessica',
      status: 'idle',
      specialty: '핫스톤'
    },
    {
      id: 34,
      name: 'Amanda',
      status: 'in_service',
      current_bed: 18,
      remaining_minutes: 5,
      specialty: '발마사지'
    },
    {
      id: 35,
      name: '강지연',
      status: 'resting',
      remaining_minutes: 10,
      specialty: '아로마테라피'
    },
    {
      id: 36,
      name: '박민경',
      status: 'idle',
      specialty: '종합'
    },
    {
      id: 37,
      name: '임다현',
      status: 'idle',
      specialty: '스웨디시'
    },
    {
      id: 38,
      name: '유지원',
      status: 'in_service',
      current_bed: 28,
      remaining_minutes: 22,
      specialty: '타이마사지'
    }
  ];
};

// ============================================================
// Mock API Adapter (실제 fetch 대신 setTimeout으로 지연 시뮬레이션)
// ============================================================

export const mockApiAdapter = {
  // 침대 목록 조회
  async getBeds(roomZone?: string): Promise<Bed[]> {
    // API 응답 지연 시뮬레이션 (100-300ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

    const allBeds = generateMockBeds();

    if (roomZone) {
      return allBeds.filter(bed => bed.room_zone === roomZone);
    }

    return allBeds;
  },

  // 특정 침대 조회
  async getBed(bedId: number): Promise<Bed | null> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

    const beds = generateMockBeds();
    return beds.find(bed => bed.id === bedId) || null;
  },

  // 테라피스트 목록 조회
  async getTherapists(status?: string): Promise<Therapist[]> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

    const allTherapists = generateMockTherapists();

    if (status) {
      return allTherapists.filter(t => t.status === status);
    }

    return allTherapists;
  },

  // 테라피스트 상세 조회
  async getTherapist(therapistId: number): Promise<Therapist | null> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

    const therapists = generateMockTherapists();
    return therapists.find(t => t.id === therapistId) || null;
  },

  // 침대 상태 업데이트
  async updateBedStatus(
    bedId: number,
    status: Bed['status'],
    data?: {
      customer_name?: string;
      therapist_id?: number;
      therapist_name?: string;
      service_name?: string;
    }
  ): Promise<Bed | null> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

    // 성공 시뮬레이션 (95% 성공률)
    if (Math.random() < 0.95) {
      const beds = generateMockBeds();
      const bed = beds.find(b => b.id === bedId);
      if (bed) {
        bed.status = status;
        if (data?.customer_name) bed.customer_name = data.customer_name;
        if (data?.therapist_id) bed.therapist_name = data.therapist_name;
        if (data?.service_name) bed.service_name = data.service_name;
        return bed;
      }
    } else {
      // 실패 시뮬레이션
      throw new Error(`Failed to update bed ${bedId}`);
    }

    return null;
  },

  // 매칭 제안 생성
  async proposeMatching(bookingId: number, serviceType: string): Promise<MatchingProposal[]> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));

    const therapists = generateMockTherapists();

    // 매칭 점수 계산 (더미 로직)
    const candidates = therapists
      .filter(t => t.status === 'idle' || t.status === 'in_service')
      .map(t => {
        // 70% 전문성, 20% 시간, 10% 평점
        const expertiseMatch = t.specialty.includes(serviceType) ? 70 : Math.random() * 70;
        const timeAvailability = t.status === 'idle' ? 20 : Math.random() * 20;
        const rating = Math.random() * 10;

        return {
          therapist_id: t.id,
          therapist_name: t.name,
          specialty: t.specialty,
          score: Math.round(expertiseMatch + timeAvailability + rating),
          availability: t.status === 'idle' ? '즉시 가용' : `${t.remaining_minutes}분 후`
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // 상위 3명만

    return candidates;
  },

  // 매칭 확정
  async confirmMatching(
    bookingId: number,
    therapistId: number
  ): Promise<MatchingConfirmation> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 150));

    if (Math.random() < 0.95) {
      return {
        bed_id: Math.floor(Math.random() * 86) + 1,
        therapist_id,
        booking_id,
        confirmed_at: new Date().toISOString()
      };
    } else {
      throw new Error('Failed to confirm matching');
    }
  },

  // 테라피스트 체크인
  async checkInTherapist(therapistId: number): Promise<Therapist | null> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

    const therapist = generateMockTherapists().find(t => t.id === therapistId);
    if (therapist) {
      therapist.status = 'idle';
      return therapist;
    }
    return null;
  },

  // 테라피스트 체크아웃
  async checkOutTherapist(therapistId: number): Promise<Therapist | null> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

    const therapist = generateMockTherapists().find(t => t.id === therapistId);
    if (therapist) {
      therapist.status = 'checked_out';
      return therapist;
    }
    return null;
  },

  // 예측: 평균 대기시간
  async getPredictedWaitTime(): Promise<{ minutes: number; next_therapist: string }> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));

    const therapists = generateMockTherapists();
    const inService = therapists.filter(t => t.status === 'in_service');
    const avgWait = inService.length > 0
      ? Math.round(inService.reduce((sum, t) => sum + (t.remaining_minutes || 0), 0) / inService.length)
      : 0;

    return {
      minutes: avgWait,
      next_therapist: therapists.find(t => t.status === 'idle')?.name || 'Unknown'
    };
  },

  // What-if 시뮬레이션
  async simulateMatching(serviceType: string, preferredTime?: string): Promise<MatchingProposal[]> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 600 + 300));

    // proposeMatching과 동일한 로직이지만 DB 쓰기 없음
    return this.proposeMatching(999, serviceType);
  },

  // ============================================================
  // Booking API (예약 관련)
  // ============================================================

  async getWaitingBookings(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

    const customerNames = [
      '김민준', '이수연', '정현준', '박지은', '최준호',
      '강지은', '이준영', '김수현', '박민수', '이영희'
    ];

    const serviceNames = Object.keys(SERVICE_PRICES);

    // 3~5개의 대기 예약 생성
    const waitingCount = Math.floor(Math.random() * 3) + 3;
    const bookings = [];

    for (let i = 0; i < waitingCount; i++) {
      const now = new Date();
      const requestedAt = new Date(now.getTime() - Math.random() * 3600000);

      bookings.push({
        id: 1000 + i,
        customer_name: customerNames[Math.floor(Math.random() * customerNames.length)],
        service_type: serviceNames[Math.floor(Math.random() * serviceNames.length)],
        service_minutes: [30, 45, 60, 90][Math.floor(Math.random() * 4)],
        status: 'requested',
        requested_at: requestedAt.toISOString(),
        scheduled_at: new Date(now.getTime() + Math.random() * 1800000).toISOString(),
        notes: Math.random() > 0.7 ? '민감한 피부' : '',
      });
    }

    return bookings;
  },

  // ============================================================
  // Settlement & Analytics API (정산 및 분석)
  // ============================================================

  /**
   * 📌 getDailySettlement()
   * 일일 정산 데이터: 일간 매출, 수수료, 순이익, 세션수
   * 실시간 또는 특정 날짜의 누적 데이터 반환
   */
  async getDailySettlement(): Promise<DailySettlement> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 150));

    const transactions = generateDailyTransactions(1000);

    const totalRevenue = transactions.reduce((sum, t) => sum + t.price, 0);
    const totalCommission = transactions.reduce((sum, t) => sum + t.commission, 0);
    const netProfit = totalRevenue - totalCommission;

    return {
      totalRevenue,
      totalCommission,
      netProfit,
      sessionCount: transactions.length,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * 📌 getTherapistSettlements()
   * 90명 테라피스트별 정산 데이터
   * - 각 테라피스트의 세션 수, 매출, 수수료, 수수료율
   */
  async getTherapistSettlements(): Promise<TherapistSettlement[]> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 250));

    const transactions = generateDailyTransactions(1000);
    const settlementMap = new Map<number, TherapistSettlement>();

    // 초기화: 90명 테라피스트 정보
    for (const therapist of THERAPIST_POOL_90) {
      settlementMap.set(therapist.id, {
        therapistId: therapist.id,
        name: therapist.name,
        sessionCount: 0,
        totalRevenue: 0,
        totalCommission: 0,
        commissionRate: therapist.commissionRate,
      });
    }

    // 거래 데이터 집계
    for (const transaction of transactions) {
      const settlement = settlementMap.get(transaction.therapistId);
      if (settlement) {
        settlement.sessionCount += 1;
        settlement.totalRevenue += transaction.price;
        settlement.totalCommission += transaction.commission;
      }
    }

    // 내림차순 정렬 (수수료 기준)
    return Array.from(settlementMap.values()).sort(
      (a, b) => b.totalCommission - a.totalCommission
    );
  },

  /**
   * 📌 getServiceBreakdown()
   * 서비스 타입별 판매 현황
   * - 각 서비스의 판매 건수, 매출, 비중
   */
  async getServiceBreakdown(): Promise<ServiceBreakdown[]> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 150));

    const transactions = generateDailyTransactions(1000);
    const breakdownMap = new Map<string, { count: number; revenue: number }>();

    // 초기화
    for (const service of Object.keys(SERVICE_PRICES)) {
      breakdownMap.set(service, { count: 0, revenue: 0 });
    }

    // 거래 데이터 집계
    for (const transaction of transactions) {
      const breakdown = breakdownMap.get(transaction.serviceType);
      if (breakdown) {
        breakdown.count += 1;
        breakdown.revenue += transaction.price;
      }
    }

    // 결과 계산
    const totalRevenue = transactions.reduce((sum, t) => sum + t.price, 0);
    const result: ServiceBreakdown[] = Array.from(breakdownMap.entries()).map(
      ([serviceType, { count, revenue }]) => ({
        serviceType,
        count,
        revenue,
        percentage: Math.round((revenue / totalRevenue) * 100 * 100) / 100, // 소수점 2자리
      })
    );

    // 매출 기준 내림차순
    return result.sort((a, b) => b.revenue - a.revenue);
  },

  /**
   * 📌 getHourlySales()
   * 시간대별 판매 현황 (09:00~22:00)
   * - 각 시간별 세션 수 및 매출
   */
  async getHourlySales(): Promise<HourlySales[]> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 150));

    const transactions = generateDailyTransactions(1000);
    const hourlySalesMap = new Map<number, { count: number; revenue: number }>();

    // 초기화 (09:00~22:00, 13시간)
    for (let hour = 9; hour <= 22; hour++) {
      hourlySalesMap.set(hour, { count: 0, revenue: 0 });
    }

    // 거래 데이터 집계
    for (const transaction of transactions) {
      const startDate = new Date(transaction.startTime);
      const hour = startDate.getHours();

      if (hour >= 9 && hour <= 22) {
        const hourlyData = hourlySalesMap.get(hour);
        if (hourlyData) {
          hourlyData.count += 1;
          hourlyData.revenue += transaction.price;
        }
      }
    }

    // 결과 변환
    const result: HourlySales[] = Array.from(hourlySalesMap.entries()).map(
      ([hour, { count, revenue }]) => ({
        hour,
        count,
        revenue,
      })
    );

    return result.sort((a, b) => a.hour - b.hour);
  },
};

// ============================================================
// 환경 기반 API 클라이언트 선택 헬퍼
// ============================================================

export const getApiClient = () => {
  const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

  if (useMockApi) {
    console.log('🎭 Using Mock API Adapter');
    return mockApiAdapter;
  } else {
    // 실제 API 클라이언트로 변경
    console.log('🚀 Using Real API Client');
    // return apiClient;
    return mockApiAdapter; // 아직 없으면 mock 사용
  }
};

// ============================================================
// React Query hooks (Team D가 사용)
// ============================================================

export const useGetBeds = () => {
  // Team D가 구현할 hook
  // const queryClient = useQueryClient();
  // return useQuery({
  //   queryKey: ['beds'],
  //   queryFn: () => getApiClient().getBeds(),
  //   refetchInterval: 5000,
  //   staleTime: 3000
  // });
};

export const useGetTherapists = () => {
  // Team D가 구현할 hook
};

export const useConfirmMatching = () => {
  // Team D가 구현할 hook
};
