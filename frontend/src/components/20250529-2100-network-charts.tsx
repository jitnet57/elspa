// ============================================================
// 📌 컴포넌트명: NetworkCharts
// 📋 목적: Recharts 기반 네트워크 시각화 (4개 차트)
// 🔧 기능:
//   - 노드 카테고리 분포 (파이 차트)
//   - 관계 타입별 강도 분포 (막대 차트)
//   - 시간별 네트워크 변화 (선 그래프)
//   - 중심성 순위 (수평 막대)
// 📤 Props: none (useNetworkStats 훅에서 데이터 로드)
// 📅 작성일: 2025-05-29
// ============================================================

'use client';

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import { useNetworkStats } from '@/hooks/20250529-2100-useNetworkStats';

/**
 * 색상 팔레트
 */
const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#06b6d4', '#84cc16',
];

const LIGHT_COLORS = [
  '#dbeafe', '#d1fae5', '#fef3c7', '#fee2e2',
  '#ede9fe', '#fce7f3', '#ccfbf1', '#fed7aa',
  '#cffafe', '#f2f91f',
];

/**
 * 차트 래퍼 컴포넌트
 */
interface ChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, description, children }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    {description && <p className="text-xs text-gray-600 mb-4">{description}</p>}
    <div className="w-full h-80">
      {children}
    </div>
  </div>
);

/**
 * 커스텀 Tooltip
 */
const CustomTooltip = (props: any) => {
  const { active, payload } = props;

  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
        <p className="text-sm font-semibold text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          {data.payload.value !== undefined
            ? data.payload.value
            : data.value}
        </p>
      </div>
    );
  }

  return null;
};

/**
 * 네트워크 차트 그룹
 */
