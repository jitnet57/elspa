// ============================================================
// 📌 훅명: useEdgeInteraction
// 📋 목적: Three.js 연결선의 마우스 호버, 클릭 인터랙션 관리
// 🔧 기능: 선 하이라이트, 관련 노드 강조, 정보 패널 표시
// 📅 작성일: 2026-05-29
// ============================================================

import { useCallback, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

// ============================================================
// TypeScript 타입 확장: Windows 제스처 이벤트 지원
// ============================================================
declare global {
  interface Window {
    onmsgesturechange?: (event: Event) => void;
    onmstouchstart?: (event: TouchEvent) => void;
  }
}

/**
 * 📝 설명:
 * 연결선(edge)의 마우스 인터랙션을 관리하는 커스텀 훅입니다.
 *
 * **기능:**
 * 1. 마우스 호버 시 선 하이라이트 (throttle로 성능 개선)
 * 2. 관련 노드도 함께 하이라이트
 * 3. 선 클릭 시 관계 정보 패널 표시
 * 4. 검색 키워드 연동으로 관련 선만 강조
 * 5. 모바일: 클릭으로만 정보 표시 (호버 없음)
 */

/**
 * 연결선(Edge) 데이터 구조
 */
export interface Edge {
  id: string;                    // 고유 식별자 (예: "therapist-john_massage-thai")
  source: string;                // 출발 노드 ID
  target: string;                // 도착 노드 ID
  relationship: string;          // 관계 유형 (예: "제공자", "영향")
  type: string;                  // 관계 분류 (예: "서비스 제공", "시장 영향")
  strength: number;              // 관계 강도 (1-5)
  description: string;           // 관계 설명
  label?: string;                // 선 위 라벨 텍스트
  color?: string;                // 선 색상 (HEX)
}

/**
 * 선 정보 패널 데이터
 */
export interface EdgeInfo {
  edge: Edge;
  sourceName: string;            // 출발 노드 이름
  targetName: string;            // 도착 노드 이름
  position?: { x: number; y: number };  // 화면 좌표 (마우스 위치)
}

/**
 * 터치 기기 감지
 */
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return (
    (typeof window.ontouchstart !== 'undefined') ||
    (typeof (window as any).onmsgesturechange !== 'undefined') ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
};

/**
 * Throttle 유틸리티 - 성능 최적화
 */
const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function (this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * 커스텀 훅: useEdgeInteraction
 */
export const useEdgeInteraction = () => {
  const [hoveredEdge, setHoveredEdge] = useState<Edge | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [edgeInfo, setEdgeInfo] = useState<EdgeInfo | null>(null);
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // 에지 메시 참조 (Three.js 객체)
  const edgeMeshesRef = useRef<Map<string, THREE.Line | THREE.Mesh>>(new Map());
  const edgeDataRef = useRef<Map<string, Edge>>(new Map());
  const nodeNamesRef = useRef<Map<string, string>>(new Map());

  // 마운트 시 터치 기기 감지
  useEffect(() => {
    setIsMobile(isTouchDevice());
  }, []);

  /**
   * 📌 함수: registerEdge
   * 📋 목적: Three.js 에지 메시를 등록하고 인터랙션 리스너 추가
   * 🔧 매개변수:
   *    - edge: Edge 데이터
   *    - mesh: THREE.Line 또는 THREE.Mesh 객체
   */
  const registerEdge = useCallback((edge: Edge, mesh: THREE.Line | THREE.Mesh) => {
    edgeMeshesRef.current.set(edge.id, mesh);
    edgeDataRef.current.set(edge.id, edge);
  }, []);

  /**
   * 📌 함수: registerNodeName
   * 📋 목적: 노드 ID와 라벨명 매핑 (선 클릭 시 정보 표시용)
   * 🔧 매개변수:
   *    - nodeId: 노드 고유 ID
   *    - nodeName: 노드 라벨명
   */
  const registerNodeName = useCallback((nodeId: string, nodeName: string) => {
    nodeNamesRef.current.set(nodeId, nodeName);
  }, []);

  /**
   * 📌 함수: onEdgeHover
   * 📋 목적: 에지 호버 시 하이라이트 및 상태 업데이트
   * 🔧 매개변수:
   *    - edge: Edge 데이터
   *    - mouseEvent: 마우스 이벤트 (위치 추출용)
   * ⚠️ 주의: 모바일에서는 호출되지 않음 (클릭만 사용)
   */
  const onEdgeHover = useCallback(
    (edge: Edge, mouseEvent?: MouseEvent) => {
      if (isMobile) return; // 모바일에서는 호버 무시

      setHoveredEdge(edge);

      // 선 하이라이트 (Two-Way: source -> target, target -> source)
      highlightEdge(edge.id, true);
      highlightRelatedNodes(edge, true);

      // 마우스 위치에 정보 패널 표시 (선택사항)
      if (mouseEvent) {
        setEdgeInfo({
          edge,
          sourceName: nodeNamesRef.current.get(edge.source) || edge.source,
          targetName: nodeNamesRef.current.get(edge.target) || edge.target,
          position: { x: mouseEvent.clientX, y: mouseEvent.clientY },
        });
      }
    },
    [isMobile]
  );

  /**
   * 📌 함수: onEdgeHoverEnd
   * 📋 목적: 에지 호버 종료 시 하이라이트 해제
   */
  const onEdgeHoverEnd = useCallback(() => {
    if (isMobile) return;

    const edge = hoveredEdge;
    if (edge) {
      highlightEdge(edge.id, false);
      highlightRelatedNodes(edge, false);
    }

    setHoveredEdge(null);
    setEdgeInfo(null);
  }, [hoveredEdge, isMobile]);

  /**
   * 📌 함수: onEdgeClick
   * 📋 목적: 에지 클릭 시 관계 정보 패널 표시
   * 🔧 매개변수:
   *    - edge: Edge 데이터
   *    - mouseEvent: 마우스 이벤트 (좌표 추출)
   */
  const onEdgeClick = useCallback((edge: Edge, mouseEvent?: MouseEvent) => {
    setSelectedEdge(edge);
    highlightEdge(edge.id, true);
    highlightRelatedNodes(edge, true);

    setEdgeInfo({
      edge,
      sourceName: nodeNamesRef.current.get(edge.source) || edge.source,
      targetName: nodeNamesRef.current.get(edge.target) || edge.target,
      position: mouseEvent
        ? { x: mouseEvent.clientX, y: mouseEvent.clientY }
        : undefined,
    });
  }, []);

  /**
   * 📌 함수: onEdgeClickClose
   * 📋 목적: 선택된 에지 패널 닫기
   */
  const onEdgeClickClose = useCallback(() => {
    if (selectedEdge) {
      highlightEdge(selectedEdge.id, false);
      highlightRelatedNodes(selectedEdge, false);
    }

    setSelectedEdge(null);
    setEdgeInfo(null);
  }, [selectedEdge]);

  /**
   * 📌 함수: highlightEdge
   * 📋 목적: 단일 에지 시각적 강조
   * 🔧 매개변수:
   *    - edgeId: 에지 고유 ID
   *    - highlight: true = 강조, false = 해제
   */
  const highlightEdge = useCallback((edgeId: string, highlight: boolean) => {
    const mesh = edgeMeshesRef.current.get(edgeId);
    if (!mesh) return;

    if (mesh instanceof THREE.Line) {
      const material = mesh.material as THREE.LineBasicMaterial;
      if (highlight) {
        (material as any).linewidth = 4;
        material.color.set(0xffff00); // 노란색 하이라이트
      } else {
        (material as any).linewidth = 2;
        material.color.set(0x888888); // 기본값
      }
    }
  }, []);

  /**
   * 📌 함수: highlightRelatedNodes
   * 📋 목적: 연결된 노드들도 함께 강조
   * 🔧 매개변수:
   *    - edge: Edge 데이터
   *    - highlight: true = 강조, false = 해제
   */
  const highlightRelatedNodes = useCallback((edge: Edge, highlight: boolean) => {
    // 노드 강조는 부모 컴포넌트에서 처리하도록 이벤트 전달
    if (highlight) {
      // source와 target 노드를 강조하도록 신호
      window.dispatchEvent(
        new CustomEvent('highlightNodes', {
          detail: { nodeIds: [edge.source, edge.target] },
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('clearHighlightNodes', {
          detail: { nodeIds: [edge.source, edge.target] },
        })
      );
    }
  }, []);

  /**
   * 📌 함수: searchAndHighlightEdges
   * 📋 목적: 검색 키워드와 일치하는 에지만 강조 표시
   * 🔧 매개변수:
   *    - query: 검색 키워드
   */
  const searchAndHighlightEdges = useCallback((query: string) => {
    const highlighted = new Set<string>();

    if (query.trim() === '') {
      // 검색 초기화 - 모든 하이라이트 제거
      setHighlightedEdges(new Set());
      return;
    }

    const lowerQuery = query.toLowerCase();

    // 모든 에지 순회하며 일치하는 것 찾기
    edgeDataRef.current.forEach((edge) => {
      const matches =
        nodeNamesRef.current.get(edge.source)?.toLowerCase().includes(lowerQuery) ||
        nodeNamesRef.current.get(edge.target)?.toLowerCase().includes(lowerQuery) ||
        edge.relationship.toLowerCase().includes(lowerQuery) ||
        edge.type.toLowerCase().includes(lowerQuery) ||
        edge.description.toLowerCase().includes(lowerQuery);

      if (matches) {
        highlighted.add(edge.id);
        highlightEdge(edge.id, true);
      }
    });

    setHighlightedEdges(highlighted);
  }, [highlightEdge]);

  /**
   * 📌 함수: clearHighlights
   * 📋 목적: 모든 하이라이트 제거
   */
  const clearHighlights = useCallback(() => {
    highlightedEdges.forEach((edgeId) => {
      highlightEdge(edgeId, false);
    });
    setHighlightedEdges(new Set());
    setSelectedEdge(null);
    setEdgeInfo(null);
  }, [highlightedEdges, highlightEdge]);

  /**
   * 📌 함수: getEdgeRaycastObjects
   * 📋 목적: Raycaster와 호환되는 Three.js 객체 배열 반환
   * 📤 반환값: THREE.Object3D[] - 레이캐스팅용 메시 배열
   */
  const getEdgeRaycastObjects = useCallback(() => {
    return Array.from(edgeMeshesRef.current.values());
  }, []);

  return {
    // 상태
    hoveredEdge,
    selectedEdge,
    edgeInfo,
    highlightedEdges,
    isMobile,

    // 메서드
    registerEdge,
    registerNodeName,
    onEdgeHover,
    onEdgeHoverEnd,
    onEdgeClick,
    onEdgeClickClose,
    highlightEdge,
    highlightRelatedNodes,
    searchAndHighlightEdges,
    clearHighlights,
    getEdgeRaycastObjects,

    // 참조
    edgeMeshesRef,
    edgeDataRef,
    nodeNamesRef,
  };
};

export default useEdgeInteraction;
