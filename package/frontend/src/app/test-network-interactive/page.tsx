// ============================================================
// 📌 테스트 페이지: KnowledgeNetworkInteractive
// 📋 목적: 3D 네트워크 컴포넌트 인터랙션 테스트
// 🔧 사용법: /test-network-interactive 접속
// 📅 작성일: 2026-05-29
// ============================================================

'use client';

import KnowledgeNetworkInteractive, {
  type NetworkNode,
} from '@/components/20250529-1530-knowledge-network-interactive';

// 테스트용 샘플 노드 데이터
const sampleNodes: NetworkNode[] = [
  {
    id: '1',
    label: '마사지 치료',
    description: '근육 이완 및 스트레스 해소',
    category: '서비스',
    color: '#3b82f6',
  },
  {
    id: '2',
    label: '요양원 관리',
    description: '입소자 관리 및 케어',
    category: '관리',
    color: '#10b981',
  },
  {
    id: '3',
    label: '시장 분석',
    description: '경쟁사 분석 및 시장 조사',
    category: '비즈니스',
    color: '#f59e0b',
  },
  {
    id: '4',
    label: '드라이버 추적',
    description: '실시간 위치 기반 서비스',
    category: '기술',
    color: '#ef4444',
  },
  {
    id: '5',
    label: '고객 만족도',
    description: '피드백 및 리뷰 관리',
    category: '분석',
    color: '#8b5cf6',
  },
  {
    id: '6',
    label: 'AI 추천 시스템',
    description: '개인화된 서비스 제안',
    category: '기술',
    color: '#ec4899',
  },
  {
    id: '7',
    label: '결제 시스템',
    description: '안전한 거래 처리',
    category: '기술',
    color: '#06b6d4',
  },
  {
    id: '8',
    label: '통계 대시보드',
    description: '실시간 성과 지표',
    category: '관리',
    color: '#14b8a6',
  },
  {
    id: '9',
    label: '스케줄 관리',
    description: '예약 및 일정 조율',
    category: '관리',
    color: '#f97316',
  },
  {
    id: '10',
    label: '알림 시스템',
    description: '실시간 푸시 알림',
    category: '기술',
    color: '#6366f1',
  },
  {
    id: '11',
    label: '데이터 보안',
    description: '개인정보 보호 및 암호화',
    category: '기술',
    color: '#dc2626',
  },
  {
    id: '12',
    label: '팀 협업',
    description: '직원 간 의사소통',
    category: '관리',
    color: '#2563eb',
  },
];

export default function TestNetworkInteractivePage() {
  const handleNodeClick = (node: NetworkNode) => {
    console.log('선택된 노드:', node);
    alert(`📌 선택: ${node.label}\n\n${node.description}`);
  };

  return (
    <main className="w-full h-screen">
      <KnowledgeNetworkInteractive
        nodes={sampleNodes}
        onNodeClick={handleNodeClick}
      />

      {/* 정보 배너 */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-cyan-600 text-white px-6 py-3 rounded-lg shadow-lg z-20">
        <p className="text-sm font-medium">
          ✅ 인터랙션 테스트 중... 드래그/휠/더블클릭을 시도해보세요!
        </p>
      </div>
    </main>
  );
}
