/**
 * ============================================================
 * 📌 컴포넌트: WalkInBookingModal
 * 📋 목적: 워크인 손님 수동 입력 모달 (인원수 + 서비스 종류 선택)
 * 🎯 기능:
 *   - 인원수 입력 (1~10명)
 *   - 서비스 종류 선택 (스웨디시, 타이마사지, 핫스톤 등)
 *   - 자동/수동 베드-테라피스트 매칭 제시
 * 📅 작성일: 2025-05-13
 * ============================================================
 */

'use client';

import { useState } from 'react';

// ============================================================
// 🔧 인터페이스 정의
// ============================================================

interface WalkInBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WalkInBookingRequest) => void;
  availableBeds: any[];
  therapists: any[];
}

export interface WalkInBookingRequest {
  count: number;           // 인원수
  serviceType: string;     // 서비스 종류
  suggestedBeds: number[]; // 추천 베드 ID
  suggestedTherapists: number[]; // 추천 테라피스트 ID
}

const SERVICE_TYPES = [
  { id: 'swedish', name: '스웨디시 60분', duration: 60 },
  { id: 'thai', name: '타이마사지 90분', duration: 90 },
  { id: 'hotstone', name: '핫스톤 60분', duration: 60 },
  { id: 'foot', name: '발마사지 30분', duration: 30 },
  { id: 'aroma', name: '아로마테라피 45분', duration: 45 },
];

/**
 * ============================================================
 * 🎯 메인 컴포넌트
 * ============================================================
 */
export const WalkInBookingModal = ({
  isOpen,
  onClose,
  onSubmit,
  availableBeds,
  therapists,
}: WalkInBookingModalProps) => {
  const [step, setStep] = useState<'input' | 'matching'>('input');
  const [count, setCount] = useState(1);
  const [serviceType, setServiceType] = useState('swedish');
  const [suggestedBeds, setSuggestedBeds] = useState<number[]>([]);
  const [suggestedTherapists, setSuggestedTherapists] = useState<number[]>([]);
  const [selectedBeds, setSelectedBeds] = useState<number[]>([]);
  const [selectedTherapists, setSelectedTherapists] = useState<number[]>([]);

  // ============================================================
  // 📌 함수: 자동 매칭 제시
  // ============================================================
  const handleAutoMatch = () => {
    // 가용 베드 중에서 처음 count개 선택
    const beds = availableBeds.slice(0, count).map(b => b.id);

    // 대기 테라피스트 중에서 처음 count개 선택
    const idleTherapists = therapists
      .filter(t => t.status === 'idle')
      .slice(0, count)
      .map(t => t.id);

    setSuggestedBeds(beds);
    setSuggestedTherapists(idleTherapists);
    setSelectedBeds(beds);
    setSelectedTherapists(idleTherapists);
    setStep('matching');
  };

  // ============================================================
  // 📌 함수: 최종 제출
  // ============================================================
  const handleFinalSubmit = () => {
    const service = SERVICE_TYPES.find(s => s.id === serviceType);
    if (!service || selectedBeds.length === 0 || selectedTherapists.length === 0) {
      alert('모든 필드를 선택해주세요');
      return;
    }

    onSubmit({
      count,
      serviceType,
      suggestedBeds: selectedBeds,
      suggestedTherapists: selectedTherapists,
    });

    // 모달 초기화
    setStep('input');
    setCount(1);
    setServiceType('swedish');
    setSuggestedBeds([]);
    setSuggestedTherapists([]);
    setSelectedBeds([]);
    setSelectedTherapists([]);
    onClose();
  };

  // ============================================================
  // 🎨 렌더링: 닫혀있으면 아무것도 표시 안 함
  // ============================================================
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 어두움 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 박스 */}
      <div className="relative bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            ✨ 워크인 손님 추가
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Step 1: 입력 폼 */}
        {step === 'input' && (
          <div className="space-y-6">
            {/* 인원수 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                👥 인원수
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <button
                    key={num}
                    onClick={() => setCount(num)}
                    className={`
                      px-3 py-2 rounded font-medium transition
                      ${count === num
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }
                    `}
                  >
                    {num}명
                  </button>
                ))}
              </div>
            </div>

            {/* 서비스 종류 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                💆 서비스 종류
              </label>
              <div className="space-y-2">
                {SERVICE_TYPES.map(service => (
                  <label
                    key={service.id}
                    className="flex items-center p-3 rounded bg-gray-800 hover:bg-gray-700 cursor-pointer transition"
                  >
                    <input
                      type="radio"
                      name="service"
                      value={service.id}
                      checked={serviceType === service.id}
                      onChange={() => setServiceType(service.id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="ml-3 text-gray-200">{service.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 가용 현황 요약 */}
            <div className="bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded">
              <div className="text-sm text-gray-300">
                <div>✅ 가용 베드: {availableBeds.length}개</div>
                <div>✅ 대기 테라피스트: {therapists.filter(t => t.status === 'idle').length}명</div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition"
              >
                취소
              </button>
              <button
                onClick={handleAutoMatch}
                disabled={count > availableBeds.length}
                className={`
                  flex-1 px-4 py-2 rounded font-medium transition
                  ${count > availableBeds.length
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                `}
              >
                자동 매칭 진행
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 매칭 확인 */}
        {step === 'matching' && (
          <div className="space-y-6">
            <div className="bg-green-900/30 border-l-4 border-green-500 p-4 rounded">
              <div className="text-sm text-green-300 font-bold">
                ✅ 자동 매칭 완료
              </div>
            </div>

            {/* 베드 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                🛏️ 베드 선택 ({selectedBeds.length}/{count}명)
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {availableBeds.map(bed => (
                  <button
                    key={bed.id}
                    onClick={() => {
                      if (selectedBeds.includes(bed.id)) {
                        setSelectedBeds(selectedBeds.filter(id => id !== bed.id));
                      } else if (selectedBeds.length < count) {
                        setSelectedBeds([...selectedBeds, bed.id]);
                      }
                    }}
                    className={`
                      p-2 rounded font-medium text-sm transition
                      ${selectedBeds.includes(bed.id)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }
                    `}
                  >
                    {bed.bed_number}번
                  </button>
                ))}
              </div>
            </div>

            {/* 테라피스트 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                👨‍⚕️ 테라피스트 선택 ({selectedTherapists.length}/{count}명)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {therapists
                  .filter(t => t.status === 'idle' || selectedTherapists.includes(t.id))
                  .map(therapist => (
                    <label
                      key={therapist.id}
                      className="flex items-center p-2 rounded bg-gray-800 hover:bg-gray-700 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTherapists.includes(therapist.id)}
                        onChange={() => {
                          if (selectedTherapists.includes(therapist.id)) {
                            setSelectedTherapists(
                              selectedTherapists.filter(id => id !== therapist.id)
                            );
                          } else if (selectedTherapists.length < count) {
                            setSelectedTherapists([...selectedTherapists, therapist.id]);
                          }
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="ml-2 text-gray-200">{therapist.name}</span>
                      <span className="ml-auto text-xs text-gray-400">
                        {therapist.status === 'idle' ? '대기중' : therapist.status}
                      </span>
                    </label>
                  ))}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('input')}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition"
              >
                ← 뒤로
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={selectedBeds.length !== count || selectedTherapists.length !== count}
                className={`
                  flex-1 px-4 py-2 rounded font-medium transition
                  ${selectedBeds.length !== count || selectedTherapists.length !== count
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                  }
                `}
              >
                ✅ 예약 확정
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
