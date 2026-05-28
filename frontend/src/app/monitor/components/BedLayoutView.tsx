'use client';

import { useState } from 'react';
import { therapyBeds, getBedsByRoom, type TherapyBed } from '@/app/admin/massage/mockData/bookingData';

/**
 * 📌 컴포넌트: BedLayoutView
 * 📋 목적: 86개 침대를 4개 마사지룸으로 분류하여 실시간 상태 표시
 * 🎨 기능: 클릭 시 예약, 변경 시 비밀번호 인증
 * 📅 작성일: 2026-05-28
 */

const PASSWORD = '1234'; // 기본 비밀번호

export default function BedLayoutView({ realtimeData }: { realtimeData?: any }) {
  const [selectedBed, setSelectedBed] = useState<TherapyBed | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [formData, setFormData] = useState({
    guestName: '',
    treatment: '',
    startTime: '09:00',
    endTime: '10:00',
  });

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

  const handleSaveClick = () => {
    if (formData.guestName && formData.treatment) {
      setShowPasswordModal(true);
      setPassword('');
      setPasswordError('');
    } else {
      alert('손님 이름과 시술을 입력해주세요.');
    }
  };

  const handlePasswordVerify = () => {
    if (password === PASSWORD) {
      alert('예약이 저장되었습니다!');
      setSelectedBed(null);
      setShowPasswordModal(false);
      setFormData({ guestName: '', treatment: '', startTime: '09:00', endTime: '10:00' });
    } else {
      setPasswordError('비밀번호가 틀렸습니다.');
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {rooms.map(room => (
          <div key={room.id}>
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              {room.name} ({room.beds.length})
            </h2>
            <div className="grid grid-cols-10 gap-2">
              {room.beds.map(bed => (
                <BedCard
                  key={bed.id}
                  bed={bed}
                  onClick={() => setSelectedBed(bed)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bed Detail & Reservation Modal */}
      {selectedBed && !showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">Bed {selectedBed.name}</h2>
                  <p className="text-sm opacity-90">Room: {selectedBed.roomNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedBed(null)}
                  className="text-2xl font-bold hover:opacity-80 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* 침대 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold">타입</p>
                  <p className="text-sm font-bold text-gray-800">
                    {selectedBed.type === 'massage' && '💆 마사지'}
                    {selectedBed.type === 'spa' && '🌊 스파'}
                    {selectedBed.type === 'facial' && '✨ 페이셜'}
                    {selectedBed.type === 'premium' && '👑 프리미엄'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">수용인원</p>
                  <p className="text-sm font-bold text-gray-800">{selectedBed.capacity}명</p>
                </div>
              </div>

              {/* 상태 */}
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">현재 상태</p>
                <div className={`px-3 py-2 rounded-lg text-center text-sm font-bold ${
                  selectedBed.status === 'available' ? 'bg-green-100 text-green-700' :
                  selectedBed.status === 'occupied' ? 'bg-blue-100 text-blue-700' :
                  selectedBed.status === 'cleaning' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedBed.status === 'available' && '✅ 사용 가능'}
                  {selectedBed.status === 'occupied' && '🔵 시술 중'}
                  {selectedBed.status === 'cleaning' && '🟡 청소 중'}
                  {selectedBed.status === 'maintenance' && '🔧 점검 중'}
                </div>
              </div>

              {/* 현재 예약 정보 */}
              {selectedBed.status === 'occupied' && selectedBed.therapistId && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-2 border border-blue-200">
                  <p className="text-xs text-gray-600 font-semibold">현재 예약</p>
                  <p className="text-sm font-bold text-gray-800">시술: {selectedBed.serviceName}</p>
                  <p className="text-sm font-bold text-green-600">종료: {selectedBed.endTime}</p>
                </div>
              )}

              {/* 예약 폼 */}
              {selectedBed.status === 'available' && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                  <p className="text-xs text-gray-600 font-semibold">새 예약 입력</p>

                  <div>
                    <label className="text-xs text-gray-600 font-semibold">손님 이름</label>
                    <input
                      type="text"
                      placeholder="예: 김철수"
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 font-semibold">시술</label>
                    <select
                      value={formData.treatment}
                      onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">선택하세요</option>
                      <option value="Thai Massage">Thai Massage</option>
                      <option value="Swedish Massage">Swedish Massage</option>
                      <option value="Deep Tissue">Deep Tissue</option>
                      <option value="Aromatherapy">Aromatherapy</option>
                      <option value="Hot Stone">Hot Stone</option>
                      <option value="Facial">Facial</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 font-semibold">시작</label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-semibold">종료</label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveClick}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
                  >
                    예약 저장
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelectedBed(null)}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Verification Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="bg-red-500 text-white p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold">🔐 비밀번호 확인</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700 font-semibold">예약 정보를 변경하려면 비밀번호를 입력하세요.</p>

              <div>
                <label className="text-xs text-gray-600 font-semibold">비밀번호</label>
                <input
                  type="password"
                  placeholder="비밀번호 입력"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordVerify()}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                />
                {passwordError && (
                  <p className="mt-2 text-sm text-red-600 font-semibold">{passwordError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold transition"
                >
                  취소
                </button>
                <button
                  onClick={handlePasswordVerify}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * 📌 컴포넌트: BedCard
 * 📋 목적: 개별 침대 상태 카드 표시
 * 🎨 색상: available(초록), occupied(파랑), cleaning(황색), maintenance(회색)
 */
function BedCard({ bed, onClick }: { bed: TherapyBed; onClick: () => void }) {
  const statusColorMap: Record<string, string> = {
    available: 'bg-green-500 text-white hover:bg-green-600',
    occupied: 'bg-blue-500 text-white hover:bg-blue-600',
    cleaning: 'bg-amber-500 text-white hover:bg-amber-600',
    maintenance: 'bg-gray-500 text-white hover:bg-gray-600',
  };

  const typeMap: Record<string, string> = {
    massage: 'Massage',
    spa: 'Spa',
    facial: 'Facial',
    premium: 'Premium',
  };

  return (
    <button
      onClick={onClick}
      className={`px-2 py-2 rounded font-bold text-center text-sm transition cursor-pointer active:scale-95 ${statusColorMap[bed.status]}`}
    >
      <div className="text-xs font-bold">Bed {bed.name.split('-')[1]}</div>
      <div className="text-xs">{typeMap[bed.type]}</div>
    </button>
  );
}
