'use client';

import { useState } from 'react';

interface ScheduleSession {
  id: string;
  therapistId: number;
  serviceType: 'swedish' | 'thai' | 'hotstone' | 'foot' | 'aroma' | 'break' | 'available';
  startHour: number;
  endHour: number;
  customerName?: string;
  roomNumber?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
}

interface ScheduleTherapist {
  id: number;
  name: string;
  title: string;
  status: 'available' | 'in_session' | 'break' | 'off_duty';
  avatarColor: string;
  sessions: ScheduleSession[];
}

const SERVICE_CONFIG = {
  swedish:   { label: 'Swedish Massage', bg: 'bg-blue-100 border-blue-300 text-blue-700', icon: '💆' },
  thai:      { label: 'Thai Massage', bg: 'bg-green-100 border-green-300 text-green-700', icon: '🙏' },
  hotstone:  { label: 'Hot Stone Therapy', bg: 'bg-orange-100 border-orange-300 text-orange-700', icon: '🪨' },
  foot:      { label: 'Foot Massage', bg: 'bg-teal-100 border-teal-300 text-teal-700', icon: '🦶' },
  aroma:     { label: 'Aromatherapy', bg: 'bg-purple-100 border-purple-300 text-purple-700', icon: '🌸' },
  break:     { label: 'Break', bg: 'bg-yellow-200 border-yellow-400 text-yellow-800', icon: '☕' },
  available: { label: 'Available', bg: 'bg-green-50 border-green-200 text-green-600', icon: '' },
} as const;

const STATUS_CONFIG = {
  available: { label: 'Available', dot: '●', color: 'text-green-500' },
  in_session: { label: 'In Session', dot: '●', color: 'text-blue-500' },
  break: { label: 'Break', dot: '◑', color: 'text-yellow-500' },
  off_duty: { label: 'Off Duty', dot: '◌', color: 'text-gray-400' },
} as const;

// 60 Philippine English names
const PHILIPPINE_NAMES = [
  'Maria Santos', 'Jose Garcia', 'Carmen Reyes', 'Antonio Flores', 'Rosa Cruz',
  'Francisco Rodriguez', 'Ana Maria', 'Juan Santos', 'Luz Garcia', 'Miguel Mendoza',
  'Jennifer Cruz', 'Michael Santos', 'Mary Ann Garcia', 'Christopher Reyes', 'Patricia Flores',
  'Robert Santos', 'Linda Rodriguez', 'James Garcia', 'Margaret Cruz', 'David Mendoza',
  'Angela Reyes', 'John Santos', 'Theresa Flores', 'Peter Garcia', 'Gloria Rodriguez',
  'Paul Mendoza', 'Irene Cruz', 'Mark Santos', 'Deborah Reyes', 'Steven Flores',
  'Nancy Garcia', 'Kevin Santos', 'Lisa Rodriguez', 'Brian Mendoza', 'Donna Cruz',
  'Edward Reyes', 'Michelle Santos', 'Ronald Flores', 'Dorothy Garcia', 'Timothy Rodriguez',
  'Elizabeth Mendoza', 'Jason Cruz', 'Barbara Santos', 'Jeffrey Reyes', 'Maria Elena Flores',
  'Ryan Garcia', 'Susan Rodriguez', 'Jacob Santos', 'Carol Mendoza', 'Gary Cruz',
  'Sarah Reyes', 'Nicholas Flores', 'Jessica Garcia', 'Eric Rodriguez', 'Karen Santos',
  'Jonathan Mendoza', 'Stephen Cruz', 'Betty Flores', 'Larry Garcia', 'Helen Reyes',
];

const AVATAR_COLORS = [
  'from-indigo-400 to-indigo-600',
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-pink-400 to-pink-600',
  'from-amber-400 to-amber-600',
  'from-purple-400 to-purple-600',
  'from-cyan-400 to-cyan-600',
  'from-rose-400 to-rose-600',
  'from-lime-400 to-lime-600',
  'from-sky-400 to-sky-600',
];

const ROOM_NUMBERS = Array.from({ length: 20 }, (_, i) => `Room ${String(i + 1).padStart(2, '0')}`);

