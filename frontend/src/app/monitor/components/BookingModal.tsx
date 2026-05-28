'use client';

import React, { useState } from 'react';

/**
 * 📌 컴포넌트: BookingModal
 * 📋 목적: Google Sheets 스타일의 예약 데이터 표시, 입력, 수정, 삭제
 * 🎨 디자인: 분홍색 헤더, 다크 테이블, 행별 액션 버튼 (수정/삭제)
 * 📅 작성일: 2026-05-28
 * 🔄 수정: 2026-05-28 - 수정/삭제 기능 추가, 상태 표시
 */

interface BookingData {
  id: number;
  date: string;
  treatment: string;
  startTime: string;
  endTime: string;
  roomNum: string;
  guestName: string;
  note: string;
  pay: string;
  tip: string;
  status?: 'normal' | 'editing' | 'deleting' | 'deleted' | 'error';
  errorMsg?: string;
}

export default function BookingModal({ onClose }: { onClose: () => void }) {
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 30;

  const [bookings, setBookings] = useState<BookingData[]>([
    {
      id: 1,
      date: '2026-05-28',
      treatment: 'Swedish Massage',
      startTime: '09:00',
      endTime: '10:00',
      roomNum: '01',
      guestName: 'John Doe',
      note: 'First time client',
      pay: '$80',
      tip: '$10',
      status: 'normal',
    },
    {
      id: 2,
      date: '2026-05-28',
      treatment: 'Thai Massage',
      startTime: '10:15',
      endTime: '11:15',
      roomNum: '02',
      guestName: 'Jane Smith',
      note: 'Regular client',
      pay: '$85',
      tip: '$15',
      status: 'normal',
    },
    {
      id: 3,
      date: '2026-05-28',
      treatment: 'Hot Stone',
      startTime: '11:30',
      endTime: '12:30',
      roomNum: '03',
      guestName: 'Mike Johnson',
      note: 'Back pain treatment',
      pay: '$95',
      tip: '$20',
      status: 'normal',
    },
  ]);

  const [newBooking, setNewBooking] = useState<BookingData>({
    id: bookings.length + 1,
    date: new Date().toISOString().split('T')[0],
    treatment: '',
    startTime: '',
    endTime: '',
    roomNum: '',
    guestName: '',
    note: '',
    pay: '',
    tip: '',
    status: 'normal',
  });

  // 수정 모드 상태
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<BookingData | null>(null);

  const handleAddBooking = async () => {
    if (
      newBooking.treatment &&
      newBooking.startTime &&
      newBooking.guestName
    ) {
      // 로컬 상태 업데이트
      setBookings([...bookings, newBooking]);

      // Google Sheets에 자동 동기화
      try {
        const response = await fetch('/api/booking/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
          body: JSON.stringify({
            duty_number: String(bookings.length + 1),
            service: newBooking.treatment,
            start_time: newBooking.startTime,
            end_time: newBooking.endTime,
            room_number: newBooking.roomNum,
            guest_name: newBooking.guestName,
            notes: newBooking.note,
            pay: newBooking.pay,
            tip: newBooking.tip,
          }),
        });

        if (!response.ok) {
          console.warn('⚠️ Google Sheets 동기화 실패:', response.statusText);
        } else {
          console.log('✅ Google Sheets에 자동 저장됨');
        }
      } catch (error) {
        console.error('❌ Google Sheets 동기화 오류:', error);
      }

      // 입력 필드 초기화
      setNewBooking({
        id: bookings.length + 2,
        date: new Date().toISOString().split('T')[0],
        treatment: '',
        startTime: '',
        endTime: '',
        roomNum: '',
        guestName: '',
        note: '',
        pay: '',
        tip: '',
        status: 'normal',
      });
    }
  };

  /**
   * 📌 함수: handleEditStart
   * 📋 목적: 예약 데이터를 수정 모드로 로드 (모달 폼에 표시)
   * 🔧 매개변수: booking (BookingData) - 수정할 예약 데이터
   */
  const handleEditStart = (booking: BookingData) => {
    setEditingId(booking.id);
    setEditData({ ...booking });
  };

  /**
   * 📌 함수: handleEditCancel
   * 📋 목적: 수정 모드 취소 (폼 초기화)
   */
  const handleEditCancel = () => {
    setEditingId(null);
    setEditData(null);
  };

  /**
   * 📌 함수: handleEditSave
   * 📋 목적: 수정된 예약 데이터를 Google Sheets에 동기화
   * 🔧 흐름:
   *   1. 로컬 상태 업데이트 (낙관적 UI)
   *   2. PUT /api/booking/update 호출로 Google Sheets 동기화
   *   3. 에러 발생 시 롤백 + 에러 메시지 표시
   */
  const handleEditSave = async () => {
    if (!editData) return;

    // 유효성 검사
    if (!editData.treatment || !editData.startTime || !editData.guestName) {
      alert('필수 항목을 입력해주세요: Treatment, Start Time, Guest Name');
      return;
    }

    // 로컬 상태 먼저 업데이트 (낙관적 UI)
    const updatedBookings = bookings.map((b) =>
      b.id === editData.id
        ? { ...editData, status: 'normal' as const }
        : b
    );
    setBookings(updatedBookings);

    // Google Sheets에 동기화
    try {
      const response = await fetch('/api/booking/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({
          id: editData.id,
          date: editData.date,
          service: editData.treatment,
          start_time: editData.startTime,
          end_time: editData.endTime,
          room_number: editData.roomNum,
          guest_name: editData.guestName,
          notes: editData.note,
          pay: editData.pay,
          tip: editData.tip,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.statusText}`);
      }

      console.log('✅ Google Sheets에 수정사항이 동기화되었습니다');
      setEditingId(null);
      setEditData(null);
    } catch (error) {
      console.error('❌ 수정 중 오류 발생:', error);

      // 에러 상태로 업데이트
      setBookings((prev) =>
        prev.map((b) =>
          b.id === editData.id
            ? {
                ...b,
                status: 'error' as const,
                errorMsg: '동기화 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'),
              }
            : b
        )
      );
    }
  };

  /**
   * 📌 함수: handleDeleteConfirm
   * 📋 목적: 삭제 확인 후 Google Sheets에서 예약 데이터 삭제
   * 🔧 흐름:
   *   1. 사용자 확인 대기
   *   2. 로컬 상태 업데이트 (낙관적 UI - 'deleting' 상태)
   *   3. DELETE /api/booking/delete 호출
   *   4. 성공 시 목록에서 완전히 제거
   *   5. 실패 시 에러 메시지 표시
   */
  const handleDeleteConfirm = async (booking: BookingData) => {
    const confirmed = confirm(
      `정말 삭제하시겠습니까?\n게스트: ${booking.guestName} (${booking.treatment})`
    );

    if (!confirmed) return;

    // 로컬 상태를 'deleting'으로 업데이트 (낙관적 UI)
    setBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id
          ? { ...b, status: 'deleting' as const }
          : b
      )
    );

    try {
      const response = await fetch('/api/booking/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({
          id: booking.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.statusText}`);
      }

      // 성공: 목록에서 완전히 제거
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
      console.log('✅ Google Sheets에서 예약이 삭제되었습니다');
    } catch (error) {
      console.error('❌ 삭제 중 오류 발생:', error);

      // 에러: 상태를 'error'로 변경
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? {
                ...b,
                status: 'error' as const,
                errorMsg: '삭제 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'),
              }
            : b
        )
      );
    }
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = bookings.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">📋 BOOKING WITH THERAPIST</h2>
            <p className="text-sm text-white/80 mt-1">Google Sheets Integration Data</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl text-white hover:bg-white/20 rounded-lg p-2 transition font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation (30개 이상일 때) */}
        {totalPages > 1 && (
          <div className="bg-slate-800 border-b border-slate-700 px-6 py-2 flex gap-2 overflow-x-auto">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                className={`px-4 py-2 rounded font-bold text-sm whitespace-nowrap transition ${
                  currentPage === idx
                    ? 'bg-pink-500 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {`Sheet ${idx + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 border-b border-slate-700">
                <th className="px-4 py-3 text-left text-white font-bold">DATE</th>
                <th className="px-4 py-3 text-left text-white font-bold">N#</th>
                <th className="px-4 py-3 text-left text-white font-bold">TRT</th>
                <th className="px-4 py-3 text-left text-white font-bold">START</th>
                <th className="px-4 py-3 text-left text-white font-bold">END</th>
                <th className="px-4 py-3 text-left text-white font-bold">RM#</th>
                <th className="px-4 py-3 text-left text-white font-bold">GUEST</th>
                <th className="px-4 py-3 text-left text-white font-bold">NOTE</th>
                <th className="px-4 py-3 text-left text-white font-bold">PAY</th>
                <th className="px-4 py-3 text-left text-white font-bold">TIP</th>
                <th className="px-4 py-3 text-left text-white font-bold">ACTION</th>
                <th className="px-4 py-3 text-left text-white font-bold">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBookings.map((booking, idx) => (
                <tr
                  key={booking.id}
                  className={`border-b border-slate-700 ${
                    booking.status === 'deleting'
                      ? 'bg-red-900/30 opacity-60'
                      : booking.status === 'error'
                      ? 'bg-red-900/50'
                      : booking.status === 'editing'
                      ? 'bg-blue-900/30'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  <td className="px-4 py-3 text-gray-300 text-xs">{booking.date}</td>
                  <td className="px-4 py-3 text-gray-300">{currentPage * ITEMS_PER_PAGE + idx + 1}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.treatment}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.startTime}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.endTime}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.roomNum}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.guestName}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.note}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.pay}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.tip}</td>

                  {/* Action Buttons */}
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap space-x-2">
                    <button
                      onClick={() => handleEditStart(booking)}
                      disabled={booking.status === 'deleting'}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded font-bold transition"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteConfirm(booking)}
                      disabled={booking.status === 'deleting'}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-xs rounded font-bold transition"
                    >
                      삭제
                    </button>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3 text-xs">
                    {booking.status === 'normal' && (
                      <span className="px-2 py-1 bg-green-600/30 text-green-300 rounded">정상</span>
                    )}
                    {booking.status === 'editing' && (
                      <span className="px-2 py-1 bg-blue-600/30 text-blue-300 rounded animate-pulse">
                        수정중
                      </span>
                    )}
                    {booking.status === 'deleting' && (
                      <span className="px-2 py-1 bg-red-600/30 text-red-300 rounded animate-pulse">
                        삭제중
                      </span>
                    )}
                    {booking.status === 'deleted' && (
                      <span className="px-2 py-1 bg-gray-600/30 text-gray-300 rounded">
                        삭제완료
                      </span>
                    )}
                    {booking.status === 'error' && (
                      <div className="space-y-1">
                        <span className="px-2 py-1 bg-red-600/50 text-red-100 rounded block text-xs">
                          오류
                        </span>
                        <span className="text-red-300 text-xs block">{booking.errorMsg}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info + Input Section */}
        <div className="bg-slate-800 border-t border-slate-700 px-6 py-4 space-y-4">
          <p className="text-sm text-gray-400 text-center">
            💬 Google Sheets에서 실시간으로 동기화된 마사지 예약 스케줄 (총 {bookings.length}건)
          </p>

          {/* Edit Modal (수정 중일 때) */}
          {editingId !== null && editData && (
            <div className="bg-slate-700 rounded-lg p-4 space-y-3 border-2 border-blue-500">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-white">
                  예약 수정 (ID: {editData.id}) - {editData.guestName}
                </h3>
                <button
                  onClick={handleEditCancel}
                  className="text-gray-400 hover:text-white text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Edit Form Grid */}
              <div className="grid grid-cols-10 gap-2">
                <input
                  type="date"
                  value={editData.date}
                  onChange={(e) =>
                    setEditData({ ...editData, date: e.target.value })
                  }
                  className="px-3 py-2 bg-slate-600 text-white rounded text-xs"
                />
                <input
                  type="text"
                  placeholder="TRT"
                  value={editData.treatment}
                  onChange={(e) =>
                    setEditData({ ...editData, treatment: e.target.value })
                  }
                  className="px-3 py-2 bg-slate-600 text-white rounded text-xs"
                />
                <input
                  type="time"
                  value={editData.startTime}
                  onChange={(e) =>
                    setEditData({ ...editData, startTime: e.target.value })
                  }
                  className="px-3 py-2 bg-slate-600 text-white rounded text-xs"
                />
                <input
                  type="time"
                  value={editData.endTime}
                  onChange={(e) =>
                    setEditData({ ...editData, endTime: e.target.value })
                  }
                  className="px-3 py-2 bg-slate-600 text-white rounded text-xs"
                />
                <input
                  type="text"
                  placeholder="RM#"
                  value={editData.roomNum}
                  onChange={(e) =>
                    setEditData({ ...editData, roomNum: e.target.value })
                  }
                  className="px-3 py-2 bg-slate-600 text-white rounded text-xs"
                />
                <input
                  type="text"
                  placeholder="Guest"
                  value={editData.guestName}
                  onChange={(e) =>
                    setEditData({ ...editData, guestName: e.target.value })
                  }
                  className="px-3 py-2 bg-slate-600 text-white rounded text-xs"
                />
                <input
                  type="text"
                  placeholder="Note"
                  value={editData.note}
                  onChange={(e) =>
                    setEditData({ ...editData, note: e.target.value })
                  }
                  className="px-3 py-2 bg-slate-600 text-white rounded text-xs"
                />
                <input
                  type="text"
                  placeholder="Pay"
                  value={editData.pay}
                  onChange={(e) =>
                    setEditData({ ...editData, pay: e.target.value })
                  }
                  className="px-3 py-2 bg-slate-600 text-white rounded text-xs"
                />
                <input
                  type="text"
                  placeholder="Tip"
                  value={editData.tip}
                  onChange={(e) =>
                    setEditData({ ...editData, tip: e.target.value })
                  }
                  className="px-3 py-2 bg-slate-600 text-white rounded text-xs"
                />
                <div className="flex gap-2 col-span-2">
                  <button
                    onClick={handleEditSave}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-xs transition"
                  >
                    저장
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-bold text-xs transition"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Booking Input Form (수정 중이 아닐 때만 표시) */}
          {editingId === null && (
            <div className="grid grid-cols-10 gap-2">
              <input
                type="date"
                value={newBooking.date}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, date: e.target.value })
                }
                className="px-3 py-2 bg-slate-700 text-white rounded text-xs"
              />
              <input
                type="text"
                placeholder="TRT"
                value={newBooking.treatment}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, treatment: e.target.value })
                }
                className="px-3 py-2 bg-slate-700 text-white rounded text-xs"
              />
              <input
                type="time"
                value={newBooking.startTime}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, startTime: e.target.value })
                }
                className="px-3 py-2 bg-slate-700 text-white rounded text-xs"
              />
              <input
                type="time"
                value={newBooking.endTime}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, endTime: e.target.value })
                }
                className="px-3 py-2 bg-slate-700 text-white rounded text-xs"
              />
              <input
                type="text"
                placeholder="RM#"
                value={newBooking.roomNum}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, roomNum: e.target.value })
                }
                className="px-3 py-2 bg-slate-700 text-white rounded text-xs"
              />
              <input
                type="text"
                placeholder="Guest"
                value={newBooking.guestName}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, guestName: e.target.value })
                }
                className="px-3 py-2 bg-slate-700 text-white rounded text-xs"
              />
              <input
                type="text"
                placeholder="Note"
                value={newBooking.note}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, note: e.target.value })
                }
                className="px-3 py-2 bg-slate-700 text-white rounded text-xs"
              />
              <input
                type="text"
                placeholder="Pay"
                value={newBooking.pay}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, pay: e.target.value })
                }
                className="px-3 py-2 bg-slate-700 text-white rounded text-xs"
              />
              <input
                type="text"
                placeholder="Tip"
                value={newBooking.tip}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, tip: e.target.value })
                }
                className="px-3 py-2 bg-slate-700 text-white rounded text-xs"
              />
              <button
                onClick={handleAddBooking}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-xs col-span-2 transition"
              >
                ADD & SYNC
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-700 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
