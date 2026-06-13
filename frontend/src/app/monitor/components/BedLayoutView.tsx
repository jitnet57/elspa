'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { therapyBeds, type TherapyBed } from '@/app/admin/massage/mockData/bookingData';
import { useT } from '@/lib/i18n';
import { supabaseApiAdapter, type Booking } from '@/lib/api/supabase-adapter';
import { getSupabase } from '@/lib/supabase/client';
import { toDecimal } from './booking-helpers';
import NewMassagePanel from './NewMassagePanel';

/**
 * ============================================================
 * 📌 컴포넌트: BedLayoutView (베드 모니터)
 * 📋 침대 상태 표시 + 예약(데일리 예약창 공용)
 * 🔌 데이터: beds(테이블)=레이아웃, bookings(테이블)=점유/테라피스트/시술
 *    ⭐ 단일 소스 원칙: 점유 여부는 오직 bookings 에서 파생한다.
 *       (테라피스트 예약현황과 동일한 bookings 를 사용 → 두 화면이 항상 일치)
 *    - 빈/정리/점검 베드: 바로 예약창
 *    - 진행중(현재시각이 예약 시간대 안) 베드: 현재정보 + 편집(비밀번호 1234 임시)
 * 📅 개정: 2026-06-13 (bookings 단일 소스로 통일)
 * ============================================================
 */

const EDIT_PASSWORD = '1234'; // 임시 편집 비밀번호
const today = () => new Date().toISOString().split('T')[0];

// 로드된 베드 (원본 한글 room_zone 포함 — room_num 매칭/저장의 핵심)
type LoadedBed = TherapyBed & { zoneKo?: string };

// bookings.room_num 파싱: "마사지룸1 7" → {zone:"마사지룸1", num:"7"} / "7" → {zone:"", num:"7"}
// ⚠️ bed_number 는 zone마다 1~30 반복(전역 유일 아님) → zone 까지 비교해야 정확.
const parseRoomNum = (s: unknown) => {
  const str = String(s ?? '').trim();
  const m = str.match(/^(.*?)\s*(\d+)\s*$/); // 끝의 숫자 + 앞의 zone 라벨
  return { zone: (m?.[1] ?? '').trim(), num: m?.[2] ?? '' };
};
const bedNumStr = (bed: LoadedBed) => String(bed.bed_number ?? bed.roomNumber ?? bed.id);
// 베드 → 예약 저장용 표준 room_num ("마사지룸1 7"). zone 없으면 번호만.
const bedRoomNum = (bed: LoadedBed) => (bed.zoneKo ? `${bed.zoneKo} ${bedNumStr(bed)}` : bedNumStr(bed));

// 베드에 표시할 파생 정보 (오직 bookings 기준)
interface BedView extends LoadedBed {
  derivedStatus: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  therapistName?: string;
  service?: string;
  endsAt?: string;
  activeBooking?: Booking;
}

