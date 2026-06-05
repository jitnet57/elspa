'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApiAdapter, type Booking } from '@/lib/api/supabase-adapter';
import { getSupabase } from '@/lib/supabase/client';
// import { saveBookingToSheet } from '@/lib/services/booking-sheet'; // DISABLED: no need shync with google drive
import { SERVICES, autoEndTime, sortByAttendance, type UiTherapist } from './booking-helpers';
import { getCompanies, getGuides } from '@/lib/api/companies-client';
import { useT } from '@/lib/i18n';
// import { useAutoSaveSettings } from '@/lib/hooks/useAutoSaveSettings'; // DISABLED: no need live
import { PaymentMethodInput, type PaymentMethodData } from '@/components/PaymentMethodInput';
import { SSSOptionSelect, type PayrollImpact } from '@/components/SSSOptionSelect';
import { PaymentFromSelect, type SettlementImpact } from '@/components/PaymentFromSelect';
import PaymentMethodModal from './PaymentMethodModal';
import NewMassagePanel from './NewMassagePanel';
import { exportBookingsToExcel } from '@/lib/utils/excel-export';
import {
  convertLegacyPayToMethods,
  calculateTotalFromMethods,
  getPaymentMethodsSummary,
  getPaymentMethodsCount,
} from './booking-payment-helpers';
// GoogleConnect 제거됨

// ============================================================
// 📌 상수: API_BASE
// 📋 목적: Cloudflare Workers 백엔드
// 📅 작성일: 2026-06-02
// ============================================================
const API_BASE = 'https://elspa-api-production.jitnet57.workers.dev';

/**
 * ============================================================
 * 📌 컴포넌트: BookingSheetTable (BOOKING WITH THERAPIST)
 * 📋 목적: 30행 예약표 — 테라피스트 예약 입력/조회 화면
 * 🔌 데이터: Supabase(bookings) 조회·등록·수정 + 구글시트(Apps Script) 동시 저장
 *           기존 예약은 행에 프리필(수정 가능), 나머지는 빈 행으로 30행 채움
 * 🎨 열: # / 테라피스트 / 마사지 / 시작 / 종료(자동) / 고객 / 룸 / 저장
 * 📅 작성일: 2026-06-01 (DB 연동)
 * ============================================================
 */

// ============================================================
// 📌 상수: DEFAULT_ROW_COUNT
// 📋 목적: BOOKING WITH THERAPIST 기본 행 수
// 🔧 범위: 10~100, LocalStorage에서 덮어쓸 수 있음
// 📅 작성일: 2026-06-02
// ============================================================
const DEFAULT_ROW_COUNT = 60;

interface Row {
  bookingId?: number;   // 있으면 기존 예약(수정), 없으면 신규(등록)
  therapistName: string;
  service: string;      // 트리트먼트
  startTime: string;
  guestName: string;
  roomNumber: string;   // 방번호
  note: string;         // 업체명(노트)
  pay: number;          // 지불 (하위 호환성)
  tip: number;          // 팁
  totalAmount: number;  // 실제 청구액 (PaymentMethodInput의 합계)
  paymentMethods?: PaymentMethodData[];  // 결제 수단 분배 (PaymentMethodInput)
  saved: boolean;
  saving: boolean;
}

const emptyRow = (): Row => ({
  therapistName: '', service: '', startTime: '', guestName: '', roomNumber: '',
  note: '', pay: 0, tip: 0, totalAmount: 0, paymentMethods: [],
  saved: false, saving: false,
});

// ============================================================
// 📌 함수: padToRowCount
// 📋 목적: 지정된 행 수만큼 빈 행으로 패딩
// 🔧 매개변수: rows (Row[]), rowCount (number)
// 📤 반환값: 패딩된 행 배열
// 📅 작성일: 2026-06-02
// ============================================================
const padToRowCount = (rows: Row[], rowCount: number): Row[] => {
  const out = rows.slice(0, rowCount);
  while (out.length < rowCount) out.push(emptyRow());
  return out;
};

