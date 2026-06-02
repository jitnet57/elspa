/**
 * ============================================================
 * 📌 훅: useAutoSaveSettings
 * 📋 목적: Google Drive 자동 저장 설정 (on/off + 간격) 공유
 *          localStorage 에 저장 → 페이지 새로고침 후에도 유지
 *          BookingSheetTable / AttendanceView / expense 모두 이 훅을 사용
 * 🔧 반환: { enabled, intervalMinutes, setEnabled, setIntervalMinutes }
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

import { useState, useEffect, useCallback } from 'react';

export interface AutoSaveSettings {
  enabled: boolean;
  intervalMinutes: number; // 15 | 30 | 60 | 120
}

const LS_KEY = 'elspa.autoSave';
const DEFAULTS: AutoSaveSettings = { enabled: true, intervalMinutes: 60 };

function load(): AutoSaveSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULTS.enabled,
      intervalMinutes: typeof parsed.intervalMinutes === 'number' ? parsed.intervalMinutes : DEFAULTS.intervalMinutes,
    };
  } catch {
    return DEFAULTS;
  }
}

function save(s: AutoSaveSettings) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}

export function useAutoSaveSettings() {
  const [settings, setSettings] = useState<AutoSaveSettings>(DEFAULTS);

  // 마운트 시 localStorage 에서 로드
  useEffect(() => { setSettings(load()); }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, enabled };
      save(next);
      return next;
    });
  }, []);

  const setIntervalMinutes = useCallback((intervalMinutes: number) => {
    setSettings((prev) => {
      const next = { ...prev, intervalMinutes };
      save(next);
      return next;
    });
  }, []);

  return {
    enabled: settings.enabled,
    intervalMinutes: settings.intervalMinutes,
    intervalMs: settings.intervalMinutes * 60 * 1000,
    setEnabled,
    setIntervalMinutes,
  };
}
