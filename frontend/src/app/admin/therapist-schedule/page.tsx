'use client';

import { useState } from 'react';

interface ScheduleSession {
  id: string;
  therapistId: number;
  serviceType: 'swedish' | 'thai' | 'hotstone' | 'foot' | 'aroma' | 'break' | 'available';
  startHour: number;
  endHour: number;
  customerName?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
}

interface ScheduleTherapist {
  id: number;
  name: string;
  status: 'available' | 'in_session' | 'break' | 'off_duty';
  avatarColor: string;
  sessions: ScheduleSession[];
}

const SERVICE_CONFIG = {
  swedish:   { label: 'Swedish Massage', bg: 'bg-blue-100 border-blue-300 text-blue-700', icon: '💆' },
  thai:      { label: 'Thai Massage', bg: 'bg-green-100 border-green-300 text-green-700', icon: '🙏' },
  hotstone:  { label: 'Hot Stone', bg: 'bg-orange-100 border-orange-300 text-orange-700', icon: '🪨' },
  foot:      { label: 'Foot Massage', bg: 'bg-teal-100 border-teal-300 text-teal-700', icon: '🦶' },
  aroma:     { label: 'Aromatherapy', bg: 'bg-purple-100 border-purple-300 text-purple-700', icon: '🌸' },
  break:     { label: 'Break', bg: 'bg-yellow-200 border-yellow-400 text-yellow-800', icon: '☕' },
  available: { label: 'Available', bg: 'bg-green-50 border-green-200 text-green-600', icon: '' },
} as const;

const STATUS_BADGE = {
  available: { dot: '●', color: 'text-green-500' },
  in_session: { dot: '●', color: 'text-blue-500' },
  break: { dot: '◑', color: 'text-yellow-500' },
  off_duty: { dot: '◌', color: 'text-gray-400' },
} as const;

const STATUS_LABEL = {
  available: 'Available',
  in_session: 'In Session',
  break: 'Break',
  off_duty: 'Off Duty',
} as const;

const MOCK_THERAPISTS: ScheduleTherapist[] = [
  {
    id: 1, name: 'Anna', status: 'available', avatarColor: 'from-orange-400 to-orange-600',
    sessions: [
      { id: 'a1', therapistId: 1, serviceType: 'available', startHour: 9, endHour: 10.5, status: 'scheduled' },
      { id: 'a2', therapistId: 1, serviceType: 'available', startHour: 16, endHour: 21, status: 'scheduled' },
    ],
  },
  {
    id: 2, name: 'Bella', status: 'in_session', avatarColor: 'from-pink-400 to-pink-600',
    sessions: [
      { id: 'b1', therapistId: 2, serviceType: 'swedish', startHour: 10, endHour: 12, customerName: '김민준', status: 'in_progress' },
      { id: 'b2', therapistId: 2, serviceType: 'aroma', startHour: 12.5, endHour: 14.5, customerName: '이수연', status: 'scheduled' },
      { id: 'b3', therapistId: 2, serviceType: 'hotstone', startHour: 15, endHour: 17, customerName: '박지은', status: 'scheduled' },
    ],
  },
  {
    id: 3, name: 'Cathy', status: 'in_session', avatarColor: 'from-amber-400 to-amber-600',
    sessions: [
      { id: 'c1', therapistId: 3, serviceType: 'foot', startHour: 9.5, endHour: 11.5, customerName: '최준호', status: 'completed' },
      { id: 'c2', therapistId: 3, serviceType: 'thai', startHour: 12, endHour: 14, customerName: '강지은', status: 'in_progress' },
      { id: 'c3', therapistId: 3, serviceType: 'swedish', startHour: 14.5, endHour: 16.5, customerName: '이준영', status: 'scheduled' },
    ],
  },
  {
    id: 4, name: 'Daisy', status: 'break', avatarColor: 'from-yellow-400 to-yellow-600',
    sessions: [
      { id: 'd0', therapistId: 4, serviceType: 'break', startHour: 9, endHour: 10, status: 'scheduled' },
      { id: 'd1', therapistId: 4, serviceType: 'aroma', startHour: 10, endHour: 12, customerName: '김수현', status: 'scheduled' },
      { id: 'd2', therapistId: 4, serviceType: 'hotstone', startHour: 13, endHour: 15, customerName: '박민수', status: 'scheduled' },
    ],
  },
  {
    id: 5, name: 'Ella', status: 'in_session', avatarColor: 'from-green-400 to-green-600',
    sessions: [
      { id: 'e1', therapistId: 5, serviceType: 'thai', startHour: 11, endHour: 13, customerName: '이영희', status: 'in_progress' },
      { id: 'e2', therapistId: 5, serviceType: 'swedish', startHour: 13.5, endHour: 15.5, customerName: '정현준', status: 'scheduled' },
      { id: 'e3', therapistId: 5, serviceType: 'aroma', startHour: 16, endHour: 18, customerName: '박유진', status: 'scheduled' },
    ],
  },
  {
    id: 6, name: 'Fatima', status: 'available', avatarColor: 'from-purple-400 to-purple-600',
    sessions: [
      { id: 'f1', therapistId: 6, serviceType: 'available', startHour: 9, endHour: 11, status: 'scheduled' },
      { id: 'f2', therapistId: 6, serviceType: 'available', startHour: 16, endHour: 21, status: 'scheduled' },
    ],
  },
  {
    id: 7, name: 'Gina', status: 'off_duty', avatarColor: 'from-gray-400 to-gray-600',
    sessions: [],
  },
  {
    id: 8, name: 'Hana', status: 'in_session', avatarColor: 'from-teal-400 to-teal-600',
    sessions: [
      { id: 'h1', therapistId: 8, serviceType: 'foot', startHour: 10.5, endHour: 12, customerName: '임다현', status: 'in_progress' },
      { id: 'h2', therapistId: 8, serviceType: 'thai', startHour: 13, endHour: 15, customerName: '유지원', status: 'scheduled' },
      { id: 'h3', therapistId: 8, serviceType: 'hotstone', startHour: 15.5, endHour: 17.5, customerName: '강지연', status: 'scheduled' },
    ],
  },
];

