'use client';

import { useMemo, useState } from 'react';
import { therapists, massageServices } from '@/app/admin/massage/mockData/bookingData';
import { saveBookingToSheet } from '@/lib/services/booking-sheet';

/**
 * ============================================================
 * 📌 컴포넌트: BookingSheetTable (BOOKING WITH THERAPIST)
 * 📋 목적: 30행 예약표 — 테라피스트 예약 입력 화면
 * 🎨 열: # / 테라피스트 / 마사지 / 시작 / 종료(자동) / 고객 / 룸 / 저장
 * ✨ 기능:
 *    - 마사지 종류 + 시작시간 → 자동 종료시간 계산 (duration)
 *    - 행별 저장 또는 전체 저장 → 구글시트(Apps Script)
 * 🔌 훅 없음 (정적 데이터 + 로컬 상태)
 * 📅 작성일: 2026-06-01
 * ============================================================
 */

const ROW_COUNT = 30;

const toDecimal = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h + (m || 0) / 60;
};
const toHHMM = (dec: number) => {
  const h = Math.floor(dec);
  const m = Math.round((dec - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
const durationOf = (id: string) => massageServices.find((s) => s.id === id)?.duration ?? 60;
const nameOf = (id: string) => massageServices.find((s) => s.id === id)?.name ?? '';

interface Row {
  therapistId: string;
  serviceId: string;
  startTime: string;
  guestName: string;
  roomNumber: string;
  saved: boolean;
  saving: boolean;
}

const emptyRow = (): Row => ({
  therapistId: '',
  serviceId: '',
  startTime: '',
  guestName: '',
  roomNumber: '',
  saved: false,
  saving: false,
});

export default function BookingSheetTable() {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [date, setDate] = useState(today);
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: ROW_COUNT }, emptyRow));
  const [bulkMsg, setBulkMsg] = useState('');

  const update = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch, saved: false } : r)));

  const endTimeOf = (r: Row) =>
    r.startTime && r.serviceId ? toHHMM(toDecimal(r.startTime) + durationOf(r.serviceId) / 60) : '';

  const isFilled = (r: Row) => r.therapistId && r.serviceId && r.startTime && r.guestName.trim();

  const saveRow = async (i: number) => {
    const r = rows[i];
    if (!isFilled(r)) return;
    update(i, { saving: true });
    const ok = await saveBookingToSheet({
      therapist: therapists.find((t) => t.id === r.therapistId)?.name ?? '',
      service: nameOf(r.serviceId),
      date,
      time: r.startTime,
      endTime: endTimeOf(r),
      guestName: r.guestName,
      roomNumber: r.roomNumber,
      notes: '',
    });
    setRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, saving: false, saved: ok } : row)));
  };

  const saveAll = async () => {
    const targets = rows.map((r, i) => ({ r, i })).filter(({ r }) => isFilled(r) && !r.saved);
    if (targets.length === 0) {
      setBulkMsg('저장할 행이 없습니다. (테라피스트·마사지·시작·고객 입력 필요)');
      return;
    }
    setBulkMsg(`${targets.length}건 저장 중…`);
    for (const { i } of targets) {
      await saveRow(i);
    }
    setBulkMsg(`✅ ${targets.length}건 구글시트 저장 완료`);
  };

  const filledCount = rows.filter(isFilled).length;

  return (
    <div className="flex-1 overflow-auto bg-slate-900 text-white">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-black">📊 BOOKING WITH THERAPIST</h2>
        <span className="text-xs text-indigo-300">테라피스트 예약 입력 ({ROW_COUNT}행)</span>
        <div className="ml-2 flex items-center gap-2">
          📅
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-indigo-500/40 text-white text-sm"
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-300">입력됨: {filledCount}건</span>
          <button onClick={saveAll} className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 font-bold text-sm">
            전체 저장 (구글시트)
          </button>
        </div>
      </div>
      {bulkMsg && <p className="px-6 py-2 text-sm text-indigo-200">{bulkMsg}</p>}

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
                  <select
                    value={r.therapistId}
                    onChange={(e) => update(i, { therapistId: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5"
                  >
                    <option value="">선택…</option>
                    {therapists.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <select
                    value={r.serviceId}
                    onChange={(e) => update(i, { serviceId: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5"
                  >
                    <option value="">선택…</option>
                    {massageServices.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.duration}분)</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input
                    type="time"
                    value={r.startTime}
                    onChange={(e) => update(i, { startTime: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5"
                  />
                </td>
                <td className="px-2 py-1 font-bold text-cyan-300">{endTimeOf(r) || '—'}</td>
                <td className="px-2 py-1">
                  <input
                    value={r.guestName}
                    onChange={(e) => update(i, { guestName: e.target.value })}
                    placeholder="고객명"
                    className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    value={r.roomNumber}
                    onChange={(e) => update(i, { roomNumber: e.target.value })}
                    placeholder="룸"
                    className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5"
                  />
                </td>
                <td className="px-2 py-1">
                  <button
                    onClick={() => saveRow(i)}
                    disabled={!isFilled(r) || r.saving}
                    className={`w-full px-2 py-1.5 rounded font-bold text-xs ${
                      r.saved ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-30'
                    }`}
                  >
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
