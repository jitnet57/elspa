'use client';

/**
 * 📌 Attendance Input Page
 * 📋 목적: 출퇴근 시간 입력, 지각/OT 자동 계산 (API 연동)
 * 🔧 포함: 날짜 선택, 시간 입력, 자동 계산, 기록 테이블
 * 📌 개선: Zustand store 사용, API 연동, Retry logic
 * 📅 작성일: 2026-05-22
 */

import { useState, useEffect } from 'react';
import { usePayrollStore } from '@/lib/store/payroll-store';
import { AttendanceLog, Employee } from '@/lib/api/payroll-client';

export default function AttendancePage() {
  const [filteredAttendance, setFilteredAttendance] = useState<AttendanceLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Zustand store
  const {
    attendance,
    employees,
    loading,
    error,
    fetchAttendance,
    fetchEmployees,
    createNewAttendance,
    updateExistingAttendance,
    deleteExistingAttendance,
    clearError,
  } = usePayrollStore();

  // Load data on mount
  useEffect(() => {
    fetchAttendance({ work_date: selectedDate });
    fetchEmployees();
  }, [selectedDate, fetchAttendance, fetchEmployees]);

  // Form data
  const [formData, setFormData] = useState({
    employee_id: 0,
    work_date: selectedDate,
    clock_in: '',
    clock_out: '',
    is_absent: false,
    holiday_type: 'none' as 'none' | 'national' | 'special',
  });

  // Filter attendance when date changes
  useEffect(() => {
    const filtered = attendance.filter(a => a.work_date === selectedDate);
    setFilteredAttendance(filtered);
  }, [selectedDate, attendance]);

  // Calculate late and overtime minutes
  const calculateMinutes = (clockIn: string, clockOut: string) => {
    if (!clockIn || !clockOut) return { late: 0, overtime: 0 };

    const standardStart = new Date(`2000-01-01 08:00:00`);
    const standardEnd = new Date(`2000-01-01 17:00:00`);

    const inTime = new Date(`2000-01-01 ${clockIn}:00`);
    const outTime = new Date(`2000-01-01 ${clockOut}:00`);

    // Calculate late minutes
    let lateMinutes = 0;
    if (inTime > standardStart) {
      lateMinutes = Math.floor((inTime.getTime() - standardStart.getTime()) / 60000);
    }

    // Calculate overtime minutes
    let overtimeMinutes = 0;
    if (outTime > standardEnd) {
      overtimeMinutes = Math.floor((outTime.getTime() - standardEnd.getTime()) / 60000);
    }

    return { late: lateMinutes, overtime: overtimeMinutes };
  };

  const handleOpenNewModal = () => {
    setFormData({
      employee_id: 0,
      work_date: selectedDate,
      clock_in: '',
      clock_out: '',
      is_absent: false,
      holiday_type: 'none',
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleSaveAttendance = async () => {
    if (!formData.employee_id) {
      alert('Please select an employee');
      return;
    }

    if (!formData.is_absent && (!formData.clock_in || !formData.clock_out)) {
      alert('Please enter clock in and clock out times');
      return;
    }

    try {
      setIsLoading(true);

      const { late, overtime } = calculateMinutes(formData.clock_in, formData.clock_out);
      const employee = employees.find(e => e.id === formData.employee_id);

      if (isEditing) {
        // Update existing via Zustand
        updateExistingAttendance(formData.employee_id, {
          ...formData,
          late_minutes: late,
          overtime_minutes: overtime,
        });
      } else {
        // Create new via Zustand
        createNewAttendance({
          employee_id: formData.employee_id,
          employee_name: employee?.name,
          work_date: formData.work_date,
          clock_in: formData.is_absent ? undefined : formData.clock_in,
          clock_out: formData.is_absent ? undefined : formData.clock_out,
          late_minutes: formData.is_absent ? 0 : late,
          overtime_minutes: formData.is_absent ? 0 : overtime,
          is_absent: formData.is_absent,
          holiday_type: formData.holiday_type,
        });
      }

      setShowModal(false);
      alert(isEditing ? 'Attendance updated successfully' : 'Attendance recorded successfully');
    } catch (err) {
      alert('Error saving attendance');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAttendance = (log: AttendanceLog) => {
    setFormData({
      employee_id: log.employee_id,
      work_date: log.work_date,
      clock_in: log.clock_in || '',
      clock_out: log.clock_out || '',
      is_absent: log.is_absent,
      holiday_type: log.holiday_type,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteAttendance = async (logId: number) => {
    if (!window.confirm('Delete this attendance record?')) return;

    try {
      deleteExistingAttendance(logId);
      alert('Attendance record deleted');
    } catch (err) {
      alert('Error deleting attendance');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const stats = {
    total: filteredAttendance.length,
    present: filteredAttendance.filter(a => !a.is_absent).length,
    absent: filteredAttendance.filter(a => a.is_absent).length,
    late: filteredAttendance.filter(a => a.late_minutes > 0).length,
    overtime: filteredAttendance.filter(a => a.overtime_minutes > 0).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900">🕐 Attendance Input</h1>
        <p className="text-gray-600 mt-1">Record clock in/out times and track late/overtime</p>
      </div>

      <main className="px-4 py-6 pb-24">
        {/* Date Selector */}
        <div className="mb-6">
          <label className="text-sm font-bold text-gray-700 mb-2 block">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base font-medium"
          />
          <p className="text-sm text-gray-600 mt-2">{formatDate(selectedDate)}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">Total</p>
            <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">Present</p>
            <h3 className="text-2xl font-bold mt-1">{stats.present}</h3>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">Absent</p>
            <h3 className="text-2xl font-bold mt-1">{stats.absent}</h3>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">Late</p>
            <h3 className="text-2xl font-bold mt-1">{stats.late}</h3>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">Overtime</p>
            <h3 className="text-2xl font-bold mt-1">{stats.overtime}</h3>
          </div>
        </div>

        {/* Attendance Records - Mobile */}
        <div className="lg:hidden space-y-3">
          {filteredAttendance.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 border-2 border-gray-200">
              No attendance records for this date
            </div>
          ) : (
            filteredAttendance.map(log => (
              <div
                key={log.id}
                className={`bg-white rounded-2xl p-4 border-2 ${
                  log.is_absent ? 'border-red-200 bg-red-50' : 'border-gray-100'
                } shadow-sm`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{log.employee_name}</h3>
                    <p className="text-sm text-gray-600">Emp #{log.employee_id}</p>
                  </div>
                  {log.is_absent && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                      ❌ ABSENT
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                  {log.is_absent ? (
                    <p className="text-sm text-red-700 font-semibold">No attendance record</p>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Clock In:</span>
                        <span className="text-sm font-bold text-gray-900">{log.clock_in}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Clock Out:</span>
                        <span className="text-sm font-bold text-gray-900">{log.clock_out}</span>
                      </div>
                      {log.late_minutes > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Late:</span>
                          <span className="text-sm font-bold text-yellow-600">{log.late_minutes} min</span>
                        </div>
                      )}
                      {log.overtime_minutes > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Overtime:</span>
                          <span className="text-sm font-bold text-purple-600">{log.overtime_minutes} min</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditAttendance(log)}
                    className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAttendance(log.id)}
                    className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-sm"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Attendance Records - Desktop Table */}
        <div className="hidden lg:block">
          {filteredAttendance.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 border-2 border-gray-200 mb-6">
              No attendance records for this date
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Employee</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Clock In</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Clock Out</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Late (min)</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">OT (min)</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map(log => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{log.employee_name}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-700">
                        {log.is_absent ? '-' : log.clock_in}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-700">
                        {log.is_absent ? '-' : log.clock_out}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {log.late_minutes > 0 ? (
                          <span className="text-sm font-bold text-yellow-600">{log.late_minutes}</span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {log.overtime_minutes > 0 ? (
                          <span className="text-sm font-bold text-purple-600">{log.overtime_minutes}</span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {log.is_absent ? (
                          <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                            ❌ ABSENT
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                            ✅ PRESENT
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={() => handleEditAttendance(log)}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded text-xs transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAttendance(log.id)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded text-xs transition-all"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Button */}
      <button
        onClick={handleOpenNewModal}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:shadow-xl transition-all active:scale-95 z-50 font-bold"
      >
        +
      </button>

      {/* Record Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50">
          <div className="bg-white w-full lg:max-w-lg rounded-t-3xl lg:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? '✏️ Edit Attendance' : '📝 Record Attendance'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    employee_id: 0,
                    work_date: selectedDate,
                    clock_in: '',
                    clock_out: '',
                    is_absent: false,
                    holiday_type: 'none',
                  });
                }}
                className="text-4xl text-gray-400 hover:text-gray-600 leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Employee *</label>
                <select
                  value={formData.employee_id}
                  onChange={e => setFormData({ ...formData, employee_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value={0}>-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Work Date *</label>
                <input
                  type="date"
                  value={formData.work_date}
                  onChange={e => setFormData({ ...formData, work_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.is_absent}
                  onChange={e => setFormData({ ...formData, is_absent: e.target.checked })}
                  className="w-5 h-5 text-red-600 rounded"
                />
                <label className="text-sm font-bold text-gray-700">Mark as Absent</label>
              </div>

              {!formData.is_absent && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 block">Clock In *</label>
                      <input
                        type="time"
                        value={formData.clock_in}
                        onChange={e => setFormData({ ...formData, clock_in: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Standard: 08:00</p>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 block">Clock Out *</label>
                      <input
                        type="time"
                        value={formData.clock_out}
                        onChange={e => setFormData({ ...formData, clock_out: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Standard: 17:00</p>
                    </div>
                  </div>

                  {formData.clock_in && formData.clock_out && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <p className="text-xs font-bold text-blue-700 mb-2">Calculated</p>
                      {(() => {
                        const { late, overtime } = calculateMinutes(formData.clock_in, formData.clock_out);
                        return (
                          <div className="space-y-1">
                            {late > 0 && <p className="text-sm text-yellow-600 font-bold">⚠️ Late: {late} minutes</p>}
                            {overtime > 0 && <p className="text-sm text-purple-600 font-bold">⏱️ Overtime: {overtime} minutes</p>}
                            {late === 0 && overtime === 0 && <p className="text-sm text-green-600 font-bold">✅ On time</p>}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Holiday Type</label>
                <select
                  value={formData.holiday_type}
                  onChange={e => setFormData({ ...formData, holiday_type: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="none">None</option>
                  <option value="national">National Holiday (200%)</option>
                  <option value="special">Special Holiday (130%)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      employee_id: 0,
                      work_date: selectedDate,
                      clock_in: '',
                      clock_out: '',
                      is_absent: false,
                      holiday_type: 'none',
                    });
                  }}
                  className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAttendance}
                  disabled={loading}
                  className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-xl transition-colors"
                >
                  {loading ? '💫 Saving...' : isEditing ? '✏️ Update' : '📝 Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
