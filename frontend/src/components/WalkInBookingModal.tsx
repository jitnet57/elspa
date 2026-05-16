'use client';

import { useState } from 'react';
import { getTranslations } from '@/lib/translations';
import { useLanguage } from '@/lib/LanguageContext';

interface WalkInBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WalkInBookingRequest) => void;
  availableBeds: any[];
  therapists: any[];
}

export interface WalkInBookingRequest {
  serviceType: string;
  customerName?: string;
  requested_therapist_id?: number;
  suggestedBeds: number[];
  suggestedTherapists: number[];
}

const SERVICE_TYPES = [
  { id: 'swedish', name: '스웨디시', duration: 60 },
  { id: 'thai', name: '타이', duration: 90 },
  { id: 'hotstone', name: '핫스톤', duration: 60 },
  { id: 'foot', name: '발마사지', duration: 30 },
  { id: 'aroma', name: '아로마', duration: 45 },
];

export const WalkInBookingModal = ({
  isOpen,
  onClose,
  onSubmit,
  availableBeds,
  therapists,
}: WalkInBookingModalProps) => {
  const [step, setStep] = useState<'input' | 'matching'>('input');
  const [serviceType, setServiceType] = useState('swedish');
  const [customerName, setCustomerName] = useState('');
  const [requestedTherapistId, setRequestedTherapistId] = useState<number | undefined>(undefined);

  const [suggestedBeds, setSuggestedBeds] = useState<number[]>([]);
  const [suggestedTherapists, setSuggestedTherapists] = useState<number[]>([]);
  const [selectedBeds, setSelectedBeds] = useState<number[]>([]);
  const [selectedTherapists, setSelectedTherapists] = useState<number[]>([]);

  // 📌 출근 순번으로 정렬된 idle 테라피스트
  const idleTherapists = therapists
    .filter(t => t.status === 'idle' && t.checked_in_at)
    .sort((a, b) => (a.checked_in_at || '').localeCompare(b.checked_in_at || ''));

  // 📌 자동 매칭 (출근 순번 기반)
  const handleAutoMatch = () => {
    let matchedTherapist = null;

    if (requestedTherapistId) {
      // 특정 테라피스트 지정
      matchedTherapist = therapists.find(t => t.id === requestedTherapistId && t.status === 'idle');
    } else {
      // 출근 1번 테라피스트
      matchedTherapist = idleTherapists[0];
    }

    if (!matchedTherapist || availableBeds.length === 0) {
      alert('가용 테라피스트 또는 베드가 없습니다');
      return;
    }

    const bedId = availableBeds[0].id;
    setSuggestedBeds([bedId]);
    setSuggestedTherapists([matchedTherapist.id]);
    setSelectedBeds([bedId]);
    setSelectedTherapists([matchedTherapist.id]);
    setStep('matching');
  };

  // 📌 최종 제출
  const handleFinalSubmit = () => {
    if (selectedBeds.length === 0 || selectedTherapists.length === 0) {
      alert('테라피스트와 베드를 선택해주세요');
      return;
    }

    onSubmit({
      serviceType,
      customerName: customerName || 'Walk-in Guest',
      requested_therapist_id: requestedTherapistId,
      suggestedBeds: selectedBeds,
      suggestedTherapists: selectedTherapists,
    });

    // 모달 초기화
    setStep('input');
    setServiceType('swedish');
    setCustomerName('');
    setRequestedTherapistId(undefined);
    setSuggestedBeds([]);
    setSuggestedTherapists([]);
    setSelectedBeds([]);
    setSelectedTherapists([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-gray-800 rounded-xl p-4 sm:p-6 w-full mx-2 sm:mx-4 max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-blue-500 shadow-2xl">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-400">
            ✨ 워크인 손님 추가
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl sm:text-2xl flex-shrink-0">
            ✕
          </button>
        </div>

        {/* Step 1: 기본 정보 입력 */}
        {step === 'input' && (
          <div className="space-y-4">
            {/* 서비스 종류 선택 */}
            <div>
              <label className="text-gray-300 font-bold mb-2 block">💆 서비스 종류</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SERVICE_TYPES.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => setServiceType(svc.id)}
                    className={`p-2 rounded text-sm font-bold transition-colors ${
                      serviceType === svc.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {svc.name} ({svc.duration}분)
                  </button>
                ))}
              </div>
            </div>

            {/* 고객명 입력 */}
            <div>
              <label className="text-gray-300 font-bold mb-2 block">👤 고객명 (선택)</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="손님 이름..."
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* 특정 테라피스트 지정 */}
            <div>
              <label className="text-gray-300 font-bold mb-2 block">💆 테라피스트 지정 (선택)</label>
              <select
                value={requestedTherapistId || ''}
                onChange={e => setRequestedTherapistId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="">미지정 (출근 순번 자동)</option>
                {idleTherapists.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.checked_in_at} 출근) - {t.specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* 가용 현황 */}
            <div className="bg-blue-900/30 border-l-4 border-blue-500 p-3 rounded">
              <div className="text-sm text-blue-300">
                <div>✅ 가용 베드: {availableBeds.length}개</div>
                <div>✅ 대기 테라피스트: {idleTherapists.length}명</div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAutoMatch}
                disabled={!serviceType || idleTherapists.length === 0 || availableBeds.length === 0}
                className={`flex-1 font-bold py-2 rounded transition-colors ${
                  !serviceType || idleTherapists.length === 0 || availableBeds.length === 0
                    ? 'bg-gray-600 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                자동 매칭 진행
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 자동 매칭 + 수동 조정 */}
        {step === 'matching' && (
          <div className="space-y-4">
            {/* 자동 매칭 결과 */}
            <div className="bg-green-900/30 border-l-4 border-green-500 p-3 rounded">
              <div className="text-green-300 font-bold mb-2">✨ 자동 매칭 결과</div>
              <div className="space-y-1 text-sm">
                <div>테라피스트: <span className="text-white font-bold">{therapists.find(t => t.id === suggestedTherapists[0])?.name}</span> ({therapists.find(t => t.id === suggestedTherapists[0])?.checked_in_at} 출근)</div>
                <div>침대: <span className="text-white font-bold">{availableBeds.find(b => b.id === suggestedBeds[0])?.room_zone} - {availableBeds.find(b => b.id === suggestedBeds[0])?.bed_number}번</span></div>
              </div>
            </div>

            {/* 테라피스트 선택 */}
            <div>
              <label className="text-gray-300 font-bold mb-2 block">💆 테라피스트 선택</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {idleTherapists.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTherapists([t.id])}
                    className={`w-full p-2 rounded text-left text-sm transition-colors ${
                      selectedTherapists.includes(t.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold">{idx + 1}위</span> {t.name}
                      </div>
                      <div className="text-xs">{t.checked_in_at} 출근</div>
                    </div>
                    <div className="text-xs text-gray-400">{t.specialty}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 침대 선택 */}
            <div>
              <label className="text-gray-300 font-bold mb-2 block">🛏️ 침대 선택</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {availableBeds.map(bed => (
                  <button
                    key={bed.id}
                    onClick={() => setSelectedBeds([bed.id])}
                    className={`p-2 rounded text-sm font-bold transition-colors ${
                      selectedBeds.includes(bed.id)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div>{bed.room_zone}</div>
                    <div className="text-xs">{bed.bed_number}번</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep('input')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded transition-colors"
              >
                ← 뒤로
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={selectedBeds.length === 0 || selectedTherapists.length === 0}
                className={`flex-1 font-bold py-2 rounded transition-colors ${
                  selectedBeds.length === 0 || selectedTherapists.length === 0
                    ? 'bg-gray-600 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                ✅ 배정 확정
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