export default function BedLayoutView() {
  const t = useT();
  const [selectedBed, setSelectedBed] = useState<BedView | null>(null);
  const [showPanel, setShowPanel] = useState(false);   // 예약창
  const [pwOpen, setPwOpen] = useState(false);          // 비밀번호 모달
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [beds, setBeds] = useState<LoadedBed[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowDec, setNowDec] = useState(() => {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  });

  // 현재 시각을 1분마다 갱신 → 진행중/종료 자동 반영
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNowDec(d.getHours() + d.getMinutes() / 60);
    };
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, []);

  // 침대 레이아웃 로드 (Supabase beds → 실패 시 mock)
  useEffect(() => {
    const loadBeds = async () => {
      try {
        const data: any[] = await supabaseApiAdapter.getBeds();

        // 한글 room_zone → 영어 매핑
        const roomZoneToEnglish: Record<string, string> = {
          '마사지룸1': 'Massage Room 1',
          '마사지룸2': 'Massage Room 2',
          'VIP룸': 'VIP Room',
          '커플룸': 'Couple Room',
        };

        const converted: LoadedBed[] = data.map((bed: any) => {
          const englishZone = roomZoneToEnglish[bed.room_zone] || bed.room_zone;
          return {
            id: String(bed.id),
            name: `${englishZone}-${bed.bed_number}`,
            roomNumber: String(bed.bed_number),
            room_zone: englishZone,     // 표시/그룹핑용(영문)
            zoneKo: bed.room_zone,      // 원본 한글 zone(매칭/저장용)
            bed_number: bed.bed_number,
            // beds 테이블의 status 는 물리 상태(정리/점검)만 신뢰. 점유는 bookings 에서 파생.
            status: bed.status === 'cleaning' || bed.status === 'maintenance' ? bed.status : 'available',
            type: 'massage' as const,
            capacity: 1,
          };
        });

        setBeds(converted);
      } catch (error) {
        console.warn('침대 데이터 로드 실패, 기본값 사용:', error);
        setBeds(therapyBeds); // 실패 시 mockData 사용
      } finally {
        setLoading(false);
      }
    };
    loadBeds();
  }, []);

  // 오늘 예약 로드 (점유/테라피스트/시술의 단일 소스)
  const loadBookings = useCallback(async () => {
    try {
      const rows = await supabaseApiAdapter.getBookings(today());
      setBookings(rows);
    } catch (err) {
      console.warn('예약 로드 실패:', err);
      setBookings([]);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // 🔄 Supabase Realtime — bookings 변경 시 베드 모니터 즉시 갱신
  //    (예약현황과 동일 테이블을 구독해야 두 화면이 함께 움직인다)
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    try {
      const subscription = sb
        .channel('bookings:bed-monitor')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
          loadBookings();
        })
        .subscribe();
      return () => {
        sb.removeChannel(subscription);
      };
    } catch (err) {
      console.warn('⚠️ Realtime 구독 실패:', err);
    }
  }, [loadBookings]);

  // 베드별 "현재 진행중인 예약" 찾기 (room_num 매칭 + 현재시각이 시간대 안)
  const activeBookingFor = useCallback(
    (bed: LoadedBed): Booking | undefined =>
      bookings.find((b) => {
        const { zone, num } = parseRoomNum(b.room_num);
        if (!num || num !== bedNumStr(bed)) return false;
        // zone 라벨이 있으면 한글/영문 zone 과 일치해야 함 (번호 중복 베드 오매칭 방지)
        if (zone && zone !== bed.zoneKo && zone !== bed.room_zone) return false;
        if (!b.start_time || !b.end_time) return false;
        return toDecimal(b.start_time) <= nowDec && nowDec < toDecimal(b.end_time);
      }),
    [bookings, nowDec]
  );

  // 베드 + 파생 점유정보
  const bedViews: BedView[] = useMemo(
    () =>
      beds.map((bed) => {
        const active = activeBookingFor(bed);
        if (active) {
          return {
            ...bed,
            derivedStatus: 'occupied',
            therapistName: active.therapist_name,
            service: active.treatment,
            endsAt: active.end_time,
            activeBooking: active,
          };
        }
        const physical = bed.status === 'cleaning' || bed.status === 'maintenance' ? bed.status : 'available';
        return { ...bed, derivedStatus: physical };
      }),
    [beds, activeBookingFor]
  );

  const getRoomBeds = (englishZone: string) => bedViews.filter((b) => b.room_zone === englishZone);

  const rooms = [
    { id: 'room1', name: 'Massage Room 1', beds: getRoomBeds('Massage Room 1') },
    { id: 'room2', name: 'Massage Room 2', beds: getRoomBeds('Massage Room 2') },
    { id: 'room3', name: 'VIP Room', beds: getRoomBeds('VIP Room') },
    { id: 'room4', name: 'Couple Room', beds: getRoomBeds('Couple Room') },
  ];
  const summary = {
    available: bedViews.filter((b) => b.derivedStatus === 'available').length,
    occupied: bedViews.filter((b) => b.derivedStatus === 'occupied').length,
    cleaning: bedViews.filter((b) => b.derivedStatus === 'cleaning').length,
    maintenance: bedViews.filter((b) => b.derivedStatus === 'maintenance').length,
  };

  const bedNo = (bed: LoadedBed) => bedNumStr(bed); // 표시용 번호

  const clickBed = (bed: BedView) => {
    setSelectedBed(bed);
    setShowPanel(false);
    setPwOpen(false);
    setPw('');
    setPwErr('');
    // 빈/정리/점검 베드는 바로 예약창, 진행중 베드는 정보 모달
    if (bed.derivedStatus !== 'occupied') setShowPanel(true);
  };

  const verifyPw = () => {
    if (pw === EDIT_PASSWORD) {
      setPwOpen(false);
      setShowPanel(true); // 예약창(편집) 오픈
    } else {
      setPwErr(t('Incorrect password.', '비밀번호가 올바르지 않습니다.'));
    }
  };

  const closeAll = () => {
    setSelectedBed(null);
    setShowPanel(false);
    setPwOpen(false);
    setPw('');
    setPwErr('');
  };

  const active = selectedBed?.activeBooking;

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label={t('Available', '비어있음')} value={summary.available} className="bg-green-50 border-green-200 text-green-700" />
          <SummaryCard label={t('In Service', '서비스중')} value={summary.occupied} className="bg-blue-50 border-blue-200 text-blue-700" />
          <SummaryCard label={t('Cleaning', '정리중')} value={summary.cleaning} className="bg-amber-50 border-amber-200 text-amber-700" />
          <SummaryCard label={t('Maintenance', '점검중')} value={summary.maintenance} className="bg-gray-100 border-gray-300 text-gray-700" />
          {loading && <span className="text-xs text-gray-400 self-center">{t('Loading…', '불러오는 중…')}</span>}
        </div>

        {rooms.map((room) => (
          <div key={room.id}>
            <h2 className="text-xl font-bold text-gray-800 mb-3">{room.name} ({room.beds.length})</h2>
            <div className="grid grid-cols-10 gap-2">
              {room.beds.map((bed) => (
                <BedCard key={bed.id} bed={bed} onClick={() => clickBed(bed)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 진행중 베드: 현재정보 + 편집(비밀번호) */}
      {selectedBed && selectedBed.derivedStatus === 'occupied' && !showPanel && !pwOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-5 rounded-t-2xl flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black">Bed {bedNo(selectedBed)}</h2>
                <p className="text-sm opacity-90">Room: {selectedBed.roomNumber}</p>
              </div>
              <button onClick={closeAll} className="text-2xl font-bold hover:opacity-80">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-1">
                <p className="text-xs text-gray-600 font-semibold">{t('In Progress', '현재 진행중')}</p>
                <p className="text-sm font-bold text-gray-800">{t('Therapist', '테라피스트')}: {selectedBed.therapistName ?? '-'}</p>
                <p className="text-sm font-bold text-gray-800">{t('Guest', '고객')}: {active?.guest_name ?? '-'}</p>
                <p className="text-sm font-bold text-gray-800">{t('Service', '시술')}: {selectedBed.service ?? '-'}</p>
                <p className="text-sm font-bold text-green-600">{t('End', '종료')}: {selectedBed.endsAt ?? '-'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setPwOpen(true); setPw(''); setPwErr(''); }} className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold">✏️ {t('Edit', '편집')}</button>
                <button onClick={closeAll} className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold">{t('Close', '닫기')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 모달 (편집 진입) */}
      {pwOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="bg-red-500 text-white p-5 rounded-t-xl"><h2 className="text-xl font-black">🔐 {t('Edit Password', '편집 비밀번호')}</h2></div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-700 font-semibold">{t('Enter the password to edit this booking. (temp: 1234)', '예약을 편집하려면 비밀번호를 입력하세요. (임시: 1234)')}</p>
              <input
                type="password"
                value={pw}
                onChange={(e) => { setPw(e.target.value); setPwErr(''); }}
                onKeyDown={(e) => e.key === 'Enter' && verifyPw()}
                placeholder={t('Password', '비밀번호')}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                autoFocus
              />
              {pwErr && <p className="text-sm text-red-600 font-semibold">{pwErr}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setPwOpen(false); setPw(''); setPwErr(''); }} className="flex-1 px-4 py-2 bg-gray-200 rounded-lg font-bold">{t('Cancel', '취소')}</button>
                <button onClick={verifyPw} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold">{t('Confirm', '확인')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 데일리 예약창(공용) — 빈 베드 신규 / 진행중 베드 편집(비밀번호 통과 후) */}
      {selectedBed && showPanel && (
        <NewMassagePanel
          date={active?.booking_date ?? today()}
          bookingId={active?.id}
          prefillRoom={bedRoomNum(selectedBed)}
          prefillTherapist={selectedBed.therapistName}
          prefillTreatment={active?.treatment}
          prefillStartTime={active?.start_time}
          prefillGuestName={active?.guest_name}
          prefillNote={active?.note}
          prefillPayAmount={active?.pay}
          prefillTip={active?.tip}
          title={selectedBed.derivedStatus === 'occupied' ? t('✏️ Edit Booking', '✏️ 예약 편집') : '+ Start New Massage'}
          onClose={closeAll}
          onSaved={async () => {
            await loadBookings();
            closeAll();
          }}
        />
      )}
    </>
  );
}

function BedCard({ bed, onClick }: { bed: BedView; onClick: () => void }) {
  const t = useT();
  const statusColorMap: Record<string, string> = {
    available: 'bg-green-500 text-white hover:bg-green-600',
    occupied: 'bg-blue-500 text-white hover:bg-blue-600',
    cleaning: 'bg-amber-500 text-white hover:bg-amber-600',
    maintenance: 'bg-gray-500 text-white hover:bg-gray-600',
  };
  const bedNo = bed.name.split('-')[1] ?? bed.roomNumber;
  const therapistName = bed.therapistName?.split(' ')[0];

  return (
    <button
      onClick={onClick}
      className={`px-2 py-2 rounded font-bold text-center transition cursor-pointer active:scale-95 leading-snug h-[100px] w-full flex flex-col justify-center gap-1 ${statusColorMap[bed.derivedStatus]}`}
    >
      <div className="text-xs font-bold">{t(`No.${bedNo}`, `${bedNo}번`)}</div>
      {bed.derivedStatus === 'occupied' ? (
        <>
          {therapistName && <div className="text-xs font-semibold truncate">{therapistName}</div>}
          {bed.service && <div className="text-xs opacity-90 truncate">{bed.service}</div>}
          {bed.endsAt && <div className="text-xs opacity-90">~{bed.endsAt}</div>}
        </>
      ) : bed.derivedStatus === 'cleaning' ? (
        <div className="text-xs">🧹 {t('Cleaning', '정리중')}</div>
      ) : bed.derivedStatus === 'maintenance' ? (
        <div className="text-xs">🔧 {t('Maintenance', '점검')}</div>
      ) : (
        <div className="text-xs opacity-90">{t('Available', '비어있음')}</div>
      )}
    </button>
  );
}

function SummaryCard({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${className}`}>
      <p className="text-xs font-bold opacity-80">{label}</p>
      <p className="text-2xl font-black mt-0.5">{value}</p>
    </div>
  );
}
