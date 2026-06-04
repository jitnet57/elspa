// ============================================================
// 📌 컴포넌트: KnowledgeNetworkInteractive
// 📋 목적: Three.js 기반 3D 지식 네트워크 + 마우스 드래그/줌/리셋 인터랙션
// 🔧 매개변수: nodes (지식 네트워크 노드 배열)
// 📤 반환값: React 컴포넌트 (캔버스 + 검색 UI + 인터랙션)
// 📅 작성일: 2026-05-29
// ⚠️ 주의: useEffect에서 Three.js 렌더링 수행, SSR 주의
// 🎮 기능: 드래그 회전, 마우스 휠 줌, 더블클릭 리셋
// ============================================================

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import Fuse from 'fuse.js';
import { Search, X, RotateCcw, Smartphone } from 'lucide-react';
import { useKnowledgeNetworkTouch, throttle } from '@/hooks/20250529-1545-useKnowledgeNetworkTouch';

// 지식 네트워크 노드 인터페이스
export interface NetworkNode {
  id: string;
  label: string;          // 노드 이름 (검색 대상)
  description: string;    // 상세 설명 (검색 대상)
  category: string;       // 카테고리 (검색 필터)
  color?: string;         // 노드 색상 (기본값: 파랑)
  position?: { x: number; y: number; z: number }; // 3D 좌표
}

interface KnowledgeNetworkInteractiveProps {
  nodes: NetworkNode[];
  onNodeClick?: (node: NetworkNode) => void;
}

/**
 * 3D 지식 네트워크 시각화 컴포넌트 (인터랙션 강화 버전)
 * - Three.js로 3D 구 형태의 노드 렌더링
 * - Fuse.js로 빠른 검색 (키워드 매칭)
 * - 마우스 드래그로 3D 씬 회전 (easing 적용)
 * - 마우스 휠로 줌 인/아웃
 * - 더블 클릭으로 초기 상태 리셋
 * - 드래그 중 자동 회전 비활성화, 중지 후 재개
 */
