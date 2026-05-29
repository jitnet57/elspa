// ============================================================
// 📌 컴포넌트명: NetworkDashboardAdmin
// 📋 목적: 관리자 대시보드의 3D 지식 네트워크 통합 UI
// 🔧 기능: 3D 네트워크 + 제어 사이드바 + 노드 선택 상세정보
// 📤 반환값: React.ReactNode
// 📅 작성일: 2026-05-29 21:00
// ============================================================

'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import React from 'react';

/**
 * NetworkNode: 3D 네트워크의 노드 인터페이스
 * - id: 고유 식별자
 * - label: 노드 라벨
 * - category: 분류 (기술, 비즈니스, 컨설팅 등)
 * - description: 상세 설명
 * - color: 표시 색상
 */
interface NetworkNode {
  id: string;
  label: string;
  category: string;
  description: string;
  color: string;
}

/**
 * NetworkNodeData: API에서 반환할 노드 데이터
 */
interface NetworkNodeData {
  id: string;
  label: string;
  category: string;
  description: string;
  color: string;
  connections?: string[];
}

// Lazy load Three.js 기반 3D 네트워크 컴포넌트
const KnowledgeNetwork3D = dynamic(
  () => import('./20250529-1435-knowledge-network-3d'),
  { ssr: false, loading: () => <NetworkLoadingPlaceholder /> }
);

/**
 * 로딩 플레이스홀더 컴포넌트
 */
function NetworkLoadingPlaceholder() {
  return (
    <div className="w-full h-[400px] bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-white/10">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin mx-auto mb-4"></div>
        <p className="text-indigo-300/60 text-sm font-semibold">3D 네트워크 로딩 중...</p>
      </div>
    </div>
  );
}

/**
 * 네트워크 대시보드 관리자 컴포넌트
 *
 * 구성:
 * - 상단: 3D 네트워크 시각화 (400px 높이)
 * - 우측: 제어 패널
 *   - 노드 추가/수정/삭제 폼
 *   - 빠른 검색 필터
 *   - 통계 요약 카드
 */
