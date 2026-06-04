/**
 * ============================================================
 * 📌 ElSpa 로컬 DB (IndexedDB via Dexie)
 * 📋 인터넷 없을 때 Supabase 대신 이 DB에서 읽고 쓴다.
 *    온라인 복구 시 syncService 가 Supabase와 동기화.
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

import Dexie, { type EntityTable } from 'dexie';

// ── 로컬 저장 레코드 타입 ────────────────────────────────────
export interface DbEmployee {
  id: number;
  name: string;
  employee_type: string;
  is_active: boolean;
  [key: string]: unknown;
}
export interface DbBooking {
  id: number;
  date: string;
  therapist_id: number;
  guest_name: string;
  status: string;
  [key: string]: unknown;
}
export interface DbAttendanceLog {
  id: number;
  employee_id: number;
  work_date: string;
  clock_in?: string;
  clock_out?: string;
  is_absent?: boolean;
  [key: string]: unknown;
}
export interface DbExpenseRecord {
  id: number;
  report_date: string;
  vendor: string;
  amount: number;
  category_name: string;
  description?: string;
  [key: string]: unknown;
}
// 오프라인 중 발생한 변경사항 큐 — 온라인 복구 시 Supabase에 반영
export interface DbPendingSync {
  id?: number;
  table_name: string;
  operation: 'insert' | 'update' | 'delete';
  payload: object;
  created_at: string;
}

// ── Dexie DB 클래스 ──────────────────────────────────────────
class ElSpaDB extends Dexie {
  employees!: EntityTable<DbEmployee, 'id'>;
  bookings!: EntityTable<DbBooking, 'id'>;
  attendanceLogs!: EntityTable<DbAttendanceLog, 'id'>;
  expenseRecords!: EntityTable<DbExpenseRecord, 'id'>;
  pendingSync!: EntityTable<DbPendingSync, 'id'>;

  constructor() {
    super('ElSpaDB');
    this.version(1).stores({
      employees:      '++id, name, employee_type, is_active',
      bookings:       '++id, date, therapist_id, status',
      attendanceLogs: '++id, employee_id, work_date',
      expenseRecords: '++id, report_date, category_name',
      pendingSync:    '++id, table_name, created_at',
    });
  }
}

// 싱글턴 export — 앱 전역에서 동일 인스턴스 사용
export const db = new ElSpaDB();
