// ============================================================
// 📌 훅 이름: useKnowledgeNetworkTouch
// 📋 목적: Three.js 3D 지식 네트워크에서 모바일 터치 이벤트를 처리
// 🔧 매개변수:
//    - containerRef: 터치 이벤트 감지할 DOM 요소
//    - onDrag: 드래그 핸들러 (deltaX, deltaY)
//    - onZoom: 핀치 줌 핸들러 (zoomDelta)
//    - onDoubleTap: 더블 탭 핸들러
//    - onSwipe: 스와이프 핸들러 (direction: 'left' | 'right')
// 📤 반환값: { isTouching: boolean, lastTouchCount: number }
// 📅 작성일: 2026-05-29
// ⚠️ 주의: 마우스 이벤트와 포인터 이벤트 중복 실행 방지, preventDefault() 주의
// 🎮 기능:
//   1️⃣ 싱글 터치 드래그 (마우스 드래그와 동일)
//   2️⃣ 멀티 터치 줌 (두 손가락 벌리기/오므리기)
//   3️⃣ 더블 탭 리셋
//   4️⃣ 스와이프 제스처 (좌/우)
// ============================================================

import { useEffect, useRef, useCallback } from 'react';

// 터치 인터랙션 옵션 인터페이스
export interface TouchOptions {
  dragSensitivity?: number;           // 드래그 감도 (기본값: 1)
  zoomSensitivity?: number;           // 줌 감도 (기본값: 0.01)
  doubleTapDelay?: number;            // 더블 탭 시간 제한 (ms, 기본값: 300)
  swipeThreshold?: number;            // 스와이프 최소 거리 (px, 기본값: 50)
  enableSwipe?: boolean;              // 스와이프 활성화 (기본값: true)
}

export interface TouchCallbacks {
  onDrag?: (delta: { x: number; y: number }) => void;
  onZoom?: (delta: number) => void;
  onDoubleTap?: () => void;
  onSwipe?: (direction: 'left' | 'right') => void;
}

export interface TouchState {
  isTouching: boolean;
  lastTouchCount: number;
}

/**
 * 모바일 터치 이벤트 훅
 *
 * Three.js 3D 네트워크 컴포넌트에 터치 지원을 추가합니다.
 *
 * **기능:**
 * 1. 싱글 터치 드래그: 한 손가락 드래그 → 3D 회전 (마우스 드래그와 동일)
 * 2. 멀티 터치 줌: 두 손가락 벌리기/오므리기 → 카메라 줌 조절
 * 3. 더블 탭: 카메라 리셋
 * 4. 스와이프: 좌/우 스와이프 → 자동 회전 토글
 *
 * **호환성:**
 * - iOS Safari 12+ (touchstart, touchmove, touchend)
 * - Android Chrome 50+ (touch events)
 * - 태블릿 지원
 *
 * **사용 예시:**
 * ```typescript
 * const { isTouching } = useKnowledgeNetworkTouch(
 *   canvasRef,
 *   {
 *     onDrag: (delta) => console.log('드래그:', delta),
 *     onZoom: (delta) => console.log('줌:', delta),
 *     onDoubleTap: () => console.log('더블 탭!'),
 *     onSwipe: (dir) => console.log('스와이프:', dir),
 *   },
 *   {
 *     dragSensitivity: 1.0,
 *     zoomSensitivity: 0.01,
 *     doubleTapDelay: 300,
 *   }
 * );
 * ```
 */
