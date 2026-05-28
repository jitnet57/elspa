// ============================================================
// 📌 네트워크 통계 대시보드
// 📋 목적: 중심성, 클러스터, 강도 통계를 시각화
// 🔧 기능: 실시간 업데이트, 탭 전환, 상세 정보
// 📅 작성일: 2025-05-29
// ============================================================

'use client';

import React, { useState, useMemo } from 'react';
import {
  calculateDegreeCentrality,
  clusterNodesKMeans,
  getEdgeWeightHistogram,
  calculateNetworkStats,
  GraphNode,
  GraphEdge,
  NetworkStats,
  CentralityResult,
  ClusterResult,
} from '@/lib/algorithms/network-analysis';

export interface NetworkStatsDashboardProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  isOpen?: boolean;
  onNodeSelect?: (nodeId: string) => void;
}

type TabType = 'overview' | 'centrality' | 'clusters' | 'strength';

export default function NetworkStatsDashboard({
  nodes,
  edges,
  isOpen = true,
  onNodeSelect,
}: NetworkStatsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [clusterCount, setClusterCount] = useState(4);

  // ============================================================
  // 📊 통계 계산
  // ============================================================
  const stats = useMemo(() => {
    return calculateNetworkStats(nodes, edges);
  }, [nodes, edges]);

  const centrality = useMemo(() => {
    return calculateDegreeCentrality(nodes, edges).slice(0, 10);
  }, [nodes, edges]);

  const clusters = useMemo(() => {
    return clusterNodesKMeans(nodes, clusterCount);
  }, [nodes, clusterCount]);

  const clusterStats = useMemo(() => {
    const stats: Map<number, { count: number; nodes: string[] }> = new Map();
    clusters.forEach((c) => {
      if (!stats.has(c.clusterId)) {
        stats.set(c.clusterId, { count: 0, nodes: [] });
      }
      const stat = stats.get(c.clusterId)!;
      stat.count++;
      stat.nodes.push(c.nodeId);
    });
    return Array.from(stats.entries()).map(([id, data]) => ({
      clusterId: id,
      ...data,
    }));
  }, [clusters]);

  const histogram = useMemo(() => {
    return getEdgeWeightHistogram(edges, 8);
  }, [edges]);

  // ============================================================
  // 🎨 클러스터 색상
  // ============================================================
  const clusterColors = [
    '#FF6B6B', // 빨강
    '#4ECDC4', // 청록
    '#FFE66D', // 노랑
    '#95E1D3', // 연두
    '#C7CEEA', // 보라
    '#FF8E8E', // 연한빨강
  ];

  const getClusterColor = (clusterId: number): string => {
    return clusterColors[clusterId % clusterColors.length];
  };

  // ============================================================
  // 📍 노드 클릭
  // ============================================================
  const handleNodeClick = (nodeId: string) => {
    onNodeSelect?.(nodeId);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-4 top-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex justify-between items-center">
        <h2 className="text-lg font-bold">📊 네트워크 통계</h2>
        <button
          className="text-xs bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded"
          onClick={() => setActiveTab('overview')}
        >
          닫기
        </button>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          개요
        </button>
        <button
          onClick={() => setActiveTab('centrality')}
          className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'centrality'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          중심성
        </button>
        <button
          onClick={() => setActiveTab('clusters')}
          className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'clusters'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          클러스터
        </button>
        <button
          onClick={() => setActiveTab('strength')}
          className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'strength'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          강도
        </button>
      </div>

      {/* 컨텐츠 */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {/* 개요 탭 */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* 총 노드 */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-gray-600">총 노드</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalNodes}</p>
              </div>

              {/* 총 엣지 */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs text-gray-600">총 엣지</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalEdges}</p>
              </div>

              {/* 평균 강도 */}
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-gray-600">평균 강도</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.averageWeight.toFixed(2)}
                </p>
              </div>

              {/* 밀도 */}
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="text-xs text-gray-600">네트워크 밀도</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(stats.density * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* 강도 범위 */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">강도 범위</p>
              <div className="flex justify-between text-xs text-gray-600">
                <span>최소: {stats.minWeight.toFixed(2)}</span>
                <span>최대: {stats.maxWeight.toFixed(2)}</span>
              </div>
            </div>

            {/* 상위 중심 노드 */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">🎯 상위 중심 노드 (Top 5)</p>
              <div className="space-y-2">
                {stats.topCentralNodes.slice(0, 5).map((node, idx) => (
                  <div
                    key={node.nodeId}
                    className="flex items-center justify-between bg-white rounded px-2 py-1 border border-gray-200 hover:border-blue-400 cursor-pointer transition-colors"
                    onClick={() => handleNodeClick(node.nodeId)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs text-gray-700 truncate">{node.nodeId}</span>
                    </div>
                    <span className="text-xs font-semibold text-blue-600">{node.degree}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 중심성 탭 */}
        {activeTab === 'centrality' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              노드별 Degree Centrality (연결 개수 기준 순위)
            </p>
            <div className="space-y-2">
              {centrality.map((node, idx) => (
                <div
                  key={node.nodeId}
                  className="flex items-center gap-2 bg-white rounded p-2 border border-gray-200 hover:border-blue-400 cursor-pointer transition-colors"
                  onClick={() => handleNodeClick(node.nodeId)}
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700">{node.nodeId}</span>
                      <span className="text-xs text-gray-500">{node.degree} 연결</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${node.centrality * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 클러스터 탭 */}
        {activeTab === 'clusters' && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                클러스터 수 (K): {clusterCount}
              </label>
              <input
                type="range"
                min="2"
                max="8"
                value={clusterCount}
                onChange={(e) => setClusterCount(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              {clusterStats.map((cluster) => (
                <div
                  key={cluster.clusterId}
                  className="bg-white rounded-lg p-3 border"
                  style={{ borderColor: getClusterColor(cluster.clusterId) }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: getClusterColor(cluster.clusterId) }}
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        클러스터 {cluster.clusterId + 1}
                      </span>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      {cluster.count}개 노드
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    {cluster.nodes.slice(0, 3).map((nodeId) => (
                      <div key={nodeId} className="truncate">
                        • {nodeId}
                      </div>
                    ))}
                    {cluster.nodes.length > 3 && (
                      <div className="text-gray-500">+{cluster.nodes.length - 3} more</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 강도 탭 */}
        {activeTab === 'strength' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">엣지 강도 분포 (히스토그램)</p>
            <div className="space-y-2">
              {histogram.map((bucket, idx) => {
                const maxCount = Math.max(...histogram.map((h) => h.count));
                const percentage = (bucket.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600 w-16">{bucket.range}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-full flex items-center justify-center transition-all"
                        style={{ width: `${percentage}%` }}
                      >
                        {bucket.count > 0 && (
                          <span className="text-xs font-bold text-white text-center">
                            {bucket.count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">총 엣지 수:</span>
                <span className="font-semibold">{edges.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">평균 강도:</span>
                <span className="font-semibold">{stats.averageWeight.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">강도 범위:</span>
                <span className="font-semibold">
                  {stats.minWeight.toFixed(3)} ~ {stats.maxWeight.toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
