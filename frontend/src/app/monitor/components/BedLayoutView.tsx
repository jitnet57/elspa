'use client';

import { useState, useEffect } from 'react';
import { therapyBeds, getBedsByRoom, therapists, type TherapyBed } from '@/app/admin/massage/mockData/bookingData';
import { useT } from '@/lib/i18n';
import { supabaseApiAdapter } from '@/lib/api/supabase-adapter';
import NewMassagePanel from './NewMassagePanel';

// 📌 테라피스트 id → 정보 매핑 (진행중 표시용)
const therapistById = new Map(therapists.map((t) => [t.id, t]));

/**
 * 📌 컴포넌트: BedLayoutView
 * 📋 침대 상태 표시 + 예약(데일리 예약창 공용)
 *    - 빈 베드: 바로 예약창
 *    - 진행중 베드: 현재정보 + 편집(비밀번호 1234 임시) → 예약창
 * 📅 개정: 2026-06-01
 */

const EDIT_PASSWORD = '1234'; // 임시 편집 비밀번호
const today = () => new Date().toISOString().split('T')[0];

export default function BedLayoutView() {
  const t = useT();
  const [selectedBed, setSelectedBed] = useState<TherapyBed | null>(null);
  const [showPanel, setShowPanel] = useState(false);   // 예약창
  const [pwOpen, setPwOpen] = useState(false);          // 비밀번호 모달
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [beds, setBeds] = useState<TherapyBed[]>([]);
  const [loading, setLoading] = useState(true);

  // Supabase에서 침대 데이터 로드
  useEffect(() => {
    const loadBeds = async () => {
      try {
        const data: any[] = await supabaseApiAdapter.getBeds();

        // Supabase 데이터를 TherapyBed 형식으로 변환
        const converted: TherapyBed[] = data.map((bed: any) => ({
          id: String(bed.id),
          name: `${bed.room_zone}-${bed.bed_number}`,
          roomNumber: String(bed.bed_number),
          room_zone: bed.room_zone,
          bed_number: bed.bed_number,
          status: bed.status,
          type: 'massage' as const,
          capacity: 1,
          therapistId: bed.therapist_name ? bed.id : undefined,
          serviceName: bed.service_name,
          endTime: bed.ends_at,
        }));

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

  // room_zone 매핑 (한글 → 영어)
  const roomZoneMap: Record<string, string> = {
    '마사지룸1': 'Massage Room 1',
    '마사지룸2': 'Massage Room 2',
    'VIP실': 'VIP Room',
    '기타실': 'Other Room',
  };

  // 침대를 방별로 분류
  const getRoomBeds = (zoneKey: string) => {
    return beds.filter((b) => b.room_zone === zoneKey);
  };

  const rooms = [
    { id: 'room1', name: 'Massage Room 1', beds: getRoomBeds('마사지룸1') },
    { id: 'room2', name: 'Massage Room 2', beds: getRoomBeds('마사지룸2') },
    { id: 'room3', name: 'VIP Room', beds: getRoomBeds('VIP실') },
    { id: 'room4', name: 'Other Room', beds: getRoomBeds('기타실') },
  ];
  const summary = {
    available: beds.filter((b) => b.status === 'available').length,
    occupied: beds.filter((b) => b.status === 'occupied').length,
    cleaning: beds.filter((b) => b.status === 'cleaning').length,
    maintenance: beds.filter((b) => b.status === 'maintenance').length,
  };

  const bedNo = (bed: TherapyBed) => String(bed.bed_number || bed.id);
  const currentTherapist = selectedBed?.therapistId ? therapistById.get(selectedBed.therapistId)?.name : undefined;

  const clickBed = (bed: TherapyBed) => {
    setSelectedBed(bed);
    setShowPanel(false);
    setPwOpen(false);
    setPw('');
    setPwErr('');
    // 빈/정리/점검 베드는 바로 예약창, 진행중 베드는 정보 모달
    if (bed.status !== 'occupied') setShowPanel(true);
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

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label={t('Available', '비어있음')} value={summary.available} className="bg-green-50 border-green-200 text-green-700" />
          <SummaryCard label={t('In Service', '서비스중')} value={summary.occupied} className="bg-blue-50 border-blue-200 text-blue-700" />
          <SummaryCard label={t('Cleaning', '정리중')} value={summary.cleaning} className="bg-amber-50 border-amber-200 text-amber-700" />
          <SummaryCard label={t('Maintenance', '점검중')} value={summary.maintenance} className="bg-gray-100 border-gray-300 text-gray-700" />
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
      {selectedBed && selectedBed.status === 'occupied' && !showPanel && !pwOpen && (
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
                <p className="text-sm font-bold text-gray-800">{t('Therapist', '테라피스트')}: {currentTherapist ?? '-'}</p>
                <p className="text-sm font-bold text-gray-800">{t('Service', '시술')}: {selectedBed.serviceName ?? '-'}</p>
                <p className="text-sm font-bold text-green-600">{t('End', '종료')}: {selectedBed.endTime ?? '-'}</p>
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
          date={today()}
          prefillRoom={bedNo(selectedBed)}
          prefillTherapist={currentTherapist}
          title={selectedBed.status === 'occupied' ? t('✏️ Edit Booking', '✏️ 예약 편집') : '+ Start New Massage'}
          onClose={closeAll}
          onSaved={closeAll}
        />
      )}
    </>
  );
}

function BedCard({ bed, onClick }: { bed: TherapyBed; onClick: () => void }) {
  const t = useT();
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
    <button
      onClick={onClick}
      className={`px-2 py-2 rounded font-bold text-center transition cursor-pointer active:scale-95 leading-snug h-[100px] w-full flex flex-col justify-center gap-1 ${statusColorMap[bed.status]}`}
    >
      <div className="text-xs font-bold">{t(`No.${bedNo}`, `${bedNo}번`)}</div>
      {bed.status === 'occupied' ? (
        <>
          {therapistName && <div className="text-xs font-semibold truncate">{therapistName}</div>}
          {bed.serviceName && <div className="text-xs opacity-90 truncate">{bed.serviceName}</div>}
          {bed.endTime && <div className="text-xs opacity-90">~{bed.endTime}</div>}
        </>
      ) : bed.status === 'cleaning' ? (
        <div className="text-xs">🧹 {t('Cleaning', '정리중')}</div>
      ) : bed.status === 'maintenance' ? (
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
