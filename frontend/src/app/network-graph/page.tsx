// ============================================================
// 📌 페이지명: Network Graph Demo
// 📋 목적: 3D 지식 네트워크 + 엣지 렌더링 테스트 페이지
// 🔧 기능: 데모 데이터와 함께 KnowledgeNetworkWithEdges 컴포넌트 표시
// 📅 작성일: 2026-05-29 16:00
// ============================================================

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { NetworkNode } from '@/components/20250529-1600-knowledge-network-with-edges';

// 동적 임포트 (SSR 방지)
const KnowledgeNetworkWithEdges = dynamic(
  () => import('@/components/20250529-1600-knowledge-network-with-edges'),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100">로딩 중...</div> }
);

/**
 * ElSpa 비즈니스 네트워크 데모 데이터
 *
 * 노드 구성:
 * - 서비스 (Massage Types): 타이마사지, 아로마테라피, 스포츠마사지
 * - 치료사 (Therapists): 존, 마리아, 알렉스
 * - 고객군 (Customer Segments): 기업 고객, 요양원 이용자, 개인 고객
 * - 조직 (Organizations): 스파, 요양원, 프랜차이즈 네트워크
 * - KPI (Key Metrics): 매출, 고객 유지율, 서비스 품질
 */
const DEMO_NODES: NetworkNode[] = [
  // ==========================================
  // 서비스 노드 (파란색)
  // ==========================================
  {
    id: 'massage-thai',
    label: '타이마사지',
    description: '전통 타이마사지 - 근육 이완 및 혈액순환 촉진',
    category: '서비스',
    color: '#3b82f6',
  },
  {
    id: 'massage-aromatherapy',
    label: '아로마테라피',
    description: '에센셜 오일을 활용한 치료 - 스트레스 완화 및 이완 효과',
    category: '서비스',
    color: '#3b82f6',
  },
  {
    id: 'massage-sports',
    label: '스포츠마사지',
    description: '운동 선수 및 활동적인 사람들을 위한 전문 마사지',
    category: '서비스',
    color: '#3b82f6',
  },

  // ==========================================
  // 치료사 노드 (녹색)
  // ==========================================
  {
    id: 'therapist-john',
    label: '존 (John)',
    description: '타이마사지 전문가 - 10년 경력, 기업 고객 전담',
    category: '치료사',
    color: '#10b981',
  },
  {
    id: 'therapist-maria',
    label: '마리아 (Maria)',
    description: '아로마테라피 전문가 - 요양원 이용자 케어 담당',
    category: '치료사',
    color: '#10b981',
  },
  {
    id: 'therapist-alex',
    label: '알렉스 (Alex)',
    description: '스포츠마사지 전문가 - 프랜차이즈 네트워크 소속',
    category: '치료사',
    color: '#10b981',
  },

  // ==========================================
  // 고객 노드 (주황색)
  // ==========================================
  {
    id: 'business-customer',
    label: '기업 고객',
    description: '기업 직원 복지 프로그램 - 정기 구독 모델',
    category: '고객',
    color: '#f97316',
  },
  {
    id: 'elderly-customer',
    label: '요양원 이용자',
    description: '요양시설 입소자 - 재활 및 웰니스 프로그램',
    category: '고객',
    color: '#f97316',
  },
  {
    id: 'personal-customer',
    label: '개인 고객',
    description: '개인 예약 고객 - 스포츠 애호가 및 피트니스 관심층',
    category: '고객',
    color: '#f97316',
  },

  // ==========================================
  // 조직 노드 (보라색)
  // ==========================================
  {
    id: 'business-spa',
    label: '비즈니스 스파',
    description: 'ElSpa 메인 운영 시설 - 타이마사지, 아로마테라피 제공',
    category: '조직',
    color: '#a855f7',
  },
  {
    id: 'elderly-facility',
    label: '요양원',
    description: '요양시설 파트너 - 입소자 웰니스 프로그램',
    category: '조직',
    color: '#a855f7',
  },
  {
    id: 'franchise-network',
    label: '프랜차이즈 네트워크',
    description: '전국 지점 네트워크 - 스포츠마사지 확대 중',
    category: '조직',
    color: '#a855f7',
  },

  // ==========================================
  // KPI 노드 (빨간색)
  // ==========================================
  {
    id: 'business-revenue',
    label: '매출',
    description: '월간 총 매출 - 치료사 성과와 고객 만족도에 의존',
    category: 'KPI',
    color: '#ef4444',
  },
  {
    id: 'customer-retention',
    label: '고객 유지율',
    description: '반복 이용 고객 비율 - 서비스 품질의 핵심 지표',
    category: 'KPI',
    color: '#ef4444',
  },
  {
    id: 'service-quality',
    label: '서비스 품질',
    description: '고객 만족도 및 치료 효과 - 치료사 역량 반영',
    category: 'KPI',
    color: '#ef4444',
  },
];

