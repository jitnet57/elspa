/**
 * ============================================================
 * 📌 싱크 서비스: Supabase ↔ IndexedDB 동기화
 * 📋 온라인 복구 시 pendingSync 큐 소진 + Supabase 최신 데이터 내려받기
 *    오프라인 중 변경사항은 pendingSync 테이블에 쌓아두고 복구 시 처리.
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

import { db } from './localDb';
import { getSupabase } from '@/lib/supabase/client';

let syncListenerAdded = false; // 중복 리스너 방지 플래그

/**
 * Supabase → IndexedDB: 오늘 날짜 기준 최신 데이터 내려받기.
 * today 는 호출자가 "YYYY-MM-DD" 형식으로 전달 (Date 생성 분리).
 */
export async function pullFromSupabase(today: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  // 직원 목록
  try {
    const { data } = await sb.from('employees').select('*').eq('is_active', true);
    if (data?.length) await db.employees.bulkPut(data as any);
  } catch { /* 오프라인 무시 */ }

  // 오늘 출결 로그
  try {
    const { data } = await sb.from('attendance_logs').select('*').eq('work_date', today);
    if (data?.length) await db.attendanceLogs.bulkPut(data as any);
  } catch { /* 오프라인 무시 */ }

  // 오늘 이후 예약
  try {
    const { data } = await sb.from('bookings').select('*').gte('date', today).limit(200);
    if (data?.length) await db.bookings.bulkPut(data as any);
  } catch { /* 오프라인 무시 */ }
}

/**
 * pendingSync 큐 → Supabase: 오프라인 중 쌓인 변경사항 반영.
 * 성공한 항목은 큐에서 삭제, 실패 항목은 다음 복구 시 재시도.
 */
export async function pushPendingSync(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const items = await db.pendingSync.toArray();
  for (const item of items) {
    try {
      if (item.operation === 'insert') {
        await sb.from(item.table_name).insert(item.payload);
      } else if (item.operation === 'update') {
        await sb.from(item.table_name).update(item.payload).eq('id', (item.payload as any).id);
      } else if (item.operation === 'delete') {
        await sb.from(item.table_name).delete().eq('id', (item.payload as any).id);
      }
      if (item.id !== undefined) await db.pendingSync.delete(item.id);
    } catch { /* 이 항목은 다음 복구 시 재시도 */ }
  }
}

/**
 * 온라인 복구 이벤트 리스너 등록.
 * getToday: 호출 시점의 날짜 반환 함수 (Date 분리).
 */
export function startSyncOnReconnect(getToday: () => string): void {
  if (typeof window === 'undefined' || syncListenerAdded) return;
  syncListenerAdded = true;
  window.addEventListener('online', async () => {
    await pushPendingSync();
    await pullFromSupabase(getToday());
  });
}

/** navigator.onLine 래핑 — SSR 안전 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * 오프라인 중 변경사항을 pendingSync 큐에 추가.
 * 복구 시 pushPendingSync() 가 자동으로 처리.
 */
export async function queueSync(
  table_name: string,
  operation: 'insert' | 'update' | 'delete',
  payload: object,
  created_at: string,
): Promise<void> {
  await db.pendingSync.add({ table_name, operation, payload, created_at });
}
