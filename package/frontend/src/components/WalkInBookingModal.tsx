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
  { id: 'swedish', name: 'Swedish', duration: 60 },
  { id: 'thai', name: 'Thai', duration: 90 },
  { id: 'hotstone', name: 'Hot Stone', duration: 60 },
  { id: 'foot', name: 'Deep Tissue', duration: 30 },
  { id: 'aroma', name: 'Aroma', duration: 45 },
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
      alert('No available therapists or beds');
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
      alert('Please select a therapist and bed');
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
            ✨ Add Walk-in Customer
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
              <label className="text-gray-300 font-bold mb-2 block">💆 Service Type</label>
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
                    {svc.name} ({svc.duration} min)
                  </button>
                ))}
              </div>
            </div>

            {/* 고객명 입력 */}
            <div>
              <label className="text-gray-300 font-bold mb-2 block">👤 Customer Name (Optional)</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Guest Name..."
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* 특정 테라피스트 지정 */}
            <div>
              <label className="text-gray-300 font-bold mb-2 block">💆 Therapist Assignment (Optional)</label>
              <select
                value={requestedTherapistId || ''}
                onChange={e => setRequestedTherapistId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Unassigned (Auto by Check-in Order)</option>
                {idleTherapists.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} (checked in: {t.checked_in_at}) - {t.specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* 가용 현황 */}
            <div className="bg-blue-900/30 border-l-4 border-blue-500 p-3 rounded">
              <div className="text-sm text-blue-300">
                <div>✅ Available Beds: {availableBeds.length}</div>
                <div>✅ Waiting Therapists: {idleTherapists.length}</div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded transition-colors"
              >
                Cancel
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
                Auto Match
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 자동 매칭 + 수동 조정 */}
        {step === 'matching' && (
          <div className="space-y-4">
            {/* 자동 매칭 결과 */}
            <div className="bg-green-900/30 border-l-4 border-green-500 p-3 rounded">
              <div className="text-green-300 font-bold mb-2">✨ Auto Match Result</div>
              <div className="space-y-1 text-sm">
                <div>Therapist: <span className="text-white font-bold">{therapists.find(t => t.id === suggestedTherapists[0])?.name}</span> (checked in: {therapists.find(t => t.id === suggestedTherapists[0])?.checked_in_at})</div>
                <div>Bed: <span className="text-white font-bold">{availableBeds.find(b => b.id === suggestedBeds[0])?.room_zone} - Bed {availableBeds.find(b => b.id === suggestedBeds[0])?.bed_number}</span></div>
              </div>
            </div>

            {/* 테라피스트 선택 - 멀티 선택 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-300 font-bold block">💆 Select Therapist(s)</label>
                <span className="text-cyan-400 font-bold text-sm">
                  Selected: {selectedTherapists.length}
                </span>
              </div>

              {/* 검색 기능 추가 (선택 사항) */}
              <input
                type="text"
                placeholder="Search by name or ID..."
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none mb-3 text-sm"
              />

              {/* 테라피스트 목록 - 체크박스 형식 */}
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-600 rounded-lg p-3 bg-gray-800/50">
                {idleTherapists.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-4">No available therapists</div>
                ) : (
                  idleTherapists.map((t, idx) => (
                    <label key={t.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-700/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedTherapists.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTherapists([...selectedTherapists, t.id]);
                          } else {
                            setSelectedTherapists(selectedTherapists.filter(id => id !== t.id));
                          }
                        }}
                        className="w-4 h-4 mt-1 accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">#{idx + 1}</span>
                          <span className="text-white font-semibold truncate">{t.name}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {t.specialty} • checked in: {t.checked_in_at}
                        </div>
                      </div>
                      {selectedTherapists.includes(t.id) && (
                        <span className="text-indigo-400 text-lg flex-shrink-0">✓</span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* 침대 선택 - 멀티 선택 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-300 font-bold block">🛏️ Select Bed(s)</label>
                <span className="text-green-400 font-bold text-sm">
                  Selected: {selectedBeds.length}
                </span>
              </div>

              {/* 침대 그리드 - 클릭으로 다중 선택 */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-3 border border-gray-600 rounded-lg bg-gray-800/50">
                {/* Unassigned 옵션 */}
                <button
                  onClick={() => {
                    if (selectedBeds.length === 0) {
                      setSelectedBeds([]);
                    } else {
                      setSelectedBeds([]);
                    }
                  }}
                  className={`p-3 rounded-lg font-bold text-sm transition-all border-2 ${
                    selectedBeds.length === 0
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/50'
                      : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'
                  }`}
                  title="Auto by Check-in Order"
                >
                  <div className="text-xs">Unassigned</div>
                  <div className="text-xs mt-1">(Auto)</div>
                </button>

                {/* 개별 침대 선택 */}
                {availableBeds.length === 0 ? (
                  <div className="col-span-full text-gray-500 text-sm text-center py-6">
                    No available beds
                  </div>
                ) : (
                  availableBeds.map(bed => (
                    <button
                      key={bed.id}
                      onClick={() => {
                        if (selectedBeds.includes(bed.id)) {
                          setSelectedBeds(selectedBeds.filter(id => id !== bed.id));
                        } else {
                          setSelectedBeds([...selectedBeds, bed.id]);
                        }
                      }}
                      className={`p-3 rounded-lg font-bold text-sm transition-all border-2 ${
                        selectedBeds.includes(bed.id)
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/50'
                          : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="text-xs font-semibold">{bed.room_zone}</div>
                      <div className="text-xs mt-1">Bed {bed.bed_number}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* 선택 요약 */}
            {(selectedTherapists.length > 0 || selectedBeds.length > 0) && (
              <div className="bg-blue-900/30 border-l-4 border-blue-500 p-3 rounded">
                <div className="text-blue-300 font-bold mb-2">📋 Selection Summary</div>
                <div className="space-y-2 text-sm">
                  {selectedTherapists.length > 0 && (
                    <div>
                      <span className="text-gray-400">Therapists ({selectedTherapists.length}):</span>
                      <div className="text-white font-semibold flex flex-wrap gap-2 mt-1">
                        {selectedTherapists.map(tId => {
                          const therapist = therapists.find(t => t.id === tId);
                          return (
                            <span key={tId} className="bg-indigo-600/40 px-2 py-1 rounded text-xs">
                              {therapist?.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {selectedBeds.length > 0 && (
                    <div>
                      <span className="text-gray-400">Beds ({selectedBeds.length}):</span>
                      <div className="text-white font-semibold flex flex-wrap gap-2 mt-1">
                        {selectedBeds.map(bedId => {
                          const bed = availableBeds.find(b => b.id === bedId);
                          return (
                            <span key={bedId} className="bg-green-600/40 px-2 py-1 rounded text-xs">
                              {bed?.room_zone} - Bed {bed?.bed_number}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep('input')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded transition-colors"
              >
                ← Back
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
                ✅ Confirm Assignment ({selectedTherapists.length} therapist(s), {selectedBeds.length} bed(s))
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
