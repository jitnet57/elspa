// ============================================================
// 📌 컴포넌트: KnowledgeNetwork3D
// 📋 목적: Three.js 기반 3D 지식 네트워크 시각화 with 검색 기능
// 🔧 매개변수: nodes (지식 네트워크 노드 배열)
// 📤 반환값: React 컴포넌트 (캔버스 + 검색 UI)
// 📅 작성일: 2026-05-29
// ⚠️ 주의: useEffect에서 Three.js 렌더링 수행 (SSR 주의)
// ============================================================

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import Fuse from 'fuse.js';
import { Search, X } from 'lucide-react';

// 지식 네트워크 노드 인터페이스
export interface NetworkNode {
  id: string;
  label: string;          // 노드 이름 (검색 대상)
  description: string;    // 상세 설명 (검색 대상)
  category: string;       // 카테고리 (검색 필터)
  color?: string;         // 노드 색상 (기본값: 파랑)
  position?: { x: number; y: number; z: number }; // 3D 좌표
}

// 노드 간 연결(엣지)
export interface NetworkEdge {
  source: string; // 출발 노드 id
  target: string; // 도착 노드 id
  label?: string;
}

interface KnowledgeNetwork3DProps {
  nodes: NetworkNode[];
  edges?: NetworkEdge[];
  onNodeClick?: (node: NetworkNode) => void;
}

/**
 * 3D 지식 네트워크 시각화 컴포넌트
 * - Three.js로 3D 구 형태의 노드 렌더링
 * - Fuse.js로 빠른 검색 (키워드 매칭)
 * - 검색 결과: 일치 노드 하이라이트 + 비일치 노드 페이드 아웃
 */
