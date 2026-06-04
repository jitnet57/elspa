// ============================================================
// 📌 페이지: 지식 네트워크 3D (API 통합)
// 📋 목적: 백엔드 API에서 지식 네트워크 데이터를 로드하여 3D로 시각화
// 🔧 기능: API 데이터 로드 + 3D 시각화 + 검색 + 에러 처리
// 📅 작성일: 2026-05-29
// ⚠️ 주의: 'use client' 컴포넌트 (Three.js 렌더링)
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import KnowledgeNetwork3D, { NetworkNode } from '@/components/20250529-1435-knowledge-network-3d';
import KnowledgeNetworkOptimized from '@/components/20250529-1545-knowledge-network-optimized';
import { getKnowledgeNetworkNodes, getKnowledgeNetworkNodeById } from '@/lib/api-client';

/**
 * 지식 네트워크 3D 페이지 (API 통합)
 * - FastAPI에서 노드 데이터 실시간 로드
 * - Three.js 기반 3D 시각화
 * - 노드 클릭 시 API에서 상세 정보 로드
 * - 로딩 스피너 & 에러 처리 포함
 */
export default function KnowledgeNetworkPage() {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // 초기 로드: 모든 노드 조회
  useEffect(() => {
    const loadNodes = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await getKnowledgeNetworkNodes({ limit: 100 });
        console.log('✅ 노드 로드 완료:', response.nodes.length, '개');

        setNodes(response.nodes);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '노드를 로드할 수 없습니다';
        console.error('❌ 노드 로드 실패:', errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadNodes();
  }, []);

  // 노드 클릭 핸들러: API에서 상세 정보 로드
  const handleNodeClick = async (node: NetworkNode) => {
    try {
      setIsLoadingDetail(true);
      setError(null);

      // API에서 상세 정보 로드 (선택사항 - 이미 클라이언트에 있으면 건너뜀)
      const detailNode = await getKnowledgeNetworkNodeById(node.id);
      console.log('🎯 상세 정보 로드:', detailNode);

      setSelectedNode(detailNode);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '상세 정보를 불러올 수 없습니다';
      console.warn('⚠️ 상세 정보 로드 실패:', errorMessage);
      // 실패해도 현재 노드 표시 (클라이언트 데이터 사용)
      setSelectedNode(node);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* 로딩 상태 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 font-semibold">지식 네트워크를 로드 중입니다...</p>
            <p className="text-gray-500 text-sm mt-2">잠시만 기다려주세요</p>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md">
            <div className="text-red-500 text-4xl mb-4">!</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">오류 발생</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 3D 시각화 영역 (노드 수에 따라 자동 선택) */}
      {!isLoading && !error && nodes.length > 0 && (
        <>
          {nodes.length < 500 ? (
            // 표준 버전: 100개 미만 노드
            <KnowledgeNetwork3D
              nodes={nodes}
              onNodeClick={handleNodeClick}
            />
          ) : (
            // 최적화 버전: 500개 이상 노드 (Fallback으로 사용)
            <KnowledgeNetworkOptimized
              nodes={nodes}
              onNodeClick={handleNodeClick}
            />
          )}
        </>
      )}

      {/* 선택된 노드 상세 정보 패널 */}
      {selectedNode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-2xl p-6 max-w-md z-20 animate-fadeIn">
          <button
            onClick={() => setSelectedNode(null)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>

          <div className="space-y-3">
            {/* 로딩 상태 (상세 정보 로드 중) */}
            {isLoadingDetail && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <p className="text-gray-500 text-sm">상세 정보 로드 중...</p>
              </div>
            )}

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
      {!isLoading && !error && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs hidden md:block">
          <h1 className="text-lg font-bold text-gray-900">ElSpa 지식 네트워크</h1>
          <p className="text-sm text-gray-600">
            {nodes.length > 0 ? `${nodes.length}개 노드` : '로드 중...'}
          </p>
        </div>
      )}
    </div>
  );
}
