// ============================================================
// 📌 모듈: Supabase API 어댑터
// 📋 목적: Monitor(실시간 모니터)가 백엔드 없이 Supabase에서
//         침대/테라피스트를 폴링 조회하고, 변경을 즉시 저장하도록 함
// 🔧 폴백 전략 ("파일 폴백시 우선 저장하고 다시 불러옴"):
//     1) Supabase 조회 성공 → localStorage 스냅샷에 "우선 저장"
//     2) Supabase 조회 실패 → 저장된 스냅샷을 "다시 불러와" 모니터에 표시
//     3) 스냅샷도 없으면 Mock 데이터로 최종 폴백
// 📅 작성일: 2026-05-31
// ⚠️ 1시간 단위 Google Sheet 저장은 Apps Script가 담당 (apps-script/Code.gs)
// ============================================================

import { mockApiAdapter } from './mock-adapter';
import { getSupabase } from '@/lib/supabase/client';

interface Bed {
  id: number;
  bed_number: number;
  room_zone: string;
  status: 'available' | 'reserved' | 'in_service' | 'cleaning';
  customer_name?: string;
  therapist_name?: string;
  service_name?: string;
  starts_at?: string;
  ends_at?: string;
}

interface Therapist {
  id: number;
  name: string;
  status: 'idle' | 'in_service' | 'resting' | 'checked_out';
  current_bed?: number;
  remaining_minutes?: number;
  specialty?: string;
  checked_in_at?: string;
}

export interface Booking {
  id: number;
  booking_date: string;   // "YYYY-MM-DD"
  seq_no?: number;        // N#
  treatment?: string;     // TRT
  start_time?: string;    // "09:00"
  end_time?: string;      // "10:00"
  room_num?: string;      // RM#
  guest_name?: string;    // GUEST
  therapist_name?: string;
  note?: string;
  pay?: number;
  tip?: number;
  payment_methods?: Array<{
    id: string;
    method: 'card' | 'cash' | 'gcash' | 'bank_a' | 'bank_b';
    amount: number;
    reference?: string;
    notes?: string;
  }>;  // 결제 수단 분배
  sss_option?: 'prepaid' | 'hold';  // SSS 정산 방식
  payment_from?: 'guest' | 'credit' | 'waived';  // 결제 출처
  status?: 'normal' | 'editing' | 'deleting' | 'deleted' | 'error';
}

// ============================================================
// 로컬 스냅샷 캐시 (파일 폴백용)
// ============================================================
const CACHE_BEDS = 'elspa.monitor.beds.snapshot';
const CACHE_THERAPISTS = 'elspa.monitor.therapists.snapshot';
const CACHE_BOOKINGS = 'elspa.monitor.bookings.snapshot';

/** 스냅샷 저장 ("우선 저장") — 조회 성공 시마다 최신 상태 보관 */
function saveSnapshot<T>(key: string, rows: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ savedAt: new Date().toISOString(), rows })
    );
  } catch {
    /* 용량 초과 등은 무시 (폴백 캐시는 best-effort) */
  }
}

/** 스냅샷 불러오기 ("다시 불러옴") — Supabase 실패 시 사용 */
function loadSnapshot<T>(key: string): T[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.rows) ? (parsed.rows as T[]) : null;
  } catch {
    return null;
  }
}

