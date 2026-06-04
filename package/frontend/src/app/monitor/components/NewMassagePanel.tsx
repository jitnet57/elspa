'use client';

import { useEffect, useState } from 'react';
import { supabaseApiAdapter } from '@/lib/api/supabase-adapter';
import { saveBookingToSheet } from '@/lib/services/booking-sheet';
import { SERVICES, autoEndTime, initials, sortByAttendance, type UiTherapist } from './booking-helpers';
import { getCompanies, getGuides } from '@/lib/api/companies-client';
import { useT } from '@/lib/i18n';
import { massageTypesApi, type MassageType } from '@/lib/api/massage-types-client';

/**
 * ============================================================
 * 📌 공용 컴포넌트: NewMassagePanel (예약창)
 * 📋 테라피스트 검색·드래그드롭 선택 + 마사지(자동 종료) + 고객 + 룸번호
 * 🔌 저장: Supabase createBooking + 구글시트(Apps Script) 동시
 * ♻️ 데일리 스케줄 / 베드별 예약 공통 사용 (prefillRoom 로 베드 반영)
 * 📅 작성일: 2026-06-01
 * ============================================================
 */

export default function NewMassagePanel({
  date,
  prefillTherapist,
  prefillRoom,
  title = '+ Start New Massage',
  onClose,
  onSaved,
}: {
  date: string;
  prefillTherapist?: string;
  prefillRoom?: string;
  title?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const [therapists, setTherapists] = useState<UiTherapist[]>([]);
  const [search, setSearch] = useState('');
  const [therapistName, setTherapistName] = useState<string>(prefillTherapist ?? '');
  const [massageServices, setMassageServices] = useState<MassageType[]>([]);
  const [service, setService] = useState(SERVICES[0]?.name ?? '');
  const [startTime, setStartTime] = useState('10:00');
  const [guestName, setGuestName] = useState('');
  const [roomNumber, setRoomNumber] = useState(prefillRoom ?? '');
  const [note, setNote] = useState('');   // 업체명(노트)
  const [pay, setPay] = useState(0);       // 지불
  const [tip, setTip] = useState(0);       // 팁
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [referrals, setReferrals] = useState<string[]>([]);

  useEffect(() => {
    supabaseApiAdapter.getTherapists().then((r) => setTherapists(r as UiTherapist[])).catch(() => setTherapists([]));
    Promise.all([getCompanies().catch(() => []), getGuides().catch(() => [])]).then(([cs, gs]) => {
      setReferrals([...cs.map((c: any) => `${c.name} (업체)`), ...gs.map((g: any) => `${g.name} (가이드)`)]);
    });
    // API에서 마사지 서비스 로드
    massageTypesApi
      .list(true) // 활성 서비스만
      .then((services) => {
        setMassageServices(services);
        // 첫 번째 서비스 기본값으로 설정
        if (services.length > 0) {
          setService(services[0].name);
        }
      })
      .catch((err) => {
        console.warn('마사지 서비스 로드 실패, 기본값 사용:', err);
        // 폴백: 기본 SERVICES 사용
        setMassageServices(
          SERVICES.map((s, idx) => ({
            id: idx + 1,
            name: s.name,
            basePrice: 0,
            baseDurationMinutes: s.duration,
            isActive: true,
            createdAt: '',
            updatedAt: '',
          }))
        );
      });
  }, []);

  // API 로드 서비스에서 선택된 서비스의 duration 찾기
  const selectedServiceDuration = massageServices.find((s) => s.name === service)?.baseDurationMinutes
    ?? SERVICES.find((s) => s.name === service)?.duration
    ?? 60;

  const endTime = startTime
    ? (() => {
        const [h, m] = startTime.split(':').map(Number);
        const startDecimal = h + (m || 0) / 60;
        const endDecimal = startDecimal + selectedServiceDuration / 60;
        const endH = Math.floor(endDecimal);
        const endM = Math.round((endDecimal - endH) * 60);
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      })()
    : '';
  // 출근 순번 정렬 + 진행중(in_service)은 뒤로 → 다음 가용 테라피스트가 먼저
  const filtered = therapists
    .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || (t.specialty ?? '').toLowerCase().includes(search.toLowerCase()))
    .slice()
    .sort(sortByAttendance);
  const selectedOk = !!therapistName;

  const handleSave = async () => {
    if (!therapistName) return setMsg(t('Select a therapist (drag & drop).', '테라피스트를 선택(드래그드롭)하세요.'));
    if (!guestName.trim()) return setMsg(t('Enter guest name.', '고객 이름을 입력하세요.'));
    setSaving(true);
    setMsg('');

    let dbOk = false;
    try {
      await supabaseApiAdapter.createBooking({
        booking_date: date, treatment: service, start_time: startTime, end_time: endTime,
        guest_name: guestName, therapist_name: therapistName, room_num: roomNumber,
        note, pay, tip, status: 'normal',
      });
      dbOk = true;
    } catch (err) {
      console.warn('DB 저장 실패(Supabase 미설정?):', err);
    }
    const sheetOk = await saveBookingToSheet({
      therapist: therapistName, service, date, time: startTime, endTime, guestName, roomNumber,
      notes: `${note}${pay ? ` | pay:${pay}` : ''}${tip ? ` | tip:${tip}` : ''}`,
    });

    setSaving(false);
    if (!dbOk && !sheetOk) { setMsg(t('Save failed — check DB/Sheet connection.', '저장 실패 — DB/시트 연결을 확인하세요.')); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white text-gray-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-black text-gray-900">{title}{prefillRoom ? ` · Bed ${prefillRoom}` : ''}</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1열: 테라피스트 검색 + 드래그드롭 */}
          <div>
            <label className="text-sm font-bold text-gray-700">🧑‍⚕️ {t('Therapist (search & drag)', '테라피스트 (검색 후 드래그)')}</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Search name / specialty…', '이름 / 전문분야 검색…')} className="w-full mt-1 mb-2 px-3 py-2 border rounded-lg text-sm text-gray-900" />
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
              {filtered.length === 0 && <p className="text-xs text-gray-400 py-4 text-center">{t('No results', '검색 결과 없음')}</p>}
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const name = e.dataTransfer.getData('text/therapist'); if (name) setTherapistName(name); }}
              className={`mt-3 h-16 rounded-xl border-2 border-dashed flex items-center justify-center text-sm ${
                selectedOk ? 'border-blue-400 bg-blue-50 text-blue-700 font-bold' : 'border-gray-300 text-gray-400'
              }`}
            >
              {selectedOk ? t(`✓ ${therapistName} selected`, `✓ ${therapistName} 선택됨`) : t('Drag a therapist here', '여기로 테라피스트를 끌어다 놓으세요')}
            </div>
          </div>

          {/* 2열: 마사지 종류 · 시간 · 고객명 · 룸 */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-bold text-gray-700">💆 {t('Massage Type', '마사지 종류')}</label>
              <select value={service} onChange={(e) => setService(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm text-gray-900">
                {massageServices.length > 0
                  ? massageServices.map((s) => <option key={s.id} value={s.name}>{s.name} ({s.baseDurationMinutes}{t('min', '분')})</option>)
                  : SERVICES.map((s) => <option key={s.name} value={s.name}>{s.name} ({s.duration}{t('min', '분')})</option>)
                }
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-gray-700">{t('Start Time', '시작 시간')}</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm text-gray-900" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">{t('End (auto)', '종료 (자동)')}</label>
                <input value={endTime} readOnly className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-gray-100 font-bold text-blue-700" />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">{t('Guest Name', '고객 이름')}</label>
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder={t('e.g. John', '예: 김철수')} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm text-gray-900" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">{t('Room No.', '룸 번호')}{prefillRoom ? '' : t(' (optional)', ' (선택)')}</label>
              <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder={t('e.g. 05', '예: 05')} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm text-gray-900" />
            </div>
          </div>

          {/* 3열: 업체/메모 · 지불 · 팁 · 저장 */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-bold text-gray-700">{t('Company / Note', '업체명(노트)')}</label>
              <input list="np-referral-options" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('company/guide or memo', '업체·가이드 검색 / 노트')} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm text-gray-900" />
              <datalist id="np-referral-options">
                {referrals.map((r) => (<option key={r} value={r} />))}
              </datalist>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">{t('Pay', '지불')}</label>
              <input type="number" value={pay || ''} onChange={(e) => setPay(Number(e.target.value) || 0)} placeholder="0" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm text-gray-900 text-right" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">{t('Tip', '팁')}</label>
              <input type="number" value={tip || ''} onChange={(e) => setTip(Number(e.target.value) || 0)} placeholder="0" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm text-gray-900 text-right" />
            </div>
            {msg && <p className="text-sm text-red-600 font-semibold">{msg}</p>}
            <button onClick={handleSave} disabled={saving} className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold mt-auto">
              {saving ? t('Saving…', '저장 중…') : t('📋 Save Booking (DB + Google Sheet)', '📋 예약 저장 (DB + 구글시트)')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
