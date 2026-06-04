// ============================================================
// 📌 페이지: 지식 네트워크 성능 벤치마크
// 📋 목적: 표준 vs 최적화 버전 성능 비교
// 🔧 기능: 100/500/1000 노드 테스트, FPS 모니터링
// 📅 작성일: 2026-05-29
// ============================================================

'use client';

import { useState } from 'react';
import KnowledgeNetwork3D, { NetworkNode } from '@/components/20250529-1435-knowledge-network-3d';
import KnowledgeNetworkOptimized from '@/components/20250529-1545-knowledge-network-optimized';

// 테스트 노드 생성
const generateTestNodes = (count: number): NetworkNode[] => {
  const categories = ['마사지', '시장', '웰니스', '판매자', '고객', '경영'];
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  const nodes: NetworkNode[] = [];

  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const color = colors[i % colors.length];

    // 구 표면에 분산된 위치 생성
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    const radius = 20;

    nodes.push({
      id: `node-${i}`,
      label: `노드 ${i + 1}`,
      description: `테스트 노드 #${i + 1} - ${category} 카테고리`,
      category,
      color,
      position: {
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi),
      },
    });
  }

  return nodes;
};

export default function BenchmarkPage() {
  const [testSize, setTestSize] = useState<100 | 500 | 1000>(100);
  const [useOptimized, setUseOptimized] = useState(true);
  const [isRunning, setIsRunning] = useState(true);

  const testNodes = generateTestNodes(testSize);

  const Component = useOptimized ? KnowledgeNetworkOptimized : KnowledgeNetwork3D;

  return (
    <div className="relative w-full h-screen">
      {/* 제어판 (좌상단) */}
      <div className="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-xl p-6 max-w-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">성능 벤치마크</h2>

        {/* 노드 수 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            테스트 노드 수
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[100, 500, 1000].map((size) => (
              <button
                key={size}
                onClick={() => setTestSize(size as 100 | 500 | 1000)}
                className={`py-2 px-3 rounded text-sm font-medium transition ${
                  testSize === size
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {size}개
              </button>
            ))}
          </div>
        </div>

        {/* 버전 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            렌더링 버전
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setUseOptimized(false)}
              className={`py-2 px-3 rounded text-sm font-medium transition ${
                !useOptimized
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              표준
            </button>
            <button
              onClick={() => setUseOptimized(true)}
              className={`py-2 px-3 rounded text-sm font-medium transition ${
                useOptimized
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              최적화
            </button>
          </div>
        </div>

        {/* 상태 표시 */}
        <div className="p-3 bg-blue-50 rounded border border-blue-200 text-sm text-blue-800">
          <p className="font-semibold mb-1">현재 설정</p>
          <p>• 노드: <strong>{testSize}개</strong></p>
          <p>• 버전: <strong>{useOptimized ? '최적화' : '표준'}</strong></p>
          <p className="mt-2 text-xs text-blue-600">
            💡 팁: 오른쪽 상단의 FPS를 확인하며 성능을 비교해보세요
          </p>
        </div>

        {/* 목표 성능 */}
        <div className="mt-4 p-3 bg-green-50 rounded border border-green-200 text-sm">
          <p className="font-semibold text-green-800 mb-2">🎯 성능 목표</p>
          <ul className="text-green-700 space-y-1">
            <li>✓ 100 노드: 60fps</li>
            <li>✓ 500 노드: 45fps</li>
            <li>✓ 1000 노드: 30fps</li>
          </ul>
        </div>
      </div>

      {/* 3D 시각화 */}
      <Component
        nodes={testNodes}
        onNodeClick={(node) => {
          console.log('선택된 노드:', node);
        }}
      />

      {/* 정보 패널 (우하단) */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs text-sm">
        <p className="font-semibold text-gray-900 mb-2">📊 벤치마크 가이드</p>
        <ul className="text-gray-700 space-y-1 text-xs">
          <li>1️⃣ <strong>100개 노드</strong>로 시작</li>
          <li>2️⃣ 표준 vs 최적화 비교</li>
          <li>3️⃣ <strong>500/1000개</strong>로 확대</li>
          <li>4️⃣ 우상단 FPS 확인</li>
          <li>5️⃣ 드래그/줌으로 부하 테스트</li>
        </ul>
      </div>
    </div>
  );
}