const SERVICE_TYPES: Array<'swedish' | 'thai' | 'hotstone' | 'foot' | 'aroma' | 'break'> = [
  'swedish', 'thai', 'hotstone', 'foot', 'aroma',
];

// Random utility functions
const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate 60 therapists
const generateMockTherapists = (): ScheduleTherapist[] => {
  return PHILIPPINE_NAMES.map((name, index) => {
    const id = index + 1;
    const statuses: Array<'available' | 'in_session' | 'break' | 'off_duty'> = ['available', 'in_session']; // All working for testing
    const status = 'available'; // All checked in as available
    const isManager = id === 1 || id === 2; // First 2 are managers

    // Generate random sessions per therapist (0-5)
    const sessionCount = getRandomInt(0, 5);
    const sessions: ScheduleSession[] = [];

    for (let i = 0; i < sessionCount; i++) {
      const startHour = getRandomInt(9, 19);
      const serviceType = getRandomElement(SERVICE_TYPES);
      const duration = serviceType === 'aroma' || serviceType === 'thai' ? 1.5 : 1;
      const endHour = Math.min(startHour + duration, 21);

      sessions.push({
        id: `s${id}-${i}`,
        therapistId: id,
        serviceType,
        startHour,
        endHour,
        customerName: `Guest ${getRandomInt(1000, 9999)}`,
        roomNumber: getRandomElement(ROOM_NUMBERS),
        status: getRandomElement(['scheduled', 'in_progress', 'completed'] as const),
      });
    }

    // Add break time (30% probability)
    if (Math.random() < 0.3) {
      const breakHour = getRandomInt(12, 14);
      sessions.push({
        id: `s${id}-break`,
        therapistId: id,
        serviceType: 'break',
        startHour: breakHour,
        endHour: breakHour + 1,
        status: 'scheduled',
      });
    }

    return {
      id,
      name,
      title: isManager ? 'Manager' : 'Therapist',
      status,
      avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
      sessions: sessions.sort((a, b) => a.startHour - b.startHour),
    };
  });
};

const MOCK_THERAPISTS: ScheduleTherapist[] = generateMockTherapists();

const START_HOUR = 9;
const END_HOUR = 21;
const COLUMN_WIDTH = 100;