export default function KnowledgeNetwork3D({
  nodes,
  edges = [],
  onNodeClick,
}: KnowledgeNetwork3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const animationIdRef = useRef<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNodes, setFilteredNodes] = useState<NetworkNode[]>(nodes);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(
    new Set()
  );

  // Fuse.js 검색 엔진 초기화
  const fuseSearchRef = useRef(
    new Fuse(nodes, {
      keys: ['label', 'description', 'category'],
      threshold: 0.3,
      includeScore: true,
    })
  );

  // 검색 핸들러
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      // 검색어 없음 = 모든 노드 표시
      setFilteredNodes(nodes);
      setHighlightedNodeIds(new Set());
      return;
    }

    // Fuse.js 검색 실행
    const results = fuseSearchRef.current.search(query);
    const filtered = results.map((r) => r.item);
    const ids = new Set(filtered.map((n) => n.id));

    setFilteredNodes(filtered);
    setHighlightedNodeIds(ids);
  }, [nodes]);

  // Three.js 초기화
  useEffect(() => {
    if (!containerRef.current) return;

    // 1️⃣ 씬 생성
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27); // 진한 파랑 배경
    sceneRef.current = scene;

    // 2️⃣ 카메라 설정 (화면 비율에 따라)
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 40;

    // 3️⃣ 렌더러 생성 (WebGL 지원 확인)
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4️⃣ 조명 설정
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // 5️⃣ 노드 메시 생성 및 배치
    const meshes = new Map<string, THREE.Mesh>();

    nodes.forEach((node, index) => {
      // 구체(sphere) 기하학 생성
      const geometry = new THREE.SphereGeometry(1, 32, 32);

      // 재질 설정 (node.color가 없으면 기본 파랑)
      const color = node.color || '#3b82f6'; // Tailwind blue-500
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color).multiplyScalar(0.3),
      });

      const mesh = new THREE.Mesh(geometry, material);

      // 3D 공간에 노드 배치 (구면 좌표)
      if (node.position) {
        mesh.position.set(node.position.x, node.position.y, node.position.z);
      } else {
        // 기본값: 구 표면에 균등 배치
        const phi = Math.acos(-1 + (2 * index) / nodes.length);
        const theta = Math.sqrt(nodes.length * Math.PI) * phi;
        const radius = 20;

        mesh.position.x = radius * Math.cos(theta) * Math.sin(phi);
        mesh.position.y = radius * Math.sin(theta) * Math.sin(phi);
        mesh.position.z = radius * Math.cos(phi);
      }

      // userData에 노드 ID 저장 (클릭 감지용)
      mesh.userData = { nodeId: node.id, node };

      scene.add(mesh);
      meshes.set(node.id, mesh);
    });

    meshesRef.current = meshes;

    // 5️⃣-b 엣지(연결선) 렌더링 — 노드 위치를 잇는 선
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.35,
    });
    const edgeObjects: THREE.Line[] = [];
    edges.forEach((edge) => {
      const a = meshes.get(edge.source);
      const b = meshes.get(edge.target);
      if (!a || !b) return;
      const geom = new THREE.BufferGeometry().setFromPoints([
        a.position.clone(),
        b.position.clone(),
      ]);
      const line = new THREE.Line(geom, edgeMaterial);
      scene.add(line); // scene 회전에 함께 따라감
      edgeObjects.push(line);
    });

    // 6️⃣ 마우스 클릭 이벤트 처리
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event: MouseEvent) => {
      if (!containerRef.current) return;

      // 마우스 위치를 정규화된 좌표로 변환
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

      // 레이캐스팅으로 교차 객체 감지
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Array.from(meshes.values()));

      if (intersects.length > 0) {
        const clicked = intersects[0].object as THREE.Mesh;
        const nodeId = clicked.userData.nodeId;
        const clickedNode = nodes.find((n) => n.id === nodeId);

        if (clickedNode && onNodeClick) {
          onNodeClick(clickedNode);
        }
      }
    };

    renderer.domElement.addEventListener('click', onMouseClick);

    // 7️⃣ 애니메이션 루프
    let rotationSpeed = 0.0005; // 자동 회전 속도

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // 씬 자동 회전
      scene.rotation.x += rotationSpeed;
      scene.rotation.y += rotationSpeed * 1.5;

      // 노드 스케일 업데이트 (검색 상태에 따라)
      meshes.forEach((mesh, nodeId) => {
        const isHighlighted = highlightedNodeIds.has(nodeId);
        const targetScale = isHighlighted ? 1.3 : 1;
        const targetOpacity = highlightedNodeIds.size === 0 ? 1 : isHighlighted ? 1 : 0.3;

        // 부드러운 애니메이션
        mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

        const material = mesh.material as THREE.MeshPhongMaterial;
        material.opacity = targetOpacity;
        material.transparent = highlightedNodeIds.size > 0; // 투명도 활성화
      });

      renderer.render(scene, camera);
    };

    animate();

    // 8️⃣ 윈도우 리사이즈 처리
    const handleResize = () => {
      if (!containerRef.current) return;

      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', onMouseClick);

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      // Three.js 객체 정리
      meshes.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      edgeObjects.forEach((line) => line.geometry.dispose());
      edgeMaterial.dispose();

      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [nodes, edges, onNodeClick, highlightedNodeIds]);

  return (
    <div className="relative w-full h-screen bg-slate-900">
      {/* 3D 캔버스 컨테이너 */}
      <div ref={containerRef} className="w-full h-full" />

      {/* 검색 UI 오버레이 */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="relative max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="검색... (예: '마사지', '시장')"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 검색 결과 정보 */}
          {searchQuery && (
            <div className="mt-2 p-2 bg-slate-800 rounded-lg text-sm text-gray-300">
              📊 <strong>{filteredNodes.length}</strong>개 항목 발견
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽 상단: 노드 정보 패널 */}
      {filteredNodes.length > 0 && searchQuery && (
        <div className="absolute top-4 right-4 bg-slate-800 border border-slate-700 rounded-lg p-4 max-w-xs max-h-96 overflow-y-auto">
          <h3 className="text-sm font-semibold text-white mb-3">검색 결과</h3>
          <div className="space-y-2">
            {filteredNodes.slice(0, 10).map((node) => (
              <div
                key={node.id}
                className="p-2 bg-slate-700 rounded cursor-pointer hover:bg-slate-600 transition"
                onClick={() => onNodeClick?.(node)}
              >
                <p className="text-sm font-medium text-white">{node.label}</p>
                <p className="text-xs text-gray-400">{node.description}</p>
                <span className="inline-block mt-1 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                  {node.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 왼쪽 하단: 조작 가이드 */}
      <div className="absolute bottom-4 left-4 bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-gray-400">
        <p>🖱️ 드래그: 회전 | 🔍 검색: 노드 필터링</p>
        <p>💡 클릭: 노드 선택</p>
      </div>
    </div>
  );
}
