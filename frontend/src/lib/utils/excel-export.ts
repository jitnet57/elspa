/**
 * ============================================================
 * 📌 유틸리티: Excel Export
 * 📋 목적: 예약 데이터를 XLSX 파일로 내보내기
 * 🔧 라이브러리: SheetJS (xlsx)
 * 📅 작성일: 2026-06-05
 * ============================================================
 */

import type { Booking } from '@/lib/api/supabase-adapter';

interface BookingRow {
  일자: string;
  순번: number;
  테라피스트: string;
  마사지종류: string;
  시작시간: string;
  종료시간: string;
  고객명: string;
  방번호: string;
  총액: number;
  팁: number;
  Bank1: number;
  Bank2: number;
  GCash: number;
  Other: number;
  업체: string;
}

/**
 * 예약 데이터를 Excel 파일로 내보내기
 */
export async function exportBookingsToExcel(
  bookings: (Booking & { seq_no?: number })[],
  date: string
): Promise<boolean> {
  try {
    // SheetJS 동적 로드
    const XLSX = await import('xlsx');

    // 데이터 변환 (결제수단별 컬럼 분리: Bank1, Bank2, GCash)
    const excelData: BookingRow[] = bookings
      .filter((b) => b.booking_date === date && b.therapist_name)
      .map((b, idx) => {
        const methods = b.payment_methods || [];
        const paymentByMethod: Record<string, number> = {
          Bank1: 0,
          Bank2: 0,
          GCash: 0,
          Other: 0,
        };

        // 결제수단별로 금액 분류
        methods.forEach((m: any) => {
          const method = (m.method || 'Other').trim();
          const amount = Number(m.amount) || 0;

          if (method.toLowerCase() === 'bank1') paymentByMethod['Bank1'] += amount;
          else if (method.toLowerCase() === 'bank2') paymentByMethod['Bank2'] += amount;
          else if (method.toLowerCase() === 'gcash') paymentByMethod['GCash'] += amount;
          else paymentByMethod['Other'] += amount;
        });

        return {
          일자: date,
          순번: b.seq_no || idx + 1,
          테라피스트: b.therapist_name || '',
          마사지종류: b.treatment || '',
          시작시간: b.start_time || '',
          종료시간: b.end_time || '',
          고객명: b.guest_name || '',
          방번호: b.room_num || '',
          총액: b.pay || 0,
          팁: b.tip || 0,
          Bank1: paymentByMethod['Bank1'],
          Bank2: paymentByMethod['Bank2'],
          GCash: paymentByMethod['GCash'],
          Other: paymentByMethod['Other'],
          업체: b.note || '',
        };
      });

    if (excelData.length === 0) {
      console.warn('⚠️ 내보낼 예약 데이터가 없습니다');
      return false;
    }

    // 워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData, {
      header: ['일자', '순번', '테라피스트', '마사지종류', '시작시간', '종료시간', '고객명', '방번호', '총액', '팁', 'Bank1', 'Bank2', 'GCash', 'Other', '업체'],
    });

    // 열 너비 설정
    worksheet['!cols'] = [
      { wch: 12 },  // 일자
      { wch: 6 },   // 순번
      { wch: 15 },  // 테라피스트
      { wch: 15 },  // 마사지종류
      { wch: 10 },  // 시작시간
      { wch: 10 },  // 종료시간
      { wch: 15 },  // 고객명
      { wch: 10 },  // 방번호
      { wch: 10 },  // 총액
      { wch: 8 },   // 팁
      { wch: 10 },  // Bank1
      { wch: 10 },  // Bank2
      { wch: 10 },  // GCash
      { wch: 10 },  // Other
      { wch: 20 },  // 업체
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '예약현황');

    // 파일명: YYYY-MM-DD_bookings.xlsx
    const fileName = `${date}_예약현황.xlsx`;

    // 다운로드
    XLSX.writeFile(workbook, fileName);

    console.log(`✅ Excel 저장 완료: ${fileName}`);
    return true;
  } catch (error) {
    console.error('❌ Excel 저장 실패:', error);
    return false;
  }
}

/**
 * 결제 수단 배열을 문자열로 변환
 */
function getPaymentMethodsSummary(methods: any[] | undefined): string {
  if (!methods || methods.length === 0) return '미지정';
  return methods.map((m) => `${m.method}(${m.amount})`).join(', ');
}