export default function TherapistSchedulePage() {
  const [therapists, setTherapists] = useState<ScheduleTherapist[]>(MOCK_THERAPISTS);
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 4, 18));
  const [selectedTherapistId, setSelectedTherapistId] = useState(1);
  const [selectedSession, setSelectedSession] = useState<ScheduleSession | null>(null);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<{ therapistId: number; hour: number } | null>(null);
  const [bookingForm, setBookingForm] = useState({ customerName: '', serviceType: 'swedish', roomNumber: '' });
  const [manualBookingForm, setManualBookingForm] = useState({
    therapistId: 1,
    date: new Date(2026, 4, 18),
    hour: 10,
    customerName: '',
    serviceType: 'swedish' as const,
    roomNumber: '',
  });

  const formatTime = (hour: number) => {
    return `${Math.floor(hour)}:${String((hour % 1) * 60).padStart(2, '0')}`;
  };

  const getDurationMinutes = (session: ScheduleSession) => {
    return Math.round((session.endHour - session.startHour) * 60);
  };

  const getNextDays = (baseDate: Date, count: number) => {
    return Array.from({ length: count }).map((_, i) => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      return date;
    });
  };

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const selectedTherapist = therapists.find(t => t.id === selectedTherapistId);
  const sortedSessions = selectedTherapist?.sessions.sort((a, b) => a.startHour - b.startHour) || [];
  const nextDays = getNextDays(selectedDate, 6);
  const completedCount = sortedSessions.filter(s => s.status === 'completed').length;

  const formatDateLong = (d: Date) => {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', weekday: 'short' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== Mobile View (less than lg) ===== */}
      <div className="lg:hidden flex justify-center items-start p-2 min-h-screen">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Top header */}
          <header className="bg-indigo-600 p-6 text-white rounded-b-3xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-xs text-indigo-200 uppercase font-semibold tracking-wider">
                  {selectedDate.toLocaleDateString('en-US')}
                </p>
                <h1 className="text-2xl font-bold">Session Progress</h1>
              </div>
              <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                {completedCount} Completed
              </span>
            </div>

            {/* Mini Calendar */}
            <div className="flex justify-between text-center mt-2 gap-1">
              <div className="p-2 w-10 text-indigo-200 text-xs">DATES</div>
              {nextDays.map((date, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`p-2 w-10 rounded-2xl font-bold transition-all ${
                    date.toDateString() === selectedDate.toDateString()
                      ? 'bg-white text-indigo-600 shadow-md'
                      : 'text-indigo-200 text-xs'
                  }`}
                >
                  <div className={date.toDateString() === selectedDate.toDateString() ? 'text-xs' : ''}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]}
                  </div>
                  <div className={date.toDateString() === selectedDate.toDateString() ? 'text-base' : 'text-sm font-medium text-white'}>
                    {date.getDate()}
                  </div>
                </button>
              ))}
            </div>
          </header>

          {/* Therapist Selection */}
          <section className="p-4 border-b border-gray-100 max-h-[280px] overflow-y-auto">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 sticky top-0 bg-white">Select Therapist ({therapists.length} total)</h2>
            <div className="grid grid-cols-2 gap-2">
              {therapists.map(therapist => (
                <button
                  key={therapist.id}
                  onClick={() => setSelectedTherapistId(therapist.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-left ${
                    selectedTherapistId === therapist.id
                      ? 'bg-indigo-50 border-2 border-indigo-500 shadow-sm'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    selectedTherapistId === therapist.id
                      ? 'bg-indigo-200 text-indigo-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {therapist.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-bold truncate ${
                      selectedTherapistId === therapist.id
                        ? 'text-indigo-900'
                        : 'text-gray-700'
                    }`}>
                      {therapist.name}
                    </div>
                    <div className="text-[10px] text-gray-500">{therapist.status === 'available' ? '✓ Available' : therapist.status === 'in_session' ? 'In Session' : therapist.status === 'break' ? 'Break' : 'Off Duty'}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Session List */}
          <main className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {sortedSessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">😌</div>
                <p className="text-gray-400 font-medium">No sessions scheduled for today</p>
              </div>
            ) : (
              sortedSessions.map(session => (
                <div key={session.id}>
                  {session.serviceType === 'break' ? (
                    <div className="flex space-x-4 items-center">
                      <div className="w-12 text-right">
                        <span className="text-sm font-medium text-gray-400">{formatTime(session.startHour)}</span>
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-xl p-2 text-center border border-dashed border-gray-300">
                        <span className="text-xs font-medium text-gray-500">Break & Equipment Cleaning</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex space-x-4 cursor-pointer"
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="w-12 text-right pt-2">
                        <span className="text-sm font-bold text-gray-800">{formatTime(session.startHour)}</span>
                        <span className="block text-xs text-gray-400">{getDurationMinutes(session)}min</span>
                      </div>

                      <div className={`flex-1 rounded-xl p-4 shadow-sm relative transition-all hover:shadow-md ${
                        session.status === 'in_progress'
                          ? 'bg-green-50 border-l-4 border-green-500'
                          : session.status === 'scheduled'
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'bg-gray-50 border-l-4 border-gray-300 opacity-70'
                      }`}>
                        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          session.status === 'in_progress'
                            ? 'bg-green-500 text-white animate-pulse'
                            : session.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {session.status === 'in_progress' ? 'In Progress' : session.status === 'scheduled' ? 'Scheduled' : 'Completed'}
                        </span>

                        <h3 className={`font-bold text-sm ${
                          session.status === 'completed'
                            ? 'text-gray-500 line-through'
                            : 'text-gray-900'
                        }`}>
                          {SERVICE_CONFIG[session.serviceType as keyof typeof SERVICE_CONFIG].icon} {SERVICE_CONFIG[session.serviceType as keyof typeof SERVICE_CONFIG].label}
                        </h3>

                        {session.customerName && (
                          <p className={`text-xs mt-1 ${
                            session.status === 'completed' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Guest: {session.customerName}
                          </p>
                        )}

                        {session.roomNumber && (
                          <div className={`mt-3 flex items-center text-[11px] font-medium ${
                            session.status === 'in_progress'
                              ? 'text-green-700'
                              : session.status === 'scheduled'
                              ? 'text-blue-700'
                              : 'text-gray-400'
                          }`}>
                            <span>{session.roomNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </main>
        </div>
      </div>

      {/* ===== Desktop View (lg and above) ===== */}
      <div className="hidden lg:block min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-8 text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
                  <span className="text-gray-600">Select Date</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-gray-400">→</div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
                  <span className="text-gray-900 font-bold">Daily Therapist Schedule</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-gray-400">→</div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">3</span>
                  <span className="text-gray-600">Start New Massage</span>
                </div>
              </div>
              <button
                onClick={() => setIsNewSessionModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg transition-all text-sm"
              >
                + Start New Massage
              </button>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
              <button onClick={handlePrevDay} className="text-2xl text-gray-600 hover:text-gray-900">&lt;</button>
              <span className="text-lg font-bold text-gray-900">{formatDateLong(selectedDate)}</span>
              <button onClick={handleNextDay} className="text-2xl text-gray-600 hover:text-gray-900">&gt;</button>
            </div>
          </div>

          {/* Schedule Grid */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Table Header */}
              <div className="flex border-b border-gray-200">
                <div className="w-40 flex-shrink-0 px-4 py-3 font-bold text-gray-900 bg-gray-50 sticky left-0 z-10">
                  Therapists ({therapists.length})
                </div>
                <div className="flex bg-gray-50">
                  {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 px-2 py-3 text-center text-sm font-bold text-gray-700 border-r border-gray-200"
                      style={{ width: COLUMN_WIDTH }}
                    >
                      {String(START_HOUR + i).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Therapist Rows */}
              {therapists.map(therapist => (
                <div key={therapist.id} className="flex border-b border-gray-200 hover:bg-gray-50 transition">
                  {/* Therapist Info */}
                  <div className="w-40 flex-shrink-0 px-4 py-4 bg-white sticky left-0 z-5 border-r border-gray-200 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${therapist.avatarColor} flex items-center justify-center text-white font-bold text-sm`}>
                      {therapist.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{therapist.name}</div>
                      <div className={`text-xs ${STATUS_CONFIG[therapist.status].color}`}>
                        {STATUS_CONFIG[therapist.status].dot} {STATUS_CONFIG[therapist.status].label}
                      </div>
                    </div>
                  </div>

                  {/* Time Grid */}
                  <div className="flex relative flex-1">
                    {Array.from({ length: END_HOUR - START_HOUR }).map((_, colIndex) => {
                      const hourStart = START_HOUR + colIndex;
                      const hourEnd = hourStart + 1;
                      const cellSessions = therapist.sessions.filter(
                        s => !(s.endHour <= hourStart || s.startHour >= hourEnd)
                      );

                      return (
                        <div
                          key={colIndex}
                          className="flex-shrink-0 px-1 py-4 border-r border-gray-200 relative bg-gray-50 hover:bg-blue-50 transition cursor-pointer group"
                          style={{ width: COLUMN_WIDTH }}
                          onClick={() => {
                            if (therapist.status === 'off_duty') return;
                            const cellSessions = therapist.sessions.filter(
                              s => !(s.endHour <= hourStart || s.startHour >= hourEnd)
                            );
                            if (cellSessions.length === 0) {
                              setBookingSlot({ therapistId: therapist.id, hour: hourStart });
                              setBookingForm({ customerName: '', serviceType: 'swedish', roomNumber: '' });
                            }
                          }}
                        >
                          {cellSessions.length === 0 && (
                            <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 text-center">Click to add</div>
                          )}
                          {cellSessions.map(session => (
                            <div
                              key={session.id}
                              className={`absolute rounded-md border-2 text-xs p-1 cursor-pointer hover:shadow-lg transition ${SERVICE_CONFIG[session.serviceType as keyof typeof SERVICE_CONFIG].bg}`}
                              style={{
                                left: `calc(${((session.startHour - hourStart) * COLUMN_WIDTH) / 1}px + 2px)`,
                                width: `${(session.endHour - Math.max(session.startHour, hourStart)) * COLUMN_WIDTH - 4}px`,
                                top: `${(MOCK_THERAPISTS.findIndex(t => t.id === therapist.id) % 2) * 28}px`,
                                zIndex: 2,
                              }}
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedSession(session);
                              }}
                            >
                              <div className="font-bold whitespace-nowrap">
                                {SERVICE_CONFIG[session.serviceType as keyof typeof SERVICE_CONFIG].icon}{' '}
                                {formatTime(session.startHour)}
                              </div>
                              {session.customerName && session.serviceType !== 'available' && (
                                <div className="text-xs opacity-75">{session.customerName}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Session Details</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-sm text-gray-600">Time</label>
                <p className="font-bold text-gray-900">
                  {formatTime(selectedSession.startHour)} ~ {formatTime(selectedSession.endHour)} ({getDurationMinutes(selectedSession)}min)
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Service</label>
                <p className="font-bold text-gray-900">
                  {SERVICE_CONFIG[selectedSession.serviceType as keyof typeof SERVICE_CONFIG].label}
                </p>
              </div>
              {selectedSession.customerName && (
                <div>
                  <label className="text-sm text-gray-600">Guest Name</label>
                  <p className="font-bold text-gray-900">{selectedSession.customerName}</p>
                </div>
              )}
              {selectedSession.roomNumber && (
                <div>
                  <label className="text-sm text-gray-600">Room</label>
                  <p className="font-bold text-gray-900">{selectedSession.roomNumber}</p>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <select
                  value={selectedSession.status}
                  onChange={e => {
                    const newStatus = e.target.value as ScheduleSession['status'];
                    setTherapists(prev =>
                      prev.map(t =>
                        t.id === selectedSession.therapistId
                          ? {
                            ...t,
                            sessions: t.sessions.map(s =>
                              s.id === selectedSession.id ? { ...s, status: newStatus } : s
                            ),
                          }
                          : t
                      )
                    );
                    setSelectedSession({ ...selectedSession, status: newStatus });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 font-bold text-gray-900"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSession(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 font-bold rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setTherapists(prev =>
                    prev.map(t =>
                      t.id === selectedSession.therapistId
                        ? { ...t, sessions: t.sessions.filter(s => s.id !== selectedSession.id) }
                        : t
                    )
                  );
                  setSelectedSession(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Booking Modal - Start New Massage Button */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🧘 Start New Massage Session</h3>

            <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
              {/* Therapist Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Therapist</label>
                <select
                  value={manualBookingForm.therapistId}
                  onChange={e => setManualBookingForm({ ...manualBookingForm, therapistId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                >
                  {therapists.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status === 'available' ? '✓ Available' : t.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={manualBookingForm.date.toISOString().split('T')[0]}
                  onChange={e => {
                    const newDate = new Date(e.target.value);
                    setManualBookingForm({ ...manualBookingForm, date: newDate });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Time</label>
                <select
                  value={manualBookingForm.hour}
                  onChange={e => setManualBookingForm({ ...manualBookingForm, hour: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                >
                  {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
                    const hour = START_HOUR + i;
                    return (
                      <option key={hour} value={hour}>
                        {String(hour).padStart(2, '0')}:00 - {String(hour + 1).padStart(2, '0')}:00
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Guest/Customer Name *</label>
                <input
                  type="text"
                  value={manualBookingForm.customerName}
                  onChange={e => setManualBookingForm({ ...manualBookingForm, customerName: e.target.value })}
                  placeholder="e.g., John Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                />
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Service Type</label>
                <select
                  value={manualBookingForm.serviceType}
                  onChange={e => setManualBookingForm({ ...manualBookingForm, serviceType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                >
                  <option value="swedish">{SERVICE_CONFIG.swedish.icon} Swedish Massage</option>
                  <option value="thai">{SERVICE_CONFIG.thai.icon} Thai Massage</option>
                  <option value="hotstone">{SERVICE_CONFIG.hotstone.icon} Hot Stone Therapy</option>
                  <option value="foot">{SERVICE_CONFIG.foot.icon} Foot Massage</option>
                  <option value="aroma">{SERVICE_CONFIG.aroma.icon} Aromatherapy</option>
                </select>
              </div>

              {/* Room Number */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Room Assignment</label>
                <select
                  value={manualBookingForm.roomNumber}
                  onChange={e => setManualBookingForm({ ...manualBookingForm, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                >
                  <option value="">Select Room</option>
                  {ROOM_NUMBERS.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsNewSessionModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 font-bold rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!manualBookingForm.customerName.trim()) {
                    alert('Please enter customer name');
                    return;
                  }
                  const newSession: ScheduleSession = {
                    id: `s${manualBookingForm.therapistId}-${Date.now()}`,
                    therapistId: manualBookingForm.therapistId,
                    serviceType: manualBookingForm.serviceType,
                    startHour: manualBookingForm.hour,
                    endHour: manualBookingForm.hour + 1,
                    customerName: manualBookingForm.customerName,
                    roomNumber: manualBookingForm.roomNumber || undefined,
                    status: 'scheduled',
                  };

                  setTherapists(prev =>
                    prev.map(t =>
                      t.id === manualBookingForm.therapistId
                        ? { ...t, sessions: [...t.sessions, newSession].sort((a, b) => a.startHour - b.startHour) }
                        : t
                    )
                  );
                  setIsNewSessionModalOpen(false);
                  setManualBookingForm({
                    therapistId: 1,
                    date: new Date(2026, 4, 18),
                    hour: 10,
                    customerName: '',
                    serviceType: 'swedish',
                    roomNumber: '',
                  });
                }}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition"
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Booking Modal - Click Time Slot */}
      {bookingSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📅 Book New Massage</h3>

            <div className="space-y-4 mb-6">
              {/* Time Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-semibold">SELECTED TIME SLOT</p>
                <p className="text-lg font-bold text-blue-900 mt-1">
                  {String(bookingSlot.hour).padStart(2, '0')}:00 - {String(bookingSlot.hour + 1).padStart(2, '0')}:00
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {therapists.find(t => t.id === bookingSlot.therapistId)?.name}
                </p>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Guest/Customer Name</label>
                <input
                  type="text"
                  value={bookingForm.customerName}
                  onChange={e => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                  placeholder="e.g., John Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                />
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Service Type</label>
                <select
                  value={bookingForm.serviceType}
                  onChange={e => setBookingForm({ ...bookingForm, serviceType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                >
                  <option value="swedish">{SERVICE_CONFIG.swedish.icon} Swedish Massage</option>
                  <option value="thai">{SERVICE_CONFIG.thai.icon} Thai Massage</option>
                  <option value="hotstone">{SERVICE_CONFIG.hotstone.icon} Hot Stone Therapy</option>
                  <option value="foot">{SERVICE_CONFIG.foot.icon} Foot Massage</option>
                  <option value="aroma">{SERVICE_CONFIG.aroma.icon} Aromatherapy</option>
                </select>
              </div>

              {/* Room Number */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Room Assignment</label>
                <select
                  value={bookingForm.roomNumber}
                  onChange={e => setBookingForm({ ...bookingForm, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                >
                  <option value="">Select Room</option>
                  {ROOM_NUMBERS.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setBookingSlot(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 font-bold rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!bookingForm.customerName.trim()) {
                    alert('Please enter customer name');
                    return;
                  }
                  const newSession: ScheduleSession = {
                    id: `s${bookingSlot.therapistId}-${Date.now()}`,
                    therapistId: bookingSlot.therapistId,
                    serviceType: bookingForm.serviceType as any,
                    startHour: bookingSlot.hour,
                    endHour: bookingSlot.hour + 1,
                    customerName: bookingForm.customerName,
                    roomNumber: bookingForm.roomNumber || undefined,
                    status: 'scheduled',
                  };

                  setTherapists(prev =>
                    prev.map(t =>
                      t.id === bookingSlot.therapistId
                        ? { ...t, sessions: [...t.sessions, newSession].sort((a, b) => a.startHour - b.startHour) }
                        : t
                    )
                  );
                  setBookingSlot(null);
                }}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition"
              >
                Book Massage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