export const NetworkCharts: React.FC = () => {
  const { stats, isLoading, error } = useNetworkStats();

  // 모의 노드 카테고리 데이터
  const nodeCategoryData = useMemo(() => {
    return [
      { name: '치료사', value: 45, percentage: 22 },
      { name: '고객', value: 78, percentage: 38 },
      { name: '드라이버', value: 32, percentage: 15 },
      { name: '관리자', value: 28, percentage: 13 },
      { name: '파트너', value: 22, percentage: 12 },
    ];
  }, []);

  // 모의 관계 타입 데이터
  const relationshipTypeData = useMemo(() => {
    return [
      { name: '직업 관계', strength: 85, frequency: 234 },
      { name: '거래 관계', strength: 72, frequency: 189 },
      { name: '협력 관계', strength: 68, frequency: 156 },
      { name: '추천 관계', strength: 54, frequency: 102 },
      { name: '기타', strength: 45, frequency: 67 },
    ];
  }, []);

  // 모의 시간별 네트워크 변화
  const timeSeriesData = useMemo(() => {
    return [
      { date: '5월 1주', nodes: 180, edges: 320, density: 0.42 },
      { date: '5월 2주', nodes: 187, edges: 345, density: 0.44 },
      { date: '5월 3주', nodes: 195, edges: 368, density: 0.46 },
      { date: '5월 4주', nodes: 205, edges: 398, density: 0.48 },
      { date: '5월 5주', nodes: 213, edges: 425, density: 0.50 },
    ];
  }, []);

  // 모의 중심성 순위 데이터
  const centralityRankData = useMemo(() => {
    return [
      { name: '노드 #42 (고객)', centrality: 0.87, degree: 34 },
      { name: '노드 #15 (치료사)', centrality: 0.81, degree: 28 },
      { name: '노드 #88 (드라이버)', centrality: 0.74, degree: 24 },
      { name: '노드 #5 (관리자)', centrality: 0.68, degree: 21 },
      { name: '노드 #72 (파트너)', centrality: 0.61, degree: 18 },
      { name: '노드 #33 (고객)', centrality: 0.55, degree: 15 },
    ];
  }, []);

  // 모의 클러스터 분포 데이터
  const clusterDistributionData = useMemo(() => {
    return [
      { cluster: '클러스터 1', nodes: 45, edges: 87, modularity: 0.72 },
      { cluster: '클러스터 2', nodes: 38, edges: 72, modularity: 0.68 },
      { cluster: '클러스터 3', nodes: 32, edges: 61, modularity: 0.65 },
      { cluster: '클러스터 4', nodes: 28, edges: 52, modularity: 0.60 },
      { cluster: '기타 클러스터', nodes: 72, edges: 151, modularity: 0.58 },
    ];
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4 w-1/3"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="text-sm font-semibold">차트 데이터 로드 실패</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 제목 */}
      <h2 className="text-2xl font-bold text-gray-900">네트워크 시각화</h2>

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 차트 1: 노드 카테고리 분포 (파이 차트) */}
        <ChartContainer
          title="노드 카테고리 분포"
          description="각 카테고리별 노드 수 비율"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={nodeCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {nodeCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}개`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* 차트 2: 관계 타입별 강도 (막대 차트) */}
        <ChartContainer
          title="관계 타입별 강도"
          description="관계 강도 및 빈도"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={relationshipTypeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip />
              <Legend />
              <Bar dataKey="strength" fill="#3b82f6" name="강도" />
              <Bar dataKey="frequency" fill="#10b981" name="빈도" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* 차트 3: 시간별 네트워크 변화 (선 그래프) */}
        <ChartContainer
          title="시간별 네트워크 변화"
          description="노드, 연결선, 밀도 추이"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="nodes"
                stroke="#3b82f6"
                name="노드 수"
                strokeWidth={2}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="edges"
                stroke="#10b981"
                name="연결선 수"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="density"
                stroke="#f59e0b"
                name="밀도"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* 차트 4: 중심성 순위 (수평 막대) */}
        <ChartContainer
          title="중심성 순위 (상위 6)"
          description="각 노드의 중심성 점수 및 차수"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={centralityRankData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 1]} />
              <YAxis dataKey="name" type="category" width={140} />
              <Tooltip />
              <Legend />
              <Bar dataKey="centrality" fill="#8b5cf6" name="중심성" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* 차트 5: 클러스터 분포 */}
        <ChartContainer
          title="클러스터 분포"
          description="각 클러스터의 노드 및 연결선 수"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clusterDistributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cluster" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="nodes" fill="#3b82f6" name="노드 수" />
              <Bar dataKey="edges" fill="#10b981" name="연결선 수" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* 차트 6: 모듈성 점수 비교 */}
        <ChartContainer
          title="클러스터 모듈성 점수"
          description="각 클러스터의 커뮤니티 검출 품질"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clusterDistributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cluster" />
              <YAxis domain={[0, 1]} />
              <Tooltip formatter={(value) => value.toFixed(3)} />
              <Bar dataKey="modularity" fill="#ef4444" name="모듈성" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* 네트워크 메트릭 요약 */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">네트워크 메트릭 요약</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-600 font-semibold mb-2">전반적 밀도</p>
            <p className="text-2xl font-bold text-blue-600">0.456</p>
            <p className="text-xs text-gray-500 mt-2">↑ 2.1% (전주 대비)</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-600 font-semibold mb-2">모듈성</p>
            <p className="text-2xl font-bold text-green-600">0.642</p>
            <p className="text-xs text-gray-500 mt-2">↑ 1.3% (전주 대비)</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-600 font-semibold mb-2">평균 집중화</p>
            <p className="text-2xl font-bold text-orange-600">0.385</p>
            <p className="text-xs text-gray-500 mt-2">↓ 0.8% (전주 대비)</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-600 font-semibold mb-2">평균 경로 길이</p>
            <p className="text-2xl font-bold text-purple-600">3.24</p>
            <p className="text-xs text-gray-500 mt-2">↑ 0.2 (전주 대비)</p>
          </div>
        </div>
      </div>

      {/* 주요 발견사항 */}
      <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">주요 발견사항</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>
            <span className="font-semibold">• 네트워크 성장:</span> 지난 5주간 노드가 180개에서 213개로 18.3% 증가했습니다.
          </li>
          <li>
            <span className="font-semibold">• 관계 강화:</span> 연결선이 320개에서 425개로 32.8% 증가했으며, 네트워크가 더욱 촘촘해지고 있습니다.
          </li>
          <li>
            <span className="font-semibold">• 클러스터링:</span> 5개의 주요 클러스터가 식별되었으며, 평균 모듈성은 0.642로 강한 커뮤니티 구조를 보입니다.
          </li>
          <li>
            <span className="font-semibold">• 중심 노드:</span> 노드 #42 (고객)이 가장 높은 중심성(0.87)을 보이며, 네트워크에서 중추적 역할을 합니다.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NetworkCharts;
