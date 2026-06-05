'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Settings, X } from 'lucide-react';
import DeploymentBadge from '@/components/DeploymentBadge';

const ADMIN_PASSWORD = 'elspa123';

export default function Home() {
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPasswordModal(true);
    setPassword('');
    setError('');
  };

  const handlePasswordSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      setShowPasswordModal(false);
      router.push('/admin');
    } else {
      setError('비밀번호가 맞지 않습니다');
      setPassword('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePasswordSubmit();
    } else if (e.key === 'Escape') {
      setShowPasswordModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white font-sans flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <DeploymentBadge />
      </div>

      <div className="text-center space-y-12 max-w-2xl">
        <div className="space-y-4">
          <div className="text-6xl md:text-7xl font-black">💆</div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
            ElSpa
          </h1>
          <p className="text-lg text-indigo-300/80">마사지 샵 통합 관리 시스템</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a href="/monitor" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 transition-all hover:shadow-2xl hover:shadow-indigo-500/50">
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            <div className="relative space-y-4">
              <div className="text-5xl">📊</div>
              <h2 className="text-2xl font-bold">Monitor</h2>
              <p className="text-indigo-200 text-sm">BOOKING WITH THERAPIST<br />예약 관리 및 테라피스트 스케줄</p>
              <div className="pt-4 flex items-center justify-center gap-2 text-indigo-200 group-hover:text-white transition-colors">
                <BarChart3 size={18} />
                <span className="text-sm font-semibold">예약표 보기 →</span>
              </div>
            </div>
          </a>

          <button
            onClick={handleAdminClick}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600 to-pink-700 p-8 transition-all hover:shadow-2xl hover:shadow-pink-500/50 w-full text-left"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            <div className="relative space-y-4">
              <div className="text-5xl">⚙️</div>
              <h2 className="text-2xl font-bold">Admin</h2>
              <p className="text-pink-200 text-sm">관리자 대시보드<br />설정, 마사지 종류, 비용 관리</p>
              <div className="pt-4 flex items-center justify-center gap-2 text-pink-200 group-hover:text-white transition-colors">
                <Settings size={18} />
                <span className="text-sm font-semibold">설정 페이지 →</span>
              </div>
            </div>
          </button>
        </div>

        <div className="pt-8 border-t border-white/10 text-xs text-slate-400">
          <p>v1.0.0 | {new Date().toLocaleDateString('ko-KR')}</p>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">관리자 접근</h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm">관리자 페이지에 접근하려면 비밀번호를 입력하세요.</p>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="비밀번호 입력"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