const START_HOUR = 9;
const END_HOUR = 21;
const COLUMN_WIDTH = 100;

export default function TherapistSchedulePage() {
  const [therapists, setTherapists] = useState<ScheduleTherapist[]>(MOCK_THERAPISTS);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<ScheduleSession | null>(null);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [newSession, setNewSession] = useState<{
    therapistId: number;
    serviceType: 'swedish' | 'thai' | 'hotstone' | 'foot' | 'aroma' | 'break' | 'available';
    startHour: number;
    customerName: string;
  }>({
    therapistId: 0,
    serviceType: 'swedish',
    startHour: 10,
    customerName: '',
  });

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', weekday: 'short' });
  };

  const handlePrevDay = () => setSelectedDate(d => new Date(d.getTime() - 86400000));
  const handleNextDay = () => setSelectedDate(d => new Date(d.getTime() + 86400000));

  const handleSessionClick = (session: ScheduleSession) => {
    if (session.serviceType === 'available') return;
    setSelectedSession(session);
  };

  const handleAddSession = () => {
    if (!newSession.therapistId) {
      alert('테라피스트를 선택해주세요');
      return;
    }

    const endHour = newSession.startHour + (SERVICE_CONFIG[newSession.serviceType as keyof typeof SERVICE_CONFIG]?.label.includes('Thai') ? 1.5 : 1);
    const session: ScheduleSession = {
      id: `new-${Date.now()}`,
      therapistId: newSession.therapistId,
      serviceType: newSession.serviceType,
      startHour: newSession.startHour,
      endHour: Math.min(endHour, END_HOUR),
      customerName: newSession.customerName || 'Walk-in Guest',
      status: 'scheduled',
    };

    setTherapists(prev =>
      prev.map(t =>
        t.id === newSession.therapistId ? { ...t, sessions: [...t.sessions, session] } : t
      )
    );

    setIsNewSessionModalOpen(false);
    setNewSession({ therapistId: 0, serviceType: 'swedish', startHour: 10, customerName: '' });
  };

  const handleDeleteSession = (sessionId: string, therapistId: number) => {
    setTherapists(prev =>
      prev.map(t =>
        t.id === therapistId ? { ...t, sessions: t.sessions.filter(s => s.id !== sessionId) } : t
      )
    );
    setSelectedSession(null);
  };

  const handleUpdateSessionStatus = (sessionId: string, therapistId: number, newStatus: ScheduleSession['status']) => {
    setTherapists(prev =>
      prev.map(t =>
        t.id === therapistId
          ? {
            ...t,
            sessions: t.sessions.map(s =>
              s.id === sessionId ? { ...s, status: newStatus } : s
            ),
          }
          : t
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-full">
        {/* 헤더 - 3단계 */}
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

          {/* 날짜 네비게이터 */}
          <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
            <button onClick={handlePrevDay} className="text-2xl text-gray-600 hover:text-gray-900">&lt;</button>
            <span className="text-lg font-bold text-gray-900">{formatDate(selectedDate)}</span>
            <button onClick={handleNextDay} className="text-2xl text-gray-600 hover:text-gray-900">&gt;</button>
          </div>
        </div>

        {/* 스케줄 그리드 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* 헤더 */}
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

            {/* 테라피스트 행 */}
            {therapists.map(therapist => (
              <div key={therapist.id} className="flex border-b border-gray-200 hover:bg-gray-50 transition">
                {/* 테라피스트 정보 */}
                <div className="w-40 flex-shrink-0 px-4 py-4 bg-white sticky left-0 z-5 border-r border-gray-200 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${therapist.avatarColor} flex items-center justify-center text-white font-bold text-sm`}>
                    {therapist.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{therapist.name}</div>
                    <div className={`text-xs ${STATUS_BADGE[therapist.status].color}`}>
                      {STATUS_BADGE[therapist.status].dot} {STATUS_LABEL[therapist.status]}
                    </div>
                  </div>
                </div>

                {/* 시간 그리드 */}
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
                          setNewSession(prev => ({...prev, therapistId: therapist.id, startHour: hourStart}));
                          setIsNewSessionModalOpen(true);
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
                              handleSessionClick(session);
                            }}
                          >
                            <div className="font-bold whitespace-nowrap">
                              {SERVICE_CONFIG[session.serviceType as keyof typeof SERVICE_CONFIG].icon}{' '}
                              {Math.floor(session.startHour)}:{String((session.startHour % 1) * 60).padStart(2, '0')}
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

      {/* 세션 상세 팝업 */}
      {selectedSession && !['available', 'break'].includes(selectedSession.serviceType) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">세션 상세</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-sm text-gray-600">고객명</label>
                <p className="font-bold text-gray-900">{selectedSession.customerName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">서비스</label>
                <p className="font-bold text-gray-900">
                  {SERVICE_CONFIG[selectedSession.serviceType as keyof typeof SERVICE_CONFIG].label}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">시간</label>
                <p className="font-bold text-gray-900">
                  {Math.floor(selectedSession.startHour)}:{String((selectedSession.startHour % 1) * 60).padStart(2, '0')} ~{' '}
                  {Math.floor(selectedSession.endHour)}:{String((selectedSession.endHour % 1) * 60).padStart(2, '0')}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">상태</label>
                <select
                  value={selectedSession.status}
                  onChange={e =>
                    handleUpdateSessionStatus(selectedSession.id, selectedSession.therapistId, e.target.value as any)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 font-bold text-gray-900"
                >
                  <option value="scheduled">예약됨</option>
                  <option value="in_progress">진행중</option>
                  <option value="completed">완료</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSession(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 font-bold rounded-lg hover:bg-gray-50 transition"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  handleDeleteSession(selectedSession.id, selectedSession.therapistId);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 새 세션 모달 */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6">+ Start New Massage</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">테라피스트 선택</label>
                <select
                  value={newSession.therapistId}
                  onChange={e => setNewSession(prev => ({...prev, therapistId: Number(e.target.value)}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value={0}>선택해주세요</option>
                  {therapists.filter(t => t.status !== 'off_duty').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">서비스 종류</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(SERVICE_CONFIG).filter(k => k !== 'break' && k !== 'available') as Array<keyof typeof SERVICE_CONFIG>).map(key => (
                    <button
                      key={key}
                      onClick={() => setNewSession(prev => ({...prev, serviceType: key}))}
                      className={`p-2 rounded text-sm font-bold transition-colors ${
                        newSession.serviceType === key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {SERVICE_CONFIG[key].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">시작 시간</label>
                <input
                  type="number"
                  min="9"
                  max="20"
                  value={newSession.startHour}
                  onChange={e => setNewSession(prev => ({...prev, startHour: Number(e.target.value)}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">고객명 (선택)</label>
                <input
                  type="text"
                  value={newSession.customerName}
                  onChange={e => setNewSession(prev => ({...prev, customerName: e.target.value}))}
                  placeholder="손님 이름..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsNewSessionModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 font-bold rounded-lg hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleAddSession}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
