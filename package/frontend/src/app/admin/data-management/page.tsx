'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n';

/**
 * ============================================================
 * 📌 Admin Data Management Dashboard
 * 📋 목적: 테라피스트, 예약, 드라이버 데이터를 웹에서 조회/수정/삭제하고 엑셀 다운로드
 * 🔧 사용 라이브러리: React, TypeScript, Tailwind CSS
 * 📅 작성일: 2026-05-21
 * ============================================================
 */

type TabType = 'therapists' | 'bookings' | 'drivers';

interface Therapist {
  id: number;
  name: string;
  speciality: string;
  experience: number;
  rating: number;
  status: string;
}

interface Booking {
  id: number;
  customer: string;
  therapist: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: string;
}

interface Driver {
  id: number;
  name: string;
  vehicle: string;
  license: string;
  phone: string;
  status: string;
  earnings: number;
}

export default function AdminDataManagement() {
  const t = useT();
  const [activeTab, setActiveTab] = useState<TabType>('therapists');
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});

  // ============================================================
  // 데이터 로드
  // ============================================================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 테라피스트 데이터 로드
      const therapistRes = await fetch('https://elspa-api-production.jitnet57.workers.dev/api/admin/data/therapists');
      const therapistData = await therapistRes.json();
      setTherapists(therapistData.data);

      // 예약 데이터 로드
      const bookingRes = await fetch('https://elspa-api-production.jitnet57.workers.dev/api/admin/data/bookings');
      const bookingData = await bookingRes.json();
      setBookings(bookingData.data);

      // 드라이버 데이터 로드
      const driverRes = await fetch('https://elspa-api-production.jitnet57.workers.dev/api/admin/data/drivers');
      const driverData = await driverRes.json();
      setDrivers(driverData.data);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // 수정 모드 진입
  // ============================================================
  const handleEdit = (id: number, data: any) => {
    setEditingId(id);
    setEditData({ ...data });
  };

  // ============================================================
  // 저장
  // ============================================================
  const handleSave = async (type: TabType, id: number) => {
    try {
      await fetch(`/api/admin/data/${type}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error('저장 실패:', error);
    }
  };

  // ============================================================
  // 삭제
  // ============================================================
  const handleDelete = async (type: TabType, id: number) => {
    if (!confirm(t('Are you sure you want to delete this?', '정말 삭제하시겠습니까?'))) return;
    try {
      await fetch(`/api/admin/data/${type}/${id}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  // ============================================================
  // 엑셀 다운로드
  // ============================================================
  const handleExport = async (type: TabType) => {
    try {
      const res = await fetch(`/api/admin/data/${type}/export`, {
        method: 'POST',
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
    } catch (error) {
      console.error('다운로드 실패:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{t('📊 Data Management Center', '📊 데이터 관리 센터')}</h1>
          <p className="text-slate-600">{t('Manage therapist, booking, and driver information in one place', '테라피스트, 예약, 드라이버 정보를 한곳에서 관리하세요')}</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('therapists')}
            className={`pb-4 px-6 font-semibold transition-all ${
              activeTab === 'therapists'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('👤 Therapists', '👤 테라피스트')} ({therapists.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-4 px-6 font-semibold transition-all ${
              activeTab === 'bookings'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('📅 Bookings', '📅 예약 현황')} ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`pb-4 px-6 font-semibold transition-all ${
              activeTab === 'drivers'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('🚗 Drivers', '🚗 드라이버')} ({drivers.length})
          </button>
        </div>

        {loading && <div className="text-center py-12 text-slate-600">{t('Loading...', '로딩 중...')}</div>}

        {!loading && (
          <>
            {/* 테라피스트 탭 */}
            {activeTab === 'therapists' && (
              <TherapistTable
                therapists={therapists}
                editingId={editingId}
                editData={editData}
                setEditData={setEditData}
                onEdit={handleEdit}
                onSave={() => handleSave('therapists', editingId!)}
                onDelete={(id) => handleDelete('therapists', id)}
                onExport={() => handleExport('therapists')}
              />
            )}

            {/* 예약 탭 */}
            {activeTab === 'bookings' && (
              <BookingTable
                bookings={bookings}
                editingId={editingId}
                editData={editData}
                setEditData={setEditData}
                onEdit={handleEdit}
                onSave={() => handleSave('bookings', editingId!)}
                onDelete={(id) => handleDelete('bookings', id)}
                onExport={() => handleExport('bookings')}
              />
            )}

            {/* 드라이버 탭 */}
            {activeTab === 'drivers' && (
              <DriverTable
                drivers={drivers}
                editingId={editingId}
                editData={editData}
                setEditData={setEditData}
                onEdit={handleEdit}
                onSave={() => handleSave('drivers', editingId!)}
                onDelete={(id) => handleDelete('drivers', id)}
                onExport={() => handleExport('drivers')}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 테라피스트 테이블 컴포넌트
// ============================================================
function TherapistTable({
  therapists,
  editingId,
  editData,
  setEditData,
  onEdit,
  onSave,
  onDelete,
  onExport,
}: {
  therapists: Therapist[];
  editingId: number | null;
  editData: any;
  setEditData: (data: any) => void;
  onEdit: (id: number, data: any) => void;
  onSave: () => void;
  onDelete: (id: number) => void;
  onExport: () => void;
}) {
  const t = useT();
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 액션 바 */}
      <div className="bg-blue-50 p-4 border-b border-blue-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-blue-900">{t('Therapist Management', '테라피스트 관리')}</h2>
        <div className="flex gap-3">
          <button
            onClick={onExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
          >
            {t('📥 Excel Download', '📥 엑셀 다운로드')}
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('ID', 'ID')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('Name', '이름')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('Speciality', '전문분야')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('Experience (yrs)', '경력(년)')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('Rating', '평점')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('Status', '상태')}</th>
              <th className="px-6 py-3 text-center font-semibold text-slate-700">{t('Actions', '작업')}</th>
            </tr>
          </thead>
          <tbody>
            {therapists.map((therapist) => (
              <tr
                key={therapist.id}
                className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
              >
                {editingId === therapist.id ? (
                  <>
                    <td className="px-6 py-4">{therapist.id}</td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editData.speciality}
                        onChange={(e) =>
                          setEditData({ ...editData, speciality: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={editData.experience}
                        onChange={(e) =>
                          setEditData({ ...editData, experience: parseInt(e.target.value) })
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={editData.rating}
                        onChange={(e) =>
                          setEditData({ ...editData, rating: parseFloat(e.target.value) })
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      >
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={onSave}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        {t('✓ Save', '✓ 저장')}
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-slate-600">{therapist.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{therapist.name}</td>
                    <td className="px-6 py-4 text-slate-600">{therapist.speciality}</td>
                    <td className="px-6 py-4 text-slate-600">{therapist.experience}</td>
                    <td className="px-6 py-4 text-slate-600">⭐ {therapist.rating}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          therapist.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {therapist.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center flex gap-2 justify-center">
                      <button
                        onClick={() => onEdit(therapist.id, therapist)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        {t('Edit', '수정')}
                      </button>
                      <button
                        onClick={() => onDelete(therapist.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        {t('Delete', '삭제')}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// 예약 테이블 컴포넌트
// ============================================================
function BookingTable({
  bookings,
  editingId,
  editData,
  setEditData,
  onEdit,
  onSave,
  onDelete,
  onExport,
}: {
  bookings: Booking[];
  editingId: number | null;
  editData: any;
  setEditData: (data: any) => void;
  onEdit: (id: number, data: any) => void;
  onSave: () => void;
  onDelete: (id: number) => void;
  onExport: () => void;
}) {
  const t = useT();
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 액션 바 */}
      <div className="bg-green-50 p-4 border-b border-green-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-green-900">{t('Booking Management', '예약 현황 관리')}</h2>
        <div className="flex gap-3">
          <button
            onClick={onExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
          >
            {t('📥 Excel Download', '📥 엑셀 다운로드')}
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('ID', 'ID')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('Customer', '고객')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('Therapist', '테라피스트')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('Service', '서비스')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('Date', '날짜')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('Time', '시간')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('Status', '상태')}</th>
              <th className="px-6 py-3 text-center font-semibold text-slate-700">{t('Actions', '작업')}</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
              >
                {editingId === booking.id ? (
                  <>
                    <td className="px-6 py-4">{booking.id}</td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editData.customer}
                        onChange={(e) => setEditData({ ...editData, customer: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editData.therapist}
                        onChange={(e) =>
                          setEditData({ ...editData, therapist: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editData.service}
                        onChange={(e) => setEditData({ ...editData, service: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="date"
                        value={editData.date}
                        onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="time"
                        value={editData.time}
                        onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      >
                        <option value="예약">{t('Booked', '예약')}</option>
                        <option value="진행중">{t('In Progress', '진행중')}</option>
                        <option value="완료">{t('Completed', '완료')}</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={onSave}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        {t('✓ Save', '✓ 저장')}
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-slate-600">{booking.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{booking.customer}</td>
                    <td className="px-6 py-4 text-slate-600">{booking.therapist}</td>
                    <td className="px-6 py-4 text-slate-600">{booking.service}</td>
                    <td className="px-6 py-4 text-slate-600">{booking.date}</td>
                    <td className="px-6 py-4 text-slate-600">{booking.time}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          booking.status === '예약'
                            ? 'bg-blue-100 text-blue-700'
                            : booking.status === '진행중'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {booking.status === '예약'
                          ? t('Booked', '예약')
                          : booking.status === '진행중'
                            ? t('In Progress', '진행중')
                            : booking.status === '완료'
                              ? t('Completed', '완료')
                              : booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center flex gap-2 justify-center">
                      <button
                        onClick={() => onEdit(booking.id, booking)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        {t('Edit', '수정')}
                      </button>
                      <button
                        onClick={() => onDelete(booking.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        {t('Delete', '삭제')}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// 드라이버 테이블 컴포넌트
// ============================================================
function DriverTable({
  drivers,
  editingId,
  editData,
  setEditData,
  onEdit,
  onSave,
  onDelete,
  onExport,
}: {
  drivers: Driver[];
  editingId: number | null;
  editData: any;
  setEditData: (data: any) => void;
  onEdit: (id: number, data: any) => void;
  onSave: () => void;
  onDelete: (id: number) => void;
  onExport: () => void;
}) {
  const t = useT();
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 액션 바 */}
      <div className="bg-amber-50 p-4 border-b border-amber-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-amber-900">{t('Driver Management', '드라이버 관리')}</h2>
        <div className="flex gap-3">
          <button
            onClick={onExport}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all text-sm font-medium"
          >
            {t('📥 Excel Download', '📥 엑셀 다운로드')}
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('ID', 'ID')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('Name', '이름')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('Vehicle', '차량')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('License No.', '면허번호')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('Phone', '휴대폰')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t('Status', '상태')}</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">{t("Today's Earnings", '오늘 수익')}</th>
              <th className="px-6 py-3 text-center font-semibold text-slate-700">{t('Actions', '작업')}</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr
                key={driver.id}
                className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
              >
                {editingId === driver.id ? (
                  <>
                    <td className="px-6 py-4">{driver.id}</td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editData.vehicle}
                        onChange={(e) => setEditData({ ...editData, vehicle: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editData.license}
                        onChange={(e) => setEditData({ ...editData, license: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      >
                        <option value="운행중">{t('Driving', '운행중')}</option>
                        <option value="대기중">{t('Waiting', '대기중')}</option>
                        <option value="휴무">{t('Off Duty', '휴무')}</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={editData.earnings}
                        onChange={(e) =>
                          setEditData({ ...editData, earnings: parseInt(e.target.value) })
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={onSave}
                        className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700"
                      >
                        {t('✓ Save', '✓ 저장')}
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-slate-600">{driver.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{driver.name}</td>
                    <td className="px-6 py-4 text-slate-600">{driver.vehicle}</td>
                    <td className="px-6 py-4 text-slate-600">{driver.license}</td>
                    <td className="px-6 py-4 text-slate-600">{driver.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          driver.status === '운행중'
                            ? 'bg-green-100 text-green-700'
                            : driver.status === '대기중'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {driver.status === '운행중'
                          ? t('Driving', '운행중')
                          : driver.status === '대기중'
                            ? t('Waiting', '대기중')
                            : driver.status === '휴무'
                              ? t('Off Duty', '휴무')
                              : driver.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-amber-600">
                      ₩ {driver.earnings.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center flex gap-2 justify-center">
                      <button
                        onClick={() => onEdit(driver.id, driver)}
                        className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700"
                      >
                        {t('Edit', '수정')}
                      </button>
                      <button
                        onClick={() => onDelete(driver.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        {t('Delete', '삭제')}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
