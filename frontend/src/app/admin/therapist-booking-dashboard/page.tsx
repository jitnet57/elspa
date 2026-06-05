'use client';

import { useState, useEffect, useRef } from 'react';
import React from 'react';

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
  avatarUrl?: string;
  sessions: ScheduleSession[];
}

const SERVICE_CONFIG = {
  swedish:   { label: 'Swedish Massage', border: 'border-l-cyan-400', text: 'text-cyan-400', icon: '💆', bg: 'bg-cyan-400/5' },
  thai:      { label: 'Thai Massage', border: 'border-l-emerald-400', text: 'text-emerald-400', icon: '🙏', bg: 'bg-emerald-400/5' },
  hotstone:  { label: 'Hot Stone Therapy', border: 'border-l-orange-400', text: 'text-orange-400', icon: '🪨', bg: 'bg-orange-400/5' },
  foot:      { label: 'Foot Massage', border: 'border-l-indigo-400', text: 'text-indigo-400', icon: '🦶', bg: 'bg-indigo-400/5' },
  aroma:     { label: 'Aromatherapy', border: 'border-l-pink-400', text: 'text-pink-400', icon: '🌸', bg: 'bg-pink-400/5' },
  break:     { label: 'Break', border: 'border-dashed border-white/10', text: 'text-slate-400', icon: '☕', bg: 'bg-white/5' },
  available: { label: 'Available', border: 'border-l-slate-600', text: 'text-slate-600', icon: '', bg: 'bg-transparent' },
} as const;

const STATUS_CONFIG = {
  available: { label: 'AVAILABLE', dot: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]', color: 'text-green-500' },
  in_session: { label: 'IN SESSION', dot: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]', color: 'text-cyan-400' },
  break: { label: 'BREAK', dot: 'bg-yellow-500', color: 'text-yellow-500' },
  off_duty: { label: 'OFF DUTY', dot: 'bg-slate-500', color: 'text-slate-500' },
} as const;

