/**
 * ============================================================
 * 📌 훅: useUnsavedChanges
 * 📋 목적: 저장되지 않은 변경사항 추적 및 페이지 이탈 확인
 * 🔧 사용: 탭 이동 시 "저장하시겠습니까?" 팝업
 * 📅 작성일: 2026-06-05
 * ============================================================
 */

import { useEffect, useCallback } from 'react';

export function useUnsavedChanges(hasUnsavedChanges: boolean, onBeforeUnload?: () => void) {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?';
      onBeforeUnload?.();
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges, onBeforeUnload]);
}

/**
 * localStorage에 unsaved 상태 저장
 */
export function setUnsavedState(key: string, hasUnsaved: boolean) {
  if (hasUnsaved) {
    localStorage.setItem(`unsaved_${key}`, JSON.stringify({ timestamp: Date.now() }));
  } else {
    localStorage.removeItem(`unsaved_${key}`);
  }
}

/**
 * localStorage에서 unsaved 상태 확인
 */
export function getUnsavedState(key: string): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(`unsaved_${key}`);
  return !!saved;
}

/**
 * 확인 팝업 표시
 */
export function showUnsavedConfirm(message = '저장되지 않은 변경사항이 있습니다. 저장하시겠습니까?'): Promise<boolean> {
  return new Promise((resolve) => {
    const result = window.confirm(message);
    resolve(result);
  });
}
