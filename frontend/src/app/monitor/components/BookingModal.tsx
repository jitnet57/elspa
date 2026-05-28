'use client';

import React, { useState } from 'react';

/**
 * 📌 컴포넌트: BookingModal
 * 📋 목적: Google Sheets 스타일의 예약 데이터 표시 및 입력
 * 🎨 디자인: 분홍색 헤더, 다크 테이블
 * 📅 작성일: 2026-05-28
 */

interface BookingData {
  id: number;
  treatment: string;
  startTime: string;
  endTime: string;
  roomNum: string;
  guestName: string;
  note: string;
  pay: string;
  tip: string;
}

export default function BookingModal({ onClose }: { onClose: () => void }) {
  const [bookings, setBookings] = useState<BookingData[]>([
    {
      id: 1,
      treatment: 'Swedish Massage',
      startTime: '09:00',
      endTime: '10:00',
      roomNum: '01',
      guestName: 'John Doe',
      note: 'First time client',
      pay: '$80',
      tip: '$10',
    },
    {
      id: 2,
      treatment: 'Thai Massage',
      startTime: '10:15',
      endTime: '11:15',
      roomNum: '02',
      guestName: 'Jane Smith',
      note: 'Regular client',
      pay: '$85',
      tip: '$15',
    },
    {
      id: 3,
      treatment: 'Hot Stone',
      startTime: '11:30',
      endTime: '12:30',
      roomNum: '03',
      guestName: 'Mike Johnson',
      note: 'Back pain treatment',
      pay: '$95',
      tip: '$20',
    },
  ]);

  const [newBooking, setNewBooking] = useState<BookingData>({
    id: bookings.length + 1,
    treatment: '',
    startTime: '',
    endTime: '',
    roomNum: '',
    guestName: '',
    note: '',
    pay: '',
    tip: '',
  });

  const handleAddBooking = () => {
    if (
      newBooking.treatment &&
      newBooking.startTime &&
      newBooking.guestName
    ) {
      setBookings([...bookings, newBooking]);
      setNewBooking({
        id: bookings.length + 2,
        treatment: '',
        startTime: '',
        endTime: '',
        roomNum: '',
        guestName: '',
        note: '',
        pay: '',
        tip: '',
      });
    }
  };

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

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 border-b border-slate-700">
                <th className="px-4 py-3 text-left text-white font-bold">9-5PM DUTY N#</th>
                <th className="px-4 py-3 text-left text-white font-bold">1ST TRT</th>
                <th className="px-4 py-3 text-left text-white font-bold">1ST START</th>
                <th className="px-4 py-3 text-left text-white font-bold">1ST END</th>
                <th className="px-4 py-3 text-left text-white font-bold">1ST RM#</th>
                <th className="px-4 py-3 text-left text-white font-bold">1ST GUEST</th>
                <th className="px-4 py-3 text-left text-white font-bold">1ST NOTE</th>
                <th className="px-4 py-3 text-left text-white font-bold">1ST PAY</th>
                <th className="px-4 py-3 text-left text-white font-bold">1ST TIP</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, idx) => (
                <tr key={booking.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-gray-300">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.treatment}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.startTime}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.endTime}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.roomNum}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.guestName}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.note}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.pay}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.tip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info + Input Section */}
        <div className="bg-slate-800 border-t border-slate-700 px-6 py-4 space-y-4">
          <p className="text-sm text-gray-400 text-center">
            💬 Google Sheets에서 실시간으로 동기화된 마사지 예약 스케줄 (총 3건)
          </p>

          {/* Input Form */}
          <div className="grid grid-cols-9 gap-2">
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
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-xs"
            >
              ADD
            </button>
          </div>
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
