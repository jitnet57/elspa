'use client';

import { useMemo, useState } from 'react';
import {
  therapists,
  massageServices,
  bookings as seedBookings,
  type Therapist,
  type TimeSlot,
} from '@/app/admin/massage/mockData/bookingData';
import { saveBookingToSheet } from '@/lib/services/booking-sheet';

/**
 * ============================================================
 * 📌 컴포넌트: DailyTherapistSchedule
 * 📋 목적: 테라피스트 일일 스케줄 타임라인 (이미지2 UI) + 신규 예약
 * 🎨 구성: 3단계 헤더 / 날짜선택 / 09~21시 타임라인 / Start New Massage 패널
 * ✨ 기능:
 *    - 마사지 종류 + 시작시간 선택 → 자동 종료시간 계산 (massageServices.duration)
 *    - 테라피스트 검색 + 드래그드롭으로 선택
 *    - 저장 시 구글시트(Apps Script)로 전송 + 타임라인 즉시 반영
 * 📅 작성일: 2026-06-01
 * ============================================================
 */

const HOURS = Array.from({ length: 13 }, (_, i) => 9 + i); // 09:00 ~ 21:00
const HOUR_W = 84; // 시간 컬럼 폭(px)

// 시술 표시(아이콘/색) — serviceId 기준
const SVC_META: Record<string, { icon: string; bar: string }> = {
  'SVC-001': { icon: '🙏', bar: 'border-l-emerald-500 bg-emerald-50' },
  'SVC-002': { icon: '💆', bar: 'border-l-blue-500 bg-blue-50' },
  'SVC-003': { icon: '💪', bar: 'border-l-red-500 bg-red-50' },
  'SVC-004': { icon: '🦶', bar: 'border-l-amber-500 bg-amber-50' },
  'SVC-005': { icon: '✨', bar: 'border-l-pink-500 bg-pink-50' },
  'SVC-006': { icon: '🌸', bar: 'border-l-cyan-500 bg-cyan-50' },
  'SVC-007': { icon: '🪨', bar: 'border-l-orange-500 bg-orange-50' },
};

// 테라피스트 상태 표시
const STATUS_META: Record<Therapist['status'], { label: string; dot: string; text: string }> = {
  available: { label: 'Available', dot: 'bg-green-500', text: 'text-green-600' },
  busy: { label: 'In Session', dot: 'bg-blue-500', text: 'text-blue-600' },
  break: { label: 'Break', dot: 'bg-amber-500', text: 'text-amber-600' },
  offline: { label: 'Off Duty', dot: 'bg-gray-400', text: 'text-gray-500' },
};

