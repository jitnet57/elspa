// ============================================================
// 📌 훅명: useNetworkStats
// 📋 목적: 네트워크 통계 데이터 로드 및 캐싱 (30초 TTL)
// 🔧 기능:
//   - API 호출: /api/network/stats
//   - Zustand 상태 관리
//   - 30초 캐시 (시간 초과 후 자동 갱신)
//   - 에러 처리
// 📤 반환값: { stats, isLoading, error, historicalData, refetch }
// 📅 작성일: 2025-05-29
// ============================================================

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { create } from 'zustand';

/**
 * 네트워크 통계 타입
 */
interface NetworkStats {
  totalNodes: number;
  totalEdges: number;
  networkDensity: number;
  averageCentrality: number;
  averageDegree: number;
  diameter: number;
  averagePathLength: number;
  clusteringCoefficient: number;
  clusterCount: number;
  topCentralityNodes: Array<{
    id: string;
    centrality: number;
    degree: number;
  }>;
  modularity: number;
  connectedComponents: number;
  timestamp: number;
}

interface HistoricalDataPoint {
  timestamp: number;
  date: string;
  nodes: number;
  edges: number;
  density: number;
  averageCentrality: number;
}

/**
 * Zustand 스토어 타입
 */
interface NetworkStatsStore {
  stats: NetworkStats | null;
  historicalData: HistoricalDataPoint[];
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;