// ============================================================
// 어댑터: mock-adapter를 베이스로 모니터 관련 메서드만 Supabase로 override
// (다른 페이지가 쓰는 메서드는 mock으로 위임되어 깨지지 않음)
// ============================================================
export const supabaseApiAdapter = {
  ...mockApiAdapter,

  /**
   * 침대 목록 조회 (Supabase → 실패 시 스냅샷 → Mock)
   * @param roomZone 선택 필터 ('마사지룸1' 등)
   */
  async getBeds(roomZone?: string): Promise<Bed[]> {
    const sb = getSupabase();
    if (!sb) return mockApiAdapter.getBeds(roomZone);

    try {
      let query = sb.from('beds').select('*').order('id', { ascending: true });
      if (roomZone) query = query.eq('room_zone', roomZone);
      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as Bed[];
      saveSnapshot(CACHE_BEDS, rows); // ✅ 우선 저장
      return rows;
    } catch (err) {
      console.warn('⚠️ Supabase beds 조회 실패 → 스냅샷 폴백:', err);
      const snap = loadSnapshot<Bed>(CACHE_BEDS); // ✅ 다시 불러옴
      if (snap) return roomZone ? snap.filter((b) => b.room_zone === roomZone) : snap;
      return mockApiAdapter.getBeds(roomZone);
    }
  },

  /** 단일 침대 조회 */
  async getBed(bedId: number): Promise<Bed | null> {
    const sb = getSupabase();
    if (!sb) return mockApiAdapter.getBed(bedId);
    try {
      const { data, error } = await sb.from('beds').select('*').eq('id', bedId).single();
      if (error) throw error;
      return (data as Bed) ?? null;
    } catch {
      const snap = loadSnapshot<Bed>(CACHE_BEDS);
      return snap?.find((b) => b.id === bedId) ?? null;
    }
  },

  /** 테라피스트 목록 조회 (Supabase employees 테이블 → 스냅샷 → Mock) */
  async getTherapists(): Promise<Therapist[]> {
    const sb = getSupabase();
    if (!sb) return mockApiAdapter.getTherapists();
    try {
      // employees 테이블에서 테라피스트(therapist) 조회
      const { data, error } = await sb
        .from('employees')
        .select('id, name')
        .or('employee_type.eq.therapist,employment_type.eq.therapist')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Supabase employees 조회 실패:', error);
        throw error;
      }

      console.log('✅ Supabase employees(therapist) 로드 성공:', data?.length, 'items');

      // employees 형식을 Therapist 형식으로 변환
      const rows = (data ?? []).map((emp: any) => ({
        id: emp.id,
        name: emp.name,
        status: 'idle' as const,
      })) as Therapist[];

      saveSnapshot(CACHE_THERAPISTS, rows); // ✅ 우선 저장
      return rows;
    } catch (err) {
      console.error('❌ Supabase employees 조회 실패:', err instanceof Error ? err.message : err);
      const snap = loadSnapshot<Therapist>(CACHE_THERAPISTS); // ✅ 다시 불러옴
      return snap ?? mockApiAdapter.getTherapists();
    }
  },

  /**
   * 침대 상태 변경 즉시 저장 (Monitor에서 호출)
   * 변경 → Supabase 즉시 기록 → 갱신된 행 반환 (Sheet 반영은 1시간 배치)
   *
   * @param bedId 침대 id
   * @param patch 변경 필드 (status, therapist_name, customer_name 등)
   */
  async updateBed(bedId: number, patch: Partial<Bed>): Promise<Bed> {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 미설정 — 변경을 저장할 수 없습니다.');

    const payload = { ...patch, updated_at: new Date().toISOString() };
    const { data, error } = await sb
      .from('beds')
      .update(payload)
      .eq('id', bedId)
      .select()
      .single();
    if (error) throw error;

    // 로컬 스냅샷도 즉시 동기화 (낙관적 일관성)
    const snap = loadSnapshot<Bed>(CACHE_BEDS);
    if (snap) {
      const next = snap.map((b) => (b.id === bedId ? { ...b, ...payload } : b));
      saveSnapshot(CACHE_BEDS, next);
    }
    return data as Bed;
  },

  // ==========================================================
  // BOOKING WITH THERAPIST — bookings CRUD (등록/수정/조회)
  // 30개씩 페이지 분할(1st/2nd/3rd…)은 UI(usePagedBookings)에서 처리
  // ==========================================================

  /** 예약 전체 조회 (날짜 필터 선택) — 최신순 */
  async getBookings(bookingDate?: string): Promise<Booking[]> {
    const sb = getSupabase();
    if (!sb) return [];
    try {
      let query = sb
        .from('bookings')
        .select('*')
        .neq('status', 'deleted')
        .order('booking_date', { ascending: false })
        .order('seq_no', { ascending: true });
      if (bookingDate) query = query.eq('booking_date', bookingDate);
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []) as Booking[];
      saveSnapshot(CACHE_BOOKINGS, rows); // ✅ 우선 저장
      return rows;
    } catch (err) {
      console.warn('⚠️ Supabase bookings 조회 실패 → 스냅샷 폴백:', err);
      return loadSnapshot<Booking>(CACHE_BOOKINGS) ?? []; // ✅ 다시 불러옴
    }
  },

  /** 예약 등록 */
  async createBooking(input: Partial<Booking>): Promise<Booking> {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 미설정 — 예약을 저장할 수 없습니다.');
    const { data, error } = await sb.from('bookings').insert(input).select().single();
    if (error) throw error;
    return data as Booking;
  },

  /** 예약 수정 */
  async updateBooking(id: number, patch: Partial<Booking>): Promise<Booking> {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 미설정 — 예약을 수정할 수 없습니다.');
    const { data, error } = await sb.from('bookings').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data as Booking;
  },

  /** 예약 삭제 (soft delete: status='deleted') */
  async deleteBooking(id: number): Promise<void> {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 미설정 — 예약을 삭제할 수 없습니다.');
    const { error } = await sb.from('bookings').update({ status: 'deleted' }).eq('id', id);
    if (error) throw error;
  },
};

export type SupabaseApiAdapter = typeof supabaseApiAdapter;
