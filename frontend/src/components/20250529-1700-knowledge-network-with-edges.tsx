// ============================================================
// 📌 컴포넌트명: KnowledgeNetworkWithEdges
// 📋 목적: 노드와 엣지(연결선)를 함께 렌더링하는 통합 3D 컴포넌트
// 🔧 기능: 3D 노드 렌더링 + 연결선 라벨 + 인터랙션
// 📅 작성일: 2026-05-29
// ============================================================

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import KnowledgeNetworkClient, { type NetworkNode, type NetworkEdge } from '@/lib/api/20250529-1530-knowledge-network-client';
import { EdgeInteractions } from './20250529-1645-edge-interactions';

/**
 * 📝 설명:
 * 이 컴포넌트는 지식 네트워크의 노드와 연결선을 함께 3D로 시각화합니다.
 *
 * **기능:**
 * 1. 노드를 구 또는 아이코사헤드론으로 렌더링
 * 2. 연결선을 선으로 그리고 중점에 라벨 표시
 * 3. 마우스 호버/클릭으로 노드와 선 하이라이트
 * 4. 검색 키워드로 관련 노드/선 강조
 * 5. 정보 패널에서 세부 정보 표시
 */

interface Props {
  onNodeSelect?: (node: NetworkNode) => void;
  onEdgeSelect?: (edge: NetworkEdge) => void;
}

