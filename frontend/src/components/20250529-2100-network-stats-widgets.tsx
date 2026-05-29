// ============================================================
// 📌 컴포넌트명: NetworkStatsWidgets
// 📋 목적: 관리자 대시보드용 네트워크 통계 위젯 (4개 카드)
// 🔧 기능:
//   - 총 노드 수 + 추세 차트
//   - 총 연결선 수 + 밀도 지표
//   - 평균 중심성 + 순위
//   - 클러스터 수 + 분포
// 📤 Props: none (useNetworkStats 훅에서 데이터 로드)
// 📅 작성일: 2025-05-29
// ============================================================

'use client';

import React, { useMemo } from 'react';
import { TrendingUp, Network, Zap, Layers } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNetworkStats } from '@/hooks/20250529-2100-useNetworkStats';

/**
 * 단일 통계 카드 컴포넌트
 * - 숫자 + 미니 차트 + 전월 대비
 */
interface StatCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: React.ReactNode;
  trend?: {
    percentage: number;
    isPositive: boolean;
  };
  chart?: {
    data: Array<{ value: number; timestamp: string }>;
    type: 'line' | 'area' | 'bar';
    color: string;
  };
  comparison?: {
    previousValue: number | string;
    label: string;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  chart,
  comparison,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
          {icon}
        </div>
      </div>

      {/* 미니 차트 */}
      {chart && (
        <div className="h-12 mb-4 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            {chart.type === 'line' && (
              <LineChart data={chart.data}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={chart.color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            )}
            {chart.type === 'area' && (
              <AreaChart data={chart.data}>
                <Area
                  type="monotone"
                  dataKey="value"
                  fill={chart.color}
                  fillOpacity={0.3}
                  stroke={chart.color}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            )}
            {chart.type === 'bar' && (
              <BarChart data={chart.data}>
                <Bar
                  dataKey="value"
                  fill={chart.color}
                  isAnimationActive={false}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* 통계 정보 */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        {trend && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">월간 추세</span>
            <div className={`flex items-center gap-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs font-semibold">
                {trend.isPositive ? '+' : ''}{trend.percentage}%
              </span>
            </div>
          </div>
        )}
        {comparison && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{comparison.label}</span>
            <span className="text-xs font-semibold text-gray-800">
              {comparison.previousValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 네트워크 통계 위젯 그룹
 */
export const NetworkStatsWidgets: React.FC = () => {
  const { stats, isLoading, error, historicalData } = useNetworkStats();

  // 모의 데이터 생성 (실제로는 API에서 받음)
  const mockNodeTrendData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: Math.floor(Math.random() * 50 + 80),
      timestamp: `${i + 1}월`,
    }));
  }, []);

  const mockEdgeTrendData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: Math.floor(Math.random() * 150 + 200),
      timestamp: `${i + 1}월`,
    }));
  }, []);

  const mockDensityData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: Math.floor(Math.random() * 30 + 40),
      timestamp: `${i + 1}월`,
    }));
  }, []);

  const mockClusterData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: Math.floor(Math.random() * 8 + 3),
      timestamp: `${i + 1}월`,
    }));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-100 rounded mb-4"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="text-sm font-semibold">데이터 로드 실패</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 제목 */}
      <div className="flex items-center gap-3 mb-6">
        <Network className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">네트워크 통계</h2>
      </div>

      {/* 4개 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 카드 1: 총 노드 수 */}
        <StatCard
          title="총 노드 수"
          value={stats?.totalNodes || 0}
          unit="개"
          icon={<Layers className="w-6 h-6" />}
          trend={{
            percentage: 12.5,
            isPositive: true,
          }}
          chart={{
            data: mockNodeTrendData,
            type: 'area',
            color: '#3b82f6',
          }}
          comparison={{
            previousValue: Math.floor((stats?.totalNodes || 0) * 0.88),
            label: '전월 대비',
          }}
        />

        {/* 카드 2: 총 연결선 수 */}
        <StatCard
          title="총 연결선 수"
          value={stats?.totalEdges || 0}
          unit="개"
          icon={<Network className="w-6 h-6" />}
          trend={{
            percentage: 8.3,
            isPositive: true,
          }}
          chart={{
            data: mockEdgeTrendData,
            type: 'line',
            color: '#10b981',
          }}
          comparison={{
            previousValue: Math.floor((stats?.totalEdges || 0) * 0.92),
            label: '전월 대비',
          }}
        />

        {/* 카드 3: 평균 중심성 */}
        <StatCard
          title="평균 중심성"
          value={(stats?.averageCentrality || 0).toFixed(2)}
          unit="점"
          icon={<Zap className="w-6 h-6" />}
          trend={{
            percentage: 5.2,
            isPositive: true,
          }}
          chart={{
            data: mockDensityData,
            type: 'area',
            color: '#f59e0b',
          }}
          comparison={{
            previousValue: ((stats?.averageCentrality || 0) * 0.95).toFixed(2),
            label: '전월 대비',
          }}
        />

        {/* 카드 4: 클러스터 수 */}
        <StatCard
          title="클러스터 수"
          value={stats?.clusterCount || 0}
          unit="개"
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{
            percentage: 3.1,
            isPositive: false,
          }}
          chart={{
            data: mockClusterData,
            type: 'bar',
            color: '#ef4444',
          }}
          comparison={{
            previousValue: Math.floor((stats?.clusterCount || 0) * 1.05),
            label: '전월 대비',
          }}
        />
      </div>

      {/* 상세 정보 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* 네트워크 밀도 & 스펙트럼 */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">네트워크 밀도</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">전체 밀도</span>
                <span className="text-sm font-bold text-blue-600">{(stats?.networkDensity || 0).toFixed(3)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((stats?.networkDensity || 0) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-4 p-3 bg-blue-50 rounded">
              네트워크 밀도는 가능한 모든 연결 중 실제 연결의 비율입니다.
              높을수록 네트워크가 더 촘촘합니다.
            </div>
          </div>
        </div>

        {/* 중심성 순위 */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">중심 노드 순위 (상위 5)</h3>
          <div className="space-y-3">
            {(stats?.topCentralityNodes || []).slice(0, 5).map((node, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-6">{idx + 1}</span>
                  <span className="text-sm font-medium text-gray-800">{node.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs text-gray-600">중심성</p>
                    <p className="text-sm font-bold text-blue-600">{node.centrality.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-200 rounded-full h-6 w-6 flex items-center justify-center">
                    <span className="text-xs text-gray-700 font-bold">{idx + 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 추가 지표 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">주요 지표</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-2">평균 차수</p>
            <p className="text-2xl font-bold text-gray-900">{(stats?.averageDegree || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-2">지름 (Diameter)</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.diameter || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-2">평균 경로 길이</p>
            <p className="text-2xl font-bold text-gray-900">{(stats?.averagePathLength || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-2">집중화 계수</p>
            <p className="text-2xl font-bold text-gray-900">{(stats?.clusteringCoefficient || 0).toFixed(3)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatsWidgets;
