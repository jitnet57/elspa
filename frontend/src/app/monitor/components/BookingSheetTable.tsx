'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseApiAdapter, type Booking } from '@/lib/api/supabase-adapter';
import { saveBookingToSheet } from '@/lib/services/booking-sheet';
import { SERVICES, autoEndTime, type UiTherapist } from './booking-helpers';

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

const ROW_COUNT = 30;

interface Row {
  bookingId?: number;   // 있으면 기존 예약(수정), 없으면 신규(등록)
  therapistName: string;
  service: string;
  startTime: string;
  guestName: string;
  roomNumber: string;
  saved: boolean;
  saving: boolean;
}

const emptyRow = (): Row => ({
  therapistName: '',
  service: '',
  startTime: '',
  guestName: '',
  roomNumber: '',
  saved: false,
  saving: false,
});

const padTo30 = (rows: Row[]): Row[] => {
  const out = rows.slice(0, ROW_COUNT);
  while (out.length < ROW_COUNT) out.push(emptyRow());
  return out;
};

export default function BookingSheetTable() {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [date, setDate] = useState(today);
  const [therapists, setTherapists] = useState<UiTherapist[]>([]);
  const [rows, setRows] = useState<Row[]>(() => padTo30([]));
  const [bulkMsg, setBulkMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [beds, setBeds] = useState<{ bed_number: number; room_zone: string; status: string }[]>([]);

  useEffect(() => {
    supabaseApiAdapter.getTherapists().then((r) => setTherapists(r as UiTherapist[])).catch(() => setTherapists([]));
    supabaseApiAdapter.getBeds().then((r) => setBeds((r as any[]).map((b) => ({ bed_number: b.bed_number, room_zone: b.room_zone, status: b.status })))).catch(() => setBeds([]));
  }, []);

  // 날짜의 기존 예약을 행에 프리필 + 30행 패딩
  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const existing = await supabaseApiAdapter.getBookings(date);
      const filled: Row[] = existing.map((b: Booking) => ({
        bookingId: b.id,
        therapistName: b.therapist_name ?? '',
        service: b.treatment ?? '',
        startTime: b.start_time ?? '',
        guestName: b.guest_name ?? '',
        roomNumber: b.room_num ?? '',
        saved: true,
        saving: false,
      }));
      setRows(padTo30(filled));
    } catch {
      setRows(padTo30([]));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch, saved: false } : r)));

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
      status: 'normal',
    };

    // 1) DB 저장 (신규=create / 기존=update)
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
      console.warn('DB 저장 실패(Supabase 미설정?):', err);
    }

    // 2) 구글시트 저장
    const sheetOk = await saveBookingToSheet({
      therapist: r.therapistName,
      service: r.service,
      date,
      time: r.startTime,
      endTime: endTimeOf(r),
      guestName: r.guestName,
      roomNumber: r.roomNumber,
      notes: '',
    });

    setRows((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, saving: false, saved: dbOk || sheetOk, bookingId: newId } : row)),
    );
  };

  const saveAll = async () => {
    const targets = rows.map((r, i) => ({ r, i })).filter(({ r }) => isFilled(r) && !r.saved);
    if (targets.length === 0) {
      setBulkMsg('저장할 행이 없습니다. (테라피스트·마사지·시작·고객 입력 필요)');
      return;
    }
    setBulkMsg(`${targets.length}건 저장 중…`);
    for (const { i } of targets) await saveRow(i);
    setBulkMsg(`✅ ${targets.length}건 저장 완료 (DB + 구글시트)`);
  };

  const filledCount = rows.filter(isFilled).length;
  // 빈 룸 = available 베드 라벨 − 현재 표에서 이미 쓰인 룸
  const usedRooms = new Set(rows.filter(isFilled).map((r) => r.roomNumber).filter(Boolean));
  const availableRooms = beds
    .filter((b) => b.status === 'available')
    .map((b) => `${b.room_zone} ${b.bed_number}`)
    .filter((lbl) => !usedRooms.has(lbl));

  return (
    <div className="flex-1 overflow-auto bg-slate-900 text-white">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-black">📊 BOOKING WITH THERAPIST</h2>
        <span className="text-xs text-indigo-300">테라피스트 예약 ({ROW_COUNT}행)</span>
        {(() => {
          const filled = rows.filter(isFilled).length;
          const sheetNo = Math.floor(filled / ROW_COUNT) + 1; // 30개 초과 시 자동으로 다음 시트
          const ord = (n: number) => { const s = ['th','st','nd','rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
          return <span className="text-xs px-2 py-1 rounded-md bg-pink-600/30 text-pink-200" title="30개 초과 시 다음 시트로 자동 반영">📄 시트: {ord(sheetNo)}</span>;
        })()}
        <div className="ml-2 flex items-center gap-2">
          📅
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800 border border-indigo-500/40 text-white text-sm" />
          {loading && <span className="text-xs text-slate-400">불러오는 중…</span>}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-300">입력됨: {filledCount}건</span>
          <button onClick={saveAll} className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 font-bold text-sm">전체 저장 (DB + 구글시트)</button>
        </div>
      </div>
      {bulkMsg && <p className="px-6 py-2 text-sm text-indigo-200">{bulkMsg}</p>}

      {/* 테라피스트 검색 자동완성 옵션 (공유) */}
      <datalist id="bk-therapist-options">
        {therapists.map((t) => (
          <option key={t.id} value={t.name} />
        ))}
      </datalist>
      {/* 빈 룸 검색 자동완성 (available 베드 − 현재 표에서 사용중인 룸) */}
      <datalist id="bk-room-options">
        {availableRooms.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
      <p className="px-6 pb-2 text-xs text-emerald-300">🟢 빈 룸 {availableRooms.length}개 — 룸 칸에서 검색/선택 가능</p>

      {/* 30행 예약표 */}
      <div className="px-4 py-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm border-collapse">
          <thead>
            <tr className="text-left text-indigo-200 border-b border-white/10">
              <th className="px-2 py-2 w-10">#</th>
              <th className="px-2 py-2">테라피스트</th>
              <th className="px-2 py-2">마사지</th>
              <th className="px-2 py-2 w-28">시작</th>
              <th className="px-2 py-2 w-24">종료(자동)</th>
              <th className="px-2 py-2">고객</th>
              <th className="px-2 py-2 w-20">룸</th>
              <th className="px-2 py-2 w-20">저장</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={`border-b border-white/5 ${r.saved ? 'bg-emerald-900/30' : ''}`}>
                <td className="px-2 py-1 text-slate-400">{i + 1}</td>
                <td className="px-2 py-1">
                  <input
                    list="bk-therapist-options"
                    value={r.therapistName}
                    onChange={(e) => update(i, { therapistName: e.target.value })}
                    placeholder="검색/선택…"
                    className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-white placeholder-slate-500"
                  />
                </td>
                <td className="px-2 py-1">
                  <select value={r.service} onChange={(e) => update(i, { service: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5">
                    <option value="">선택…</option>
                    {SERVICES.map((s) => (
                      <option key={s.name} value={s.name}>{s.name} ({s.duration}분)</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input type="time" value={r.startTime} onChange={(e) => update(i, { startTime: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5" />
                </td>
                <td className="px-2 py-1 font-bold text-cyan-300">{endTimeOf(r) || '—'}</td>
                <td className="px-2 py-1">
                  <input value={r.guestName} onChange={(e) => update(i, { guestName: e.target.value })} placeholder="고객명" className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5" />
                </td>
                <td className="px-2 py-1">
                  <input list="bk-room-options" value={r.roomNumber} onChange={(e) => update(i, { roomNumber: e.target.value })} placeholder="빈룸 검색" className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-white placeholder-slate-500" />
                </td>
                <td className="px-2 py-1">
                  <button onClick={() => saveRow(i)} disabled={!isFilled(r) || r.saving} className={`w-full px-2 py-1.5 rounded font-bold text-xs ${r.saved ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-30'}`}>
                    {r.saving ? '…' : r.saved ? '✓' : '저장'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
