'use client';

import { useState } from 'react';

export default function MyPagePage() {
  const [activeTab, setActiveTab] = useState('profile');

  const userProfile = {
    name: '김민지',
    email: 'kim.minji@email.com',
    phone: '010-1234-5678',
    joinDate: '2024-01-15',
    membershipLevel: 'Gold',
    totalVisits: 12,
    points: 3500,
    nextBooking: {
      service: '스웨디시 Massage 60분',
      therapist: 'Sarah',
      date: '2026-05-15',
      time: '14:00',
    },
  };

  const bookingHistory = [
    {
      id: 1,
      service: '스웨디시 Massage',
      therapist: 'Sarah',
      date: '2026-05-08',
      time: '10:00',
      price: '₱80,000',
      status: 'completed',
    },
    {
      id: 2,
      service: '발 Massage',
      therapist: 'Amanda',
      date: '2026-05-01',
      time: '15:00',
      price: '₱50,000',
      status: 'completed',
    },
    {
      id: 3,
      service: '타이 Massage',
      therapist: 'Emma',
      date: '2026-04-24',
      time: '11:30',
      price: '₱120,000',
      status: 'completed',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header - 모바일 최적화 */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">마이페이지</h1>
        <p className="text-sm sm:text-lg text-gray-600">나의 Information와 예약 내역</p>
      </div>

      {/* User Info Card - 모바일 최적화 */}
      <div className="bg-white rounded-2xl sm:rounded-xl p-6 sm:p-8 shadow-sm border border-stone-100">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="flex items-start gap-4 sm:gap-6 w-full">
            <div className="w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center text-2xl sm:text-4xl flex-shrink-0">
              👤
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{userProfile.name}</h2>
              <p className="text-xs sm:text-base text-gray-600 mt-1 truncate">{userProfile.email}</p>
              <div className="flex gap-2 sm:gap-4 mt-3 sm:mt-4 flex-wrap">
                <span className="px-2 sm:px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs sm:text-sm font-semibold">
                  {userProfile.membershipLevel} 회원
                </span>
                <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-semibold">
                  {userProfile.totalVisits}회 방문
                </span>
              </div>
            </div>
          </div>
          <button className="w-full sm:w-auto px-4 py-2 border border-stone-200 text-gray-900 rounded-lg hover:bg-stone-50 hover:scale-105 active:scale-95 transition-all font-medium text-sm sm:text-base">
            프로필 수정
          </button>
        </div>
      </div>

      {/* Stats Cards - 모바일 최적화 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-stone-100 hover:shadow-md hover:scale-105 transition-all duration-300">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">적립 포인트</p>
          <p className="text-3xl sm:text-4xl font-bold text-orange-600">{userProfile.points.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">₱1,000 = 100P</p>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-stone-100 hover:shadow-md hover:scale-105 transition-all duration-300">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">총 방문 횟수</p>
          <p className="text-3xl sm:text-4xl font-bold text-green-600">{userProfile.totalVisits}회</p>
          <p className="text-xs text-gray-500 mt-2">가입: {userProfile.joinDate}</p>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-stone-100 hover:shadow-md hover:scale-105 transition-all duration-300">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">혜택 요약</p>
          <p className="text-2xl sm:text-lg font-bold text-purple-600">15% 할인</p>
          <p className="text-xs text-gray-500 mt-2">월 1회 무료</p>
        </div>
      </div>

      {/* Next Booking - 모바일 최적화 */}
      {userProfile.nextBooking && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl sm:rounded-xl p-6 sm:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">다음 예약</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
            <div>
              <p className="text-xs text-gray-600 mb-1">서비스</p>
              <p className="text-xs sm:text-sm font-bold text-gray-900">
                {userProfile.nextBooking.service}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Therapist</p>
              <p className="text-xs sm:text-sm font-bold text-gray-900">
                {userProfile.nextBooking.therapist}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">날짜</p>
              <p className="text-xs sm:text-sm font-bold text-gray-900">
                {userProfile.nextBooking.date}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">시간</p>
              <p className="text-xs sm:text-sm font-bold text-gray-900">
                {userProfile.nextBooking.time}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2 sm:gap-3">
            <button className="flex-1 sm:flex-initial px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm font-medium border border-stone-200">
              수정
            </button>
            <button className="flex-1 sm:flex-initial px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm font-medium border border-red-200">
              취소
            </button>
          </div>
        </div>
      )}

      {/* Tabs - 모바일 최적화 */}
      <div className="flex gap-2 sm:gap-4 border-b border-stone-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-base transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          예약 이력
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-base transition-all whitespace-nowrap ${
            activeTab === 'payment'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          결제 내역
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-base transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          설정
        </button>
      </div>

      {/* Tab Content - 모바일 최적화 */}
      {activeTab === 'history' && (
        <div className="space-y-3 sm:space-y-4">
          {bookingHistory.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:shadow-md hover:scale-105 transition-all duration-300"
            >
              <div>
                <h4 className="text-sm sm:text-base font-bold text-gray-900">{booking.service}</h4>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {booking.therapist} • {booking.date} {booking.time}
                </p>
              </div>
              <div className="text-right">
                <p className="text-base sm:text-lg font-bold text-orange-600">{booking.price}</p>
                <span className="inline-block mt-1 sm:mt-2 px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  ✓ 완료
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
          <p className="text-gray-600 mb-6">
            최근 결제 내역이 표시됩니다.
          </p>
          <div className="space-y-4">
            {bookingHistory.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 border border-stone-200 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900">{booking.service}</p>
                  <p className="text-xs text-gray-500 mt-1">{booking.date}</p>
                </div>
                <p className="font-bold text-gray-900">{booking.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100 space-y-6">
          <div>
            <h3 className="font-bold text-gray-900 mb-4">알림 설정</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-gray-700">예약 확인 알림</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-gray-700">특가 이벤트 알림</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm text-gray-700">광고 이메일</span>
              </label>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-6">
            <h3 className="font-bold text-gray-900 mb-4">계정 관리</h3>
            <button className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm">
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

