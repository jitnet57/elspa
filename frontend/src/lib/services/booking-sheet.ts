/**
 * ============================================================
 * 📌 서비스: booking-sheet
 * 📋 목적: 마사지 예약을 Google Apps Script Web App 으로 전송하여 구글시트에 저장
 * 🔌 방식: 정적 export 환경 → 백엔드 없이 Apps Script /exec 로 직접 POST
 * 📅 작성일: 2026-06-01
 * ============================================================
 *
 * Apps Script(doPost)는 FormData 필드를 받아 시트 행으로 append 합니다.
 * URL 은 book-massage 페이지에서 검증된 기존 웹앱을 재사용합니다.
 * (교체 시 NEXT_PUBLIC_BOOKING_WEBHOOK_URL 환경변수로 덮어쓸 수 있음)
 */

const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_BOOKING_WEBHOOK_URL ||
  'https://script.google.com/macros/s/AKfycbxjNk5uAbusS5CEeGMuUiRhcI1tDiTYtZtlI5T-5rciWk_aQGTNQFkVuHwRIKjpMqQf/exec';

export interface BookingSheetPayload {
  therapist: string;   // 테라피스트 이름
  service: string;     // 마사지 종류
  date: string;        // YYYY-MM-DD
  time: string;        // 시작 HH:MM
  endTime: string;     // 종료 HH:MM (자동 계산)
  guestName: string;
  roomNumber: string;
  notes?: string;
}

/**
 * 📌 saveBookingToSheet: 예약 1건을 구글시트에 저장
 * @returns 성공 여부 (실패해도 throw 하지 않고 false 반환 → UI 폴백 처리)
 */
export async function saveBookingToSheet(payload: BookingSheetPayload): Promise<boolean> {
  try {
    const fd = new FormData();
    fd.append('therapist', payload.therapist);
    fd.append('service', payload.service);
    fd.append('date', payload.date);
    fd.append('time', payload.time);
    fd.append('endTime', payload.endTime);
    fd.append('guestName', payload.guestName);
    fd.append('roomNumber', payload.roomNumber);
    fd.append('notes', payload.notes ?? '');

    const res = await fetch(WEBHOOK_URL, { method: 'POST', body: fd });
    const result = await res.json().catch(() => ({ status: res.ok ? 'success' : 'error' }));
    return result.status === 'success';
  } catch (err) {
    console.error('구글시트 저장 실패:', err);
    return false;
  }
}
