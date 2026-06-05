'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseApiAdapter, type Booking } from '@/lib/api/supabase-adapter';
import { getSupabase } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';
import NewMassagePanel from './NewMassagePanel';
import {
  toDecimal,
  treatmentMeta,
  therapistStatusMeta,
  initials,
  sortByAttendance,
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

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 00:00 ~ 23:00 (24시간)
const HOUR_W = 84;

export default function DailyTherapistSchedule({ openNewOnMount = false }: { openNewOnMount?: boolean }) {
  const t = useT();
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
      console.log(`📅 ${selectedDate} 예약 로드:`, rows.map(r => ({ therapist_name: r.therapist_name, treatment: r.treatment })));
      setBookings(rows);
    } catch (err) {
      console.error('예약 로드 실패:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // 🔄 Supabase Realtime 구독 (예약 데이터 변경 감지)
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;

    try {
      const subscription = sb
        .channel(`massage_bookings:schedule`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'massage_bookings',
          },
          () => {
            console.log('📅 예약 데이터 변경 감지, 스케줄 새로고침...');
            loadBookings();
          }
        )
        .subscribe();

      return () => {
        sb.removeChannel(subscription);
      };
    } catch (err) {
      console.warn('⚠️ Realtime 구독 실패:', err);
    }
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
        <Step n={1} title="Select Date" desc={t('Browse schedule by date', '날짜별 스케줄 조회')} />
        <Step n={2} title="Daily Therapist Schedule" desc={t('See who, when, and which massage at a glance', '누가·언제·어떤 마사지인지 한눈에')} />
        <Step n={3} title="Start New Massage" desc={t('Pick therapist, guest, and massage to book', '테라피스트·고객·마사지 선택해 예약')} />
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
        {loading && <span className="text-xs text-gray-400 ml-2">{t('Loading…', '불러오는 중…')}</span>}
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
            <div className="px-4 py-8 text-center text-gray-400">{t('No therapist data', '테라피스트 데이터 없음')}</div>
          ) : (
            therapists.slice().sort(sortByAttendance).map((t, idx) => {
              const st = therapistStatusMeta[(t.status as DbTherapistStatus) ?? 'idle'] ?? therapistStatusMeta.idle;
              // 대소문자 무시하고 일치하는 예약 필터링
              // therapist_id로 매칭, 또는 therapist_name으로 폴백 (기존 데이터 호환)
              const rows = bookings.filter((b) =>
                b.therapist_id === t.id ||
                (b.therapist_id === null && (b.therapist_name || '').toLowerCase() === (t.name || '').toLowerCase())
              );
              if (rows.length > 0) {
                console.log(`🧑‍⚕️ ${t.name}: ${rows.length}개 예약`);
              }
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
