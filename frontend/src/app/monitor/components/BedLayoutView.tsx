'use client';

import { useState } from 'react';
import { therapyBeds, getBedsByRoom, therapists, type TherapyBed } from '@/app/admin/massage/mockData/bookingData';
import { SERVICES, autoEndTime } from './booking-helpers';
import { saveBookingToSheet } from '@/lib/services/booking-sheet';
import { supabaseApiAdapter } from '@/lib/api/supabase-adapter';

// 📌 테라피스트 id → 정보 매핑 (진행중 표시용)
const therapistById = new Map(therapists.map((t) => [t.id, t]));

/**
 * 📌 컴포넌트: BedLayoutView
 * 📋 목적: 침대 상태 표시 + 클릭 시 booking-with-therapist 형태 예약창
 * 🔌 저장: Supabase(createBooking) + 구글시트(Apps Script) 동시
 * 📅 작성일: 2026-05-28 / 개정: 2026-06-01 (예약창을 테라피스트 예약 형태로)
 */

const today = () => new Date().toISOString().split('T')[0];

export default function BedLayoutView() {
  const [selectedBed, setSelectedBed] = useState<TherapyBed | null>(null);
  const [form, setForm] = useState({ therapistName: '', service: SERVICES[0]?.name ?? '', startTime: '10:00', guestName: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const room1Beds = getBedsByRoom('room1');
  const room2Beds = getBedsByRoom('room2');
  const room3Beds = getBedsByRoom('room3');
  const room4Beds = getBedsByRoom('room4');
  const rooms = [
    { id: 'room1', name: '마사지룸1', beds: room1Beds },
    { id: 'room2', name: '마사지룸2', beds: room2Beds },
    { id: 'room3', name: 'VIP실', beds: room3Beds },
    { id: 'room4', name: '기타실', beds: room4Beds },
  ];

  const summary = {
    available: therapyBeds.filter((b) => b.status === 'available').length,
    occupied: therapyBeds.filter((b) => b.status === 'occupied').length,
    cleaning: therapyBeds.filter((b) => b.status === 'cleaning').length,
    maintenance: therapyBeds.filter((b) => b.status === 'maintenance').length,
  };

  const openBed = (bed: TherapyBed) => {
    setSelectedBed(bed);
    setForm({ therapistName: '', service: SERVICES[0]?.name ?? '', startTime: '10:00', guestName: '' });
    setMsg('');
  };

  const bedNo = (bed: TherapyBed) => bed.name.split('-')[1] ?? bed.name;
  const endTime = autoEndTime(form.startTime, form.service);

  const handleSave = async () => {
    if (!selectedBed) return;
    if (!form.therapistName) return setMsg('테라피스트를 선택하세요.');
    if (!form.guestName.trim()) return setMsg('고객 이름을 입력하세요.');
    setSaving(true);
    setMsg('');

    const payloadDate = today();
    let dbOk = false;
    try {
      await supabaseApiAdapter.createBooking({
        booking_date: payloadDate,
        treatment: form.service,
        start_time: form.startTime,
        end_time: endTime,
        guest_name: form.guestName,
        therapist_name: form.therapistName,
        room_num: bedNo(selectedBed),
        status: 'normal',
      });
      dbOk = true;
    } catch (err) {
      console.warn('DB 저장 실패(Supabase 미설정?):', err);
    }
    const sheetOk = await saveBookingToSheet({
      therapist: form.therapistName, service: form.service, date: payloadDate,
      time: form.startTime, endTime, guestName: form.guestName, roomNumber: bedNo(selectedBed), notes: '',
    });

    setSaving(false);
    if (!dbOk && !sheetOk) { setMsg('저장 실패 — DB/시트 연결을 확인하세요.'); return; }
    alert(`예약 저장됨 — Bed ${bedNo(selectedBed)} · ${form.therapistName} · ${form.service} (${form.startTime}~${endTime})`);
    setSelectedBed(null);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="비어있음" value={summary.available} className="bg-green-50 border-green-200 text-green-700" />
          <SummaryCard label="서비스중" value={summary.occupied} className="bg-blue-50 border-blue-200 text-blue-700" />
          <SummaryCard label="정리중" value={summary.cleaning} className="bg-amber-50 border-amber-200 text-amber-700" />
          <SummaryCard label="점검중" value={summary.maintenance} className="bg-gray-100 border-gray-300 text-gray-700" />
        </div>

        {rooms.map((room) => (
          <div key={room.id}>
            <h2 className="text-xl font-bold text-gray-800 mb-3">{room.name} ({room.beds.length})</h2>
            <div className="grid grid-cols-10 gap-2">
              {room.beds.map((bed) => (
                <BedCard key={bed.id} bed={bed} onClick={() => openBed(bed)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 예약창 (booking-with-therapist 형태) */}
      {selectedBed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-5 rounded-t-2xl flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black">Bed {bedNo(selectedBed)}</h2>
                <p className="text-sm opacity-90">Room: {selectedBed.roomNumber}</p>
              </div>
              <button onClick={() => setSelectedBed(null)} className="text-2xl font-bold hover:opacity-80">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {selectedBed.status === 'occupied' ? (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-1">
                  <p className="text-xs text-gray-600 font-semibold">현재 진행중</p>
                  <p className="text-sm font-bold text-gray-800">테라피스트: {selectedBed.therapistId ? therapistById.get(selectedBed.therapistId)?.name : '-'}</p>
                  <p className="text-sm font-bold text-gray-800">시술: {selectedBed.serviceName ?? '-'}</p>
                  <p className="text-sm font-bold text-green-600">종료: {selectedBed.endTime ?? '-'}</p>
                </div>
              ) : (
                <>
                  {/* 테라피스트 */}
                  <div>
                    <label className="text-sm font-bold text-gray-700">🧑‍⚕️ 테라피스트</label>
                    <select value={form.therapistName} onChange={(e) => setForm({ ...form, therapistName: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                      <option value="">선택…</option>
                      {therapists.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                  {/* 마사지 종류 */}
                  <div>
                    <label className="text-sm font-bold text-gray-700">💆 마사지 종류</label>
                    <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                      {SERVICES.map((s) => <option key={s.name} value={s.name}>{s.name} ({s.duration}분)</option>)}
                    </select>
                  </div>
                  {/* 시작/종료 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-bold text-gray-700">시작 시간</label>
                      <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700">종료 (자동)</label>
                      <input value={endTime} readOnly className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-gray-100 font-bold text-blue-700" />
                    </div>
                  </div>
                  {/* 고객 */}
                  <div>
                    <label className="text-sm font-bold text-gray-700">고객 이름</label>
                    <input value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} placeholder="예: 김철수" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  {msg && <p className="text-sm text-red-600 font-semibold">{msg}</p>}
                  <button onClick={handleSave} disabled={saving} className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold">
                    {saving ? '저장 중…' : '📋 예약 저장 (DB + 구글시트)'}
                  </button>
                </>
              )}
              <button onClick={() => setSelectedBed(null)} className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold">닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BedCard({ bed, onClick }: { bed: TherapyBed; onClick: () => void }) {
  const statusColorMap: Record<string, string> = {
    available: 'bg-green-500 text-white hover:bg-green-600',
    occupied: 'bg-blue-500 text-white hover:bg-blue-600',
    cleaning: 'bg-amber-500 text-white hover:bg-amber-600',
    maintenance: 'bg-gray-500 text-white hover:bg-gray-600',
  };
  const bedNo = bed.name.split('-')[1];
  const therapist = bed.therapistId ? therapistById.get(bed.therapistId) : undefined;
  const therapistName = therapist?.name.split(' ')[0];

  return (
    <button onClick={onClick} className={`px-1 py-2 rounded font-bold text-center transition cursor-pointer active:scale-95 leading-tight min-h-[56px] flex flex-col justify-center gap-0.5 ${statusColorMap[bed.status]}`}>
      <div className="text-xs font-bold">{bedNo}번</div>
      {bed.status === 'occupied' ? (
        <>
          {therapistName && <div className="text-[11px] font-semibold truncate">{therapistName}</div>}
          {bed.serviceName && <div className="text-[9px] opacity-90 truncate">{bed.serviceName}</div>}
          {bed.endTime && <div className="text-[9px] opacity-90">~{bed.endTime}</div>}
        </>
      ) : bed.status === 'cleaning' ? (
        <div className="text-[10px]">🧹 정리중</div>
      ) : bed.status === 'maintenance' ? (
        <div className="text-[10px]">🔧 점검</div>
      ) : (
        <div className="text-[10px] opacity-90">비어있음</div>
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
