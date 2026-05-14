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
      service: '스웨디시 마사지 60분',
      therapist: 'Sarah',
      date: '2026-05-15',
      time: '14:00',
    },
  };

  const bookingHistory = [
    {
      id: 1,
      service: '스웨디시 마사지',
      therapist: 'Sarah',
      date: '2026-05-08',
      time: '10:00',
      price: '₩80,000',
      status: 'completed',
    },
    {
      id: 2,
      service: '발 마사지',
      therapist: 'Amanda',
      date: '2026-05-01',
      time: '15:00',
      price: '₩50,000',
      status: 'completed',
    },
    {
      id: 3,
      service: '타이 마사지',
      therapist: 'Emma',
      date: '2026-04-24',
      time: '11:30',
      price: '₩120,000',
      status: 'completed',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">마이페이지</h1>
        <p className="text-lg text-gray-600">나의 정보와 예약 내역을 관리하세요</p>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center text-4xl">
              👤
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{userProfile.name}</h2>
              <p className="text-gray-600 mt-1">{userProfile.email}</p>
              <div className="flex gap-4 mt-4">
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                  {userProfile.membershipLevel} 회원
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {userProfile.totalVisits}회 방문
                </span>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 border border-stone-200 text-gray-900 rounded-lg hover:bg-stone-50 transition-colors font-medium">
            프로필 수정
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
          <p className="text-sm text-gray-600 mb-2">적립 포인트</p>
          <p className="text-4xl font-bold text-orange-600">{userProfile.points.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">다음 충전: ₩1,000 = 100P</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
          <p className="text-sm text-gray-600 mb-2">총 방문 횟수</p>
          <p className="text-4xl font-bold text-green-600">{userProfile.totalVisits}회</p>
          <p className="text-xs text-gray-500 mt-2">회원가입: {userProfile.joinDate}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
          <p className="text-sm text-gray-600 mb-2">혜택 요약</p>
          <p className="text-lg font-bold text-purple-600">15% 할인</p>
          <p className="text-xs text-gray-500 mt-2">매달 1회 무료 예약</p>
        </div>
      </div>

      {/* Next Booking */}
      {userProfile.nextBooking && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">다음 예약</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-600 mb-1">서비스</p>
              <p className="text-sm font-bold text-gray-900">
                {userProfile.nextBooking.service}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">테라피스트</p>
              <p className="text-sm font-bold text-gray-900">
                {userProfile.nextBooking.therapist}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">날짜</p>
              <p className="text-sm font-bold text-gray-900">
                {userProfile.nextBooking.date}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">시간</p>
              <p className="text-sm font-bold text-gray-900">
                {userProfile.nextBooking.time}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium border border-stone-200">
              수정
            </button>
            <button className="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium border border-red-200">
              취소
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          예약 이력
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'payment'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          결제 내역
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          설정
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {bookingHistory.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg p-6 shadow-sm border border-stone-100 flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-gray-900">{booking.service}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {booking.therapist} • {booking.date} {booking.time}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-orange-600">{booking.price}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
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
