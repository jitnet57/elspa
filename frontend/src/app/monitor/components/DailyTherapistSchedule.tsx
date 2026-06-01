'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseApiAdapter, type Booking } from '@/lib/api/supabase-adapter';
import { saveBookingToSheet } from '@/lib/services/booking-sheet';
import {
  SERVICES,
  autoEndTime,
  toDecimal,
  treatmentMeta,
  therapistStatusMeta,
  initials,
  type UiTherapist,
  type DbTherapistStatus,
} from './booking-helpers';

/**
 * ============================================================
 * 📌 컴포넌트: DailyTherapistSchedule
 * 📋 목적: 테라피스트 일일 스케줄 타임라인 (이미지2 UI) + 신규 예약
 * 🔌 데이터: Supabase(therapists/bookings) 조회·저장 + 구글시트(Apps Script) 동시 저장
 *           Supabase 미설정 시 스냅샷/목 폴백 (저장은 시트 + 로컬 반영)
 * ✨ 기능: 마사지+시작시간 → 자동 종료시간 / 테라피스트 검색·드래그드롭 선택
 * 📅 작성일: 2026-06-01 (DB 연동)
 * ============================================================
 */

const HOURS = Array.from({ length: 13 }, (_, i) => 9 + i); // 09:00 ~ 21:00
const HOUR_W = 84;