export default function KnowledgeNetworkInteractive({
  nodes,
  onNodeClick,
}: KnowledgeNetworkInteractiveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const animationIdRef = useRef<number | null>(null);

  // 인터랙션 상태
  const mouseRef = useRef({ x: 0, y: 0, isDragging: false });
  const deltaRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });
  const autoRotationRef = useRef({ x: 0.0005, y: 0.00075 });
  const targetZoomRef = useRef(40);
  const currentZoomRef = useRef(40);
  const doubleClickRef = useRef({ time: 0, count: 0 });

  // 카메라 초기값 (리셋용)
  const initialCameraRef = useRef({ z: 40, rotationX: 0, rotationY: 0 });

  // 터치 상태
  const [showTouchGuide, setShowTouchGuide] = useState(false);
  const autoRotationEnabledRef = useRef(true);

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

  // ============================================================
  // 🔍 검색 핸들러
  // ============================================================
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

  // ============================================================
  // 🎮 카메라 리셋
  // ============================================================
  const resetCamera = useCallback(() => {
    if (!cameraRef.current) return;

    // 회전 초기화 (부드러운 전환)
    rotationRef.current.x = 0;
    rotationRef.current.y = 0;
    targetZoomRef.current = initialCameraRef.current.z;

    // 즉시 값 업데이트
    currentZoomRef.current = initialCameraRef.current.z;
    cameraRef.current.position.z = initialCameraRef.current.z;
    cameraRef.current.updateProjectionMatrix();

    if (sceneRef.current) {
      sceneRef.current.rotation.x = 0;
      sceneRef.current.rotation.y = 0;
    }
  }, []);

  // ============================================================
  // 📱 마우스 이벤트 핸들러
  // ============================================================
  const handleMouseDown = useCallback((e: MouseEvent) => {
    // 드래그 시작
    mouseRef.current.isDragging = true;
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!mouseRef.current.isDragging) return;
    if (!containerRef.current) return;

    // 마우스 이동 거리 계산
    const deltaX = e.clientX - mouseRef.current.x;
    const deltaY = e.clientY - mouseRef.current.y;

    // 감도 조정 (화면 크기를 고려한 정규화)
    const sensitivity = 0.01;
    deltaRef.current.x = deltaX * sensitivity;
    deltaRef.current.y = deltaY * sensitivity;

    // 회전값 누적
    rotationRef.current.y += deltaRef.current.x;
    rotationRef.current.x += deltaRef.current.y;

    // 상하 회전 제한 (너무 뒤로 회전하지 않도록)
    rotationRef.current.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, rotationRef.current.x)
    );

    // 마우스 위치 업데이트
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
  }, []);

  const handleMouseUp = useCallback(() => {
    // 드래그 종료
    mouseRef.current.isDragging = false;
  }, []);

  // ============================================================
  // 🔍 마우스 휠 줌 핸들러
  // ============================================================
  const handleMouseWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    // 스크롤 방향에 따라 줌 조정
    const zoomSpeed = 2; // 줌 속도
    const delta = e.deltaY > 0 ? zoomSpeed : -zoomSpeed;

    targetZoomRef.current += delta;

    // 줌 범위 제한
    targetZoomRef.current = Math.max(15, Math.min(100, targetZoomRef.current));
  }, []);

  // ============================================================
  // 📌 더블 클릭 리셋 핸들러
  // ============================================================
  const handleDoubleClick = useCallback(() => {
    const now = Date.now();
    const timeSinceLastClick = now - doubleClickRef.current.time;

    // 300ms 이내 두 번 클릭 = 더블 클릭
    if (timeSinceLastClick < 300) {
      resetCamera();
    }

    doubleClickRef.current.time = now;
  }, [resetCamera]);

  // ============================================================
  // 📱 터치 드래그 핸들러 (모바일)
  // ============================================================
  const handleTouchDrag = useCallback((delta: { x: number; y: number }) => {
    if (!containerRef.current) return;

    // 터치 드래그는 마우스 드래그와 동일하게 처리
    // (감도는 이미 useKnowledgeNetworkTouch에서 조정됨)
    rotationRef.current.y += delta.x * 0.01;
    rotationRef.current.x += delta.y * 0.01;

    // 상하 회전 제한
    rotationRef.current.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, rotationRef.current.x)
    );

    // 드래그 중 자동 회전 비활성화
    autoRotationEnabledRef.current = false;

    // 드래그 종료 후 1초 후 자동 회전 재개
    setTimeout(() => {
      autoRotationEnabledRef.current = true;
    }, 1000);
  }, []);

  // ============================================================
  // 📱 터치 줌 핸들러 (핀치)
  // ============================================================
  const handleTouchZoom = useCallback((delta: number) => {
    targetZoomRef.current += delta * 50; // 줌 스피드 조정
    targetZoomRef.current = Math.max(15, Math.min(100, targetZoomRef.current));
  }, []);

  // ============================================================
  // 📱 터치 더블 탭 핸들러
  // ============================================================
  const handleTouchDoubleTap = useCallback(() => {
    resetCamera();
  }, [resetCamera]);

  // ============================================================
  // 📱 터치 스와이프 핸들러 (자동 회전 토글)
  // ============================================================
  const handleTouchSwipe = useCallback((direction: 'left' | 'right') => {
    autoRotationEnabledRef.current = !autoRotationEnabledRef.current;

    // 피드백용 토스트 메시지 (간단히 콘솔에만 출력)
    console.log(
      `🔄 자동 회전 ${autoRotationEnabledRef.current ? '활성화' : '비활성화'}`
    );
  }, []);

  // useKnowledgeNetworkTouch 훅 사용
  const { isTouching } = useKnowledgeNetworkTouch(
    containerRef,
    {
      onDrag: handleTouchDrag,
      onZoom: handleTouchZoom,
      onDoubleTap: handleTouchDoubleTap,
      onSwipe: handleTouchSwipe,
    },
    {
      dragSensitivity: 1.5,        // 터치는 마우스보다 예민함
      zoomSensitivity: 0.01,
      doubleTapDelay: 300,
      swipeThreshold: 50,
      enableSwipe: true,
    }
  );

  // ============================================================
  // 🎨 Three.js 초기화 및 렌더링
  // ============================================================
  useEffect(() => {
    if (!containerRef.current) return;

    // 1️⃣ 씬 생성
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27); // 진한 파랑 배경
    sceneRef.current = scene;

    // 2️⃣ 카메라 설정
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = initialCameraRef.current.z;
    cameraRef.current = camera;

    // 3️⃣ 렌더러 생성
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
      const geometry = new THREE.SphereGeometry(1, 32, 32);
      const color = node.color || '#3b82f6';
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color).multiplyScalar(0.3),
      });

      const mesh = new THREE.Mesh(geometry, material);

      // 3D 공간에 노드 배치
      if (node.position) {
        mesh.position.set(node.position.x, node.position.y, node.position.z);
      } else {
        const phi = Math.acos(-1 + (2 * index) / nodes.length);
        const theta = Math.sqrt(nodes.length * Math.PI) * phi;
        const radius = 20;

        mesh.position.x = radius * Math.cos(theta) * Math.sin(phi);
        mesh.position.y = radius * Math.sin(theta) * Math.sin(phi);
        mesh.position.z = radius * Math.cos(phi);
      }

      mesh.userData = { nodeId: node.id, node };
      scene.add(mesh);
      meshes.set(node.id, mesh);
    });

    meshesRef.current = meshes;

    // 6️⃣ 마우스 클릭 이벤트 (노드 선택)
    const raycaster = new THREE.Raycaster();
    const mousePos = new THREE.Vector2();

    const onMouseClick = (event: MouseEvent) => {
      if (!containerRef.current || mouseRef.current.isDragging) return;

      const rect = containerRef.current.getBoundingClientRect();
      mousePos.x = ((event.clientX - rect.left) / width) * 2 - 1;
      mousePos.y = -((event.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mousePos, camera);
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
    renderer.domElement.addEventListener('dblclick', handleDoubleClick);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleMouseWheel, {
      passive: false,
    });

    // 7️⃣ 애니메이션 루프
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // 드래그 중이 아니고 자동 회전이 활성화되었을 때만 회전 적용
      if (!mouseRef.current.isDragging && autoRotationEnabledRef.current) {
        rotationRef.current.x += autoRotationRef.current.x;
        rotationRef.current.y += autoRotationRef.current.y;
      }

      // 씬 회전 적용 (부드러운 전환)
      const rotationSpeed = 0.1;
      scene.rotation.x +=
        (rotationRef.current.x - scene.rotation.x) * rotationSpeed;
      scene.rotation.y +=
        (rotationRef.current.y - scene.rotation.y) * rotationSpeed;

      // 줌 처리 (현재값 → 목표값으로 smoothing)
      const zoomSpeed = 0.1;
      currentZoomRef.current +=
        (targetZoomRef.current - currentZoomRef.current) * zoomSpeed;
      camera.position.z = currentZoomRef.current;
      camera.updateProjectionMatrix();

      // 노드 스케일 업데이트 (검색 상태에 따라)
      meshes.forEach((mesh, nodeId) => {
        const isHighlighted = highlightedNodeIds.has(nodeId);
        const targetScale = isHighlighted ? 1.3 : 1;
        const targetOpacity =
          highlightedNodeIds.size === 0 ? 1 : isHighlighted ? 1 : 0.3;

        // 부드러운 애니메이션
        mesh.scale.lerp(
          new THREE.Vector3(targetScale, targetScale, targetScale),
          0.1
        );

        const material = mesh.material as THREE.MeshPhongMaterial;
        material.opacity = targetOpacity;
        material.transparent = highlightedNodeIds.size > 0;
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
      renderer.domElement.removeEventListener('dblclick', handleDoubleClick);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleMouseWheel);

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      meshes.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });

      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [nodes, onNodeClick, highlightedNodeIds, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseWheel, handleDoubleClick]);

  return (
    <div className="relative w-full h-screen bg-slate-900">
      {/* 3D 캔버스 컨테이너 */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 검색 UI 오버레이 (좌상단) */}
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

      {/* 왼쪽 하단: 조작 가이드 (데스크톱) */}
      <div className="absolute bottom-4 left-4 bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-gray-400 space-y-2">
        <p>🖱️ <strong>드래그:</strong> 3D 회전</p>
        <p>🔍 <strong>휠:</strong> 줌 인/아웃 (15~100)</p>
        <p>📌 <strong>더블클릭:</strong> 카메라 리셋</p>
        <p>💡 <strong>클릭:</strong> 노드 선택 | 🔍 <strong>검색:</strong> 필터링</p>
      </div>

      {/* 왼쪽 하단: 모바일 터치 가이드 */}
      <div className="absolute bottom-4 left-4 bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-gray-400 space-y-2 md:hidden">
        <button
          onClick={() => setShowTouchGuide(!showTouchGuide)}
          className="flex items-center gap-2 hover:text-white transition"
          title="터치 제스처 가이드"
        >
          <Smartphone className="w-4 h-4" />
          <span className="font-medium">터치 가이드</span>
        </button>

        {showTouchGuide && (
          <div className="border-t border-slate-600 pt-2 mt-2 space-y-2">
            <p>👆 <strong>드래그:</strong> 3D 회전</p>
            <p>🤏 <strong>핀치:</strong> 줌 인/아웃</p>
            <p>⏸️ <strong>더블탭:</strong> 카메라 리셋</p>
            <p>👈 <strong>스와이프:</strong> 자동회전 토글</p>
            <p className={`mt-2 ${isTouching ? 'text-green-400' : 'text-gray-500'}`}>
              {isTouching ? '✅ 터치 감지 중' : '⏳ 터치 대기'}
            </p>
          </div>
        )}
      </div>

      {/* 오른쪽 하단: 리셋 버튼 */}
      <button
        onClick={resetCamera}
        className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 transition flex items-center gap-2"
        title="카메라 초기화 (더블클릭도 가능)"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="text-sm font-medium">리셋</span>
      </button>
    </div>
  );
}