const PHILIPPINE_NAMES = [
  'Elena Santos', 'David Cruz', 'Sophie Reyes', 'Jose Garcia', 'Carmen Flores',
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

const ROOM_NUMBERS = Array.from({ length: 20 }, (_, i) => `Room ${String(i + 1).padStart(2, '0')}`);
const SERVICE_TYPES: Array<'swedish' | 'thai' | 'hotstone' | 'foot' | 'aroma'> = ['swedish', 'thai', 'hotstone', 'foot', 'aroma'];
const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const generateMockTherapists = (): ScheduleTherapist[] => {
  return PHILIPPINE_NAMES.map((name, index) => {
    const id = index + 1;
    const isManager = id <= 3;
    let status: 'available' | 'in_session' | 'break' | 'off_duty' = 'available';
    if (id === 2) status = 'in_session';
    if (id === 3) status = 'break';
    const sessions: ScheduleSession[] = [];

    if (id === 1) {
      sessions.push({
        id: `s${id}-1`,
        therapistId: id,
        serviceType: 'swedish',
        startHour: 10,
        endHour: 12,
        customerName: 'James Cooper',
        roomNumber: 'Room 03',
        status: 'scheduled',
      });
      sessions.push({
        id: `s${id}-2`,
        therapistId: id,
        serviceType: 'aroma',
        startHour: 14,
        endHour: 15,
        customerName: 'Sarah L.',
        roomNumber: 'Room 08',
        status: 'scheduled',
      });
    } else if (id === 2) {
      sessions.push({
        id: `s${id}-1`,
        therapistId: id,
        serviceType: 'thai',
        startHour: 9,
        endHour: 10.5,
        customerName: 'Marcus V.',
        roomNumber: 'Room 01',
        status: 'in_progress',
      });
      sessions.push({
        id: `s${id}-2`,
        therapistId: id,
        serviceType: 'hotstone',
        startHour: 12,
        endHour: 14,
        customerName: 'Olivia Chen',
        roomNumber: 'Room 05',
        status: 'scheduled',
      });
    } else if (id === 3) {
      sessions.push({
        id: `s${id}-break`,
        therapistId: id,
        serviceType: 'break',
        startHour: 11,
        endHour: 12,
        status: 'scheduled',
      });
      sessions.push({
        id: `s${id}-1`,
        therapistId: id,
        serviceType: 'foot',
        startHour: 15,
        endHour: 16,
        customerName: 'Kevin Smith',
        roomNumber: 'Room 12',
        status: 'scheduled',
      });
    } else {
      const sessionCount = getRandomInt(0, 3);
      for (let i = 0; i < sessionCount; i++) {
        const startHour = getRandomInt(9, 18);
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
    }

    return {
      id,
      name,
      title: isManager ? 'Senior Therapist' : 'Therapist',
      status,
      avatarColor: 'from-slate-700 to-slate-800',
      sessions: sessions.sort((a, b) => a.startHour - b.startHour),
    };
  });
};

const START_HOUR = 9;
const END_HOUR = 21;
const COLUMN_WIDTH = 80;

export default function TherapistBookingDashboard() {
  const [therapists, setTherapists] = useState<ScheduleTherapist[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Supabase에서 실시간 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Supabase에서 therapists와 bookings 데이터 조회
        const response = await fetch('/api/therapist-schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: selectedDate.toISOString().split('T')[0] })
        });

        if (response.ok) {
          const data = await response.json();
          setTherapists(data.therapists || []);
        } else {
          console.warn('❌ Supabase 데이터 로드 실패, 목 데이터 사용');
          setTherapists(generateMockTherapists());
        }
      } catch (error) {
        console.error('❌ 데이터 로드 실패:', error);
        setTherapists(generateMockTherapists());
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

  const formatTime = (hour: number) => {
    const hh = Math.floor(hour);
    const mm = Math.round((hour % 1) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
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

  const getNextDays = (baseDate: Date, count: number) => {
    return Array.from({ length: count }).map((_, i) => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      return date;
    });
  };

  const nextDays = getNextDays(selectedDate, 6);
  const filteredTherapists = therapists.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0c1324] bg-[radial-gradient(ellipse_at_top,_#1e293b,_#0c1324)] text-[#dce1fb] font-sans antialiased overflow-hidden">

      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-500/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-500/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

      {/* Header */}
      <header className="bg-slate-950/40 backdrop-blur-md text-cyan-400 flex justify-between items-center px-6 py-4 border-b border-indigo-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-4">
          <a className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-full transition-all active:scale-95 text-[#8aebff]" href="/admin">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
          </a>
          <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-[#8aebff] drop-shadow-[0_0_8px_rgba(138,235,255,0.4)]">
            SPLIT VIEW: Therapist Schedule + Booking
          </h1>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex h-[calc(100vh-73px)]">

        {/* LEFT: Therapist Schedule - Compact Timeline */}
        <div className="flex-1 border-r border-indigo-500/10 overflow-hidden flex flex-col">

          {/* Date Navigator */}
          <div className="flex-shrink-0 bg-slate-900/40 border-b border-indigo-500/10 p-3 flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              className="bg-white/5 border border-indigo-500/10 hover:border-indigo-500/30 p-2 rounded-lg hover:bg-white/10 active:scale-95 transition-all text-[#8aebff]"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>

            <div className="flex gap-1.5 overflow-x-auto">
              {nextDays.map((date, i) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center justify-center min-w-[50px] py-1.5 px-1 rounded-lg cursor-pointer active:scale-95 transition-all duration-300 border text-[8px] ${
                      isSelected
                        ? 'bg-white/5 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                        : 'bg-white/2 border-white/5 opacity-55 hover:opacity-100'
                    }`}
                  >
                    <span className={`font-bold ${isSelected ? 'text-cyan-400' : 'text-indigo-200'}`}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]}
                    </span>
                    <span className="text-xs font-black text-white">{date.getDate()}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNextDay}
              className="bg-white/5 border border-indigo-500/10 hover:border-indigo-500/30 p-2 rounded-lg hover:bg-white/10 active:scale-95 transition-all text-[#8aebff]"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>

            <div className="flex-1 ml-2">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-1.5 bg-slate-950/80 border border-indigo-500/20 rounded-lg text-xs focus:outline-none focus:border-cyan-400 text-white placeholder-indigo-300/30"
              />
            </div>
          </div>

          {/* Compact Timeline */}
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-slate-900/20">
            <div className="min-w-max" style={{ display: 'grid', gridTemplateColumns: `140px repeat(${END_HOUR - START_HOUR}, ${COLUMN_WIDTH}px)` }}>

              {/* Header - Hours */}
              <div className="sticky top-0 left-0 z-30 bg-slate-900/60 border-b border-r border-indigo-500/20 w-[140px] flex items-center justify-center text-[9px] font-bold text-indigo-300/50">
                SCHEDULE
              </div>

              {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                <div
                  key={i}
                  className="sticky top-0 z-20 bg-slate-900/40 border-b border-r border-indigo-500/10 flex items-center justify-center text-[9px] font-black text-indigo-300/60"
                  style={{ width: COLUMN_WIDTH }}
                >
                  {String(START_HOUR + i).padStart(2, '0')}:00
                </div>
              ))}

              {/* Therapist Rows */}
              {filteredTherapists.slice(0, 20).map((therapist) => (
                <React.Fragment key={therapist.id}>
                  {/* Name Column */}
                  <div className="sticky left-0 z-20 w-[140px] bg-slate-900/60 border-b border-r border-indigo-500/20 p-2 flex items-center gap-1.5 min-h-[50px]">
                    <div className="relative flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/30 border border-indigo-500/40 flex items-center justify-center text-white font-bold text-xs">
                        {therapist.name[0]}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-2 h-2 border border-slate-900 rounded-full ${STATUS_CONFIG[therapist.status].dot}`}></div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-white truncate">{therapist.name.split(' ')[0]}</p>
                      <p className={`text-[7px] font-bold ${STATUS_CONFIG[therapist.status].color}`}>{STATUS_CONFIG[therapist.status].label.split(' ')[0]}</p>
                    </div>
                  </div>

                  {/* Timeline Cells */}
                  <div className="flex h-[50px] border-b border-indigo-500/10 relative">
                    {Array.from({ length: END_HOUR - START_HOUR }).map((_, colIndex) => (
                      <div
                        key={colIndex}
                        className="border-r border-indigo-500/5 flex-shrink-0 relative hover:bg-indigo-500/10 transition-colors"
                        style={{ width: COLUMN_WIDTH }}
                      >
                        {therapist.sessions.map((session) => {
                          if (!(session.startHour < colIndex + START_HOUR + 1 && session.endHour > colIndex + START_HOUR)) return null;

                          const conf = SERVICE_CONFIG[session.serviceType as keyof typeof SERVICE_CONFIG];
                          const startOffset = (session.startHour - (colIndex + START_HOUR)) * COLUMN_WIDTH;
                          const durationWidth = (session.endHour - session.startHour) * COLUMN_WIDTH;

                          return (
                            <div
                              key={session.id}
                              className={`absolute top-1 bottom-1 rounded-lg border-l-2 ${conf.border} ${conf.bg} p-1 text-[7px] font-bold text-white overflow-hidden`}
                              style={{
                                left: `${Math.max(0, startOffset)}px`,
                                width: `${Math.min(durationWidth, COLUMN_WIDTH - 4)}px`
                              }}
                              title={`${session.customerName || ''} ${session.serviceType}`}
                            >
                              {session.customerName && <div className="truncate">{session.customerName.split(' ')[0]}</div>}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Booking Panel + Google Sheet */}
        <div className="w-[500px] border-l border-indigo-500/10 flex flex-col bg-slate-950/40 backdrop-blur-sm overflow-hidden">

          {/* Booking Form */}
          <div className="flex-shrink-0 border-b border-indigo-500/10 overflow-y-auto max-h-[45%]">
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-black text-cyan-400 mb-2">📋 QUICK BOOKING</h3>

              <div>
                <label className="text-[9px] font-bold text-indigo-300/60 block mb-1 uppercase">Service</label>
                <select className="w-full px-3 py-2 bg-slate-950/80 border border-indigo-500/20 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400">
                  <option>Swedish Massage</option>
                  <option>Thai Massage</option>
                  <option>Hot Stone</option>
                  <option>Foot Massage</option>
                  <option>Aromatherapy</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-indigo-300/60 block mb-1 uppercase">Time</label>
                  <select className="w-full px-3 py-2 bg-slate-950/80 border border-indigo-500/20 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400">
                    <option>09:00</option>
                    <option>10:00</option>
                    <option>11:00</option>
                    <option>12:00</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-indigo-300/60 block mb-1 uppercase">Room</label>
                  <select className="w-full px-3 py-2 bg-slate-950/80 border border-indigo-500/20 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400">
                    <option>Room 01</option>
                    <option>Room 02</option>
                    <option>Room 03</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-indigo-300/60 block mb-1 uppercase">Guest Name</label>
                <input type="text" placeholder="e.g. James Cooper" className="w-full px-3 py-2 bg-slate-950/80 border border-indigo-500/20 rounded-lg text-xs text-white placeholder-indigo-300/30 focus:outline-none focus:border-cyan-400" />
              </div>

              <button className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 rounded-lg text-xs uppercase transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                ✨ BOOK NOW
              </button>
            </div>
          </div>

          {/* Google Sheet Embed */}
          <div className="flex-1 overflow-hidden">
            <iframe
              src="https://docs.google.com/spreadsheets/d/1-WRjYvp33RQ3vJBSJ7RIW1g6P5pZjKqy_vPeVtA7mf8/edit?usp=sharing&rm=minimal"
              className="w-full h-full"
              style={{ border: 'none' }}
            ></iframe>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.3);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
