'use client';

import { useState, useEffect } from 'react';
import { GoogleSheetBookingModal } from '@/components/GoogleSheetBookingModal';
import BedLayoutView from './components/BedLayoutView';
import TherapistScheduleView from './components/TherapistScheduleView';
import BookingTabView from './components/BookingTabView';

interface MassageBooking {
  id: string;
  therapist: string;
  service: string;
  date: string;
  time: string;
  guestName: string;
  roomNumber: string;
  status: 'pending' | 'confirmed' | 'completed';
  createdAt: string;
}

export default function MonitorPage({ showBookingButton = true }) {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<'beds' | 'schedule' | 'booking'>('beds');

  // 시간 표시
  const [currentTime, setCurrentTime] = useState<string>('--:--:--');

  // Google 연결 상태 & 모달
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Admin 통계
  const [bedStats, setBedStats] = useState({
    available: 86,
    inService: 0,
    reserved: 0,
    cleaning: 0,
  });

  const [therapistStats, setTherapistStats] = useState({
    checkedIn: 42,
    waiting: 42,
  });

  const [massageBookings, setMassageBookings] = useState<MassageBooking[]>([
    { id: '1', therapist: 'Maria Santos', service: 'Swedish Massage', date: '2026-05-28', time: '14:00', guestName: 'John Doe', roomNumber: '01', status: 'confirmed', createdAt: new Date().toISOString() },
    { id: '2', therapist: 'Ana Mercado', service: 'Thai Massage', date: '2026-05-28', time: '15:00', guestName: 'Jane Smith', roomNumber: '02', status: 'pending', createdAt: new Date().toISOString() },
    { id: '3', therapist: 'Rosa Chavez', service: 'Hot Stone Therapy', date: '2026-05-28', time: '16:00', guestName: 'Mike Johnson', roomNumber: '03', status: 'confirmed', createdAt: new Date().toISOString() },
  ]);

  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const response = await fetch('/api/booking/status');
        const data = await response.json();
        setIsGoogleConnected(data.connected);
      } catch (error) {
        setIsGoogleConnected(false);
      }
    };
    checkGoogleConnection();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ko-KR', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/booking/auth/google');
      const data = await response.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (error) {
      console.error('Google 로그인 실패:', error);
      alert('Google 로그인에 실패했습니다. 나중에 다시 시도해주세요.');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      confirmed: 'bg-green-500/20 text-green-400',
      pending: 'bg-amber-500/20 text-amber-400',
      completed: 'bg-blue-500/20 text-blue-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      confirmed: '✅ 확정',
      pending: '⏳ 대기',
      completed: '✔️ 완료',
    };
    return labels[status] || status;
  };

  // 탭 버튼 컴포넌트
  function TabButton({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) {
    return (
      <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
          active
            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col">
      {/* Fixed Header with Stats on the Right */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-white/10 px-6 py-4">
        <div className="flex justify-between items-center gap-6">
          {/* Left: Title & Google Button */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-white">📊 실시간 모니터</h1>
            <p className="text-sm text-gray-400 mt-1">Google Sheets 예약 관리</p>

            {/* RED BOX - Google Connection */}
            {showBookingButton && (
              <div className="mt-3 inline-block">
                {isGoogleConnected ? (
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="border-2 border-red-500/80 rounded-lg px-6 py-2 bg-transparent hover:bg-red-500/10 transition-all"
                  >
                    <span className="text-sm font-bold text-white">📊 Booking with Therapist</span>
                    <span className="text-xs text-green-400 block">✅ Google 연결됨</span>
                  </button>
                ) : (
                  <button
                    onClick={handleGoogleLogin}
                    className="border-2 border-blue-500/80 rounded-lg px-6 py-2 bg-transparent hover:bg-blue-500/10 transition-all"
                  >
                    <span className="text-sm font-bold text-white">🔓 Google로 연결</span>
                    <span className="text-xs text-blue-300 block">Google Sheets에 접근</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Stats (Compact) */}
          <div className="flex gap-2 items-center whitespace-nowrap">
            {/* Time */}
            <div className="text-right mr-4">
              <div className="text-2xl font-mono font-bold text-indigo-400">{currentTime}</div>
              <p className="text-xs text-gray-500">현재 시간</p>
            </div>

            {/* Bed Stats - Compact */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
              <div className="text-xl font-bold text-green-400">{bedStats.available}</div>
              <p className="text-xs text-gray-400">사용가능</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
              <div className="text-xl font-bold text-blue-400">{bedStats.inService}</div>
              <p className="text-xs text-gray-400">시술중</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
              <div className="text-xl font-bold text-amber-400">{bedStats.reserved}</div>
              <p className="text-xs text-gray-400">예약됨</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
              <div className="text-xl font-bold text-purple-400">{bedStats.cleaning}</div>
              <p className="text-xs text-gray-400">청소중</p>
            </div>

            {/* Therapist Stats - Compact */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
              <div className="text-xl font-bold text-emerald-400">{therapistStats.checkedIn}</div>
              <p className="text-xs text-gray-400">체크인</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
              <div className="text-xl font-bold text-cyan-400">{therapistStats.waiting}</div>
              <p className="text-xs text-gray-400">대기중</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Section: Tab Navigation + Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Tab Navigation */}
        <div className="flex gap-2 px-6 py-4 border-b border-white/10 bg-slate-950 overflow-x-auto shrink-0">
          <TabButton
            active={activeTab === 'beds'}
            onClick={() => setActiveTab('beds')}
          >
            🛏️ Real-time Bed Mode
          </TabButton>
          <TabButton
            active={activeTab === 'schedule'}
            onClick={() => setActiveTab('schedule')}
          >
            🗓️ Therapist Daily Schedule
          </TabButton>
          <TabButton
            active={activeTab === 'booking'}
            onClick={() => setActiveTab('booking')}
          >
            📊 BOOKING WITH THERAPIST
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'beds' && <BedLayoutView />}
          {activeTab === 'schedule' && <TherapistScheduleView />}
          {activeTab === 'booking' && <BookingTabView />}
        </div>
      </div>

      {/* Google Sheet Booking Modal */}
      <GoogleSheetBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        isConnected={isGoogleConnected}
        onLoginClick={handleGoogleLogin}
      />
    </div>
  );
}