/**
 * 네트워크 그래프 데모 페이지
 *
 * 기능:
 * 1. 3D 시각화: Three.js 기반 인터랙티브 네트워크
 * 2. 엣지 렌더링: 노드 간 관계선 표시
 * 3. 클릭 상호작용: 노드 선택 시 상세 정보 표시
 * 4. 성능 모니터링: FPS, 노드/엣지 개수 표시
 */
export default function NetworkGraphPage() {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* ==========================================
          헤더
          ========================================== */}
      <div className="bg-white shadow-md px-6 py-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800">
          ElSpa 3D 지식 네트워크
        </h1>
        <p className="text-gray-600 mt-1">
          비즈니스 생태계 시각화 - 서비스, 치료사, 고객, 조직 간 관계
        </p>
      </div>

      {/* ==========================================
          메인 컨텐츠 (3D 네트워크 + 우측 패널)
          ========================================== */}
      <div className="flex flex-1 overflow-hidden">
        {/* 3D 네트워크 */}
        <div className="flex-1 relative">
          <KnowledgeNetworkWithEdges
            nodes={DEMO_NODES}
            onNodeClick={setSelectedNode}
            showEdges={true}
          />
        </div>

        {/* ==========================================
            우측 패널 - 선택된 노드 상세 정보
            ========================================== */}
        <div className="w-80 bg-white shadow-lg border-l border-gray-200 overflow-y-auto">
          {selectedNode ? (
            <div className="p-6 space-y-6">
              {/* 노드 헤더 */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedNode.label}
                  </h2>
                </div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  {selectedNode.category}
                </p>
              </div>

              {/* 설명 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  📝 설명
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>

              {/* 노드 ID */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  🔖 ID
                </h3>
                <code className="block bg-gray-100 rounded p-2 text-xs text-gray-700 font-mono">
                  {selectedNode.id}
                </code>
              </div>

              {/* 연결 정보 (추후 Agent G에서 추가) */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  🔗 연결 관계
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    (Agent G: 호버 효과 및 연결선 상세 정보)
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-xs text-blue-700">
                      이 노드와 연결된 다른 노드의 정보가 여기에 표시됩니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 닫기 버튼 */}
              <button
                onClick={() => setSelectedNode(null)}
                className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
              >
                닫기
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                노드를 선택하세요
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                3D 네트워크에서 노드를 클릭하면 상세 정보가 여기에 표시됩니다.
              </p>

              {/* 범례 */}
              <div className="mt-6 w-full space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  범례
                </p>
                {[
                  { color: '#3b82f6', label: '서비스' },
                  { color: '#10b981', label: '치료사' },
                  { color: '#f97316', label: '고객' },
                  { color: '#a855f7', label: '조직' },
                  { color: '#ef4444', label: 'KPI' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center space-x-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          하단 푸터 (정보)
          ========================================== */}
      <div className="bg-gray-100 border-t border-gray-200 px-6 py-3 text-xs text-gray-600">
        <p>
          💡 팁: 마우스로 드래그하여 회전 | 스크롤로 확대/축소 | 노드 클릭으로 상세 정보 보기
        </p>
      </div>
    </div>
  );
}
