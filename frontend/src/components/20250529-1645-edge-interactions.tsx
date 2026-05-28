// ============================================================
// 📌 컴포넌트명: EdgeInteractions
// 📋 목적: Three.js 연결선의 라벨, 호버, 클릭 인터랙션 구현
// 🔧 기능: 선 위 텍스트 라벨, 마우스 인터랙션, 정보 패널
// 📅 작성일: 2026-05-29
// ============================================================

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useEdgeInteraction, Edge, EdgeInfo } from '@/hooks/20250529-1645-useEdgeInteraction';

/**
 * 📝 설명:
 * 이 컴포넌트는 Three.js 장면에서 연결선(edge)의 인터랙션을 관리합니다.
 *
 * **주요 기능:**
 * 1. 연결선 위에 라벨 텍스트 표시 (Canvas texture)
 * 2. 마우스 호버 시 선 두께 증가 및 밝기 증가
 * 3. 선 클릭 시 관계 정보 패널 표시
 * 4. 검색 키워드 연동으로 관련 선만 강조
 * 5. 모바일: 클릭 제스처만 지원 (호버 제거)
 */

export interface EdgeInteractionProps {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  edges: Edge[];
  nodeMap: Map<string, { label: string; position: THREE.Vector3 }>;
  searchQuery?: string;
  onEdgeSelect?: (edge: Edge, info: EdgeInfo) => void;
  onEdgeDeselect?: () => void;
}

/**
 * 커다란 라벨을 위한 Canvas Texture 생성
 */
