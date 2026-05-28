// ============================================================
// 📌 페이지: 지식 네트워크 3D
// 📋 목적: 세부(Cebu) ElSpa 시장 정보를 3D 네트워크로 시각화
// 🔧 기능: 3D 시각화 + 검색 필터링
// 📅 작성일: 2026-05-29
// ⚠️ 주의: 'use client' 컴포넌트 (Three.js 렌더링)
// ============================================================

'use client';

import { useState } from 'react';
import KnowledgeNetwork3D, { NetworkNode } from '@/components/20250529-1435-knowledge-network-3d';

/**
 * 샘플 지식 네트워크 데이터
 * ElSpa 시장의 주요 정보: 점포, 상품, 판매자, 고객
 */
const SAMPLE_KNOWLEDGE_NETWORK: NetworkNode[] = [
  // 📍 시장 정보
  {
    id: 'elspa-market',
    label: 'ElSpa 시장',
    description: '세부(Cebu) 지역의 종합 마사지 및 웰니스 서비스 시장',
    category: '시장',
    color: '#ef4444',
  },

  // 💇 마사지 서비스
  {
    id: 'massage-thai',
    label: '타이 마사지',
    description: '전통 태국식 마사지, 경혈 치료, 근육 이완',
    category: '마사지',
    color: '#3b82f6',
  },
  {
    id: 'massage-shiatsu',
    label: '시아츠 마사지',
    description: '일본식 지압 마사지, 신경계 활성화',
    category: '마사지',
    color: '#3b82f6',
  },
  {
    id: 'massage-sports',
    label: '스포츠 마사지',
    description: '운동 선수 전문 마사지, 근육 회복 치료',
    category: '마사지',
    color: '#3b82f6',
  },
  {
    id: 'massage-aromatherapy',
    label: '아로마테라피',
    description: '향기 요법, 정신 건강 개선, 스트레스 완화',
    category: '마사지',
    color: '#3b82f6',
  },

  // 💆 웰니스 서비스
  {
    id: 'wellness-spa',
    label: '스파',
    description: '고급 휴식 및 피부 관리 서비스',
    category: '웰니스',
    color: '#10b981',
  },
  {
    id: 'wellness-yoga',
    label: '요가',
    description: '신체 단련, 명상, 유연성 증진',
    category: '웰니스',
    color: '#10b981',
  },
  {
    id: 'wellness-meditation',
    label: '명상',
    description: '마음챙김 명상, 스트레스 해소, 정신 수양',
    category: '웰니스',
    color: '#10b981',
  },

  // 👥 판매자 정보
  {
    id: 'therapist-john',
    label: '존 (치료사)',
    description: '경력 10년의 마사지 전문가, 타이 마사지 전공',
    category: '판매자',
    color: '#f59e0b',
  },
  {
    id: 'therapist-maria',
    label: '마리아 (치료사)',
    description: '스파 및 아로마테라피 전문, 5성 평점 유지',
    category: '판매자',
    color: '#f59e0b',
  },
  {
    id: 'therapist-david',
    label: '데이빗 (치료사)',
    description: '스포츠 마사지 전문, 국가대표팀 경험',
    category: '판매자',
    color: '#f59e0b',
  },

  // 👤 고객 정보
  {
    id: 'customer-segment-corporate',
    label: '기업 고객',
    description: '회사원, 임원진, 스트레스 관리 필요',
    category: '고객',
    color: '#8b5cf6',
  },
  {
    id: 'customer-segment-athletes',
    label: '운동선수',
    description: '축구, 농구, 피트니스 선수들',
    category: '고객',
    color: '#8b5cf6',
  },
  {
    id: 'customer-segment-elderly',
    label: '시니어',
    description: '65세 이상, 건강 관리 필요',
    category: '고객',
    color: '#8b5cf6',
  },

  // 📊 경영 정보
  {
    id: 'business-revenue',
    label: '매출',
    description: '월별 총 매출액, 성장률 추이',
    category: '경영',
    color: '#ec4899',
  },
  {
    id: 'business-occupancy',
    label: '예약률',
    description: '침대/방 사용률, 피크 시간',
    category: '경영',
    color: '#ec4899',
  },
  {
    id: 'business-customer-retention',
    label: '고객 유지율',
    description: '재방문 고객 비율, 만족도 지수',
    category: '경영',
    color: '#ec4899',
  },
];

/**
 * 지식 네트워크 3D 페이지
 * - Three.js 기반 3D 시각화
 * - Fuse.js 검색 기능
 * - 노드 클릭 시 상세 정보 표시
 */
export default function KnowledgeNetworkPage() {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  const handleNodeClick = (node: NetworkNode) => {
    setSelectedNode(node);
    console.log('🎯 선택된 노드:', node);
  };

  return (
    <div className="relative w-full h-screen">
      {/* 3D 시각화 영역 */}
      <KnowledgeNetwork3D
        nodes={SAMPLE_KNOWLEDGE_NETWORK}
        onNodeClick={handleNodeClick}
      />

      {/* 선택된 노드 상세 정보 패널 (중앙 상단) */}
      {selectedNode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-2xl p-6 max-w-md z-20 animate-fadeIn">
          <button
            onClick={() => setSelectedNode(null)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>

          <div className="space-y-3">
            {/* 노드 제목 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedNode.label}
              </h2>
              <span className="inline-block mt-1 text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {selectedNode.category}
              </span>
            </div>

            {/* 노드 설명 */}
            <p className="text-gray-600">{selectedNode.description}</p>

            {/* 노드 ID (개발자용) */}
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-mono">ID: {selectedNode.id}</p>
            </div>

            {/* 색상 표시 */}
            <div className="flex items-center space-x-2">
              <div
                className="w-8 h-8 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: selectedNode.color }}
              />
              <span className="text-sm text-gray-600">
                색상: {selectedNode.color}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 상단 타이틀 (모바일 친화적) */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs hidden md:block">
        <h1 className="text-lg font-bold text-gray-900">ElSpa 지식 네트워크</h1>
        <p className="text-sm text-gray-600">세부 시장 정보 시각화</p>
      </div>
    </div>
  );
}
