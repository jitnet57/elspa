'use client';

/**
 * 📌 Holiday Management Page
 * 📋 목적: 공휴일 캘린더 조회, CRUD 작업
 * 🔧 포함: 달력 뷰, 공휴일 목록, 추가/수정/삭제 버튼
 * 📅 작성일: 2026-05-21
 */

import { useState, useEffect } from 'react';

interface PhilippineHoliday {
  id: number;
  holiday_date: string;
  holiday_name: string;
  holiday_type: 'national' | 'special';
  rate_multiplier: number;
  created_at: string;
  updated_at: string;
}

const MOCK_HOLIDAYS: PhilippineHoliday[] = [
  {
    id: 1,
    holiday_date: '2026-06-12',
    holiday_name: 'Independence Day',
    holiday_type: 'national',
    rate_multiplier: 2.0,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  },
  {
    id: 2,
    holiday_date: '2026-08-21',
    holiday_name: 'Ninoy Aquino Day',
    holiday_type: 'national',
    rate_multiplier: 2.0,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  },
  {
    id: 3,
    holiday_date: '2026-11-01',
    holiday_name: 'All Saints\' Day',
    holiday_type: 'national',
    rate_multiplier: 2.0,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  },
];

const HOLIDAY_TYPE_CONFIG = {
  national: {
    label: 'National Holiday',
    emoji: '🇵🇭',
    color: 'bg-red-100 text-red-700',
    multiplier: 2.0,
  },
  special: {
    label: 'Special Holiday',
    emoji: '🎉',
    color: 'bg-blue-100 text-blue-700',
    multiplier: 1.3,
  },
};

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<PhilippineHoliday[]>(MOCK_HOLIDAYS);
  const [filteredHolidays, setFilteredHolidays] = useState<PhilippineHoliday[]>(MOCK_HOLIDAYS);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHoliday, setSelectedHoliday] = useState<PhilippineHoliday | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const [formData, setFormData] = useState({
    holiday_date: '',
    holiday_name: '',
    holiday_type: 'national' as 'national' | 'special',
    rate_multiplier: 2.0,
  });

  // Filter holidays by type
  useEffect(() => {
    let filtered = holidays;

    if (filterType !== 'all') {
      filtered = filtered.filter(h => h.holiday_type === filterType);
    }

    setFilteredHolidays(filtered.sort((a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime()));
  }, [filterType, holidays]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isHolidayDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.some(h => h.holiday_date === dateStr);
  };

  const getHolidayForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.find(h => h.holiday_date === dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleOpenNewModal = () => {
    setFormData({
      holiday_date: '',
      holiday_name: '',
      holiday_type: 'national',
      rate_multiplier: 2.0,
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (holiday: PhilippineHoliday) => {
    setFormData({
      holiday_date: holiday.holiday_date,
      holiday_name: holiday.holiday_name,
      holiday_type: holiday.holiday_type,
      rate_multiplier: holiday.rate_multiplier,
    });
    setSelectedHoliday(holiday);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSaveHoliday = async () => {
    if (!formData.holiday_date || !formData.holiday_name) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      if (isEditing && selectedHoliday) {
        // Update existing
        setHolidays(
          holidays.map(h =>
            h.id === selectedHoliday.id
              ? {
                  ...h,
                  ...formData,
                  updated_at: new Date().toISOString(),
                }
              : h
          )
        );
        alert('Holiday updated successfully');
      } else {
        // Create new
        const newHoliday: PhilippineHoliday = {
          id: Math.max(...holidays.map(h => h.id), 0) + 1,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setHolidays([...holidays, newHoliday]);
        alert('Holiday created successfully');
      }

      setShowModal(false);
      setFormData({
        holiday_date: '',
        holiday_name: '',
        holiday_type: 'national',
        rate_multiplier: 2.0,
      });
    } catch (err) {
      alert('Error saving holiday');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (holidayId: number) => {
    if (!window.confirm('Delete this holiday?')) return;

    try {
      setHolidays(holidays.filter(h => h.id !== holidayId));
      alert('Holiday deleted successfully');
    } catch (err) {
      alert('Error deleting holiday');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const stats = {
    total: holidays.length,
    national: holidays.filter(h => h.holiday_type === 'national').length,
    special: holidays.filter(h => h.holiday_type === 'special').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900">🗓️ Holiday Management</h1>
        <p className="text-gray-600 mt-1">Manage national and special holidays for payroll calculations</p>

        {/* Stats */}
        <div className="flex gap-3 mt-4">
          <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
            Total: {stats.total}
          </div>
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold">
            National: {stats.national}
          </div>
          <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-bold">
            Special: {stats.special}
          </div>
        </div>
      </div>

      <main className="px-4 py-6 pb-24">
        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold"
            >
              ← Prev
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
            <button
              onClick={handleNextMonth}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-bold text-gray-700 py-2">
                {day}
              </div>
            ))}

            {calendarDays.map((day, idx) => (
              <div
                key={idx}
                className={`aspect-square p-2 rounded-lg text-center font-bold transition-all ${
                  day === null
                    ? 'bg-gray-50'
                    : isHolidayDate(day)
                      ? 'bg-red-100 border-2 border-red-300 cursor-pointer hover:bg-red-200'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => {
                  if (day && isHolidayDate(day)) {
                    const holiday = getHolidayForDate(day);
                    if (holiday) {
                      setSelectedHoliday(holiday);
                      setShowModal(true);
                    }
                  }
                }}
              >
                {day && (
                  <>
                    <div className="text-sm text-gray-900">{day}</div>
                    {isHolidayDate(day) && <div className="text-xs text-red-600 font-bold">●</div>}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
              filterType === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Holidays
          </button>
          {Object.entries(HOLIDAY_TYPE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                filterType === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {config.emoji} {config.label}
            </button>
          ))}
        </div>

        {/* Holiday List - Mobile */}
        <div className="lg:hidden space-y-3">
          {filteredHolidays.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 border-2 border-gray-200">
              No holidays found
            </div>
          ) : (
            filteredHolidays.map(holiday => {
              const config = HOLIDAY_TYPE_CONFIG[holiday.holiday_type];
              return (
                <div
                  key={holiday.id}
                  className={`bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{holiday.holiday_name}</h3>
                      <p className="text-sm text-gray-600">{formatDate(holiday.holiday_date)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.color}`}>
                      {config.emoji} {config.label}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Pay Multiplier:</span>
                    <span className="text-sm font-bold text-green-600">{holiday.rate_multiplier}x</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(holiday)}
                      className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteHoliday(holiday.id)}
                      className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Holiday List - Desktop Table */}
        <div className="hidden lg:block">
          {filteredHolidays.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 border-2 border-gray-200">
              No holidays found
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Holiday Name</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Pay Multiplier</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHolidays.map(holiday => {
                    const config = HOLIDAY_TYPE_CONFIG[holiday.holiday_type];
                    return (
                      <tr key={holiday.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{holiday.holiday_name}</td>
                        <td className="px-6 py-4 text-center text-sm text-gray-700">
                          {formatDate(holiday.holiday_date)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${config.color}`}>
                            {config.emoji} {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-green-600">
                          {holiday.rate_multiplier}x
                        </td>
                        <td className="px-6 py-4 text-center space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(holiday)}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded text-xs transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded text-xs transition-all"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50">
          <div className="bg-white w-full lg:max-w-lg rounded-t-3xl lg:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? '✏️ Edit Holiday' : '➕ New Holiday'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    holiday_date: '',
                    holiday_name: '',
                    holiday_type: 'national',
                    rate_multiplier: 2.0,
                  });
                }}
                className="text-4xl text-gray-400 hover:text-gray-600 leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Holiday Date *</label>
                <input
                  type="date"
                  value={formData.holiday_date}
                  onChange={e => setFormData({ ...formData, holiday_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Holiday Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Independence Day"
                  value={formData.holiday_name}
                  onChange={e => setFormData({ ...formData, holiday_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Holiday Type *</label>
                <select
                  value={formData.holiday_type}
                  onChange={e => {
                    const type = e.target.value as 'national' | 'special';
                    const multiplier = HOLIDAY_TYPE_CONFIG[type].multiplier;
                    setFormData({
                      ...formData,
                      holiday_type: type,
                      rate_multiplier: multiplier,
                    });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="national">🇵🇭 National Holiday (2.0x pay)</option>
                  <option value="special">🎉 Special Holiday (1.3x pay)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Pay Multiplier *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.rate_multiplier}
                  onChange={e => setFormData({ ...formData, rate_multiplier: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., 2.0 for 200% pay, 1.3 for 130% pay</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      holiday_date: '',
                      holiday_name: '',
                      holiday_type: 'national',
                      rate_multiplier: 2.0,
                    });
                  }}
                  className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveHoliday}
                  disabled={loading}
                  className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-xl transition-colors"
                >
                  {loading ? '💫 Saving...' : isEditing ? '✏️ Update' : '➕ Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
