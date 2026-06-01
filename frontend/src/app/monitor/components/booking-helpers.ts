/**
 * ============================================================
 * 📌 모듈: booking-helpers
 * 📋 목적: 테라피스트 스케줄/예약 화면 공용 유틸 (서비스 카탈로그, 시간변환, 표시 메타)
 * 🔌 데이터: 서비스 카탈로그(이름/소요시간)는 고정 카탈로그 사용,
 *           예약/테라피스트는 getApiClient()(Supabase/Mock)에서 조회
 * 📅 작성일: 2026-06-01
 * ============================================================
 */

import { massageServices } from '@/app/admin/massage/mockData/bookingData';

// 서비스 카탈로그 (이름 + 소요시간) — bookings.treatment 는 이 이름 문자열로 저장
export const SERVICES = massageServices.map((s) => ({ name: s.name, duration: s.duration }));

// 이름 → 소요시간(분)
export const durationByName = (name: string): number =>
  SERVICES.find((s) => s.name === name)?.duration ?? 60;

// 시간 문자열 ⇄ 소수 변환
export const toDecimal = (hhmm: string): number => {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h + (m || 0) / 60;
};
export const toHHMM = (dec: number): string => {
  const h = Math.floor(dec);
  const m = Math.round((dec - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// 자동 종료시간 = 시작 + 소요시간
export const autoEndTime = (start: string, serviceName: string): string =>
  start && serviceName ? toHHMM(toDecimal(start) + durationByName(serviceName) / 60) : '';

// 시술명 → 표시(아이콘/색)
const SVC_VISUAL: Record<string, { icon: string; bar: string }> = {
  'Thai Massage': { icon: '🙏', bar: 'border-l-emerald-500 bg-emerald-50' },
  'Swedish Massage': { icon: '💆', bar: 'border-l-blue-500 bg-blue-50' },
  'Deep Tissue': { icon: '💪', bar: 'border-l-red-500 bg-red-50' },
  'Foot Massage': { icon: '🦶', bar: 'border-l-amber-500 bg-amber-50' },
  'Facial Treatment': { icon: '✨', bar: 'border-l-pink-500 bg-pink-50' },
  'Aromatherapy': { icon: '🌸', bar: 'border-l-cyan-500 bg-cyan-50' },
  'Hot Stone Massage': { icon: '🪨', bar: 'border-l-orange-500 bg-orange-50' },
};
export const treatmentMeta = (treatment?: string) =>
  (treatment && SVC_VISUAL[treatment]) || { icon: '💆', bar: 'border-l-slate-400 bg-slate-50' };

// DB 테라피스트 상태 → 표시 라벨
export type DbTherapistStatus = 'idle' | 'in_service' | 'resting' | 'checked_out';
export const therapistStatusMeta: Record<DbTherapistStatus, { label: string; dot: string; text: string }> = {
  idle: { label: 'Available', dot: 'bg-green-500', text: 'text-green-600' },
  in_service: { label: 'In Session', dot: 'bg-blue-500', text: 'text-blue-600' },
  resting: { label: 'Break', dot: 'bg-amber-500', text: 'text-amber-600' },
  checked_out: { label: 'Off Duty', dot: 'bg-gray-400', text: 'text-gray-500' },
};

// 이름 → 이니셜 아바타
export const initials = (name: string): string =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

// 공용 UI 테라피스트 타입
export interface UiTherapist {
  id: number;
  name: string;
  status: DbTherapistStatus;
  specialty?: string;
  checked_in_at?: string; // "HH:MM" 출근시각 (출근 순번 정렬용)
}

// 가용 우선순위: 대기(idle) → 휴식 → 진행중(in_service) → 퇴근. 같으면 출근순(checked_in_at) → id
const STATUS_RANK: Record<string, number> = { idle: 0, resting: 1, in_service: 2, checked_out: 3 };
export function sortByAttendance(a: UiTherapist, b: UiTherapist): number {
  const r = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
  if (r !== 0) return r;
  const ca = a.checked_in_at || '99:99';
  const cb = b.checked_in_at || '99:99';
  if (ca !== cb) return ca.localeCompare(cb);
  return a.id - b.id;
}
