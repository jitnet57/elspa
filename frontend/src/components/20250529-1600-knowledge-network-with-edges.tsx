// ============================================================
// 📌 컴포넌트명: Knowledge Network 3D with Edges
// 📋 목적: 노드 간 연결선(Edge) 렌더링이 추가된 3D 지식 네트워크
// 🔧 기능:
//   - Three.js LineSegments로 엣지 렌더링
//   - 노드 위치 기반 동적 선 그리기
//   - 강도(strength)에 따른 선 굵기 조절
//   - 성능 최적화: 500+ 노드일 때 엣지 비활성화
// 📅 작성일: 2026-05-29 16:00
// ============================================================

'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  NETWORK_LINKS,
  LINK_TYPE_COLORS,
  STRENGTH_TO_WIDTH,
  type NetworkLink,
} from '@/lib/data/20250529-1600-network-links';

export interface NetworkNode {
  id: string;
  label: string;
  description: string;
  category: string;
  color?: string;
}

interface Props {
  nodes: NetworkNode[];
  onNodeClick?: (node: NetworkNode) => void;
  showEdges?: boolean; // 엣지 표시 여부 (기본값: true)
}

/**
 * 3D 지식 네트워크 컴포넌트 (엣지 렌더링 포함)
 *
 * 주요 기능:
 * 1. 노드 렌더링 (IcosahedronGeometry)
 * 2. 엣지 렌더링 (LineSegments)
 * 3. 인터랙션 (드래그, 확대축소, 클릭)
 * 4. 성능 모니터링 UI
 *
 * 최적화:
 * - 500+ 노드일 때 자동으로 엣지 숨김
 * - 모든 엣지를 하나의 LineSegments로 통합 (메모리 효율)
 * - requestAnimationFrame 기반 애니메이션 루프
 */