  // 액션
  setStats: (stats: NetworkStats) => void;
  setHistoricalData: (data: HistoricalDataPoint[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastFetchTime: (time: number) => void;
  reset: () => void;
}

/**
 * 네트워크 통계 상태 관리 스토어
 */
const useNetworkStatsStore = create<NetworkStatsStore>((set) => ({
  stats: null,
  historicalData: [],
  isLoading: false,
  error: null,
  lastFetchTime: null,

  setStats: (stats) => set({ stats }),
  setHistoricalData: (historicalData) => set({ historicalData }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastFetchTime: (lastFetchTime) => set({ lastFetchTime }),
  reset: () =>
    set({
      stats: null,
      historicalData: [],
      isLoading: false,
      error: null,
      lastFetchTime: null,
    }),
}));

/**
 * 모의 통계 데이터 생성 (API 없을 때)
 */
const generateMockStats = (): NetworkStats => {
  const topNodes = Array.from({ length: 10 }, (_, i) => ({
    id: `노드 #${Math.floor(Math.random() * 100) + 1}`,
    centrality: Math.random() * 0.5 + 0.5,
    degree: Math.floor(Math.random() * 30 + 10),
  }));

  return {
    totalNodes: Math.floor(Math.random() * 50 + 200),
    totalEdges: Math.floor(Math.random() * 100 + 350),
    networkDensity: Math.random() * 0.3 + 0.3,
    averageCentrality: Math.random() * 0.3 + 0.5,
    averageDegree: Math.random() * 10 + 15,
    diameter: Math.floor(Math.random() * 5 + 3),
    averagePathLength: Math.random() * 1 + 2.5,
    clusteringCoefficient: Math.random() * 0.3 + 0.4,
    clusterCount: Math.floor(Math.random() * 3 + 4),
    topCentralityNodes: topNodes.sort((a, b) => b.centrality - a.centrality).slice(0, 5),
    modularity: Math.random() * 0.2 + 0.55,
    connectedComponents: Math.floor(Math.random() * 2 + 1),
    timestamp: Date.now(),
  };
};

/**
 * 모의 히스토리 데이터 생성
 */
const generateMockHistoricalData = (): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 29; i >= 0; i--) {
    const timestamp = now - i * dayMs;
    const date = new Date(timestamp).toLocaleDateString('ko-KR');

    data.push({
      timestamp,
      date,
      nodes: Math.floor(Math.random() * 50 + 180 + i * 1.5),
      edges: Math.floor(Math.random() * 100 + 300 + i * 3),
      density: Math.random() * 0.15 + 0.35 + i * 0.001,
      averageCentrality: Math.random() * 0.2 + 0.5 + i * 0.002,
    });
  }

  return data;
};

/**
 * 네트워크 통계 조회 훅
 * @param autoRefetch - 자동 갱신 여부 (기본값: true, 30초)
 * @returns { stats, isLoading, error, historicalData, refetch }
 */
export function useNetworkStats(autoRefetch: boolean = true) {
  const { stats, historicalData, isLoading, error, lastFetchTime, ...actions } = useNetworkStatsStore();

  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const CACHE_DURATION_MS = 30 * 1000; // 30초

  /**
   * API에서 통계 데이터 조회
   */
  const fetchStats = useCallback(async () => {
    try {
      actions.setLoading(true);
      actions.setError(null);

      // API 호출 시뮬레이션 (실제로는 /api/network/stats)
      // const response = await fetch('/api/network/stats', {
      //   method: 'GET',
      //   headers: { 'Content-Type': 'application/json' },
      // });

      // if (!response.ok) {
      //   throw new Error(`API Error: ${response.statusText}`);
      // }

      // const data = await response.json();
      // actions.setStats(data.stats);
      // actions.setHistoricalData(data.historicalData);

      // 모의 데이터 사용 (API 완성 후 위의 실제 코드로 대체)
      const mockStats = generateMockStats();
      const mockHistoricalData = generateMockHistoricalData();

      actions.setStats(mockStats);
      actions.setHistoricalData(mockHistoricalData);
      actions.setLastFetchTime(Date.now());
      actions.setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      actions.setError(errorMessage);
      actions.setLoading(false);

      // 폴백: 모의 데이터 사용
      try {
        const mockStats = generateMockStats();
        const mockHistoricalData = generateMockHistoricalData();
        actions.setStats(mockStats);
        actions.setHistoricalData(mockHistoricalData);
      } catch (mockErr) {
        console.error('Failed to generate mock data:', mockErr);
      }
    }
  }, [actions]);

  /**
   * 캐시 확인 및 갱신
   */
  const refreshIfNeeded = useCallback(() => {
    const now = Date.now();
    const shouldRefetch = !lastFetchTime || now - lastFetchTime >= CACHE_DURATION_MS;

    if (shouldRefetch) {
      fetchStats();
    }
  }, [lastFetchTime, fetchStats]);

  /**
   * 자동 갱신 설정
   */
  useEffect(() => {
    if (!autoRefetch) return;

    // 초기 로드
    refreshIfNeeded();

    // 30초 주기로 갱신
    const intervalId = setInterval(() => {
      refreshIfNeeded();
    }, CACHE_DURATION_MS);

    return () => {
      clearInterval(intervalId);
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, [autoRefetch, refreshIfNeeded]);

  /**
   * 수동 갱신 함수
   */
  const refetch = useCallback(async () => {
    actions.setLastFetchTime(0); // 캐시 무효화
    await fetchStats();
  }, [fetchStats, actions]);

  return {
    stats: stats || {
      totalNodes: 0,
      totalEdges: 0,
      networkDensity: 0,
      averageCentrality: 0,
      averageDegree: 0,
      diameter: 0,
      averagePathLength: 0,
      clusteringCoefficient: 0,
      clusterCount: 0,
      topCentralityNodes: [],
      modularity: 0,
      connectedComponents: 0,
      timestamp: 0,
    },
    historicalData,
    isLoading,
    error,
    refetch,
    lastFetchTime: lastFetchTime ? new Date(lastFetchTime).toLocaleTimeString('ko-KR') : null,
  };
}

/**
 * 네트워크 통계 계산 유틸리티 함수들
 */

/**
 * 네트워크 밀도 계산
 * @param nodes - 노드 수
 * @param edges - 엣지 수
 * @returns 밀도 (0-1)
 */
export function calculateNetworkDensity(nodes: number, edges: number): number {
  if (nodes <= 1) return 0;
  const maxEdges = (nodes * (nodes - 1)) / 2;
  return maxEdges > 0 ? edges / maxEdges : 0;
}

/**
 * 평균 차수 계산
 * @param nodes - 노드 수
 * @param edges - 엣지 수
 * @returns 평균 차수
 */
export function calculateAverageDegree(nodes: number, edges: number): number {
  if (nodes === 0) return 0;
  return (2 * edges) / nodes;
}

/**
 * 중심성 점수 정규화 (0-1)
 * @param centrality - 원본 중심성
 * @param maxCentrality - 최대 중심성
 * @returns 정규화된 중심성
 */
export function normalizeCentrality(centrality: number, maxCentrality: number): number {
  if (maxCentrality === 0) return 0;
  return Math.min(centrality / maxCentrality, 1);
}

/**
 * 네트워크 성장률 계산
 * @param current - 현재 값
 * @param previous - 이전 값
 * @returns 성장률 (%)
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export default useNetworkStats;
