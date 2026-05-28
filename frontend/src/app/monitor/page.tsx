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
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-white/10 px-6 py-6">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">📊 실시간 모니터</h1>
            <p className="text-sm text-gray-400 mt-1">Google Sheets 예약 관리</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-mono font-bold text-indigo-400">{currentTime}</div>
            <p className="text-xs text-gray-500 mt-1">현재 시간</p>
          </div>
        </div>
      </div>

      {/* Admin Dashboard Stats */}
      <div className="grid grid-cols-4 gap-3 px-6 py-4 bg-slate-950 border-b border-white/10">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-all">
          <div className="text-3xl font-bold text-green-400">{bedStats.available}</div>
          <p className="text-xs text-gray-400 mt-1">✅ 사용 가능</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-all">
          <div className="text-3xl font-bold text-blue-400">{bedStats.inService}</div>
          <p className="text-xs text-gray-400 mt-1">🔵 시술 중</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-all">
          <div className="text-3xl font-bold text-amber-400">{bedStats.reserved}</div>
          <p className="text-xs text-gray-400 mt-1">🟡 예약됨</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-all">
          <div className="text-3xl font-bold text-purple-400">{bedStats.cleaning}</div>
          <p className="text-xs text-gray-400 mt-1">🟣 청소 중</p>
        </div>
      </div>

      {/* Therapist Status */}
      <div className="grid grid-cols-2 gap-3 px-6 py-4 bg-slate-950 border-b border-white/10">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="text-3xl font-bold text-emerald-400">{therapistStats.checkedIn}</div>
          <p className="text-xs text-gray-400 mt-1">✅ 체크인</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="text-3xl font-bold text-cyan-400">{therapistStats.waiting}</div>
          <p className="text-xs text-gray-400 mt-1">⏳ 대기 중</p>
        </div>
      </div>

      {/* Scrollable Section: Tab Navigation + Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Tab Navigation - Centered */}
        <div className="flex justify-center gap-2 px-6 py-4 border-b border-white/10 bg-slate-950 shrink-0">
          <TabButton
            active={activeTab === 'booking'}
            onClick={() => setActiveTab('booking')}
          >
            📊 BOOKING WITH THERAPIST
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <BookingTabView />
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
