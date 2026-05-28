'use client';

import { useState, useEffect } from 'react';
import { GoogleSheetBookingModal } from '@/components/GoogleSheetBookingModal';

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

export function MonitorPage({ showBookingButton = true }) {
  const [currentTime, setCurrentTime] = useState<string>('--:--:--');
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

        {/* RED BOX - Google Connection */}
        {showBookingButton && (
          <div className="flex justify-center mt-6">
            {isGoogleConnected ? (
              <button
                onClick={() => setShowBookingModal(true)}
                className="border-4 border-red-500/80 rounded-lg px-12 py-4 bg-transparent hover:bg-red-500/10 transition-all"
              >
                <span className="text-2xl font-bold text-white">📊 Booking with Therapist</span>
                <span className="text-xs text-green-400 block mt-2">✅ Google 연결됨</span>
              </button>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="border-4 border-blue-500/80 rounded-lg px-12 py-4 bg-transparent hover:bg-blue-500/10 transition-all"
              >
                <span className="text-2xl font-bold text-white">🔓 Google로 연결</span>
                <span className="text-xs text-blue-300 block mt-2">Google Sheets에 접근하려면 클릭</span>
              </button>
            )}
          </div>
        )}
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

      {/* Massage Booking Table */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <h2 className="text-lg font-bold text-white">💆 마사지 예약 현황</h2>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300">테라피스트</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300">서비스</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300">시간</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300">손님명</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300">룸</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300">상태</th>
              </tr>
            </thead>
            <tbody>
              {massageBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-white/10 hover:bg-white/5 transition">
                  <td className="px-6 py-3 text-sm text-gray-300">{booking.therapist}</td>
                  <td className="px-6 py-3 text-sm text-gray-300">{booking.service}</td>
                  <td className="px-6 py-3 text-sm text-gray-300">{booking.time}</td>
                  <td className="px-6 py-3 text-sm text-gray-300">{booking.guestName}</td>
                  <td className="px-6 py-3 text-sm text-gray-300">{booking.roomNumber}</td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