const createEdgeLabelTexture = (text: string, size: number = 256): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Cannot get canvas 2D context');
  }

  // 배경 (투명)
  context.clearRect(0, 0, size, size);

  // 텍스트 스타일
  context.fillStyle = '#000000';
  context.font = `bold ${size * 0.3}px Arial, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  // 흰색 테두리로 검정 텍스트 렌더링
  context.strokeStyle = '#ffffff';
  context.lineWidth = size * 0.05;
  context.strokeText(text, size / 2, size / 2);

  // 검정 텍스트 채우기
  context.fillStyle = '#000000';
  context.fillText(text, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
};

/**
 * Billboard 메시 생성 - 항상 카메라를 향하는 텍스트
 */
const createBillboardLabel = (
  text: string,
  position: THREE.Vector3,
  size: number = 20
): THREE.Mesh => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Cannot get canvas 2D context');
  }

  // 배경
  context.fillStyle = 'rgba(0, 0, 0, 0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 텍스트
  context.fillStyle = '#ffffff';
  context.font = 'bold 48px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  // 테두리
  context.strokeStyle = '#ffff00';
  context.lineWidth = 3;
  context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  const texture = new THREE.CanvasTexture(canvas);
  const geometry = new THREE.PlaneGeometry(size * 2, size);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);

  // Billboard 효과를 위한 커스텀 업데이트 로직
  (mesh as any).isBillboard = true;

  return mesh;
};

/**
 * 메인 컴포넌트
 */
export const EdgeInteractions: React.FC<EdgeInteractionProps> = ({
  scene,
  camera,
  renderer,
  edges,
  nodeMap,
  searchQuery,
  onEdgeSelect,
  onEdgeDeselect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const infoPanelRef = useRef<HTMLDivElement>(null);
  const edgeGroupRef = useRef<THREE.Group | null>(null);
  const edgeLinesRef = useRef<Map<string, THREE.Line>>(new Map());
  const edgeLabelsRef = useRef<Map<string, THREE.Mesh>>(new Map());

  const {
    hoveredEdge,
    selectedEdge,
    edgeInfo,
    registerEdge,
    registerNodeName,
    onEdgeHover,
    onEdgeHoverEnd,
    onEdgeClick,
    onEdgeClickClose,
    searchAndHighlightEdges,
    isMobile,
  } = useEdgeInteraction();

  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  /**
   * 📌 함수: renderEdges
   * 📋 목적: Three.js 장면에 모든 연결선 렌더링
   */
  const renderEdges = useCallback(() => {
    if (!edgeGroupRef.current) {
      edgeGroupRef.current = new THREE.Group();
      scene.add(edgeGroupRef.current);
    }

    // 기존 엣지 정리
    edgeGroupRef.current.clear();
    edgeLinesRef.current.clear();
    edgeLabelsRef.current.clear();

    // 각 엣지 렌더링
    edges.forEach((edge) => {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      if (!sourceNode || !targetNode) return;

      // ===== 1. 연결선 렌더링 =====
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(
          new Float32Array([
            sourceNode.position.x,
            sourceNode.position.y,
            sourceNode.position.z,
            targetNode.position.x,
            targetNode.position.y,
            targetNode.position.z,
          ]),
          3
        )
      );

      const lineMaterial = new THREE.LineBasicMaterial({
        color: edge.color || '#888888',
        linewidth: 2,
        fog: true,
      });

      const line = new THREE.Line(lineGeometry, lineMaterial);
      (line as any).userData = { edge };

      edgeGroupRef.current.add(line);
      edgeLinesRef.current.set(edge.id, line);
      registerEdge(edge, line);

      // ===== 2. 라벨 렌더링 =====
      if (edge.label) {
        // 선의 중점 계산
        const midpoint = new THREE.Vector3(
          (sourceNode.position.x + targetNode.position.x) / 2,
          (sourceNode.position.y + targetNode.position.y) / 2,
          (sourceNode.position.z + targetNode.position.z) / 2
        );

        // Billboard 라벨 생성
        const label = createBillboardLabel(edge.label, midpoint, 15);
        edgeGroupRef.current.add(label);
        edgeLabelsRef.current.set(edge.id, label);
      }

      // ===== 3. 노드명 등록 =====
      registerNodeName(edge.source, sourceNode.label);
      registerNodeName(edge.target, targetNode.label);
    });
  }, [edges, nodeMap, registerEdge, registerNodeName]);

  /**
   * 📌 함수: handleMouseMove
   * 📋 목적: 마우스 움직임 감지 및 레이캐스팅
   * ⚠️ 주의: 성능을 위해 throttle 적용 (모바일에서는 비활성)
   */
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isMobile) return; // 모바일에서는 마우스 이벤트 무시

      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const intersects = raycasterRef.current.intersectObjects(
        edgeGroupRef.current?.children || []
      );

      if (intersects.length > 0) {
        const firstIntersect = intersects[0].object as any;
        if (firstIntersect.userData?.edge) {
          const hoveredEdgeData = firstIntersect.userData.edge;
          onEdgeHover(hoveredEdgeData, event);
        }
      } else {
        onEdgeHoverEnd();
      }
    },
    [camera, renderer, isMobile, onEdgeHover, onEdgeHoverEnd]
  );

  /**
   * 📌 함수: handleClick
   * 📋 목적: 선 클릭 이벤트 처리 (데스크톱 & 모바일)
   */
  const handleClick = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      let clientX: number, clientY: number;

      if (event instanceof TouchEvent) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const intersects = raycasterRef.current.intersectObjects(
        edgeGroupRef.current?.children || []
      );

      if (intersects.length > 0) {
        const firstIntersect = intersects[0].object as any;
        if (firstIntersect.userData?.edge) {
          const clickedEdge = firstIntersect.userData.edge;
          onEdgeClick(clickedEdge, event as MouseEvent);

          if (onEdgeSelect && edgeInfo) {
            onEdgeSelect(clickedEdge, edgeInfo);
          }
        }
      }
    },
    [camera, renderer, onEdgeClick, onEdgeSelect, edgeInfo]
  );

  /**
   * 📌 함수: updateBillboardLabels
   * 📋 목적: 프레임마다 라벨이 항상 카메라를 향하도록 업데이트
   * 📝 설명: Billboard 효과로 3D 공간의 라벨이 항상 보이도록 함
   */
  const updateBillboardLabels = useCallback(() => {
    edgeLabelsRef.current.forEach((label) => {
      // 카메라를 향하도록 회전
      const toCamera = new THREE.Vector3();
      toCamera.subVectors(camera.position, label.position).normalize();

      label.lookAt(
        label.position.x + toCamera.x,
        label.position.y + toCamera.y,
        label.position.z + toCamera.z
      );

      // 거리에 따라 스케일 조정 (카메라에서 멀어질수록 커짐)
      const distance = label.position.distanceTo(camera.position);
      const scale = Math.min(distance / 100, 2); // 최대 2배까지만
      label.scale.set(scale, scale, scale);
    });
  }, [camera]);

  /**
   * 📌 함수: animationLoop
   * 📋 목적: 렌더링 루프에서 라벨 업데이트 및 렌더링
   */
  useEffect(() => {
    if (!edgeGroupRef.current) return;

    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      updateBillboardLabels();
      // renderer.render(scene, camera); // 부모 컴포넌트에서 관리
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [updateBillboardLabels]);

  /**
   * 📌 함수: setupEventListeners
   * 📋 목적: 마우스/터치 이벤트 리스너 등록
   */
  useEffect(() => {
    const domElement = renderer.domElement;

    if (!isMobile) {
      // 데스크톱: 마우스 호버 + 클릭
      domElement.addEventListener('mousemove', handleMouseMove);
    }

    // 모바일 & 데스크톱 모두: 클릭/터치
    domElement.addEventListener('click', handleClick);
    domElement.addEventListener('touchend', handleClick);

    return () => {
      if (!isMobile) {
        domElement.removeEventListener('mousemove', handleMouseMove);
      }
      domElement.removeEventListener('click', handleClick);
      domElement.removeEventListener('touchend', handleClick);
    };
  }, [handleMouseMove, handleClick, isMobile, renderer]);

  /**
   * 📌 함수: handleSearch
   * 📋 목적: 검색 쿼리 변경 시 관련 선 강조
   */
  useEffect(() => {
    if (searchQuery) {
      searchAndHighlightEdges(searchQuery);
    } else {
      searchAndHighlightEdges('');
    }
  }, [searchQuery, searchAndHighlightEdges]);

  /**
   * 📌 함수: setupScene
   * 📋 목적: 초기 씬 설정
   */
  useEffect(() => {
    renderEdges();
  }, [renderEdges]);

  return (
    <>
      {/* 정보 패널 */}
      {edgeInfo && !isMobile && (
        <EdgeInfoPanel
          edgeInfo={edgeInfo}
          onClose={onEdgeClickClose}
          position={edgeInfo.position}
        />
      )}

      {/* 모바일: 선택된 정보 패널 (화면 중앙 상단) */}
      {selectedEdge && edgeInfo && isMobile && (
        <EdgeInfoPanelMobile edgeInfo={edgeInfo} onClose={onEdgeClickClose} />
      )}
    </>
  );
};

/**
 * 📌 컴포넌트: EdgeInfoPanel (데스크톱 - 마우스 따라다니기)
 * 📋 목적: 연결선 정보를 마우스 위치 근처에 표시
 */
interface EdgeInfoPanelProps {
  edgeInfo: EdgeInfo;
  onClose: () => void;
  position?: { x: number; y: number };
}

const EdgeInfoPanel: React.FC<EdgeInfoPanelProps> = ({ edgeInfo, onClose, position }) => {
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 1000,
  });

  useEffect(() => {
    if (position) {
      setStyle({
        position: 'fixed',
        top: `${position.y + 10}px`,
        right: 'auto',
        left: `${position.x + 10}px`,
        zIndex: 1000,
      });
    }
  }, [position]);

  const renderStars = (strength: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < strength ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  return (
    <div
      className="bg-white rounded-lg shadow-lg border-l-4 border-blue-500 p-4 w-72 max-h-96 overflow-y-auto"
      style={style}
    >
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-gray-800">
          {edgeInfo.sourceName} → {edgeInfo.targetName}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 font-bold text-xl"
        >
          ×
        </button>
      </div>

      <hr className="mb-3 border-gray-200" />

      {/* 관계 정보 */}
      <div className="space-y-2 text-sm">
        <div>
          <label className="font-semibold text-gray-700">관계유형:</label>
          <p className="text-gray-600">{edgeInfo.edge.relationship}</p>
        </div>

        <div>
          <label className="font-semibold text-gray-700">분류:</label>
          <p className="text-gray-600">{edgeInfo.edge.type}</p>
        </div>

        <div>
          <label className="font-semibold text-gray-700">강도:</label>
          <div className="flex gap-1 text-lg">{renderStars(edgeInfo.edge.strength)}</div>
          <p className="text-xs text-gray-500">({edgeInfo.edge.strength}/5)</p>
        </div>

        <div>
          <label className="font-semibold text-gray-700">설명:</label>
          <p className="text-gray-600 leading-relaxed">{edgeInfo.edge.description}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * 📌 컴포넌트: EdgeInfoPanelMobile (모바일 - 화면 중앙 상단)
 * 📋 목적: 모바일에서 선택된 연결선 정보를 고정된 위치에 표시
 */
const EdgeInfoPanelMobile: React.FC<EdgeInfoPanelProps> = ({ edgeInfo, onClose }) => {
  const renderStars = (strength: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < strength ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border-l-4 border-blue-500 p-4 w-11/12 max-w-md z-50">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-base text-gray-800 truncate">
          {edgeInfo.sourceName} → {edgeInfo.targetName}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 font-bold text-2xl ml-2 flex-shrink-0"
        >
          ×
        </button>
      </div>

      <hr className="mb-3 border-gray-200" />

      {/* 관계 정보 */}
      <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
        <div>
          <label className="font-semibold text-gray-700">관계:</label>
          <p className="text-gray-600">{edgeInfo.edge.relationship}</p>
        </div>

        <div>
          <label className="font-semibold text-gray-700">유형:</label>
          <p className="text-gray-600">{edgeInfo.edge.type}</p>
        </div>

        <div>
          <label className="font-semibold text-gray-700">강도:</label>
          <div className="flex gap-1 text-lg">{renderStars(edgeInfo.edge.strength)}</div>
          <p className="text-xs text-gray-500">({edgeInfo.edge.strength}/5)</p>
        </div>

        <div>
          <label className="font-semibold text-gray-700">설명:</label>
          <p className="text-gray-600 leading-relaxed text-xs">
            {edgeInfo.edge.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EdgeInteractions;