export default function NetworkDashboardAdmin() {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  // 3D 네트워크 노드 데이터
  const [nodes, setNodes] = useState<NetworkNode[]>([
    {
      id: 'tech-001',
      label: '웹 프레임워크',
      category: '기술',
      description: 'Next.js, React, FastAPI 등 웹 개발 프레임워크',
      color: '#3b82f6'
    },
    {
      id: 'tech-002',
      label: '데이터베이스',
      category: '기술',
      description: 'PostgreSQL, Redis, SQLAlchemy ORM',
      color: '#10b981'
    },
    {
      id: 'bus-001',
      label: '급여정산',
      category: '비즈니스',
      description: 'ElSpa 직원 급여 관리 및 정산 시스템',
      color: '#f59e0b'
    },
    {
      id: 'bus-002',
      label: '마사지예약',
      category: '비즈니스',
      description: '테라피스트 일정 관리 및 고객 예약',
      color: '#ec4899'
    },
    {
      id: 'cons-001',
      label: '서비스 최적화',
      category: '컨설팅',
      description: '성능 개선 및 사용자 경험 최적화',
      color: '#8b5cf6'
    }
  ]);

  // 선택된 노드
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  // 폼 상태 (노드 추가/수정)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState({
    label: '',
    category: '기술',
    description: '',
    color: '#3b82f6'
  });

  // 검색 필터
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // 통계 데이터
  const [stats, setStats] = useState({
    totalNodes: 5,
    activeCategory: '전체',
    lastUpdate: new Date().toLocaleString('ko-KR')
  });

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // HANDLERS
  // ============================================================

  /**
   * 노드 추가 버튼 클릭 핸들러
   */
  const handleAddNode = () => {
    if (!formData.label || !formData.description) {
      setError('라벨과 설명을 입력해주세요');
      return;
    }

    const newNode: NetworkNode = {
      id: `node-${Date.now()}`,
      label: formData.label,
      category: formData.category,
      description: formData.description,
      color: formData.color
    };

    setNodes([...nodes, newNode]);
    setFormData({ label: '', category: '기술', description: '', color: '#3b82f6' });
    setError(null);
    updateStats();
  };

  /**
   * 노드 수정 버튼 클릭 핸들러
   */
  const handleEditNode = () => {
    if (!selectedNode) return;

    const updatedNodes = nodes.map(node =>
      node.id === selectedNode.id
        ? {
            ...node,
            label: formData.label,
            category: formData.category,
            description: formData.description,
            color: formData.color
          }
        : node
    );

    setNodes(updatedNodes);
    setFormData({ label: '', category: '기술', description: '', color: '#3b82f6' });
    setSelectedNode(null);
    setFormMode('add');
    setError(null);
    updateStats();
  };

  /**
   * 노드 삭제 핸들러
   */
  const handleDeleteNode = (nodeId: string) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setNodes(nodes.filter(node => node.id !== nodeId));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
      setError(null);
      updateStats();
    }
  };

  /**
   * 노드 선택 핸들러 (3D 네트워크에서 클릭)
   */
  const handleNodeClick = (node: NetworkNode) => {
    setSelectedNode(node);
    // 수정 폼에 데이터 채우기
    setFormData({
      label: node.label,
      category: node.category,
      description: node.description,
      color: node.color
    });
    setFormMode('edit');
  };

  /**
   * 검색 및 필터링 로직
   */
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || node.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  /**
   * 통계 업데이트
   */
  const updateStats = () => {
    const categories = [...new Set(nodes.map(n => n.category))];
    setStats({
      totalNodes: nodes.length,
      activeCategory: categoryFilter === 'all' ? '전체' : categoryFilter,
      lastUpdate: new Date().toLocaleString('ko-KR')
    });
  };

  /**
   * 폼 초기화
   */
  const handleResetForm = () => {
    setFormData({ label: '', category: '기술', description: '', color: '#3b82f6' });
    setSelectedNode(null);
    setFormMode('add');
    setError(null);
  };

  // 마운트 시 통계 업데이트
  useEffect(() => {
    updateStats();
  }, [nodes, categoryFilter]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* ============================================================
          📊 3D 네트워크 시각화 영역 (상단)
          ============================================================ */}
      <section className="bg-white/3 backdrop-blur-md border border-indigo-500/20 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(99,102,241,0.15)]">

        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-indigo-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
            <h3 className="text-lg font-black text-white">ElSpa 지식 네트워크 3D</h3>
            <span className="text-[9px] font-mono text-indigo-300/50 ml-2">
              {nodes.length}개 노드 • {filteredNodes.length}개 활성
            </span>
          </div>
          <button
            onClick={handleResetForm}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-indigo-300/60 hover:text-indigo-300 rounded-lg text-xs font-bold transition-all"
          >
            초기화
          </button>
        </div>

        {/* 3D 네트워크 컨테이너 */}
        <div className="h-[400px] bg-gradient-to-b from-slate-900/50 to-slate-950/50 relative">
          <Suspense fallback={<NetworkLoadingPlaceholder />}>
            <KnowledgeNetwork3D
              nodes={filteredNodes}
              onNodeClick={handleNodeClick}
            />
          </Suspense>

          {/* 에러 상태 */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 max-w-xs">
                <p className="text-xs text-rose-400 font-semibold">⚠️ {error}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          🎮 제어 패널 (우측 사이드바)
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 왼쪽: 노드 추가/수정 폼 */}
        <div className="lg:col-span-2 space-y-6">

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 총 노드 수 */}
            <div className="bg-white/3 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-cyan-300/60 uppercase tracking-widest">총 노드</span>
                <span className="text-cyan-400">📍</span>
              </div>
              <h3 className="text-2xl font-black text-cyan-400">{stats.totalNodes}</h3>
              <p className="text-[10px] text-indigo-300/50 mt-1">활성 네트워크 노드</p>
            </div>

            {/* 카테고리별 분포 */}
            <div className="bg-white/3 backdrop-blur-md border border-purple-500/20 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-purple-300/60 uppercase tracking-widest">카테고리</span>
                <span className="text-purple-400">🏷️</span>
              </div>
              <h3 className="text-2xl font-black text-purple-400">
                {new Set(nodes.map(n => n.category)).size}
              </h3>
              <p className="text-[10px] text-indigo-300/50 mt-1">분류 유형</p>
            </div>

            {/* 마지막 업데이트 */}
            <div className="bg-white/3 backdrop-blur-md border border-orange-500/20 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-orange-300/60 uppercase tracking-widest">업데이트</span>
                <span className="text-orange-400">⏱️</span>
              </div>
              <p className="text-[10px] font-mono text-orange-300 mt-3">{stats.lastUpdate}</p>
            </div>
          </div>

          {/* 폼 섹션 */}
          <div className="bg-white/3 backdrop-blur-md border border-indigo-500/20 rounded-3xl p-6 shadow-[0_0_40px_rgba(99,102,241,0.15)]">

            {/* 폼 타이틀 */}
            <div className="mb-6 pb-4 border-b border-indigo-500/10">
              <h4 className="text-lg font-black text-white">
                {formMode === 'add' ? '✨ 새 노드 추가' : '🔧 노드 수정'}
              </h4>
              <p className="text-xs text-indigo-300/50 mt-1">
                {formMode === 'add'
                  ? '새로운 지식 노드를 추가하여 네트워크를 확장하세요'
                  : '선택한 노드의 정보를 수정할 수 있습니다'}
              </p>
            </div>

            {/* 폼 필드들 */}
            <div className="space-y-4">

              {/* 라벨 입력 */}
              <div>
                <label className="text-xs font-black text-indigo-300/60 uppercase tracking-widest block mb-2">
                  노드 라벨
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="예: 웹 프레임워크"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 font-medium text-sm"
                />
              </div>

              {/* 카테고리 선택 */}
              <div>
                <label className="text-xs font-black text-indigo-300/60 uppercase tracking-widest block mb-2">
                  카테고리
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 font-medium text-sm"
                >
                  <option value="기술">기술</option>
                  <option value="비즈니스">비즈니스</option>
                  <option value="컨설팅">컨설팅</option>
                  <option value="관리">관리</option>
                </select>
              </div>

              {/* 설명 입력 */}
              <div>
                <label className="text-xs font-black text-indigo-300/60 uppercase tracking-widest block mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="노드에 대한 상세 설명을 입력하세요"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 font-medium text-sm resize-none"
                />
              </div>

              {/* 색상 선택 */}
              <div>
                <label className="text-xs font-black text-indigo-300/60 uppercase tracking-widest block mb-2">
                  표시 색상
                </label>
                <div className="flex gap-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'].map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        formData.color === color
                          ? 'ring-2 ring-white scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* 버튼 그룹 */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={formMode === 'add' ? handleAddNode : handleEditNode}
                  className={`py-2.5 px-4 rounded-lg font-black text-sm transition-all ${
                    formMode === 'add'
                      ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30'
                      : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30'
                  }`}
                >
                  {formMode === 'add' ? '✨ 추가' : '🔧 수정'}
                </button>
                <button
                  onClick={handleResetForm}
                  className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-indigo-300/60 hover:text-indigo-300 rounded-lg font-black text-sm transition-all border border-white/10"
                >
                  초기화
                </button>
              </div>

              {/* 수정 중일 때만 삭제 버튼 표시 */}
              {formMode === 'edit' && selectedNode && (
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="w-full py-2.5 px-4 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-lg font-black text-sm transition-all"
                >
                  🗑️ 삭제
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: 검색 필터 및 노드 목록 */}
        <div className="space-y-6">

          {/* 검색 및 필터 섹션 */}
          <div className="bg-white/3 backdrop-blur-md border border-indigo-500/20 rounded-3xl p-6 shadow-[0_0_40px_rgba(99,102,241,0.15)]">

            <h4 className="text-lg font-black text-white mb-4">🔍 검색 & 필터</h4>

            {/* 검색 필드 */}
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="노드 검색..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 font-medium text-sm"
              />
            </div>

            {/* 카테고리 필터 */}
            <div className="space-y-2">
              <label className="text-xs font-black text-indigo-300/60 uppercase tracking-widest block">
                카테고리 필터
              </label>
              <div className="space-y-1.5">
                {['all', '기술', '비즈니스', '컨설팅', '관리'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      categoryFilter === cat
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-white/5 text-indigo-300/60 hover:text-indigo-300 border border-white/10'
                    }`}
                  >
                    {cat === 'all' ? '전체' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 노드 목록 */}
          <div className="bg-white/3 backdrop-blur-md border border-indigo-500/20 rounded-3xl
         overflow-hidden shadow-[0_0_40px_rgba(99,102,241,0.15)]">

            <div className="px-6 py-4 border-b border-indigo-500/10">
              <h4 className="text-lg font-black text-white">📋 노드 목록</h4>
              <p className="text-xs text-indigo-300/50 mt-1">
                총 {filteredNodes.length}개 / {nodes.length}개
              </p>
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-2 p-4">
              {filteredNodes.length > 0 ? (
                filteredNodes.map(node => (
                  <button
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all border ${
                      selectedNode?.id === node.id
                        ? 'bg-cyan-500/20 border-cyan-500/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: node.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {node.label}
                        </p>
                        <p className="text-[10px] text-indigo-300/50 truncate">
                          {node.category}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs text-indigo-300/30 font-semibold">
                    검색 결과가 없습니다
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
