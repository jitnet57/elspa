'use client';

import { useState, useEffect, useRef } from 'react';
import React from 'react';

// ============================================================
// 📌 인터페이스 정의 (TypeScript Schedule Models)
// ============================================================
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

// ============================================================
// 📌 상수 및 설정 시스템 (Service & Status Configs)
// ============================================================
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

// 60명의 필리핀 및 아시안 로컬라이즈드 인력 네이밍
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

const SERVICE_TYPES: Array<'swedish' | 'thai' | 'hotstone' | 'foot' | 'aroma'> = [
  'swedish', 'thai', 'hotstone', 'foot', 'aroma',
];

// 난수 생성 유틸리티 함수
const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

// ============================================================
// 📌 60명 치료사 초기 시드 데이터 자동 생성기
// ============================================================
const generateMockTherapists = (): ScheduleTherapist[] => {
  return PHILIPPINE_NAMES.map((name, index) => {
    const id = index + 1;
    const isManager = id <= 3; // Elena, David, Sophie는 1, 2, 3번으로 고정 매핑

    // 초기 상태 정의
    let status: 'available' | 'in_session' | 'break' | 'off_duty' = 'available';
    if (id === 2) status = 'in_session';
    if (id === 3) status = 'break';

    const sessions: ScheduleSession[] = [];

    // Elena S. 고정 더미 세션 매핑
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
    } 
    // David K. 고정 더미 세션 매핑
    else if (id === 2) {
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
    } 
    // Sophie R. 고정 더미 세션 매핑
    else if (id === 3) {
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
    } 
    // 나머지 57명은 랜덤 스케줄 자동 시뮬레이션
    else {
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

const MOCK_THERAPISTS: ScheduleTherapist[] = generateMockTherapists();

const START_HOUR = 9;
const END_HOUR = 21;
const COLUMN_WIDTH = 120; // 1시간당 120px (HTML Mockup 규격 일치)

export default function TherapistSchedulePage() {
  const [therapists, setTherapists] = useState<ScheduleTherapist[]>(MOCK_THERAPISTS);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 4, 18)); // 5월 18일 기준
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'table' | 'sheet' | 'book'>('sheet');

  // 3대 인터랙티브 모달 상태 제어
  const [selectedSession, setSelectedSession] = useState<ScheduleSession | null>(null);
  const [bookingSlot, setBookingSlot] = useState<{ therapistId: number; hour: number } | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [showGoogleSheetBooking, setShowGoogleSheetBooking] = useState(false);
  const [googleBookings, setGoogleBookings] = useState<any[]>([]);

  // 예약 폼 상태 제어
  const [quickForm, setQuickForm] = useState({ customerName: '', serviceType: 'swedish' as const, roomNumber: '' });
  const [manualForm, setManualForm] = useState({
    therapistId: 1,
    startHour: 9,
    duration: 60, // 60, 90, 120 Min
    serviceType: 'swedish' as 'swedish' | 'thai' | 'hotstone' | 'foot' | 'aroma',
    customerName: '',
    roomNumber: '',
  });

  const timeIndicatorRef = useRef<HTMLDivElement | null>(null);

  // ============================================================
  // 📌 현재 시간 인디케이터 실시간 시뮬레이터 (Nebula Red Line)
  // ============================================================
  useEffect(() => {
    const updateIndicator = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();

      if (timeIndicatorRef.current) {
        if (currentHour >= START_HOUR && currentHour < END_HOUR) {
          // Left offset: 200px (이름셀 너비) + ((현재시간 - 9) * 120px) + (분 비율 * 120px)
          const offset = 200 + (currentHour - START_HOUR) * COLUMN_WIDTH + (currentMinutes / 60) * COLUMN_WIDTH;
          timeIndicatorRef.current.style.left = `${offset}px`;
          timeIndicatorRef.current.style.display = 'block';
        } else {
          timeIndicatorRef.current.style.display = 'none';
        }
      }
    };

    updateIndicator();
    const interval = setInterval(updateIndicator, 60000); // 1분 주기 갱신
    return () => clearInterval(interval);
  }, []);

  const formatTime = (hour: number) => {
    const hh = Math.floor(hour);
    const mm = Math.round((hour % 1) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };


  // 날짜 변경 컨트롤러
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

  // 6개 날짜 칩 생성용 데이터
  const getNextDays = (baseDate: Date, count: number) => {
    return Array.from({ length: count }).map((_, i) => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      return date;
    });
  };
  const nextDays = getNextDays(selectedDate, 6);

  // 검색어가 있을 경우 치료사 필터링
  const filteredTherapists = therapists.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0c1324] bg-[radial-gradient(ellipse_at_top,_#1e293b,_#0c1324)] text-[#dce1fb] font-sans antialiased relative pb-16">
      
      {/* 구글 폰트 및 아이콘 다이나믹 인젝션 */}
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

      {/* 우주 은하수 안개 배경 (Nebula Layer Effects) */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-500/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-500/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

      {/* ============================================================
          📌 Top Navigation Shell (Shared Component)
          ============================================================ */}
      <header className="bg-gradient-to-b from-slate-900/60 to-slate-950/40 backdrop-blur-md text-white sticky top-0 z-50 border-b border-indigo-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        {/* Top Navigation */}
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-4">
            <a className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-full transition-all active:scale-95" href="/admin">
              <span className="material-symbols-outlined text-cyan-400">arrow_back</span>
            </a>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all text-slate-300 hover:text-white text-sm font-semibold">
              🛏️ Real-time Bed Mode
            </button>
          </div>

          {/* Center Tab - Therapist Daily Schedule */}
          <button className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 rounded-xl transition-all text-white font-bold shadow-lg hover:shadow-purple-500/50">
            <span style={{fontSize: '20px'}}>📅</span>
            Therapist Daily Schedule
          </button>

          {/* Right - Time & Language */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-mono text-slate-300">08:47:31</div>
              <div className="text-xs text-slate-500">Polls: 1 | 📞</div>
            </div>
            <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-bold text-sm">EN</button>
            <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold text-sm">KO</button>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
              <span className="material-symbols-outlined text-slate-400">settings</span>
            </button>
          </div>
        </div>

        {/* RED BOX - Booking Menu */}
        <div className="flex justify-center px-6 pb-4">
          <button
            onClick={() => setShowGoogleSheetBooking(true)}
            className="w-full max-w-2xl px-6 py-4 border-4 border-red-500/80 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-lg transition-all shadow-xl hover:shadow-rose-500/50 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🧖</span>
            <div className="text-left">
              <div>Booking with Therapist</div>
              <div className="text-xs text-white/80">View Google Sheets Bookings</div>
            </div>
            <span className="ml-auto">→</span>
          </button>
        </div>
      </header>

      {/* ============================================================
          📌 Main Shell Grid (Sidebar + Content Area)
          ============================================================ */}
      <div className="flex min-h-screen">
        
        {/* Navigation Sidebar Shell */}
        <aside className="hidden lg:flex flex-col h-screen p-6 fixed left-0 top-0 h-full w-[280px] bg-slate-900/40 backdrop-blur-xl border-r border-indigo-500/10 shadow-2xl shadow-black/50 z-40 pt-24 justify-between">
          <div className="flex flex-col gap-2">
            <a className="flex items-center gap-4 px-4 py-3 rounded-xl text-indigo-300/60 hover:text-white hover:bg-white/5 transition-all" href="/admin">
              <span className="material-symbols-outlined">dashboard</span>
              <span className="font-semibold text-sm">Dashboard</span>
            </a>
            <a className="flex items-center gap-4 px-4 py-3 rounded-xl text-cyan-400 bg-white/10 border-r-2 border-cyan-400 font-bold shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all" href="/admin/therapists">
              <span className="material-symbols-outlined">groups</span>
              <span className="font-bold text-sm">Therapists</span>
            </a>
            <a className="flex items-center gap-4 px-4 py-3 rounded-xl text-indigo-300/60 hover:text-white hover:bg-white/5 transition-all" href="/admin/payroll">
              <span className="material-symbols-outlined">payments</span>
              <span className="font-semibold text-sm">Payroll</span>
            </a>
            <a className="flex items-center gap-4 px-4 py-3 rounded-xl text-indigo-300/60 hover:text-white hover:bg-white/5 transition-all" href="/admin/policies">
              <span className="material-symbols-outlined">settings</span>
              <span className="font-semibold text-sm">Settings</span>
            </a>
          </div>
          
          <div className="bg-slate-950/50 backdrop-blur-md border border-cyan-500/20 p-4 rounded-2xl shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">SYSTEM ONLINE</span>
            </div>
            <p className="text-[9px] text-indigo-300/40 mt-1 uppercase font-bold tracking-wider">ENCRYPTION: AES-256 ACTIVE</p>
          </div>
        </aside>

        {/* Content Canvas */}
        <section className="flex-grow lg:ml-[280px] p-4 sm:p-6 lg:p-8 space-y-8 overflow-x-hidden">
          
          {/* Date Navigator & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/10 pb-6">
            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={handlePrevDay}
                  className="bg-white/5 border border-indigo-500/10 hover:border-indigo-500/30 p-3 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-[#8aebff]"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                {/* Date Chips */}
                <div className="flex gap-2.5 overflow-x-auto py-1 max-w-[280px] sm:max-w-none">
                  {nextDays.map((date, i) => {
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const isSat = date.getDay() === 6;
                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={`flex flex-col items-center justify-center min-w-[65px] py-2 px-1.5 rounded-xl cursor-pointer active:scale-95 transition-all duration-300 border ${
                          isSelected
                            ? 'bg-white/5 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                            : 'bg-white/2 border-white/5 opacity-55 hover:opacity-100'
                        }`}
                      >
                        <span className={`text-[9px] font-black tracking-widest ${isSelected ? 'text-cyan-400' : isSat ? 'text-rose-400' : 'text-indigo-200'}`}>
                          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()]}
                        </span>
                        <span className="text-lg font-black text-white mt-0.5">{date.getDate()}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleNextDay}
                  className="bg-white/5 border border-indigo-500/10 hover:border-indigo-500/30 p-3 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-[#8aebff]"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>

              {/* View Mode Toggle & Search */}
              <div className="flex gap-3 md:gap-4 w-full md:justify-end items-center">
                {/* View Mode Toggle */}
                <div className="flex gap-2 bg-slate-900/40 border border-indigo-500/10 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                      viewMode === 'timeline'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-indigo-300/60 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined inline mr-1.5" style={{fontSize: '16px', verticalAlign: 'middle'}}>timeline</span>
                    Timeline
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                      viewMode === 'table'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-indigo-300/60 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined inline mr-1.5" style={{fontSize: '16px', verticalAlign: 'middle'}}>table_chart</span>
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('sheet')}
                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                      viewMode === 'sheet'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-indigo-300/60 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined inline mr-1.5" style={{fontSize: '16px', verticalAlign: 'middle'}}>sheets_rtl</span>
                    Sheet
                  </button>
                  <button
                    onClick={() => setViewMode('book')}
                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                      viewMode === 'book'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-indigo-300/60 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined inline mr-1.5" style={{fontSize: '16px', verticalAlign: 'middle'}}>spa</span>
                    Book
                  </button>
                </div>

                {/* Live Search Box */}
                <div className="relative flex-1 md:flex-none md:w-64">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="치료사 이름 또는 직무 검색..."
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-indigo-500/20 rounded-xl text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all text-white placeholder-indigo-300/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              📌 Schedule Views (Timeline or Table Mode)
              ============================================================ */}
          {viewMode === 'timeline' ? (
          <div className="bg-slate-900/30 backdrop-blur-md border border-indigo-500/20 rounded-2xl overflow-hidden relative shadow-[0_0_40px_rgba(99,102,241,0.1)]">
            
            {/* Timeline Horizontal Scroll Board */}
            <div className="overflow-x-auto custom-scrollbar" id="schedule-scroll-container">
              <div 
                className="min-w-[1640px] relative" 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: `200px repeat(${END_HOUR - START_HOUR}, ${COLUMN_WIDTH}px)` 
                }}
              >
                
                {/* 📌 Real-time Red Nebula Indicator Line */}
                <div 
                  ref={timeIndicatorRef} 
                  className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-20 shadow-[0_0_10px_#8aebff] pointer-events-none transition-all duration-300"
                  style={{ display: 'none' }}
                ></div>

                {/* Top-Left Corner */}
                <div className="bg-slate-900/60 p-4 border-b border-r border-indigo-500/20 sticky left-0 z-30 flex items-center justify-center backdrop-blur-md">
                  <span className="material-symbols-outlined text-cyan-400/40">schedule</span>
                  <span className="text-[10px] font-black tracking-widest text-indigo-300/50 ml-1.5 uppercase">SCHEDULE</span>
                </div>

                {/* Hours Columns */}
                <div className="flex bg-slate-900/40 border-b border-indigo-500/20 h-14 col-span-12">
                  {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                    <div 
                      key={i} 
                      className="border-r border-indigo-500/10 flex items-center justify-center text-[10px] font-black tracking-widest text-indigo-300/60 font-mono"
                      style={{ width: COLUMN_WIDTH }}
                    >
                      {String(START_HOUR + i).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Rows Mapping */}
                <div className="contents">
                  {filteredTherapists.length > 0 ? (
                    filteredTherapists.map((therapist) => (
                      <React.Fragment key={therapist.id}>
                        
                        {/* Therapist Profile Sticky Left Column */}
                        <div className="w-[200px] p-4 bg-slate-900/60 border-b border-r border-indigo-500/20 sticky left-0 z-30 flex items-center gap-3 backdrop-blur-md">
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/30 border border-indigo-500/40 flex items-center justify-center text-white font-black text-sm uppercase">
                              {therapist.name[0]}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-slate-900 rounded-full ${STATUS_CONFIG[therapist.status].dot}`}></div>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white truncate">{therapist.name}</p>
                            <p className={`text-[9px] font-black tracking-wider ${STATUS_CONFIG[therapist.status].color}`}>{STATUS_CONFIG[therapist.status].label}</p>
                          </div>
                        </div>

                        {/* Interactive Timeline Grid Row */}
                        <div 
                          className="flex relative h-20 border-b border-indigo-500/10 bg-white/[0.01] hover:bg-indigo-500/5 transition-colors cursor-pointer group"
                          onClick={() => {
                            if (therapist.status === 'off_duty') return;
                            setBookingSlot({ therapistId: therapist.id, hour: 9 });
                          }}
                        >
                          {/* Empty hour cells for background grid mapping */}
                          {Array.from({ length: END_HOUR - START_HOUR }).map((_, colIndex) => {
                            const hourStart = START_HOUR + colIndex;
                            return (
                              <div
                                key={colIndex}
                                className="h-full border-r border-indigo-500/5 flex-shrink-0 relative group/cell"
                                style={{ width: COLUMN_WIDTH }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (therapist.status === 'off_duty') return;
                                  // 해당 칸에 스케줄이 중복되지 않는지 검사
                                  const isOverlap = therapist.sessions.some(s => !(s.endHour <= hourStart || s.startHour >= hourStart + 1));
                                  if (!isOverlap) {
                                    setBookingSlot({ therapistId: therapist.id, hour: hourStart });
                                    setQuickForm({ customerName: '', serviceType: 'swedish', roomNumber: '' });
                                  }
                                }}
                              >
                                <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-black text-cyan-400 uppercase tracking-widest select-none">
                                  + BOOK
                                </div>
                              </div>
                            );
                          })}

                          {/* Render Active Sessions absolutely positioned */}
                          {therapist.sessions.map((session) => {
                            const conf = SERVICE_CONFIG[session.serviceType as keyof typeof SERVICE_CONFIG];
                            const startOffset = (session.startHour - START_HOUR) * COLUMN_WIDTH;
                            const durationWidth = (session.endHour - session.startHour) * COLUMN_WIDTH;
                            
                            return (
                              <div
                                key={session.id}
                                className={`absolute top-2 bottom-2 rounded-xl border-l-4 ${conf.border} ${conf.bg} p-2.5 cursor-pointer hover:scale-[1.02] active:scale-98 transition-all duration-300 z-10 flex flex-col justify-between shadow-sm overflow-hidden`}
                                style={{
                                  left: `${startOffset + 4}px`,
                                  width: `${durationWidth - 8}px`
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSession(session);
                                }}
                              >
                                <div>
                                  <span className={`text-[9px] font-black tracking-widest ${conf.text} uppercase flex items-center gap-1`}>
                                    <span>{conf.icon}</span> {session.serviceType.toUpperCase()}
                                  </span>
                                  {session.customerName && (
                                    <p className="text-xs font-black text-white truncate mt-0.5">{session.customerName}</p>
                                  )}
                                </div>
                                {session.roomNumber && (
                                  <div className="flex justify-between items-center text-[9px] text-indigo-300/60 font-bold">
                                    <span>{session.roomNumber}</span>
                                    <span>{formatTime(session.startHour)} - {formatTime(session.endHour)}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                      </React.Fragment>
                    ))
                  ) : (
                    <div className="col-span-13 text-center py-16 text-indigo-300/30 font-black text-sm uppercase">치료사를 찾을 수 없습니다.</div>
                  )}
                </div>

              </div>
            </div>
          </div>
          ) : (
          <div className="bg-slate-900/30 backdrop-blur-md border border-indigo-500/20 rounded-2xl overflow-hidden relative shadow-[0_0_40px_rgba(99,102,241,0.1)]">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-indigo-500/20">
                    <th className="px-4 py-4 text-left text-[10px] font-black tracking-widest text-indigo-300/50 border-r border-indigo-500/10 sticky left-0 z-10 bg-slate-900/60 w-32">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{fontSize: '14px'}}>schedule</span>
                        THERAPIST
                      </span>
                    </th>
                    <th colSpan={8} className="px-4 py-4 text-center text-[10px] font-black tracking-widest text-cyan-400/70 border-r border-indigo-500/10">1ST TREATMENT</th>
                    <th colSpan={8} className="px-4 py-4 text-center text-[10px] font-black tracking-widest text-emerald-400/70">2ND TREATMENT</th>
                  </tr>
                  <tr className="bg-slate-900/40 border-b border-indigo-500/10">
                    <th className="px-4 py-3 text-left text-[9px] font-bold text-indigo-300/40 border-r border-indigo-500/10 sticky left-0 z-10 bg-slate-900/40">NAME</th>
                    {['1ST', '2ND'].map(treatment => (
                      <React.Fragment key={treatment}>
                        <th className="px-2 py-3 text-[9px] font-bold text-indigo-300/40 border-r border-indigo-500/10 w-20">TYPE</th>
                        <th className="px-2 py-3 text-[9px] font-bold text-indigo-300/40 border-r border-indigo-500/10 w-16">START</th>
                        <th className="px-2 py-3 text-[9px] font-bold text-indigo-300/40 border-r border-indigo-500/10 w-16">END</th>
                        <th className="px-2 py-3 text-[9px] font-bold text-indigo-300/40 border-r border-indigo-500/10 w-14">RM#</th>
                        <th className="px-2 py-3 text-[9px] font-bold text-indigo-300/40 border-r border-indigo-500/10 w-24">GUEST</th>
                        <th className="px-2 py-3 text-[9px] font-bold text-indigo-300/40 border-r border-indigo-500/10 w-20">NOTE</th>
                        <th className="px-2 py-3 text-[9px] font-bold text-indigo-300/40 border-r border-indigo-500/10 w-16">PAYMENT</th>
                        <th className="px-2 py-3 text-[9px] font-bold text-indigo-300/40 w-14">TIP</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTherapists.length > 0 ? (
                    filteredTherapists.slice(0, 30).map((therapist) => {
                      const [session1, session2] = therapist.sessions.sort((a, b) => a.startHour - b.startHour);
                      return (
                        <tr
                          key={therapist.id}
                          className="border-b border-indigo-500/10 hover:bg-indigo-500/5 transition-colors"
                        >
                          <td className="px-4 py-4 sticky left-0 z-10 bg-slate-900/30 border-r border-indigo-500/10">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/30 border border-indigo-500/40 flex items-center justify-center text-white font-black text-xs">
                                {therapist.name[0]}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">{therapist.name}</p>
                                <p className={`text-[9px] font-bold ${STATUS_CONFIG[therapist.status].color}`}>
                                  {STATUS_CONFIG[therapist.status].label}
                                </p>
                              </div>
                            </div>
                          </td>

                          {[session1, session2].map((session, sessionIdx) => (
                            <React.Fragment key={`${therapist.id}-${sessionIdx}`}>
                              <td className="px-2 py-4 border-r border-indigo-500/10">
                                {session ? (
                                  <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${SERVICE_CONFIG[session.serviceType as keyof typeof SERVICE_CONFIG].text} bg-white/5`}>
                                    {session.serviceType.toUpperCase()}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-indigo-300/20">-</span>
                                )}
                              </td>
                              <td className="px-2 py-4 border-r border-indigo-500/10 text-xs text-white font-mono">
                                {session ? formatTime(session.startHour) : '-'}
                              </td>
                              <td className="px-2 py-4 border-r border-indigo-500/10 text-xs text-white font-mono">
                                {session ? formatTime(session.endHour) : '-'}
                              </td>
                              <td className="px-2 py-4 border-r border-indigo-500/10 text-xs text-white font-bold">
                                {session?.roomNumber ? session.roomNumber.replace('Room ', '') : '-'}
                              </td>
                              <td className="px-2 py-4 border-r border-indigo-500/10 text-xs text-cyan-300 font-semibold truncate">
                                {session?.customerName || '-'}
                              </td>
                              <td className="px-2 py-4 border-r border-indigo-500/10 text-xs text-indigo-300/60">
                                -
                              </td>
                              <td className="px-2 py-4 border-r border-indigo-500/10 text-xs text-emerald-400 font-bold">
                                -
                              </td>
                              <td className="px-2 py-4 text-xs text-orange-400 font-bold">
                                -
                              </td>
                            </React.Fragment>
                          ))}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={17} className="text-center py-16 text-indigo-300/30 font-black text-sm uppercase">
                        치료사를 찾을 수 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Google Sheet View with Booking Functionality */}
          {viewMode === 'sheet' && (
          <div className="bg-slate-900/30 backdrop-blur-md border border-indigo-500/20 rounded-2xl overflow-hidden relative shadow-[0_0_40px_rgba(99,102,241,0.1)]">
            <iframe
              src="https://docs.google.com/spreadsheets/d/1-WRjYvp33RQ3vJBSJ7RIW1g6P5pZjKqy_vPeVtA7mf8/edit?usp=sharing&rm=minimal"
              width="100%"
              height="900"
              style={{border: 'none', borderRadius: '1rem'}}
              allowFullScreen
            ></iframe>
          </div>
          )}

          {/* Book Massage View - Google Sheet Booking Form */}
          {viewMode === 'book' && (
          <div className="bg-slate-900/30 backdrop-blur-md border border-indigo-500/20 rounded-2xl overflow-hidden relative shadow-[0_0_40px_rgba(99,102,241,0.1)]">
            <iframe
              src="https://docs.google.com/spreadsheets/d/1-WRjYvp33RQ3vJBSJ7RIW1g6P5pZjKqy_vPeVtA7mf8/edit?gid=4&usp=sharing&rm=minimal"
              width="100%"
              height="900"
              style={{border: 'none', borderRadius: '1rem'}}
              allowFullScreen
            ></iframe>
          </div>
          )}

          {/* ============================================================
              📌 Quick Action Floating Bento Grid
              ============================================================ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Quick Action: Quick Booking */}
            <div 
              onClick={() => {
                setBookingSlot({ therapistId: 1, hour: 9 });
                setQuickForm({ customerName: '', serviceType: 'swedish', roomNumber: '' });
              }}
              className="bg-slate-900/40 backdrop-blur-sm border border-cyan-500/20 p-6 rounded-2xl hover:translate-y-[-4px] active:scale-95 transition-all cursor-pointer group flex items-center gap-6 shadow-md hover:bg-slate-900/70"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <span className="material-symbols-outlined">add_circle</span>
              </div>
              <div>
                <h3 className="font-black text-white text-base">Quick Booking</h3>
                <p className="text-xs text-indigo-300/40 font-bold mt-0.5 uppercase tracking-wide">Instant AI-assisted slotting</p>
              </div>
            </div>

            {/* Quick Action: Manual Entry */}
            <div 
              onClick={() => setIsManualModalOpen(true)}
              className="bg-slate-900/40 backdrop-blur-sm border border-indigo-500/10 p-6 rounded-2xl hover:translate-y-[-4px] active:scale-95 transition-all cursor-pointer group flex items-center gap-6 shadow-md hover:bg-slate-900/70"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined">edit_calendar</span>
              </div>
              <div>
                <h3 className="font-black text-white text-base">Manual Entry</h3>
                <p className="text-xs text-indigo-300/40 font-bold mt-0.5 uppercase tracking-wide">Custom schedule overriding</p>
              </div>
            </div>

            {/* Quick Action: Dashboard Link */}
            <a 
              href="/admin/test-data"
              className="bg-slate-900/40 backdrop-blur-sm border border-indigo-500/10 p-6 rounded-2xl hover:translate-y-[-4px] active:scale-95 transition-all cursor-pointer group flex items-center gap-6 shadow-md hover:bg-slate-900/70"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-white/20 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined">analytics</span>
              </div>
              <div>
                <h3 className="font-black text-white text-base">Validation Matrix</h3>
                <p className="text-xs text-indigo-300/40 font-bold mt-0.5 uppercase tracking-wide">Staff Load & Settlement Audit</p>
              </div>
            </a>
          </div>

        </section>
      </div>

      {/* ============================================================
          📌 모달 윈도우 3종 세트 (Embedded Glassmorphism Modals)
          ============================================================ */}
      
      {/* 1. Quick Booking Modal (타임 슬롯 터치) */}
      {bookingSlot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-[0_0_50px_-12px_rgba(34,211,238,0.3)] transition-transform transform scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                ⚡ Quick Book Massage
              </h3>
              <button 
                onClick={() => setBookingSlot(null)}
                className="text-indigo-300/50 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-5">
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 text-xs">
                <p className="text-indigo-300/60 font-bold uppercase tracking-wider">Target Slot</p>
                <p className="text-base font-black text-white mt-1">
                  {formatTime(bookingSlot.hour)} - {formatTime(bookingSlot.hour + 1)} ({therapists.find(t => t.id === bookingSlot.therapistId)?.name})
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black tracking-widest text-indigo-300/60 block mb-2 uppercase">Guest Name</label>
                <input
                  type="text"
                  value={quickForm.customerName}
                  onChange={e => setQuickForm({ ...quickForm, customerName: e.target.value })}
                  placeholder="e.g. James Cooper"
                  className="w-full px-4 py-3 bg-slate-950/80 border border-indigo-500/30 rounded-xl text-xs focus:outline-none focus:border-cyan-400 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black tracking-widest text-indigo-300/60 block mb-2 uppercase">Service Type</label>
                <select
                  value={quickForm.serviceType}
                  onChange={e => setQuickForm({ ...quickForm, serviceType: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-indigo-500/30 rounded-xl text-xs focus:outline-none focus:border-cyan-400 text-white font-bold"
                >
                  <option value="swedish">💆 Swedish Massage</option>
                  <option value="thai">🙏 Thai Massage</option>
                  <option value="hotstone">🪨 Hot Stone Therapy</option>
                  <option value="foot">🦶 Foot Massage</option>
                  <option value="aroma">🌸 Aromatherapy</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black tracking-widest text-indigo-300/60 block mb-2 uppercase">Room Assignment</label>
                <select
                  value={quickForm.roomNumber}
                  onChange={e => setQuickForm({ ...quickForm, roomNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-indigo-500/30 rounded-xl text-xs focus:outline-none focus:border-cyan-400 text-white font-bold"
                >
                  <option value="">Select Room...</option>
                  {ROOM_NUMBERS.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  if (!quickForm.customerName.trim()) {
                    alert('고객 이름을 입력해 주세요! 💡');
                    return;
                  }
                  const newSession: ScheduleSession = {
                    id: `s${bookingSlot.therapistId}-${Date.now()}`,
                    therapistId: bookingSlot.therapistId,
                    serviceType: quickForm.serviceType,
                    startHour: bookingSlot.hour,
                    endHour: bookingSlot.hour + 1,
                    customerName: quickForm.customerName,
                    roomNumber: quickForm.roomNumber || undefined,
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
                className="w-full mt-4 bg-cyan-400 text-slate-950 font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-[1.02] active:scale-98 transition-all text-xs tracking-wider"
              >
                CONFIRM QUICK RESERVATION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Manual Booking Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl scale-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white">Manual Booking</h2>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="text-indigo-300/50 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black tracking-widest text-indigo-300/60 mb-2 block uppercase">Select Therapist</label>
                <select
                  value={manualForm.therapistId}
                  onChange={e => setManualForm({ ...manualForm, therapistId: parseInt(e.target.value) })}
                  className="w-full bg-slate-950/85 border border-indigo-500/20 rounded-xl px-4 py-3 text-white font-bold outline-none"
                >
                  {therapists.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black tracking-widest text-indigo-300/60 mb-2 block uppercase">Start Time</label>
                  <select
                    value={manualForm.startHour}
                    onChange={e => setManualForm({ ...manualForm, startHour: parseInt(e.target.value) })}
                    className="w-full bg-slate-950/85 border border-indigo-500/20 rounded-xl px-4 py-3 text-white font-mono"
                  >
                    {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                      <option key={i} value={START_HOUR + i}>{String(START_HOUR + i).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black tracking-widest text-indigo-300/60 mb-2 block uppercase">Duration</label>
                  <select
                    value={manualForm.duration}
                    onChange={e => setManualForm({ ...manualForm, duration: parseInt(e.target.value) })}
                    className="w-full bg-slate-950/85 border border-indigo-500/20 rounded-xl px-4 py-3 text-white"
                  >
                    <option value={60}>60 Min</option>
                    <option value={90}>90 Min</option>
                    <option value={120}>120 Min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black tracking-widest text-indigo-300/60 mb-2 block uppercase">Guest Name</label>
                <input
                  type="text"
                  value={manualForm.customerName}
                  onChange={e => setManualForm({ ...manualForm, customerName: e.target.value })}
                  placeholder="e.g. Sarah L."
                  className="w-full bg-slate-950/85 border border-indigo-500/20 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-black tracking-widest text-indigo-300/60 mb-2 block uppercase">Service Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['swedish', 'thai', 'hotstone', 'foot', 'aroma'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setManualForm({ ...manualForm, serviceType: type })}
                      className={`px-2.5 py-2 rounded-xl border text-[10px] font-black transition-all ${
                        manualForm.serviceType === type
                          ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10'
                          : 'border-white/5 text-indigo-300/40 hover:bg-white/5'
                      }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black tracking-widest text-indigo-300/60 mb-2 block uppercase">Room Assignment</label>
                <select
                  value={manualForm.roomNumber}
                  onChange={e => setManualForm({ ...manualForm, roomNumber: e.target.value })}
                  className="w-full bg-slate-950/85 border border-indigo-500/20 rounded-xl px-4 py-3 text-white font-bold"
                >
                  <option value="">Select Room...</option>
                  {ROOM_NUMBERS.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  if (!manualForm.customerName.trim()) {
                    alert('고객 이름을 입력해 주세요! 💡');
                    return;
                  }
                  const endHour = manualForm.startHour + (manualForm.duration / 60);
                  const newSession: ScheduleSession = {
                    id: `s${manualForm.therapistId}-${Date.now()}`,
                    therapistId: manualForm.therapistId,
                    serviceType: manualForm.serviceType,
                    startHour: manualForm.startHour,
                    endHour: Math.min(endHour, 21),
                    customerName: manualForm.customerName,
                    roomNumber: manualForm.roomNumber || undefined,
                    status: 'scheduled',
                  };

                  setTherapists(prev =>
                    prev.map(t =>
                      t.id === manualForm.therapistId
                        ? { ...t, sessions: [...t.sessions, newSession].sort((a, b) => a.startHour - b.startHour) }
                        : t
                    )
                  );
                  setIsManualModalOpen(false);
                  setManualForm({
                    therapistId: 1,
                    startHour: 9,
                    duration: 60,
                    serviceType: 'swedish',
                    customerName: '',
                    roomNumber: '',
                  });
                }}
                className="w-full mt-4 bg-cyan-400 text-slate-950 font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-[1.02] active:scale-95 transition-all text-xs tracking-wider"
              >
                CONFIRM RESERVATION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Session Details & Management Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white">Session Control Panel</h3>
              <button 
                onClick={() => setSelectedSession(null)}
                className="text-indigo-300/50 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 mb-6 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-indigo-300/40 font-bold block uppercase">Start Time</label>
                  <p className="font-black text-white mt-1 text-sm">{formatTime(selectedSession.startHour)}</p>
                </div>
                <div>
                  <label className="text-[10px] text-indigo-300/40 font-bold block uppercase">End Time</label>
                  <p className="font-black text-white mt-1 text-sm">{formatTime(selectedSession.endHour)}</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-indigo-300/40 font-bold block uppercase">Service Type</label>
                <p className="font-black text-white mt-1 text-sm flex items-center gap-1.5">
                  {SERVICE_CONFIG[selectedSession.serviceType as keyof typeof SERVICE_CONFIG].icon}{' '}
                  {SERVICE_CONFIG[selectedSession.serviceType as keyof typeof SERVICE_CONFIG].label}
                </p>
              </div>

              {selectedSession.customerName && (
                <div>
                  <label className="text-[10px] text-indigo-300/40 font-bold block uppercase">Guest Name</label>
                  <p className="font-black text-white mt-1 text-sm">{selectedSession.customerName}</p>
                </div>
              )}

              {selectedSession.roomNumber && (
                <div>
                  <label className="text-[10px] text-indigo-300/40 font-bold block uppercase">Room Assignment</label>
                  <p className="font-black text-white mt-1 text-sm">{selectedSession.roomNumber}</p>
                </div>
              )}

              <div>
                <label className="text-[10px] text-indigo-300/40 font-bold block mb-2 uppercase">Status Control</label>
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
                  className="w-full px-4 py-3 bg-slate-950/80 border border-indigo-500/20 rounded-xl text-white font-bold focus:outline-none"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 text-xs">
              <button
                onClick={() => setSelectedSession(null)}
                className="flex-1 px-4 py-3 border border-indigo-500/20 text-white font-black rounded-xl hover:bg-white/5 transition-all text-center"
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
                className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-slate-950 font-black rounded-xl transition-all text-center shadow-lg"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheet Booking Modal */}
      {showGoogleSheetBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
          <div className="bg-slate-900 border border-pink-500/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-4 flex justify-between items-center border-b border-pink-500/30">
              <div>
                <h2 className="text-xl font-bold text-white">🧖 Therapist Bookings</h2>
                <p className="text-xs text-pink-100 mt-1">Google Sheets Integration</p>
              </div>
              <button
                onClick={() => setShowGoogleSheetBooking(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-3">
                {/* Sample Booking Data */}
                {[
                  { id: '1', therapist: 'Maria Santos', service: 'Swedish Massage', date: '2026-05-28', time: '14:00', guest: 'John Doe', room: '01' },
                  { id: '2', therapist: 'Ana Mercado', service: 'Thai Massage', date: '2026-05-28', time: '15:00', guest: 'Jane Smith', room: '02' },
                  { id: '3', therapist: 'Rosa Chavez', service: 'Hot Stone Therapy', date: '2026-05-28', time: '16:00', guest: 'Mike Johnson', room: '03' },
                ].map(booking => (
                  <div
                    key={booking.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-white text-base">👤 {booking.guest}</p>
                        <p className="text-sm text-pink-400 mt-1">{booking.service}</p>
                        <p className="text-sm text-gray-400 mt-1">Therapist: <span className="text-indigo-300 font-medium">{booking.therapist}</span></p>
                        <p className="text-xs text-gray-500 mt-2">📅 {booking.date} ⏰ {booking.time} | 🚪 Room {booking.room}</p>
                      </div>
                      <div className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap">
                        ☁️ Synced
                      </div>
                    </div>
                  </div>
                ))}

                {/* Sync Info */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-500 text-center">
                    💾 Auto-synced daily at midnight (00:00)
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-800 border-t border-white/10 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowGoogleSheetBooking(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          📌 Mobile Bottom Navigation (fixed at bottom)
          ============================================================ */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-slate-950/80 backdrop-blur-lg border-t border-cyan-500/20 shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
        <a className="flex flex-col items-center justify-center text-indigo-300/40" href="/monitor">
          <span className="material-symbols-outlined">home_max</span>
          <span className="text-[9px] font-black mt-0.5 tracking-wider">HOME</span>
        </a>
        <a className="flex flex-col items-center justify-center text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" href="/admin/therapists">
          <span className="material-symbols-outlined">group</span>
          <span className="text-[9px] font-black mt-0.5 tracking-wider">STAFF</span>
        </a>
        <a className="flex flex-col items-center justify-center text-indigo-300/40" href="/admin/payroll">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="text-[9px] font-black mt-0.5 tracking-wider">PAY</span>
        </a>
      </nav>

      {/* Custom Scrollbars and Animations Injection */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.3);
          border-radius: 10px;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