export default function BookingSheetTable() {
  const tr = useT();
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [date, setDate] = useState(today);
  const [therapists, setTherapists] = useState<UiTherapist[]>([]);
  const [massageServices, setMassageServices] = useState<Array<{ name: string; price: number; duration: number }>>([]);

  // ============================================================
  // 📌 상태: rowCount (LocalStorage 기반, 기본값: 60)
  // 📋 목적: 사용자 설정에 따라 동적 행 수 조정
  // 🔧 범위: 10~100
  // 📅 작성일: 2026-06-02
  // ============================================================
  const [rowCount, setRowCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bookingRowCount');
      return saved ? Math.max(10, Math.min(100, parseInt(saved, 10))) : DEFAULT_ROW_COUNT;
    }
    return DEFAULT_ROW_COUNT;
  });

  const [rows, setRows] = useState<Row[]>(() => padToRowCount([], rowCount));
  const [loading, setLoading] = useState(false);

  const [beds, setBeds] = useState<{ bed_number: number; room_zone: string; status: string }[]>([]);
  const [referrals, setReferrals] = useState<string[]>([]); // "이름 (업체)" / "이름 (가이드)"

  // ============================================================
  // 📌 상태: PaymentMethodModal 제어
  // 📋 목적: 각 행별 결제 수단 입력 모달 관리
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentRowIndex, setSelectedPaymentRowIndex] = useState<number | null>(null);

  // ============================================================
  // 📌 상태: Edit 모달 제어
  // 📋 목적: NewMassagePanel으로 예약 수정
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  // ============================================================
  // 📌 상태: Google Drive 동기화 제거됨 (사용자 요청)
  // DISABLED: driveLoading, lastAutoSave, useAutoSaveSettings

  useEffect(() => {
    // 테라피스트 로드 + 정렬 (출근순서, 마사지중은 맨뒤)
    supabaseApiAdapter.getTherapists()
      .then((r) => {
        const sorted = (r as UiTherapist[]).sort(sortByAttendance);
        console.log('👥 테라피스트 로드:', sorted.map(t => ({ id: t.id, name: t.name })));
        setTherapists(sorted);
      })
      .catch(() => setTherapists([]));

    // 테라피스트 로드 완료 후 datalist 확인
    setTimeout(() => {
      const options = document.querySelectorAll('#bk-therapist-options option');
      console.log('📋 datalist options:', Array.from(options).map(o => o.value));
    }, 500);

    // 침대 정보 로드
    supabaseApiAdapter.getBeds().then((r) => setBeds((r as any[]).map((b) => ({ bed_number: b.bed_number, room_zone: b.room_zone, status: b.status })))).catch(() => setBeds([]));

    // 마사지 서비스 로드 (Supabase REST API)
    const sb = getSupabase();
    if (sb) {
      sb.from('massage_services')
        .select('name,base_price,base_duration_minutes')
        .order('name')
        .then(({ data, error }) => {
          if (data && !error && data.length > 0) {
            const services = data.map((d: any) => ({
              name: d.name,
              price: Number(d.base_price),
              duration: Number(d.base_duration_minutes),
            }));
            setMassageServices(services);
            console.log('✅ 마사지 서비스 Supabase 로드:', services.length, 'items');
            console.log('   샘플:', services.slice(0, 3));
          } else {
            console.warn('⚠️ 마사지 서비스 로드 실패 (데이터 없음 또는 에러):', error);
            console.warn('   data:', data, 'error:', error);
            setMassageServices([]);
          }
        })
        .catch((err) => {
          console.error('❌ 마사지 서비스 로드 에러:', err);
          setMassageServices([]);
        });
    } else {
      console.warn('⚠️ Supabase 클라이언트 초기화 실패');
    }

    // 업체/가이드 레퍼럴 후보
    Promise.all([getCompanies().catch(() => []), getGuides().catch(() => [])]).then(([cs, gs]) => {
      setReferrals([
        ...cs.map((c: any) => `${c.name} (업체)`),
        ...gs.map((g: any) => `${g.name} (가이드)`),
      ]);
    });
  }, []);

  // ============================================================
  // 📌 함수: loadRows
  // 📋 목적: 날짜의 기존 예약을 행에 프리필 + rowCount만큼 패딩
  // 🔧 매개변수: date (상태), rowCount (상태)
  // 📤 반환값: 없음 (rows 상태 업데이트)
  // 📅 작성일: 2026-06-02
  // ============================================================
  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const existing = await supabaseApiAdapter.getBookings(date);
      const filled: Row[] = existing.map((b: Booking) => {
        // 마이그레이션: paymentMethods 없으면 pay에서 변환
        let paymentMethods = (b as any).payment_methods || [];
        if (!paymentMethods.length && b.pay) {
          paymentMethods = convertLegacyPayToMethods(Number(b.pay) || 0);
        }
        const totalAmount = calculateTotalFromMethods(paymentMethods) || Number(b.pay) || 0;

        return {
          bookingId: b.id,
          therapistName: b.therapist_name ?? '',
          service: b.treatment ?? '',
          startTime: b.start_time ?? '',
          guestName: b.guest_name ?? '',
          roomNumber: b.room_num ?? '',
          note: b.note ?? '',
          pay: Number(b.pay) || 0,
          tip: Number(b.tip) || 0,
          totalAmount,
          paymentMethods,
          sssOption: ((b as any).sss_option as 'prepaid' | 'hold') || 'prepaid',
          paymentFrom: ((b as any).payment_from as 'guest' | 'credit' | 'waived') || 'guest',
          saved: true,
          saving: false,
        };
      });
      console.log('📊 Bookings 로드됨:', filled.map(r => ({
        bookingId: r.bookingId,
        therapist: r.therapistName,
        guest: r.guestName,
        treatment: r.service,
        startTime: r.startTime,
        saved: r.saved,
      })));
      setRows(padToRowCount(filled, rowCount));
    } catch (err) {
      console.error('❌ Bookings 로드 실패:', err);
      setRows(padToRowCount([], rowCount));
    } finally {
      setLoading(false);
    }
  }, [date, rowCount]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  // ============================================================
  // 📌 함수: updateRowCount
  // 📋 목적: 표시 행 수 변경 + LocalStorage 저장
  // 🔧 매개변수: newCount (number, 10~100 범위)
  // 📤 반환값: 없음
  // 📅 작성일: 2026-06-02
  // ============================================================
  const updateRowCount = (newCount: number) => {
    const clamped = Math.max(10, Math.min(100, newCount));
    setRowCount(clamped);
    localStorage.setItem('bookingRowCount', clamped.toString());
    setRows((prev) => padToRowCount(prev, clamped));
  };

  // ============================================================
  // 📌 함수: getServiceInfo
  // 📋 목적: 마사지 이름으로 서비스 정보 조회 (가격, 시간옵션)
  // 🔧 매개변수: serviceName (string)
  // 📤 반환값: { duration: number; price: number }
  // 📅 작성일: 2026-06-03
  // ============================================================
  const getServiceInfo = (serviceName: string) => {
    // Supabase에서 로드한 마사지 서비스 사용
    const service = massageServices.find((s) => s.name === serviceName);
    return service || { name: '', duration: 60, price: 0 };
  };

  const update = (i: number, patch: Partial<Row>) => {
    // 마사지 선택 시 자동으로 시간과 금액 설정
    if (patch.service && !patch.totalAmount) {
      const serviceInfo = getServiceInfo(patch.service);
      patch.totalAmount = serviceInfo.price || 0;
    }
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch, saved: false } : r)));
  };

  const endTimeOf = (r: Row) => autoEndTime(r.startTime, r.service);
  const isFilled = (r: Row) => r.therapistName && r.service && r.startTime && r.guestName.trim();

  const saveRow = async (i: number) => {
    const r = rows[i];
    if (!isFilled(r)) return;
    setRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, saving: true } : row)));

    const payload: Partial<Booking> = {
      booking_date: date,
      treatment: r.service,
      start_time: r.startTime,
      end_time: endTimeOf(r),
      guest_name: r.guestName,
      therapist_name: r.therapistName,
      room_num: r.roomNumber,
      note: r.note,
      pay: r.totalAmount || r.pay,  // totalAmount 우선, 없으면 pay 사용
      tip: r.tip,
      status: 'normal',
      ...(r.paymentMethods && r.paymentMethods.length > 0 && { payment_methods: r.paymentMethods }),
      ...(r.sssOption && { sss_option: r.sssOption }),
      ...(r.paymentFrom && { payment_from: r.paymentFrom }),
    } as any;

    // 1) Supabase DB 저장 (신규=create / 기존=update)
    let dbOk = false;
    let newId = r.bookingId;
    try {
      if (r.bookingId) {
        await supabaseApiAdapter.updateBooking(r.bookingId, payload);
      } else {
        const created = await supabaseApiAdapter.createBooking({ ...payload, seq_no: i + 1 });
        newId = created.id;
      }
      dbOk = true;
    } catch (err) {
      console.warn('Supabase 저장 실패:', err);
    }

    // 2) Excel 저장 (모든 저장된 행을 포함해서 다시 내보내기)
    if (dbOk) {
      try {
        const filledBookings = rows
          .map((row, idx) => ({
            ...row,
            bookingId: row.bookingId || (idx === i ? newId : undefined),
          } as any))
          .filter((row) => isFilled(row))
          .map((row, idx) => ({
            id: row.bookingId,
            seq_no: idx + 1,
            booking_date: date,
            therapist_name: row.therapistName,
            treatment: row.service,
            start_time: row.startTime,
            end_time: endTimeOf(row),
            room_num: row.roomNumber,
            guest_name: row.guestName,
            note: row.note,
            pay: row.totalAmount || row.pay,
            tip: row.tip,
            payment_methods: row.paymentMethods,
          }));

        await exportBookingsToExcel(filledBookings, date);
      } catch (err) {
        console.warn('Excel 저장 실패:', err);
      }
    }

    setRows((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, saving: false, saved: dbOk, bookingId: newId } : row)),
    );
  };


  // ============================================================
  // 📌 함수: handleDriveExport — DISABLED (사용자 요청: "no need shync with google drive")
  // 📋 목적: 현재 예약 데이터를 Google Drive 스프레드시트로 저장
  // ============================================================
  // const handleDriveExport = useCallback(async (silent = false) => {
  //   const filled = rows.filter((r, i) => isFilled(rows[i]));
  //   if (filled.length === 0) return;
  //   if (!silent) setDriveLoading(true);
  //   try {
  //     const bookingData = filled.map((r, idx) => ({
  //       id: idx + 1,
  //       booking_date: date,
  //       therapist_name: r.therapistName,
  //       treatment: r.service,
  //       start_time: r.startTime,
  //       end_time: endTimeOf(r),
  //       room_number: r.roomNumber,
  //       guest_name: r.guestName,
  //       note: r.note,
  //       pay: r.totalAmount || r.pay,
  //       tip: r.tip,
  //       status: 'completed',
  //       created_at: new Date().toISOString(),
  //     }));
  //
  //     const [localRes, driveRes] = await Promise.all([
  //       fetch('http://localhost:5001/api/save-bookings', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ bookings: bookingData }),
  //       }),
  //       fetch(`${API_BASE}/api/drive/save-booking`, {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify(bookingData),
  //       }),
  //     ]);
  //
  //     const localJson = await localRes.json();
  //     const driveJson = await driveRes.json();
  //
  //     const stamp = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  //     setLastAutoSave(stamp);
  //
  //     const localSuccess = localRes.ok && localJson.success;
  //     const driveSuccess = driveRes.ok && driveJson.status === 'success';
  //
  //     if (localSuccess && driveSuccess) {
  //       if (!silent) alert(`✅ 저장 완료!\n📁 로컬: ~/elspa/data/\n☁️ Google Drive: elspa/예약\n${stamp}`);
  //     } else if (localSuccess || driveSuccess) {
  //       const msg = localSuccess ? '📁 로컬 ✓' : '❌ 로컬 실패';
  //       const gMsg = driveSuccess ? '☁️ Google Drive ✓' : '❌ Google Drive 실패';
  //       if (!silent) alert(`⚠️ 부분 저장\n${msg}\n${gMsg}`);
  //     } else {
  //       if (!silent) alert(`❌ 저장 실패\n로컬: ${localJson.error}\nGoogle Drive: ${driveJson.error}`);
  //     }
  //   } catch (err) {
  //     if (!silent) alert(`❌ 저장 오류: ${err instanceof Error ? err.message : '서버 연결 확인'}`);
  //   } finally {
  //     if (!silent) setDriveLoading(false);
  //   }
  // }, [rows, date]);

  // ── 설정된 간격마다 자동 Drive 저장 — DISABLED (사용자 요청: "no need live") ───────────
  // useEffect(() => {
  //   if (!autoSaveEnabled) return;
  //   const timer = setInterval(() => { handleDriveExport(true); }, autoSaveIntervalMs);
  //   return () => clearInterval(timer);
  // }, [handleDriveExport, autoSaveEnabled, autoSaveIntervalMs]);

  const filledCount = rows.filter(isFilled).length;
  // 저장되지 않은 행 = 입력되었지만 saved=false인 행
  const unsavedCount = rows.filter((r) => isFilled(r) && !r.saved).length;

  // 빈 룸 = available 베드 라벨 − 현재 표에서 이미 쓰인 룸
  const usedRooms = new Set(rows.filter(isFilled).map((r) => r.roomNumber).filter(Boolean));
  const availableRooms = beds
    .filter((b) => b.status === 'available')
    .map((b) => `${b.room_zone} ${b.bed_number}`)
    .filter((lbl) => !usedRooms.has(lbl));

  // ============================================================
  // 📌 함수: handlePaymentMethodConfirm
  // 📋 목적: 모달에서 결제 수단 확인 시 행 데이터 업데이트
  // 🔧 매개변수: methods (PaymentMethodData[])
  // 📤 반환값: 없음 (rows 상태 업데이트)
  // ============================================================
  const handlePaymentMethodConfirm = (methods: PaymentMethodData[]) => {
    if (selectedPaymentRowIndex !== null) {
      const totalAmount = calculateTotalFromMethods(methods);
      update(selectedPaymentRowIndex, {
        paymentMethods: methods,
        totalAmount,
      });
    }
  };

  return (
    <>
      {/* PaymentMethodModal */}
      {selectedPaymentRowIndex !== null && (
        <PaymentMethodModal
          isOpen={isPaymentModalOpen}
          rowIndex={selectedPaymentRowIndex}
          initialMethods={rows[selectedPaymentRowIndex]?.paymentMethods || []}
          totalAmount={rows[selectedPaymentRowIndex]?.totalAmount || 0}
          onClose={() => setIsPaymentModalOpen(false)}
          onConfirm={handlePaymentMethodConfirm}
          locale="ko"
        />
      )}

      {/* Edit Modal - NewMassagePanel */}
      {editingRowIndex !== null && isEditModalOpen && (() => {
        const editRow = rows[editingRowIndex];
        console.log('📝 Edit 모달 열림:', {
          index: editingRowIndex,
          therapistName: editRow?.therapistName,
          treatment: editRow?.treatment,
          startTime: editRow?.startTime,
          guestName: editRow?.guestName,
          payAmount: editRow?.payAmount,
          tip: editRow?.tip,
          roomNumber: editRow?.roomNumber,
          payMethod: editRow?.payMethod,
          note: editRow?.note,
        });
        return (
          <NewMassagePanel
            date={date}
            prefillTherapist={editRow?.therapistName}
            prefillRoom={editRow?.roomNumber}
            prefillTreatment={editRow?.treatment}
            prefillStartTime={editRow?.startTime}
            prefillEndTime={editRow?.endTime}
            prefillGuestName={editRow?.guestName}
            prefillPayAmount={editRow?.payAmount}
            prefillTip={editRow?.tip}
            prefillPayMethod={editRow?.payMethod}
            prefillNote={editRow?.note}
            title={`✏️ Edit Booking · ${editRow?.guestName}`}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingRowIndex(null);
            }}
            onSaved={() => {
              setIsEditModalOpen(false);
              setEditingRowIndex(null);
              // 데이터 새로고침
              fetchBookings();
            }}
          />
        );
      })()}

      <div className="flex-1 overflow-auto bg-slate-900 text-white">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h2 className="text-lg md:text-xl font-black">📊 BOOKING WITH THERAPIST</h2>
          <span className="text-[10px] md:text-xs text-indigo-300">{tr(`Therapist booking`, `테라피스트 예약`)}</span>
          {(() => {
            const filled = rows.filter(isFilled).length;
            const sheetNo = Math.floor(filled / rowCount) + 1;
            const ord = (n: number) => { const s = ['th','st','nd','rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
            return <span className="text-[10px] md:text-xs px-2 py-1 rounded-md bg-pink-600/30 text-pink-200">{tr('Sheet', '시트')}: {ord(sheetNo)}</span>;
          })()}
          <div className="ml-2 flex items-center gap-2">
            📅
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800 border border-indigo-500/40 text-white text-xs md:text-sm" />
            {loading && <span className="text-[10px] md:text-xs text-slate-400">{tr('Loading…', '불러오는 중…')}</span>}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[10px] md:text-xs text-slate-300">{tr(`Entered: ${filledCount}`, `입력됨: ${filledCount}건`)}</span>
            {/* ✅ Supabase 자동 저장 (Google Drive/Sheet 동기화 DISABLED) */}
            {/* {lastAutoSave && (
              <span className="text-[10px] md:text-xs text-emerald-400 font-semibold">✅ 저장됨 {lastAutoSave}</span>
            )} */}
            {/* Drive 저장 버튼 — DISABLED (사용자 요청: "no need shync with google drive") */}
            {/* <button
              onClick={() => handleDriveExport(false)}
              disabled={driveLoading || filledCount === 0}
              className={`px-3 py-1.5 rounded text-[10px] md:text-xs font-semibold transition ${
                driveLoading
                  ? 'bg-slate-700 text-slate-400 cursor-wait'
                  : filledCount === 0
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {driveLoading ? '💾 저장 중...' : '💾 Drive 저장'}
            </button> */}
          </div>
        </div>

        {/* 행 수 조정 UI */}
        <div className="flex items-center gap-3 text-[10px] md:text-xs text-slate-300 bg-slate-800/50 p-2 rounded-lg">
          <label className="text-slate-400 font-medium">
            {tr('Rows', '행 수')}:
          </label>
          <input
            type="range"
            min="10"
            max="100"
            step="10"
            value={rowCount}
            onChange={(e) => updateRowCount(parseInt(e.target.value, 10))}
            className="w-24 cursor-pointer"
          />
          <span className="min-w-[2rem] font-semibold text-indigo-300">{rowCount}</span>
          <input
            type="number"
            min="10"
            max="100"
            value={rowCount}
            onChange={(e) => updateRowCount(parseInt(e.target.value, 10))}
            className="w-12 px-2 py-1 rounded bg-slate-700 border border-indigo-500/30 text-white text-[10px] md:text-xs"
          />
          <button
            onClick={() => updateRowCount(DEFAULT_ROW_COUNT)}
            className="ml-2 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] md:text-xs transition"
          >
            {tr('Reset', '초기화')} (60)
          </button>
        </div>
      </div>

      {/* 테라피스트 검색 자동완성 옵션 (공유) */}
      {/* 빈 룸 검색 자동완성 (available 베드 − 현재 표에서 사용중인 룸) */}
      <datalist id="bk-room-options">
        {availableRooms.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
      {/* 업체/가이드 레퍼럴 검색 (선택 시 레퍼럴, 자유입력 시 노트) */}
      <datalist id="bk-referral-options">
        {referrals.map((r) => (<option key={r} value={r} />))}
      </datalist>
      <p className="px-6 pb-2 text-[10px] md:text-xs text-emerald-300">{tr(`🟢 ${availableRooms.length} rooms free · Company/Note: search company·guide (referral) or free text (note)`, `🟢 빈 룸 ${availableRooms.length}개 · 업체/노트 칸: 업체·가이드 검색(레퍼럴) 또는 자유 입력(노트)`)}</p>

      {/* 30행 예약표 */}
      <div className="px-4 py-4 overflow-x-auto">
        <table className="w-full min-w-[1100px] text-xs md:text-sm border-collapse">
          <thead>
            <tr className="text-left text-indigo-200 border-b border-white/10">
              <th className="px-2 py-2 w-10">#</th>
              <th className="px-2 py-2">{tr('Therapist', '테라피스트')}</th>
              <th className="px-2 py-2">{tr('Treatment', '트리트먼트')}</th>
              <th className="px-2 py-2 w-28">{tr('Start', '시작')}</th>
              <th className="px-2 py-2 w-20">{tr('End', '종료')}</th>
              <th className="px-2 py-2 w-24">{tr('Room', '방번호')}</th>
              <th className="px-2 py-2">{tr('Guest', '고객이름')}</th>
              <th className="px-2 py-2">{tr('Company (Note)', '업체명(노트)')}</th>
              <th className="px-2 py-2 w-32">{tr('Pay (Breakdown)', 'Pay 구분')}</th>
              <th className="px-2 py-2 w-24">{tr('Total', '청구액')}</th>
              <th className="px-2 py-2 w-20">{tr('Tip', '팁')}</th>
              <th className="px-2 py-2 w-16">{tr('Save', '저장')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const inp = 'w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-white placeholder-slate-500 text-[11px] md:text-xs';
              // ============================================================
              // 📌 Mock SSS Payroll Impact (실제로는 백엔드에서 조회)
              // 📋 목적: SSSOptionSelect 컴포넌트 데모용
              // ============================================================
              const mockPayrollImpact: PayrollImpact = {
                grossSalary: 25000,
                sssContribution: 1125,
                prepaidAmount: 1125,
                holdAmount: r.pay || 0,
                taxImplications: tr('Tax implications calculated based on SSS option', 'SSS 옵션에 따른 세금 영향도 계산됨'),
                settlementDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
              };

              return (
              <tr key={i} className={`border-b border-white/5 ${r.saved ? 'bg-emerald-900/30' : ''}`}>
                <td className="px-2 py-1 text-slate-400">{i + 1}</td>
                <td className="px-2 py-1">
                  <select value={r.therapistName} onChange={(e) => update(i, { therapistName: e.target.value })} className={inp}>
                    <option value="">{tr('Select…','선택…')}</option>
                    {therapists.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <select value={r.service} onChange={(e) => update(i, { service: e.target.value })} className={inp}>
                    <option value="">{tr('Select…','선택…')}</option>
                    {(massageServices.length > 0 ? massageServices : SERVICES).map((s) => (<option key={s.name} value={s.name}>{s.name} ({s.duration}분)</option>))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input type="time" value={r.startTime} onChange={(e) => update(i, { startTime: e.target.value })} className={inp} />
                </td>
                <td className="px-2 py-1 font-bold text-cyan-300">{endTimeOf(r) || '—'}</td>
                <td className="px-2 py-1">
                  <input list="bk-room-options" value={r.roomNumber} onChange={(e) => update(i, { roomNumber: e.target.value })} placeholder={tr('free room','빈룸')} className={inp} />
                </td>
                <td className="px-2 py-1">
                  <input value={r.guestName} onChange={(e) => update(i, { guestName: e.target.value })} placeholder={tr('guest','고객명')} className={inp} />
                </td>
                <td className="px-2 py-1">
                  <input list="bk-referral-options" value={r.note} onChange={(e) => update(i, { note: e.target.value })} placeholder={tr('company/guide or note','업체·가이드 검색 / 노트')} className={inp} />
                </td>
                {/* ===== Payment Method Column (with Modal) ===== */}
                <td className="px-2 py-1 min-w-max">
                  <button
                    onClick={() => {
                      setSelectedPaymentRowIndex(i);
                      setIsPaymentModalOpen(true);
                    }}
                    className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] md:text-xs rounded font-semibold transition"
                  >
                    💳 {getPaymentMethodsCount(r.paymentMethods || [])}
                  </button>
                </td>
                <td className="px-2 py-1">
                  <input type="number" value={r.totalAmount || ''} onChange={(e) => update(i, { totalAmount: Number(e.target.value) || 0 })} placeholder="0" className={inp + ' text-right'} />
                </td>
                <td className="px-2 py-1">
                  <input type="number" value={r.tip || ''} onChange={(e) => update(i, { tip: Number(e.target.value) || 0 })} placeholder="0" className={inp + ' text-right'} />
                </td>
                <td className="px-2 py-1 flex gap-1">
                  <button onClick={() => saveRow(i)} disabled={!isFilled(r) || r.saving} className={`flex-1 px-2 py-1.5 rounded font-bold text-[11px] md:text-xs ${r.saved ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-30'}`}>
                    {r.saving ? '…' : r.saved ? '✓' : tr('Save', '저장')}
                  </button>
                  {r.bookingId && (
                    <button
                      onClick={() => {
                        // NewMassagePanel 모달 열기
                        setEditingRowIndex(i);
                        setIsEditModalOpen(true);
                      }}
                      className="px-2 py-1.5 rounded font-bold text-[11px] md:text-xs bg-orange-600 hover:bg-orange-700 text-white"
                      title={tr('Edit', '수정')}
                    >
                      ✏️
                    </button>
                  )}
                </td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
