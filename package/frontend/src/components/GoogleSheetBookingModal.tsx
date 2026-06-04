'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface BookingData {
  duty_number: string;
  service: string;
  start_time: string;
  end_time: string;
  room_number: string;
  guest_name: string;
  notes: string;
  pay: string;
  tip: string;
}

interface GoogleSheetBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  onLoginClick: () => void;
}

export function GoogleSheetBookingModal({
  isOpen,
  onClose,
  isConnected,
  onLoginClick,
}: GoogleSheetBookingModalProps) {
  const [formData, setFormData] = useState<BookingData>({
    duty_number: '',
    service: '',
    start_time: '',
    end_time: '',
    room_number: '',
    guest_name: '',
    notes: '',
    pay: '',
    tip: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('https://elspa-api-production.jitnet57.workers.dev/api/booking/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage('✅ 예약이 저장되었습니다!');
        // 폼 초기화
        setFormData({
          duty_number: '',
          service: '',
          start_time: '',
          end_time: '',
          room_number: '',
          guest_name: '',
          notes: '',
          pay: '',
          tip: '',
        });
        // 2초 후 모달 닫기
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const error = await response.json();
        setMessage(`❌ 저장 실패: ${error.detail}`);
      }
    } catch (error) {
      setMessage(`❌ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">📊 Google Sheets 예약</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {!isConnected ? (
          // Google 로그인 필요
          <div className="flex flex-col items-center justify-center py-12 gap-6">
            <div className="text-center">
              <p className="text-gray-300 mb-4">Google Sheets에 연결하려면 로그인하세요</p>
              <button
                onClick={onLoginClick}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition"
              >
                🔓 Google로 로그인
              </button>
            </div>
          </div>
        ) : (
          // 예약 폼
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Grid Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* 9-5PM DUTY N# */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  9-5PM DUTY N#
                </label>
                <input
                  type="text"
                  name="duty_number"
                  value={formData.duty_number}
                  onChange={handleInputChange}
                  placeholder="예: D001"
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 1ST TRT (Service) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  1ST TRT (서비스)
                </label>
                <input
                  type="text"
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                  placeholder="예: Swedish Massage"
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 1ST START */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  1ST START (시작 시간)
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 1ST END */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  1ST END (종료 시간)
                </label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 1ST RM# */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  1ST RM# (룸 번호)
                </label>
                <input
                  type="text"
                  name="room_number"
                  value={formData.room_number}
                  onChange={handleInputChange}
                  placeholder="예: 01"
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 1ST GUEST */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  1ST GUEST (손님명)
                </label>
                <input
                  type="text"
                  name="guest_name"
                  value={formData.guest_name}
                  onChange={handleInputChange}
                  placeholder="예: John Doe"
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 1ST PAY */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  1ST PAY (금액)
                </label>
                <input
                  type="text"
                  name="pay"
                  value={formData.pay}
                  onChange={handleInputChange}
                  placeholder="예: $100"
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 1ST TIP */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  1ST TIP (팁)
                </label>
                <input
                  type="text"
                  name="tip"
                  value={formData.tip}
                  onChange={handleInputChange}
                  placeholder="예: $20"
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* 1ST NOTE (Notes) - Full Width */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                1ST NOTE (메모)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="추가 정보..."
                rows={3}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Message */}
            {message && (
              <div className="p-3 rounded-lg bg-slate-800 border border-white/10">
                <p className="text-sm text-gray-300">{message}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
              >
                {isLoading ? '💾 저장 중...' : '✅ 저장'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
              >
                ❌ 닫기
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
