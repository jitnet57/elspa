'use client';

import React, { useState } from 'react';
import {
  useGetBookings,
  useCreateBooking,
  useUpdateBooking,
  useDeleteBooking,
  usePagedBookings,
  ordinal,
} from '@/hooks/useBookings';
import type { Booking } from '@/lib/api/supabase-adapter';

/**
 * 📌 컴포넌트: BookingModal (BOOKING WITH THERAPIST)
 * 📋 목적: Supabase bookings 테이블에 예약 등록/수정/조회 (백엔드 없음)
 * 📄 페이지: 30개까지 1페이지(1st), 초과 시 2nd, 또 초과 시 3rd …
 * 🎨 디자인: 분홍 헤더 + 다크 테이블 + 행별 수정/삭제 + 상태(정상)
 * 🔄 저장 즉시 Supabase 반영 → 1시간 단위 Google Sheet 백업(Apps Script)
 * 📅 작성일: 2026-05-28 / 개정: 2026-05-31 (Supabase 연동)
 */

const ITEMS_PER_PAGE = 30;

// 폼(로컬) 표현 — UI 친화 camelCase
interface BookingForm {
  date: string;
  treatment: string;
  startTime: string;
  endTime: string;
  roomNum: string;
  guestName: string;
  note: string;
  pay: string;
  tip: string;
}

const emptyForm = (): BookingForm => ({
  date: new Date().toISOString().split('T')[0],
  treatment: '',
  startTime: '',
  endTime: '',
  roomNum: '',
  guestName: '',
  note: '',
  pay: '',
  tip: '',
});

// 폼 → Supabase Booking 레코드 변환
const toRecord = (f: BookingForm, seqNo?: number): Partial<Booking> => ({
  booking_date: f.date,
  seq_no: seqNo,
  treatment: f.treatment,
  start_time: f.startTime,
  end_time: f.endTime,
  room_num: f.roomNum,
  guest_name: f.guestName,
  note: f.note,
  pay: f.pay ? Number(String(f.pay).replace(/[^0-9.]/g, '')) : undefined,
  tip: f.tip ? Number(String(f.tip).replace(/[^0-9.]/g, '')) : undefined,
  status: 'normal',
});

// Supabase Booking → 폼 변환 (수정 로드용)
const toForm = (b: Booking): BookingForm => ({
  date: b.booking_date,
  treatment: b.treatment ?? '',
  startTime: b.start_time ?? '',
  endTime: b.end_time ?? '',
  roomNum: b.room_num ?? '',
  guestName: b.guest_name ?? '',
  note: b.note ?? '',
  pay: b.pay != null ? String(b.pay) : '',
  tip: b.tip != null ? String(b.tip) : '',
});

const money = (v?: number) => (v != null ? `$${v}` : '');

