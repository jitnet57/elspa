'use client';

/**
 * ============================================================
 * 📌 모듈: i18n (경량 다국어)
 * 📋 기본 언어 = 영어(en). 언어 변경 시 ko 이면 한글.
 * 💾 localStorage('elspa.lang') 영속, 전역 구독(useSyncExternalStore)
 * 사용:
 *   const t = useT();
 *   t('Save', '저장')   // en → 'Save', ko → '저장'
 * ============================================================
 */

import { useSyncExternalStore } from 'react';

export type Lang = 'en' | 'ko';
const KEY = 'elspa.lang';
const listeners = new Set<() => void>();

let current: Lang = 'en';
if (typeof window !== 'undefined') {
  const saved = window.localStorage.getItem(KEY);
  if (saved === 'ko' || saved === 'en') current = saved;
}

export function getLang(): Lang {
  return current;
}
export function setLang(l: Lang): void {
  current = l;
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, l);
  listeners.forEach((f) => f());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, () => current, () => 'en');
}

/** 번역 헬퍼 훅: t(en, ko) — 기본 영어, ko 일 때 한글 */
export function useT() {
  const lang = useLang();
  return (en: string, ko: string) => (lang === 'ko' ? ko : en);
}