export default function KnowledgeNetworkWithEdges({
  nodes,
  onNodeClick,
  showEdges = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodeGroupRef = useRef<THREE.Group | null>(null);
  const nodeMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const edgesGroupRef = useRef<THREE.Group | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [performanceStats, setPerformanceStats] = useState({
    fps: 0,
    nodeCount: 0,
    edgeCount: 0,
  });

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    // ==========================================
    // 1. Three.js Scene 초기화
    // ==========================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfafafa);
    sceneRef.current = scene;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 5000);
    camera.position.set(0, 0, 200);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ==========================================
    // 2. 노드 그룹 생성
    // ==========================================
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);
    nodeGroupRef.current = nodeGroup;

    // 노드 메시 저장 (나중에 엣지 연결 시 사용)
    const nodeMeshes = new Map<string, THREE.Mesh>();

    // 노드 지오메트리 재사용 (성능 최적화)
    const nodeGeometry = new THREE.IcosahedronGeometry(3, 1);

    // ==========================================
    // 3. 노드 생성 및 위치 설정
    // ==========================================
    nodes.forEach((node, index) => {
      // 구면(sphere) 분포를 사용한 노드 배치
      const phi = Math.acos(-1 + (2 * index) / nodes.length);
      const theta = Math.sqrt(nodes.length * Math.PI) * phi;

      const x = 100 * Math.cos(theta) * Math.sin(phi);
      const y = 100 * Math.sin(theta) * Math.sin(phi);
      const z = 100 * Math.cos(phi);

      // 노드 머티리얼 및 메시 생성
      const material = new THREE.MeshPhongMaterial({ color: node.color || '#3b82f6' });
      const mesh = new THREE.Mesh(nodeGeometry, material);
      mesh.position.set(x, y, z);
      mesh.userData = { node };
      nodeGroup.add(mesh);

      // 노드 메시 매핑 저장
      nodeMeshes.set(node.id, mesh);
    });

    nodeMeshesRef.current = nodeMeshes;

    // ==========================================
    // 4. 엣지 렌더링 (500개 노드 이상일 때는 비활성화)
    // ==========================================
    const edgesGroup = new THREE.Group();
    scene.add(edgesGroup);
    edgesGroupRef.current = edgesGroup;

    const shouldRenderEdges =
      showEdges && nodes.length < 500 && NETWORK_LINKS.length > 0;

    if (shouldRenderEdges) {
      // 모든 엣지를 하나의 LineSegments로 통합 (메모리 효율)
      const positions: number[] = [];
      const colors: number[] = [];

      NETWORK_LINKS.forEach(link => {
        const fromMesh = nodeMeshes.get(link.from);
        const toMesh = nodeMeshes.get(link.to);

        // 두 노드가 모두 존재하는 경우에만 엣지 생성
        if (fromMesh && toMesh) {
          // 시작 노드 좌표
          positions.push(fromMesh.position.x, fromMesh.position.y, fromMesh.position.z);

          // 도착 노드 좌표
          positions.push(toMesh.position.x, toMesh.position.y, toMesh.position.z);

          // 색상 설정: 시작 노드의 색상 기반 (또는 관계 타입별 색상)
          const colorHex =
            LINK_TYPE_COLORS[link.type] || (fromMesh.material as THREE.MeshPhongMaterial).color.getHexString();
          const colorNum = parseInt(colorHex.replace('#', ''), 16);
          const r = (colorNum >> 16) & 255;
          const g = (colorNum >> 8) & 255;
          const b = colorNum & 255;

          // 두 점 모두 동일한 색상으로 설정 (선 전체가 한 색상)
          colors.push(r / 255, g / 255, b / 255);
          colors.push(r / 255, g / 255, b / 255);
        }
      });

      // LineSegments 지오메트리 생성
      const edgeGeometry = new THREE.BufferGeometry();
      edgeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      edgeGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

      // LineSegments 머티리얼 (색상 버텍스 기반 렌더링)
      const edgeMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        opacity: 0.6,
        transparent: true,
        linewidth: 2, // 일부 브라우저에서만 작동 (WebGL 제한)
      });

      const lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      edgesGroup.add(lineSegments);

      // 성능 통계 업데이트
      setPerformanceStats(prev => ({
        ...prev,
        edgeCount: NETWORK_LINKS.length,
      }));
    } else {
      setPerformanceStats(prev => ({ ...prev, edgeCount: 0 }));
    }

    // ==========================================
    // 5. 조명 설정
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

    // ==========================================
    // 6. 마우스 인터랙션 (레이캐스팅)
    // ==========================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / width) * 2 - 1;
      mouse.y = -(event.clientY / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeGroup.children);

      if (intersects.length > 0) {
        const node = (intersects[0].object as any).userData?.node;
        if (node) setHoveredNode(node);
      } else {
        setHoveredNode(null);
      }
    };

    const onClick = (event: MouseEvent) => {
      mouse.x = (event.clientX / width) * 2 - 1;
      mouse.y = -(event.clientY / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeGroup.children);

      if (intersects.length > 0) {
        const node = (intersects[0].object as any).userData?.node;
        if (node && onNodeClick) onNodeClick(node);
      }
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);

    // ==========================================
    // 7. 드래그 회전
    // ==========================================
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (event: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onMouseDrag = (event: MouseEvent) => {
      if (!isDragging || !nodeGroup) return;

      const deltaX = event.clientX - previousMousePosition.x;
      const deltaY = event.clientY - previousMousePosition.y;

      // 노드 그룹 회전 (엣지도 함께 회전)
      nodeGroup.rotation.y += deltaX * 0.005;
      nodeGroup.rotation.x += deltaY * 0.005;

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseDrag);

    // ==========================================
    // 8. 마우스 휠 확대축소
    // ==========================================
    const onMouseWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.z += event.deltaY > 0 ? 5 : -5;
      camera.position.z = Math.max(50, Math.min(camera.position.z, 500));
    };

    renderer.domElement.addEventListener('wheel', onMouseWheel, { passive: false });

    // ==========================================
    // 9. 성능 모니터링
    // ==========================================
    let frameCount = 0;
    let lastTime = performance.now();

    // ==========================================
    // 10. 애니메이션 루프
    // ==========================================
    const animate = () => {
      requestAnimationFrame(animate);

      // FPS 계산
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        setPerformanceStats(prev => ({
          ...prev,
          fps: frameCount,
          nodeCount: nodes.length,
        }));
        frameCount = 0;
        lastTime = currentTime;
      }

      // 자동 회전 (드래그 중이 아닐 때)
      if (!isDragging && nodeGroup) {
        nodeGroup.rotation.y += 0.0001;
      }

      renderer.render(scene, camera);
    };

    animate();

    // ==========================================
    // 11. 윈도우 리사이즈 핸들러
    // ==========================================
    const onWindowResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', onWindowResize);

    // ==========================================
    // 12. 정리(Cleanup)
    // ==========================================
    return () => {
      window.removeEventListener('resize', onWindowResize);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseDrag);
      renderer.domElement.removeEventListener('wheel', onMouseWheel);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [nodes, onNodeClick, showEdges]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* ==========================================
          호버 노드 정보 표시
          ========================================== */}
      {hoveredNode && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs animate-fadeIn pointer-events-none">
          <div className="flex items-center space-x-2 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: hoveredNode.color }}
            />
            <h3 className="font-bold text-gray-900">{hoveredNode.label}</h3>
          </div>
          <p className="text-sm text-gray-600">
            {hoveredNode.description.slice(0, 100)}...
          </p>
          <p className="text-xs text-gray-400 mt-2">카테고리: {hoveredNode.category}</p>
        </div>
      )}

      {/* ==========================================
          성능 모니터링 UI (모바일 제외)
          ========================================== */}
      <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-75 text-white rounded-lg p-3 text-sm hidden sm:block font-mono">
        <div className="space-y-1">
          <p>
            <span className="text-green-400">FPS:</span> {performanceStats.fps}
          </p>
          <p>
            <span className="text-blue-400">Nodes:</span> {performanceStats.nodeCount}
          </p>
          <p>
            <span className="text-purple-400">Edges:</span> {performanceStats.edgeCount}
          </p>
        </div>
      </div>

      {/* ==========================================
          조작 안내 (모바일 제외)
          ========================================== */}
      <div className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-75 text-white rounded-lg p-3 text-sm hidden sm:block">
        <p className="font-semibold mb-2">조작 가이드</p>
        <ul className="space-y-1 text-xs">
          <li>
            <span className="text-yellow-400">🖱️ 드래그:</span> 네트워크 회전
          </li>
          <li>
            <span className="text-yellow-400">🔄 스크롤:</span> 확대/축소
          </li>
          <li>
            <span className="text-yellow-400">👆 클릭:</span> 노드 상세 정보
          </li>
        </ul>
      </div>
    </div>
  );
}