export default function DailyTherapistSchedule({ openNewOnMount = false }: { openNewOnMount?: boolean }) {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [therapists, setTherapists] = useState<UiTherapist[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(openNewOnMount);
  const [prefill, setPrefill] = useState<string | null>(null);

  // 테라피스트 로드 (1회)
  useEffect(() => {
    supabaseApiAdapter
      .getTherapists()
      .then((rows) => setTherapists(rows as UiTherapist[]))
      .catch(() => setTherapists([]));
  }, []);

  // 예약 로드 (날짜 변경 시)
  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await supabaseApiAdapter.getBookings(selectedDate);
      setBookings(rows);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

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
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="outline-none" />
        </div>
        <button onClick={() => shiftDate(1)} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">›</button>
        {loading && <span className="text-xs text-gray-400 ml-2">불러오는 중…</span>}
      </div>

      {/* 타임라인 */}
      <div className="px-6 pb-6 overflow-x-auto">
        <div className="min-w-max border border-gray-200 rounded-xl overflow-hidden">
          {/* 시간 헤더 */}
          <div className="flex bg-gray-50 border-b border-gray-200">
            <div className="w-44 flex-shrink-0 px-4 py-3 font-bold text-gray-600 border-r border-gray-200">
              Therapists ({therapists.length})
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
          {therapists.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">테라피스트 데이터 없음</div>
          ) : (
            therapists.map((t, idx) => {
              const st = therapistStatusMeta[(t.status as DbTherapistStatus) ?? 'idle'] ?? therapistStatusMeta.idle;
              const rows = bookings.filter((b) => b.therapist_name === t.name);
              return (
                <div key={t.id} className={`flex border-b border-gray-100 ${idx % 2 ? 'bg-gray-50/40' : 'bg-white'}`}>
                  {/* 이름/상태 */}
                  <div className="w-44 flex-shrink-0 px-4 py-3 border-r border-gray-200 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                      {initials(t.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{t.name.split(' ')[0]}</p>
                      <p className={`text-xs flex items-center gap-1 ${st.text}`}>
                        <span className={`w-2 h-2 rounded-full ${st.dot}`} /> {st.label}
                      </p>
                    </div>
                  </div>
                  {/* 예약 블록 영역 */}
                  <div
                    className="relative"
                    style={{ width: HOURS.length * HOUR_W, minHeight: 64 }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dropped = e.dataTransfer.getData('text/therapist');
                      if (dropped) {
                        setPrefill(dropped);
                        setShowNew(true);
                      }
                    }}
                  >
                    {HOURS.map((h, i) => (
                      <div key={h} className="absolute top-0 bottom-0 border-r border-gray-100" style={{ left: i * HOUR_W, width: HOUR_W }} />
                    ))}
                    {rows.map((b) => {
                      const left = (toDecimal(b.start_time ?? '09:00') - 9) * HOUR_W;
                      const width = (toDecimal(b.end_time ?? '10:00') - toDecimal(b.start_time ?? '09:00')) * HOUR_W;
                      const meta = treatmentMeta(b.treatment);
                      return (
                        <div
                          key={b.id}
                          title={`${b.start_time}-${b.end_time} ${b.treatment} · ${b.guest_name ?? ''}`}
                          className={`absolute top-2 bottom-2 border-l-4 rounded-lg px-2 py-1 overflow-hidden ${meta.bar}`}
                          style={{ left: Math.max(0, left), width: Math.max(40, width) }}
                        >
                          <p className="text-[11px] font-bold text-gray-700 truncate">{b.start_time} - {b.end_time}</p>
                          <p className="text-[11px] text-gray-600 truncate">{meta.icon} {b.treatment}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showNew && (
        <NewMassagePanel
          date={selectedDate}
          therapists={therapists}
          prefillTherapist={prefill ? therapists.find((t) => String(t.id) === prefill)?.name : undefined}
          onClose={() => {
            setShowNew(false);
            setPrefill(null);
          }}
          onSaved={async () => {
            setShowNew(false);
            setPrefill(null);
            await loadBookings();
          }}
        />
      )}
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 max-w-xs">
      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</div>
      <div>
        <p className="font-bold text-blue-700 text-sm">{title}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
    </div>
  );
}

// ── 신규 예약 패널 (검색+드래그드롭, 자동 종료시간, DB+시트 저장) ──
function NewMassagePanel({
  date,
  therapists,
  prefillTherapist,
  onClose,
  onSaved,
}: {
  date: string;
  therapists: UiTherapist[];
  prefillTherapist?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [search, setSearch] = useState('');
  const [therapistName, setTherapistName] = useState<string>(prefillTherapist ?? '');
  const [service, setService] = useState(SERVICES[0]?.name ?? '');
  const [startTime, setStartTime] = useState('10:00');
  const [guestName, setGuestName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const endTime = autoEndTime(startTime, service);
  const filtered = therapists.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || (t.specialty ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const handleSave = async () => {
    if (!therapistName) return setMsg('테라피스트를 선택(드래그드롭)하세요.');
    if (!guestName.trim()) return setMsg('고객 이름을 입력하세요.');
    setSaving(true);
    setMsg('');

    // 1) DB 저장 (Supabase) — 미설정 시 throw → catch
    let dbOk = false;
    try {
      await supabaseApiAdapter.createBooking({
        booking_date: date,
        treatment: service,
        start_time: startTime,
        end_time: endTime,
        guest_name: guestName,
        therapist_name: therapistName,
        room_num: roomNumber,
        status: 'normal',
      });
      dbOk = true;
    } catch (err) {
      console.warn('DB 저장 실패(Supabase 미설정?):', err);
    }

    // 2) 구글시트 저장 (Apps Script)
    const sheetOk = await saveBookingToSheet({
      therapist: therapistName,
      service,
      date,
      time: startTime,
      endTime,
      guestName,
      roomNumber,
      notes: '',
    });

    setSaving(false);
    if (!dbOk && !sheetOk) {
      setMsg('저장 실패 — DB/시트 모두 연결을 확인하세요.');
      return;
    }
    onSaved();
  };

  const selectedOk = !!therapistName;

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
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름 / 전문분야 검색…" className="w-full mt-1 mb-2 px-3 py-2 border rounded-lg text-sm" />
            <div className="h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/therapist', t.name)}
                  onClick={() => setTherapistName(t.name)}
                  className={`px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing border text-sm flex items-center gap-2 ${
                    therapistName === t.name ? 'bg-blue-50 border-blue-400' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">{initials(t.name)}</span>
                  <span className="font-semibold">{t.name}</span>
                  {t.specialty && <span className="ml-auto text-xs text-gray-400">{t.specialty}</span>}
                </div>
              ))}
              {filtered.length === 0 && <p className="text-xs text-gray-400 py-4 text-center">검색 결과 없음</p>}
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const name = e.dataTransfer.getData('text/therapist');
                if (name) setTherapistName(name);
              }}
              className={`mt-3 h-16 rounded-xl border-2 border-dashed flex items-center justify-center text-sm ${
                selectedOk ? 'border-blue-400 bg-blue-50 text-blue-700 font-bold' : 'border-gray-300 text-gray-400'
              }`}
            >
              {selectedOk ? `✓ ${therapistName} 선택됨` : '여기로 테라피스트를 끌어다 놓으세요'}
            </div>
          </div>

          {/* 우: 마사지/시간/고객 */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-bold text-gray-700">💆 마사지 종류</label>
              <select value={service} onChange={(e) => setService(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                {SERVICES.map((s) => (
                  <option key={s.name} value={s.name}>{s.name} ({s.duration}분)</option>
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
            <button onClick={handleSave} disabled={saving} className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold">
              {saving ? '저장 중…' : '📋 예약 저장 (DB + 구글시트)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