// ── 시간 변환 헬퍼 ───────────────────────────────────────────
const toDecimal = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h + (m || 0) / 60;
};
const toHHMM = (dec: number) => {
  const h = Math.floor(dec);
  const m = Math.round((dec - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
const svcName = (id: string) => massageServices.find((s) => s.id === id)?.name ?? id;
const svcDuration = (id: string) => massageServices.find((s) => s.id === id)?.duration ?? 60;

export default function DailyTherapistSchedule({ openNewOnMount = false }: { openNewOnMount?: boolean }) {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(today);

  // 시드 예약을 오늘 날짜로 매핑해 타임라인이 비지 않도록
  const [items, setItems] = useState<TimeSlot[]>(() =>
    seedBookings
      .filter((b) => b.status !== 'cancelled')
      .map((b) => ({ ...b, date: today })),
  );

  const [showNew, setShowNew] = useState(openNewOnMount);
  const [prefill, setPrefill] = useState<{ therapistId: string } | null>(null);

  const dayItems = items.filter((b) => b.date === selectedDate);

  const shiftDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="flex-1 overflow-auto bg-white text-gray-800">
      {/* 3단계 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-start gap-6">
        <Step n={1} title="Select Date" desc="날짜별 스케줄 조회" />
        <Step n={2} title="Daily Therapist Schedule" desc="누가·언제·어떤 마사지인지 한눈에" />
        <Step n={3} title="Start New Massage" desc="테라피스트·고객·마사지 선택해 예약" />
        <button
          onClick={() => setShowNew(true)}
          className="ml-auto self-center px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold whitespace-nowrap shadow"
        >
          + Start New Massage
        </button>
      </div>

      {/* 날짜 선택기 */}
      <div className="px-6 py-3 flex items-center gap-2">
        <button onClick={() => shiftDate(-1)} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">‹</button>
        <div className="px-4 py-2 rounded-lg border border-gray-300 font-semibold flex items-center gap-2">
          📅
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="outline-none"
          />
        </div>
        <button onClick={() => shiftDate(1)} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">›</button>
      </div>

      {/* 타임라인 */}
      <div className="px-6 pb-6 overflow-x-auto">
        <div className="min-w-max border border-gray-200 rounded-xl overflow-hidden">
          {/* 시간 헤더 */}
          <div className="flex bg-gray-50 border-b border-gray-200">
            <div className="w-44 flex-shrink-0 px-4 py-3 font-bold text-gray-600 border-r border-gray-200">
              Therapists ({therapists.length})
            </div>
            <div className="w-16 flex-shrink-0 px-2 py-3 text-xs font-bold text-gray-400 border-r border-gray-200">
              Time
            </div>
            <div className="flex">
              {HOURS.map((h) => (
                <div key={h} style={{ width: HOUR_W }} className="px-2 py-3 text-xs font-semibold text-gray-500 border-r border-gray-100 text-center">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* 테라피스트 행 */}
          {therapists.map((t, idx) => {
            const st = STATUS_META[t.status];
            const rows = dayItems.filter((b) => b.therapistId === t.id);
            return (
              <div key={t.id} className={`flex border-b border-gray-100 ${idx % 2 ? 'bg-gray-50/40' : 'bg-white'}`}>
                {/* 이름/상태 */}
                <div className="w-44 flex-shrink-0 px-4 py-3 border-r border-gray-200 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{t.name.split(' ')[0]}</p>
                    <p className={`text-xs flex items-center gap-1 ${st.text}`}>
                      <span className={`w-2 h-2 rounded-full ${st.dot}`} /> {st.label}
                    </p>
                  </div>
                </div>
                {/* Time 스페이서 */}
                <div className="w-16 flex-shrink-0 border-r border-gray-200" />
                {/* 예약 블록 영역 */}
                <div
                  className="relative"
                  style={{ width: HOURS.length * HOUR_W, minHeight: 64 }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    // (예비) 행에 드롭 시 해당 테라피스트로 신규 패널 열기
                    const dropped = e.dataTransfer.getData('text/therapist');
                    if (dropped) {
                      setPrefill({ therapistId: dropped });
                      setShowNew(true);
                    }
                  }}
                >
                  {/* 시간 격자선 */}
                  {HOURS.map((h, i) => (
                    <div key={h} className="absolute top-0 bottom-0 border-r border-gray-100" style={{ left: i * HOUR_W, width: HOUR_W }} />
                  ))}
                  {/* 예약 블록 */}
                  {rows.map((b) => {
                    const left = (toDecimal(b.startTime) - 9) * HOUR_W;
                    const width = (toDecimal(b.endTime) - toDecimal(b.startTime)) * HOUR_W;
                    const meta = SVC_META[b.serviceId] ?? { icon: '💆', bar: 'border-l-slate-400 bg-slate-50' };
                    return (
                      <div
                        key={b.id}
                        title={`${b.startTime}-${b.endTime} ${svcName(b.serviceId)} · ${b.clientName}`}
                        className={`absolute top-2 bottom-2 border-l-4 rounded-lg px-2 py-1 overflow-hidden ${meta.bar}`}
                        style={{ left: Math.max(0, left), width: Math.max(40, width) }}
                      >
                        <p className="text-[11px] font-bold text-gray-700 truncate">
                          {b.startTime} - {b.endTime}
                        </p>
                        <p className="text-[11px] text-gray-600 truncate">
                          {meta.icon} {svcName(b.serviceId)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 신규 예약 패널 */}
      {showNew && (
        <NewMassagePanel
          date={selectedDate}
          prefillTherapistId={prefill?.therapistId}
          onClose={() => {
            setShowNew(false);
            setPrefill(null);
          }}
          onSaved={(slot) => {
            setItems((prev) => [...prev, slot]);
            setSelectedDate(slot.date);
            setShowNew(false);
            setPrefill(null);
          }}
        />
      )}
    </div>
  );
}

// ── 3단계 헤더 아이템 ────────────────────────────────────────
function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 max-w-xs">
      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
        {n}
      </div>
      <div>
        <p className="font-bold text-blue-700 text-sm">{title}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
    </div>
  );
}

// ── 신규 예약 패널 (테라피스트 검색+드래그드롭, 자동 종료시간, 시트저장) ──
function NewMassagePanel({
  date,
  prefillTherapistId,
  onClose,
  onSaved,
}: {
  date: string;
  prefillTherapistId?: string;
  onClose: () => void;
  onSaved: (slot: TimeSlot) => void;
}) {
  const [search, setSearch] = useState('');
  const [therapistId, setTherapistId] = useState<string>(prefillTherapistId ?? '');
  const [serviceId, setServiceId] = useState('SVC-001');
  const [startTime, setStartTime] = useState('10:00');
  const [guestName, setGuestName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // 자동 종료시간 = 시작 + 소요시간
  const endTime = toHHMM(toDecimal(startTime) + svcDuration(serviceId) / 60);

  const selected = therapists.find((t) => t.id === therapistId);
  const filtered = therapists.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.specialties.join(' ').toLowerCase().includes(search.toLowerCase()),
  );

  const handleSave = async () => {
    if (!therapistId) return setMsg('테라피스트를 선택(드래그드롭)하세요.');
    if (!guestName.trim()) return setMsg('고객 이름을 입력하세요.');

    setSaving(true);
    setMsg('');
    const slot: TimeSlot = {
      id: `BK-${Date.now()}`,
      bedId: '',
      therapistId,
      startTime,
      endTime,
      serviceId,
      clientName: guestName,
      clientPhone: '',
      status: 'confirmed',
      date,
      notes: roomNumber ? `Room ${roomNumber}` : '',
    };

    const ok = await saveBookingToSheet({
      therapist: selected?.name ?? '',
      service: svcName(serviceId),
      date,
      time: startTime,
      endTime,
      guestName,
      roomNumber,
      notes: '',
    });

    setSaving(false);
    onSaved(slot); // 시트 저장 실패해도 타임라인엔 반영 (로컬)
    if (!ok) console.warn('구글시트 저장 실패 — 타임라인엔 반영됨(로컬)');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-black">+ Start New Massage</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 좌: 테라피스트 검색 + 드래그드롭 */}
          <div>
            <label className="text-sm font-bold text-gray-700">🧑‍⚕️ 테라피스트 (검색 후 드래그)</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 / 전문분야 검색…"
              className="w-full mt-1 mb-2 px-3 py-2 border rounded-lg text-sm"
            />
            <div className="h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/therapist', t.id)}
                  onClick={() => setTherapistId(t.id)}
                  className={`px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing border text-sm flex items-center gap-2 ${
                    therapistId === t.id ? 'bg-blue-50 border-blue-400' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                    {t.avatar}
                  </span>
                  <span className="font-semibold">{t.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{t.specialties[0]}</span>
                </div>
              ))}
            </div>

            {/* 드롭존 */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/therapist');
                if (id) setTherapistId(id);
              }}
              className={`mt-3 h-16 rounded-xl border-2 border-dashed flex items-center justify-center text-sm ${
                selected ? 'border-blue-400 bg-blue-50 text-blue-700 font-bold' : 'border-gray-300 text-gray-400'
              }`}
            >
              {selected ? `✓ ${selected.name} 선택됨` : '여기로 테라피스트를 끌어다 놓으세요'}
            </div>
          </div>

          {/* 우: 마사지/시간/고객 */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-bold text-gray-700">💆 마사지 종류</label>
              <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                {massageServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration}분)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-gray-700">시작 시간</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">종료 (자동)</label>
                <input value={endTime} readOnly className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-gray-100 font-bold text-blue-700" />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700">고객 이름</label>
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="예: 김철수" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">룸 번호 (선택)</label>
              <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="예: 05" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
            </div>

            {msg && <p className="text-sm text-red-600 font-semibold">{msg}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold"
            >
              {saving ? '저장 중…' : '📋 예약 저장 (구글시트)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