export function useKnowledgeNetworkTouch(
  containerRef: React.RefObject<HTMLElement | HTMLDivElement>,
  callbacks: TouchCallbacks,
  options: TouchOptions = {}
): TouchState {
  // 옵션 기본값
  const {
    dragSensitivity = 1,
    zoomSensitivity = 0.01,
    doubleTapDelay = 300,
    swipeThreshold = 50,
    enableSwipe = true,
  } = options;

  // 터치 상태 저장
  const touchStateRef = useRef({
    isTouching: false,
    lastTouchCount: 0,
    lastTouchTime: 0,
    lastTouchX: 0,
    lastTouchY: 0,
    startTouchX: 0,
    startTouchY: 0,
  });

  const [isTouching, setIsTouching] = React.useState(false);

  // ============================================================
  // 📐 거리 계산 함수 (두 점 사이의 거리)
  // ============================================================
  const calculateDistance = useCallback(
    (x1: number, y1: number, x2: number, y2: number): number => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    },
    []
  );

  // ============================================================
  // 👆 싱글 터치 드래그 핸들러
  // ============================================================
  const handleTouchDrag = useCallback(
    (touches: TouchList, isDragging: boolean) => {
      if (touches.length !== 1 || !isDragging) return;

      const touch = touches[0];
      const deltaX = (touch.clientX - touchStateRef.current.lastTouchX) * dragSensitivity;
      const deltaY = (touch.clientY - touchStateRef.current.lastTouchY) * dragSensitivity;

      // 드래그 핸들러 콜백
      callbacks.onDrag?.({ x: deltaX, y: deltaY });

      // 현재 터치 위치 업데이트
      touchStateRef.current.lastTouchX = touch.clientX;
      touchStateRef.current.lastTouchY = touch.clientY;
    },
    [dragSensitivity, callbacks]
  );

  // ============================================================
  // 🤏 멀티 터치 줌 (핀치) 핸들러
  // ============================================================
  const handlePinchZoom = useCallback(
    (touches: TouchList) => {
      if (touches.length !== 2) return;

      const touch1 = touches[0];
      const touch2 = touches[1];

      // 현재 두 손가락 사이의 거리
      const currentDistance = calculateDistance(
        touch1.clientX,
        touch1.clientY,
        touch2.clientX,
        touch2.clientY
      );

      // 이전 거리 저장
      const prevDistanceRef = useRef<number | null>(null);
      if (!prevDistanceRef.current) {
        prevDistanceRef.current = currentDistance;
        return;
      }

      // 거리 변화량 계산
      const distanceDelta = currentDistance - prevDistanceRef.current;
      const zoomDelta = distanceDelta * zoomSensitivity;

      // 줌 핸들러 콜백 (양수 = 줌 아웃, 음수 = 줌 인)
      callbacks.onZoom?.(-zoomDelta);

      prevDistanceRef.current = currentDistance;
    },
    [calculateDistance, zoomSensitivity, callbacks]
  );

  // ============================================================
  // 📱 터치 시작 이벤트
  // ============================================================
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      // 멀티 터치 줌 중에 새 터치 추가되면 처리 중단
      if (touchStateRef.current.isTouching && touchStateRef.current.lastTouchCount !== e.touches.length) {
        return;
      }

      touchStateRef.current.isTouching = true;
      touchStateRef.current.lastTouchCount = e.touches.length;

      const touch = e.touches[0];
      touchStateRef.current.lastTouchX = touch.clientX;
      touchStateRef.current.lastTouchY = touch.clientY;
      touchStateRef.current.startTouchX = touch.clientX;
      touchStateRef.current.startTouchY = touch.clientY;

      setIsTouching(true);
    },
    []
  );

  // ============================================================
  // 📱 터치 이동 이벤트 (드래그 & 줌)
  // ============================================================
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!touchStateRef.current.isTouching) return;

      e.preventDefault(); // 브라우저 기본 스크롤 방지

      const touchCount = e.touches.length;

      if (touchCount === 1) {
        // 싱글 터치: 드래그 회전
        handleTouchDrag(e.touches, true);
      } else if (touchCount === 2) {
        // 멀티 터치: 핀치 줌
        handlePinchZoom(e.touches);
      }
    },
    [handleTouchDrag, handlePinchZoom]
  );

  // ============================================================
  // 📱 터치 종료 이벤트
  // ============================================================
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStateRef.current.isTouching) return;

      const now = Date.now();
      const timeSinceLastTap = now - touchStateRef.current.lastTouchTime;

      // 스와이프 감지 (터치 종료 시)
      if (enableSwipe && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStateRef.current.startTouchX;
        const deltaY = touch.clientY - touchStateRef.current.startTouchY;

        // 수평 스와이프 (Y 이동이 작아야 함)
        if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaY) < swipeThreshold / 2) {
          const direction: 'left' | 'right' = deltaX > 0 ? 'right' : 'left';
          callbacks.onSwipe?.(direction);
        }
      }

      // 더블 탭 감지 (빠르게 두 번 탭)
      if (timeSinceLastTap < doubleTapDelay && e.touches.length === 0) {
        callbacks.onDoubleTap?.();
      }

      // 상태 업데이트
      if (e.touches.length === 0) {
        touchStateRef.current.isTouching = false;
        touchStateRef.current.lastTouchTime = now;
        setIsTouching(false);
      } else {
        touchStateRef.current.lastTouchCount = e.touches.length;
      }
    },
    [enableSwipe, swipeThreshold, doubleTapDelay, callbacks]
  );

  // ============================================================
  // 📌 이벤트 리스너 등록 (useEffect)
  // ============================================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 터치 이벤트 옵션 ({ passive: false }는 preventDefault() 사용 시 필수)
    const touchOptions = { passive: false };

    // 이벤트 리스너 등록
    container.addEventListener('touchstart', handleTouchStart, touchOptions);
    container.addEventListener('touchmove', handleTouchMove, touchOptions);
    container.addEventListener('touchend', handleTouchEnd, touchOptions);
    container.addEventListener('touchcancel', handleTouchEnd, touchOptions); // 터치 취소 (예: 알림 팝업)

    // Cleanup: 이벤트 리스너 제거
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, containerRef]);

  return {
    isTouching,
    lastTouchCount: touchStateRef.current.lastTouchCount,
  };
}

// ============================================================
// 🛠️ 유틸리티: 스로틀 함수 (고빈도 이벤트 최적화)
// ============================================================
/**
 * 함수 호출을 지정된 시간 간격으로 제한합니다.
 *
 * **사용 예시:**
 * ```typescript
 * const throttledDrag = throttle((delta) => {
 *   updateScene(delta);
 * }, 16); // 약 60fps
 * ```
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T {
  let lastFunc: NodeJS.Timeout | null = null;
  let lastRan = 0;

  return function (this: any, ...args: Parameters<T>) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc!);
      lastFunc = setTimeout(
        () => {
          if (Date.now() - lastRan > limit) {
            func.apply(this, args);
            lastRan = Date.now();
          }
        },
        limit - (Date.now() - lastRan)
      );
    }
  } as T;
}

// ============================================================
// 🛠️ 유틸리티: 디바운스 함수 (최종 이벤트만 처리)
// ============================================================
/**
 * 함수 호출을 지정된 시간 이후에만 실행합니다.
 * 연속 호출 중 가장 마지막 호출만 실행됩니다.
 *
 * **사용 예시:**
 * ```typescript
 * const debouncedZoom = debounce((zoom) => {
 *   saveZoomLevel(zoom);
 * }, 500);
 * ```
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  } as T;
}