export default function BookingModal({ onClose }: { onClose: () => void }) {
  const [currentPage, setCurrentPage] = useState(0);

  // Supabase 데이터 + mutation 훅
  const { data: bookings = [], isLoading, error } = useGetBookings();
  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();

  // 30개 단위 페이지 분할 (1st / 2nd / 3rd …)
  const { pageItems, totalPages, pageLabels } = usePagedBookings(bookings, currentPage, ITEMS_PER_PAGE);

  const [newBooking, setNewBooking] = useState<BookingForm>(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<BookingForm | null>(null);

  // 등록
  const handleAddBooking = async () => {
    if (!newBooking.treatment || !newBooking.startTime || !newBooking.guestName) {
      alert('필수 항목을 입력해주세요: TRT, Start, Guest');
      return;
    }
    try {
      await createBooking.mutateAsync(toRecord(newBooking, bookings.length + 1));
      setNewBooking(emptyForm());
      // 마지막 페이지로 이동 (방금 등록분 보이게)
      setCurrentPage(Math.floor(bookings.length / ITEMS_PER_PAGE));
    } catch (e) {
      alert('등록 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    }
  };

  // 수정 시작/취소/저장
  const handleEditStart = (b: Booking) => {
    setEditingId(b.id);
    setEditData(toForm(b));
  };
  const handleEditCancel = () => {
    setEditingId(null);
    setEditData(null);
  };
  const handleEditSave = async () => {
    if (!editData || editingId == null) return;
    if (!editData.treatment || !editData.startTime || !editData.guestName) {
      alert('필수 항목을 입력해주세요: TRT, Start, Guest');
      return;
    }
    try {
      await updateBooking.mutateAsync({ id: editingId, patch: toRecord(editData) });
      handleEditCancel();
    } catch (e) {
      alert('수정 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    }
  };

  // 삭제
  const handleDeleteConfirm = async (b: Booking) => {
    if (!confirm(`정말 삭제하시겠습니까?\n게스트: ${b.guest_name} (${b.treatment})`)) return;
    try {
      await deleteBooking.mutateAsync(b.id);
    } catch (e) {
      alert('삭제 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
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

        {/* 페이지 탭 (30개 초과 시 1st / 2nd / 3rd …) */}
        {totalPages > 1 && (
          <div className="bg-slate-800 border-b border-slate-700 px-6 py-2 flex gap-2 overflow-x-auto">
            {pageLabels.map((label, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                className={`px-4 py-2 rounded font-bold text-sm whitespace-nowrap transition ${
                  currentPage === idx
                    ? 'bg-pink-500 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 border-b border-slate-700">
                {['DATE', 'N#', 'TRT', 'START', 'END', 'RM#', 'GUEST', 'NOTE', 'PAY', 'TIP', 'ACTION', 'STATUS'].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 text-left text-white font-bold">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              )}
              {error && !isLoading && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-red-400">
                    데이터를 불러오지 못했습니다. (Supabase 설정 확인)
                  </td>
                </tr>
              )}
              {!isLoading && !error && pageItems.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-400">
                    등록된 예약이 없습니다. 아래에서 새 예약을 등록하세요.
                  </td>
                </tr>
              )}
              {pageItems.map((booking, idx) => (
                <tr
                  key={booking.id}
                  className={`border-b border-slate-700 ${
                    booking.status === 'error' ? 'bg-red-900/50' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <td className="px-4 py-3 text-gray-300 text-xs">{booking.booking_date}</td>
                  <td className="px-4 py-3 text-gray-300">{currentPage * ITEMS_PER_PAGE + idx + 1}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.treatment}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.start_time}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.end_time}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.room_num}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.guest_name}</td>
                  <td className="px-4 py-3 text-gray-300">{booking.note}</td>
                  <td className="px-4 py-3 text-gray-300">{money(booking.pay)}</td>
                  <td className="px-4 py-3 text-gray-300">{money(booking.tip)}</td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap space-x-2">
                    <button
                      onClick={() => handleEditStart(booking)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-bold transition"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteConfirm(booking)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-bold transition"
                    >
                      삭제
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="px-2 py-1 bg-green-600/30 text-green-300 rounded">정상</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info + Input Section */}
        <div className="bg-slate-800 border-t border-slate-700 px-6 py-4 space-y-4">
          <p className="text-sm text-gray-400 text-center">
            💬 Supabase 실시간 동기화 (총 {bookings.length}건 · {ordinal(currentPage + 1)} 페이지 / 전체 {totalPages})
          </p>

          {/* Edit Form */}
          {editingId !== null && editData && (
            <div className="bg-slate-700 rounded-lg p-4 space-y-3 border-2 border-blue-500">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-white">
                  예약 수정 (ID: {editingId}) - {editData.guestName}
                </h3>
                <button onClick={handleEditCancel} className="text-gray-400 hover:text-white text-lg">
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-10 gap-2">
                <input type="date" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} className="px-3 py-2 bg-slate-600 text-white rounded text-xs" />
                <input type="text" placeholder="TRT" value={editData.treatment} onChange={(e) => setEditData({ ...editData, treatment: e.target.value })} className="px-3 py-2 bg-slate-600 text-white rounded text-xs" />
                <input type="time" value={editData.startTime} onChange={(e) => setEditData({ ...editData, startTime: e.target.value })} className="px-3 py-2 bg-slate-600 text-white rounded text-xs" />
                <input type="time" value={editData.endTime} onChange={(e) => setEditData({ ...editData, endTime: e.target.value })} className="px-3 py-2 bg-slate-600 text-white rounded text-xs" />
                <input type="text" placeholder="RM#" value={editData.roomNum} onChange={(e) => setEditData({ ...editData, roomNum: e.target.value })} className="px-3 py-2 bg-slate-600 text-white rounded text-xs" />
                <input type="text" placeholder="Guest" value={editData.guestName} onChange={(e) => setEditData({ ...editData, guestName: e.target.value })} className="px-3 py-2 bg-slate-600 text-white rounded text-xs" />
                <input type="text" placeholder="Note" value={editData.note} onChange={(e) => setEditData({ ...editData, note: e.target.value })} className="px-3 py-2 bg-slate-600 text-white rounded text-xs" />
                <input type="text" placeholder="Pay" value={editData.pay} onChange={(e) => setEditData({ ...editData, pay: e.target.value })} className="px-3 py-2 bg-slate-600 text-white rounded text-xs" />
                <input type="text" placeholder="Tip" value={editData.tip} onChange={(e) => setEditData({ ...editData, tip: e.target.value })} className="px-3 py-2 bg-slate-600 text-white rounded text-xs" />
                <div className="flex gap-2 col-span-2">
                  <button onClick={handleEditSave} disabled={updateBooking.isPending} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded font-bold text-xs transition">
                    저장
                  </button>
                  <button onClick={handleEditCancel} className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-bold text-xs transition">
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Booking Form */}
          {editingId === null && (
            <div className="grid grid-cols-10 gap-2">
              <input type="date" value={newBooking.date} onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })} className="px-3 py-2 bg-slate-700 text-white rounded text-xs" />
              <input type="text" placeholder="TRT" value={newBooking.treatment} onChange={(e) => setNewBooking({ ...newBooking, treatment: e.target.value })} className="px-3 py-2 bg-slate-700 text-white rounded text-xs" />
              <input type="time" value={newBooking.startTime} onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })} className="px-3 py-2 bg-slate-700 text-white rounded text-xs" />
              <input type="time" value={newBooking.endTime} onChange={(e) => setNewBooking({ ...newBooking, endTime: e.target.value })} className="px-3 py-2 bg-slate-700 text-white rounded text-xs" />
              <input type="text" placeholder="RM#" value={newBooking.roomNum} onChange={(e) => setNewBooking({ ...newBooking, roomNum: e.target.value })} className="px-3 py-2 bg-slate-700 text-white rounded text-xs" />
              <input type="text" placeholder="Guest" value={newBooking.guestName} onChange={(e) => setNewBooking({ ...newBooking, guestName: e.target.value })} className="px-3 py-2 bg-slate-700 text-white rounded text-xs" />
              <input type="text" placeholder="Note" value={newBooking.note} onChange={(e) => setNewBooking({ ...newBooking, note: e.target.value })} className="px-3 py-2 bg-slate-700 text-white rounded text-xs" />
              <input type="text" placeholder="Pay" value={newBooking.pay} onChange={(e) => setNewBooking({ ...newBooking, pay: e.target.value })} className="px-3 py-2 bg-slate-700 text-white rounded text-xs" />
              <input type="text" placeholder="Tip" value={newBooking.tip} onChange={(e) => setNewBooking({ ...newBooking, tip: e.target.value })} className="px-3 py-2 bg-slate-700 text-white rounded text-xs" />
              <button onClick={handleAddBooking} disabled={createBooking.isPending} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded font-bold text-xs col-span-2 transition">
                ADD & SYNC
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-700 px-6 py-3 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