export const KnowledgeNetworkWithEdges: React.FC<Props> = ({
  onNodeSelect,
  onEdgeSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodeGroupRef = useRef<THREE.Group | null>(null);
  const edgeGroupRef = useRef<THREE.Group | null>(null);

  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);

  // 노드 메시 참조
  const nodeMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  /**
   * 📌 함수: loadNetworkData
   * 📋 목적: 백엔드에서 노드와 엣지 데이터를 로드합니다.
   */
  const loadNetworkData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 노드 조회
      const nodesResponse = await KnowledgeNetworkClient.getAllNodes(undefined, 0, 100);
      setNodes(nodesResponse.nodes);

      // 연결선 조회
      const edgesResponse = await KnowledgeNetworkClient.getAllEdges(
        undefined,
        undefined,
        undefined,
        1,
        5,
        0,
        100
      );
      setEdges(edgesResponse.edges);

      console.log(`✅ 네트워크 데이터 로드 완료: 노드 ${nodesResponse.total}개, 엣지 ${edgesResponse.total}개`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      console.error('❌ 네트워크 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 📌 함수: initScene
   * 📋 목적: Three.js 장면 초기화
   */
  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    // 씬, 카메라, 렌더러 생성
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

    // 노드 그룹
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);
    nodeGroupRef.current = nodeGroup;

    // 엣지 그룹
    const edgeGroup = new THREE.Group();
    scene.add(edgeGroup);
    edgeGroupRef.current = edgeGroup;

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

    // 렌더링 루프
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // 노드 그룹 회전 (선택사항)
      if (nodeGroup) {
        nodeGroup.rotation.y += 0.0003;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 윈도우 리사이즈 핸들러
    const handleResize = () => {
      const newWidth = containerRef.current?.clientWidth || width;
      const newHeight = containerRef.current?.clientHeight || height;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  /**
   * 📌 함수: renderNodes
   * 📋 목적: 노드를 3D 구체로 렌더링
   */
  const renderNodes = useCallback(() => {
    if (!nodeGroupRef.current || nodes.length === 0) return;

    nodeMeshesRef.current.clear();
    nodeGroupRef.current.clear();

    const nodeGeometry = new THREE.IcosahedronGeometry(3, 1);

    nodes.forEach((node, index) => {
      // Golden spiral 배치로 노드 위치 결정
      const phi = Math.acos(-1 + (2 * index) / nodes.length);
      const theta = Math.sqrt(nodes.length * Math.PI) * phi;

      const x = 100 * Math.cos(theta) * Math.sin(phi);
      const y = 100 * Math.sin(theta) * Math.sin(phi);
      const z = 100 * Math.cos(phi);

      const material = new THREE.MeshPhongMaterial({
        color: node.color || '#3b82f6',
        emissive: 0x000000,
        shininess: 100,
      });

      const mesh = new THREE.Mesh(nodeGeometry, material);
      mesh.position.set(x, y, z);
      (mesh as any).userData = { node };

      nodeGroupRef.current!.add(mesh);
      nodeMeshesRef.current.set(node.id, mesh);
    });

    console.log(`✅ ${nodes.length}개 노드 렌더링 완료`);
  }, [nodes]);

  /**
   * 📌 함수: highlightNode
   * 📋 목적: 특정 노드를 강조 표시
   */
  const highlightNode = useCallback((nodeId: string, highlight: boolean) => {
    const mesh = nodeMeshesRef.current.get(nodeId);
    if (!mesh) return;

    const material = mesh.material as THREE.MeshPhongMaterial;
    if (highlight) {
      material.emissive.set(0xffff00); // 노란색
      material.emissiveIntensity = 0.5;
      mesh.scale.set(1.2, 1.2, 1.2);
    } else {
      material.emissive.set(0x000000);
      material.emissiveIntensity = 0;
      mesh.scale.set(1, 1, 1);
    }
  }, []);

  /**
   * 📌 함수: handleNodeHover
   * 📋 목적: 노드 호버 처리
   */
  const handleNodeHover = useCallback((node: NetworkNode | null) => {
    if (hoveredNode) {
      highlightNode(hoveredNode.id, false);
    }

    if (node) {
      highlightNode(node.id, true);
      setHoveredNode(node);

      // 관련 엣지 강조 (이벤트 발생)
      const relatedEdges = edges.filter(
        (e) => e.source === node.id || e.target === node.id
      );
      window.dispatchEvent(
        new CustomEvent('highlightEdges', {
          detail: { edgeIds: relatedEdges.map((e) => e.id) },
        })
      );
    } else {
      setHoveredNode(null);
    }
  }, [hoveredNode, edges, highlightNode]);

  /**
   * 📌 함수: setupNodeInteraction
   * 📋 목적: 노드 마우스 인터랙션 설정
   */
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !nodeGroupRef.current) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = rendererRef.current!.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current!);
      const intersects = raycaster.intersectObjects(nodeGroupRef.current!.children);

      if (intersects.length > 0) {
        const node = (intersects[0].object as any).userData?.node;
        if (node) {
          handleNodeHover(node);
        }
      } else {
        handleNodeHover(null);
      }
    };

    const handleClick = (event: MouseEvent) => {
      const rect = rendererRef.current!.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current!);
      const intersects = raycaster.intersectObjects(nodeGroupRef.current!.children);

      if (intersects.length > 0) {
        const node = (intersects[0].object as any).userData?.node;
        if (node && onNodeSelect) {
          onNodeSelect(node);
        }
      }
    };

    rendererRef.current.domElement.addEventListener('mousemove', handleMouseMove);
    rendererRef.current.domElement.addEventListener('click', handleClick);

    return () => {
      rendererRef.current?.domElement.removeEventListener('mousemove', handleMouseMove);
      rendererRef.current?.domElement.removeEventListener('click', handleClick);
    };
  }, [handleNodeHover, onNodeSelect]);

  /**
   * 📌 함수: getNodeMap
   * 📋 목적: 노드 ID -> (라벨, 위치) 매핑 생성
   */
  const getNodeMap = useCallback((): Map<string, { label: string; position: THREE.Vector3 }> => {
    const map = new Map();

    nodes.forEach((node, index) => {
      const phi = Math.acos(-1 + (2 * index) / nodes.length);
      const theta = Math.sqrt(nodes.length * Math.PI) * phi;

      const x = 100 * Math.cos(theta) * Math.sin(phi);
      const y = 100 * Math.sin(theta) * Math.sin(phi);
      const z = 100 * Math.cos(phi);

      map.set(node.id, {
        label: node.label,
        position: new THREE.Vector3(x, y, z),
      });
    });

    return map;
  }, [nodes]);

  // 초기 로드
  useEffect(() => {
    loadNetworkData();
  }, [loadNetworkData]);

  // Scene 초기화
  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  // 노드 렌더링
  useEffect(() => {
    renderNodes();
  }, [renderNodes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">네트워크 데이터 로드 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 font-bold mb-4">오류 발생</p>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-50">
      {/* Three.js 캔버스 */}
      <div ref={containerRef} className="w-full h-full" />

      {/* 검색 바 */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 w-80 z-10">
        <input
          type="text"
          placeholder="검색... (예: 마사지, 존)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-2">
          노드: {nodes.length} | 연결선: {edges.length}
        </p>
      </div>

      {/* 호버 정보 */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 w-80 z-10">
          <h3 className="font-bold text-lg text-gray-800">{hoveredNode.label}</h3>
          <p className="text-xs text-gray-500 mb-2">{hoveredNode.category}</p>
          <p className="text-sm text-gray-600 line-clamp-3">{hoveredNode.description}</p>
        </div>
      )}

      {/* 엣지 인터랙션 */}
      {sceneRef.current && cameraRef.current && rendererRef.current && (
        <EdgeInteractions
          scene={sceneRef.current}
          camera={cameraRef.current}
          renderer={rendererRef.current}
          edges={edges}
          nodeMap={getNodeMap()}
          searchQuery={searchQuery}
          onEdgeSelect={onEdgeSelect}
        />
      )}
    </div>
  );
};

export default KnowledgeNetworkWithEdges;
