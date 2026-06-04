// ============================================================
// 📌 파일명: Network Links 데이터
// 📋 목적: 3D 지식 네트워크의 노드 간 연결 관계 정의
// 🔧 기능: 12-15개의 노드 링크 + 관계 타입 정의
// 📅 작성일: 2026-05-29 16:00
// ============================================================

/**
 * 네트워크 링크 인터페이스
 * - from: 시작 노드의 ID
 * - to: 도착 노드의 ID
 * - type: 관계 타입 ('provides', 'targets', 'influences', 'manages', 'uses')
 * - strength: 연결 강도 1-5 (선의 굵기에 영향)
 * - label: 관계 설명 (호버 시 표시)
 */
export interface NetworkLink {
  from: string;
  to: string;
  type: 'provides' | 'targets' | 'influences' | 'manages' | 'uses';
  strength: number;
  label: string;
}

/**
 * ElSpa 비즈니스 네트워크 링크 정의
 *
 * 노드 구성:
 * - 서비스: massage-thai, massage-aromatherapy, massage-sports
 * - 치료사: therapist-john, therapist-maria, therapist-alex
 * - 고객: business-customer, elderly-customer, personal-customer
 * - 조직: business-spa, elderly-facility, franchise-network
 * - KPI: business-revenue, customer-retention, service-quality
 *
 * 관계 유형:
 * - 'provides': 서비스를 제공
 * - 'targets': 대상 고객
 * - 'influences': 영향을 미침
 * - 'manages': 관리하는 관계
 * - 'uses': 사용/이용
 */
export const NETWORK_LINKS: NetworkLink[] = [
  // ==========================================
  // 서비스 → 치료사 (who provides)
  // ==========================================
  {
    from: 'massage-thai',
    to: 'therapist-john',
    type: 'provides',
    strength: 4,
    label: '타이마사지 제공 (존)',
  },
  {
    from: 'massage-aromatherapy',
    to: 'therapist-maria',
    type: 'provides',
    strength: 3,
    label: '아로마테라피 제공 (마리아)',
  },
  {
    from: 'massage-sports',
    to: 'therapist-alex',
    type: 'provides',
    strength: 3,
    label: '스포츠마사지 제공 (알렉스)',
  },

  // ==========================================
  // 서비스 → 고객 (target audience)
  // ==========================================
  {
    from: 'massage-thai',
    to: 'business-customer',
    type: 'targets',
    strength: 4,
    label: '기업 고객 대상',
  },
  {
    from: 'massage-aromatherapy',
    to: 'elderly-customer',
    type: 'targets',
    strength: 5,
    label: '요양원 이용자 대상',
  },
  {
    from: 'massage-sports',
    to: 'personal-customer',
    type: 'targets',
    strength: 3,
    label: '개인 고객 대상',
  },

  // ==========================================
  // 조직 → 서비스 (manages)
  // ==========================================
  {
    from: 'business-spa',
    to: 'massage-thai',
    type: 'manages',
    strength: 4,
    label: '타이마사지 운영',
  },
  {
    from: 'business-spa',
    to: 'massage-aromatherapy',
    type: 'manages',
    strength: 3,
    label: '아로마테라피 운영',
  },
  {
    from: 'elderly-facility',
    to: 'massage-aromatherapy',
    type: 'manages',
    strength: 4,
    label: '요양원 마사지 운영',
  },

  // ==========================================
  // 치료사 → 조직 (works at)
  // ==========================================
  {
    from: 'therapist-john',
    to: 'business-spa',
    type: 'uses',
    strength: 4,
    label: '스파에서 근무',
  },
  {
    from: 'therapist-maria',
    to: 'elderly-facility',
    type: 'uses',
    strength: 5,
    label: '요양원에서 근무',
  },
  {
    from: 'therapist-alex',
    to: 'franchise-network',
    type: 'uses',
    strength: 3,
    label: '프랜차이즈 네트워크 소속',
  },

  // ==========================================
  // 치료사 → KPI (influences)
  // ==========================================
  {
    from: 'therapist-john',
    to: 'business-revenue',
    type: 'influences',
    strength: 4,
    label: '매출에 영향',
  },
  {
    from: 'therapist-maria',
    to: 'customer-retention',
    type: 'influences',
    strength: 5,
    label: '고객 유지율 향상',
  },
  {
    from: 'therapist-alex',
    to: 'service-quality',
    type: 'influences',
    strength: 3,
    label: '서비스 품질 관리',
  },

  // ==========================================
  // 고객 만족도 → 비즈니스 KPI (influences)
  // ==========================================
  {
    from: 'customer-retention',
    to: 'business-revenue',
    type: 'influences',
    strength: 5,
    label: '고객 유지 → 매출 증가',
  },
  {
    from: 'service-quality',
    to: 'customer-retention',
    type: 'influences',
    strength: 4,
    label: '서비스 품질 → 고객 만족',
  },
];

/**
 * 관계 타입별 색상 정의
 * - provides: 파란색 (서비스 제공)
 * - targets: 녹색 (대상 고객)
 * - influences: 주황색 (영향 관계)
 * - manages: 보라색 (관리 관계)
 * - uses: 빨간색 (사용 관계)
 */
export const LINK_TYPE_COLORS: Record<NetworkLink['type'], string> = {
  provides: '#3b82f6',    // blue-500
  targets: '#10b981',     // emerald-500
  influences: '#f97316',  // orange-500
  manages: '#a855f7',     // purple-500
  uses: '#ef4444',        // red-500
};

/**
 * 연결 강도(strength)별 선 굵기 (픽셀)
 * - strength 1: 1px (매우 약한 관계)
 * - strength 2: 1.5px
 * - strength 3: 2px
 * - strength 4: 2.5px
 * - strength 5: 3px (매우 강한 관계)
 */
export const STRENGTH_TO_WIDTH: Record<number, number> = {
  1: 1,
  2: 1.5,
  3: 2,
  4: 2.5,
  5: 3,
};

/**
 * 노드 ID로 네트워크 링크 검색
 * @param nodeId - 검색할 노드 ID
 * @returns 해당 노드와 연결된 모든 링크
 */
export function getLinksByNode(nodeId: string): NetworkLink[] {
  return NETWORK_LINKS.filter(link => link.from === nodeId || link.to === nodeId);
}

/**
 * 두 노드 사이의 직접 연결 찾기
 * @param fromId - 시작 노드 ID
 * @param toId - 도착 노드 ID
 * @returns 연결 정보 또는 null
 */
export function findDirectLink(fromId: string, toId: string): NetworkLink | null {
  return NETWORK_LINKS.find(link => link.from === fromId && link.to === toId) || null;
}

/**
 * 관계 타입별로 링크 분류
 * @param type - 관계 타입
 * @returns 해당 타입의 모든 링크
 */
export function getLinksByType(type: NetworkLink['type']): NetworkLink[] {
  return NETWORK_LINKS.filter(link => link.type === type);
}
