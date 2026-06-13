// ============================================================
// 📌 모듈: 지식 네트워크 데모 데이터
// 📋 목적: 백엔드 API(/api/knowledge-network) 미배포/오류 시 폴백용 노드셋
//         (admin/knowledge-network 페이지가 빈 화면이 되지 않도록)
// 🔧 출처: network-graph 데모(DEMO_NODES)와 동일 — 서비스/치료사/고객/조직/KPI
// 📅 작성일: 2026-06-13
// ============================================================

import type { NetworkNode, NetworkEdge } from '@/components/20250529-1435-knowledge-network-3d';

export const DEMO_KNOWLEDGE_NODES: NetworkNode[] = [
  // 서비스 (파랑)
  { id: 'massage-thai', label: '타이마사지', description: '전통 타이마사지 - 근육 이완 및 혈액순환 촉진', category: '서비스', color: '#3b82f6' },
  { id: 'massage-aromatherapy', label: '아로마테라피', description: '에센셜 오일을 활용한 치료 - 스트레스 완화 및 이완 효과', category: '서비스', color: '#3b82f6' },
  { id: 'massage-sports', label: '스포츠마사지', description: '운동 선수 및 활동적인 사람들을 위한 전문 마사지', category: '서비스', color: '#3b82f6' },
  // 치료사 (녹색)
  { id: 'therapist-john', label: '존 (John)', description: '타이마사지 전문가 - 10년 경력, 기업 고객 전담', category: '치료사', color: '#10b981' },
  { id: 'therapist-maria', label: '마리아 (Maria)', description: '아로마테라피 전문가 - 요양원 이용자 케어 담당', category: '치료사', color: '#10b981' },
  { id: 'therapist-alex', label: '알렉스 (Alex)', description: '스포츠마사지 전문가 - 프랜차이즈 네트워크 소속', category: '치료사', color: '#10b981' },
  // 고객 (주황)
  { id: 'business-customer', label: '기업 고객', description: '기업 직원 복지 프로그램 - 정기 구독 모델', category: '고객', color: '#f97316' },
  { id: 'elderly-customer', label: '요양원 이용자', description: '요양시설 입소자 - 재활 및 웰니스 프로그램', category: '고객', color: '#f97316' },
  { id: 'personal-customer', label: '개인 고객', description: '개인 예약 고객 - 스포츠 애호가 및 피트니스 관심층', category: '고객', color: '#f97316' },
  // 조직 (보라)
  { id: 'business-spa', label: '비즈니스 스파', description: 'ElSpa 메인 운영 시설 - 타이마사지, 아로마테라피 제공', category: '조직', color: '#a855f7' },
  { id: 'elderly-facility', label: '요양원', description: '요양시설 파트너 - 입소자 웰니스 프로그램', category: '조직', color: '#a855f7' },
  { id: 'franchise-network', label: '프랜차이즈 네트워크', description: '전국 지점 네트워크 - 스포츠마사지 확대 중', category: '조직', color: '#a855f7' },
  // KPI (빨강)
  { id: 'business-revenue', label: '매출', description: '월간 총 매출 - 치료사 성과와 고객 만족도에 의존', category: 'KPI', color: '#ef4444' },
  { id: 'customer-retention', label: '고객 유지율', description: '반복 이용 고객 비율 - 서비스 품질의 핵심 지표', category: 'KPI', color: '#ef4444' },
  { id: 'service-quality', label: '서비스 품질', description: '고객 만족도 및 치료 효과 - 치료사 역량 반영', category: 'KPI', color: '#ef4444' },
];

// 노드 간 관계(엣지) — 설명문에 근거 (서비스→치료사→고객→조직, KPI 연결)
export const DEMO_KNOWLEDGE_EDGES: NetworkEdge[] = [
  { source: 'massage-thai', target: 'therapist-john' },
  { source: 'massage-aromatherapy', target: 'therapist-maria' },
  { source: 'massage-sports', target: 'therapist-alex' },
  { source: 'therapist-john', target: 'business-customer' },
  { source: 'therapist-maria', target: 'elderly-customer' },
  { source: 'therapist-alex', target: 'personal-customer' },
  { source: 'business-customer', target: 'business-spa' },
  { source: 'elderly-customer', target: 'elderly-facility' },
  { source: 'personal-customer', target: 'franchise-network' },
  { source: 'business-spa', target: 'massage-thai' },
  { source: 'business-spa', target: 'massage-aromatherapy' },
  { source: 'franchise-network', target: 'massage-sports' },
  { source: 'business-revenue', target: 'service-quality' },
  { source: 'business-revenue', target: 'customer-retention' },
  { source: 'customer-retention', target: 'service-quality' },
  { source: 'service-quality', target: 'therapist-john' },
  { source: 'service-quality', target: 'therapist-maria' },
  { source: 'service-quality', target: 'therapist-alex' },
  { source: 'customer-retention', target: 'business-customer' },
  { source: 'business-revenue', target: 'business-spa' },
];
