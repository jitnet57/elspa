'use client';

import { useState } from 'react';
import Link from 'next/link';

// ============================================================
// 📌 Driver Dashboard: 배정된 고객/세션 관리
// 📋 목적: 드라이버가 하루의 예약 및 수익 확인
// 📅 작성일: 2026-05-18
// ============================================================

export default function DriverDashboard() {
  const [activeTab, setActiveTab] = useState<'today' | 'earnings' | 'schedule'>('today');

  // 테스트 데이터: 오늘의 배정
  const todayBookings = [
    {
      id: 1,
      customerName: '박미영',
      address: '서울시 강남구 도곡동',
      therapist: '김현정',
      service: '스웨디시 마사지',
      time: '10:00',
      duration: '60분',
      status: 'upcoming',
      distance: '1.2km',
    },
    {
      id: 2,
      customerName: '이지은',
      address: '서울시 강남구 삼성동',
      therapist: '이지은',
      service: '타이 마사지',
      time: '11:30',
      duration: '90분',
      status: 'upcoming',
      distance: '2.5km',
    },
    {
      id: 3,
      customerName: '최수진',
      address: '서울시 강남구 압구정동',
      therapist: '최수진',
      service: '발마사지',
      time: '13:30',
      duration: '30분',
      status: 'completed',
      distance: '0.8km',
    },
  ];

  // 수익 현황
  const earningsData = {
    today: 180000,
    thisWeek: 900000,
    thisMonth: 3500000,
    completedTrips: 12,
    earnings: [
      { id: 1, amount: 50000, time: '10:30', status: '완료' },
      { id: 2, amount: 65000, time: '12:15', status: '완료' },
      { id: 3, amount: 40000, time: '14:00', status: '진행중' },
      { id: 4, amount: 25000, time: '예정' },
    ],
  };

  // 스케줄
  const weekSchedule = [
    { day: '월', time: '08:00 - 20:00', status: '근무' },
    { day: '화', time: '08:00 - 20:00', status: '근무' },
    { day: '수', time: '휴무', status: '휴무' },
    { day: '목', time: '08:00 - 20:00', status: '근무' },
    { day: '금', time: '08:00 - 20:00', status: '근무' },
    { day: '토', time: '10:00 - 18:00', status: '근무' },
    { day: '일', time: '휴무', status: '휴무' },
  ];

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* 헤더 */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl sm:rounded-xl p-6 sm:p-8 md:p-12 shadow-sm border border-blue-100">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight">
            🚗 드라이버 대시보드
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
            오늘의 배정, 수익, 그리고 스케줄을 한눈에 확인하세요.
          </p>

          {/* 주요 통계 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-blue-200">
              <p className="text-xs sm:text-sm text-gray-500 font-light">오늘의 수익</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">₩{earningsData.today.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">{earningsData.completedTrips}건 완료</p>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 border border-indigo-200">
              <p className="text-xs sm:text-sm text-gray-500 font-light">이번주 수익</p>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-2">₩{earningsData.thisWeek.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">평균 ₩{Math.round(earningsData.thisWeek / 5).toLocaleString()}/일</p>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 border border-purple-200">
              <p className="text-xs sm:text-sm text-gray-500 font-light">배정 건수</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-2">{todayBookings.length}건</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">대기중: {todayBookings.filter(b => b.status === 'upcoming').length}건</p>
            </div>
          </div>
        </div>
      </section>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 sm:gap-4 border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'today' as const, label: '📋 오늘의 배정', icon: '📋' },
          { id: 'earnings' as const, label: '💰 수익 현황', icon: '💰' },
          { id: 'schedule' as const, label: '📅 주간 스케줄', icon: '📅' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 sm:px-6 py-3 font-semibold text-sm sm:text-base transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 오늘의 배정 */}
      {activeTab === 'today' && (
        <section>
          <div className="space-y-4">
            {todayBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">{booking.customerName}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {booking.status === 'completed' ? '완료' : '예정'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm text-gray-600">
                        📍 {booking.address}
                        <span className="ml-2 font-semibold text-blue-600">{booking.distance}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        💆 {booking.therapist} · {booking.service}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        ⏰ {booking.time} · {booking.duration}
                      </p>
                    </div>
                  </div>

                  {booking.status === 'upcoming' && (
                    <button className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold whitespace-nowrap">
                      시작
                    </button>
                  )}
                </div>

                {booking.status === 'upcoming' && (
                  <Link
                    href="/driver/customer-locations"
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2"
                  >
                    🗺️ 위치 추적 →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 수익 현황 */}
      {activeTab === 'earnings' && (
        <section className="space-y-6">
          {/* 수익 요약 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-6 border border-green-200">
              <p className="text-xs sm:text-sm text-gray-600 font-light">이번달 총 수익</p>
              <p className="text-3xl sm:text-4xl font-bold text-green-600 mt-3">₩{earningsData.thisMonth.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl p-6 border border-blue-200">
              <p className="text-xs sm:text-sm text-gray-600 font-light">이번주 평균</p>
              <p className="text-3xl sm:text-4xl font-bold text-blue-600 mt-3">₩{Math.round(earningsData.thisWeek / 5).toLocaleString()}</p>
            </div>
          </div>

          {/* 최근 거래 */}
          <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <div className="bg-gray-50 p-4 sm:p-6 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">최근 거래</h3>
            </div>

            <div className="divide-y">
              {earningsData.earnings.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-blue-50 transition-colors">
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">+₩{item.amount.toLocaleString()}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">{item.time}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status === '완료'
                        ? 'bg-green-100 text-green-700'
                        : item.status === '진행중'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 주간 스케줄 */}
      {activeTab === 'schedule' && (
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {weekSchedule.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-lg sm:rounded-xl p-4 sm:p-6 text-center transition-all ${
                  item.status === '근무'
                    ? 'bg-blue-50 border border-blue-200 hover:shadow-md'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{item.day}</p>
                <p className={`text-xs sm:text-sm font-semibold ${item.status === '근무' ? 'text-blue-600' : 'text-gray-600'}`}>
                  {item.time}
                </p>
                <p className="text-xs text-gray-500 mt-2">{item.status}</p>
              </div>
            ))}
          </div>

          {/* 근무 변경 요청 */}
          <div className="mt-8 sm:mt-12 bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 border border-gray-100 text-center">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">스케줄 변경이 필요하신가요?</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">운영팀에 근무 변경을 요청할 수 있습니다.</p>
            <button className="px-6 sm:px-8 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm sm:text-base">
              변경 요청하기
            </button>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl sm:rounded-xl p-6 sm:p-8 md:p-12 shadow-lg text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">실시간 위치 추적</h2>
        <p className="text-blue-100 mb-6 sm:mb-8 text-base sm:text-lg">고객 위치를 실시간으로 확인하고 최적의 경로로 이동하세요.</p>
        <Link
          href="/driver/customer-locations"
          className="inline-block px-6 sm:px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold transition-all hover:scale-105"
        >
          지도 보기 🗺️
        </Link>
      </section>
    </div>
  );
}
