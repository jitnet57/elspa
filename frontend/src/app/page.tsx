'use client';

import { useState } from 'react';

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState('dashboard');

  const stats = [
    { label: '활성 테라피스트', value: '12', icon: '👥', change: '+2', changeType: 'positive' },
    { label: '오늘 예약', value: '24', icon: '📅', change: '+8', changeType: 'positive' },
    { label: '월 매출', value: '₩4.8M', icon: '💰', change: '+12%', changeType: 'positive' },
    { label: '고객 만족도', value: '4.8★', icon: '⭐', change: '+0.2', changeType: 'positive' },
  ];

  const recentBookings = [
    { id: 1, customer: '김민준', therapist: 'Sarah', service: '스웨디시 60분', time: '10:00 AM', status: 'confirmed', revenue: '₩80,000' },
    { id: 2, customer: '이수연', therapist: 'Emma', service: '타이 마사지 90분', time: '11:30 AM', status: 'confirmed', revenue: '₩120,000' },
    { id: 3, customer: '정현준', therapist: 'Jessica', service: '핫스톤 60분', time: '02:00 PM', status: 'in_progress', revenue: '₩100,000' },
    { id: 4, customer: '박지은', therapist: 'Amanda', service: '커플 마사지 120분', time: '03:00 PM', status: 'pending', revenue: '₩180,000' },
    { id: 5, customer: '최준호', therapist: 'Sarah', service: '발 마사지 30분', time: '04:30 PM', status: 'completed', revenue: '₩50,000' },
  ];

  const therapists = [
    { name: 'Sarah', bookings: 8, rating: 4.9, revenue: '₩640K', availability: '95%', imageColor: 'from-orange-100 to-amber-100' },
    { name: 'Emma', bookings: 6, rating: 4.7, revenue: '₩480K', availability: '87%', imageColor: 'from-pink-100 to-orange-100' },
    { name: 'Jessica', bookings: 7, rating: 4.8, revenue: '₩560K', availability: '92%', imageColor: 'from-amber-100 to-yellow-100' },
    { name: 'Amanda', bookings: 5, rating: 4.6, revenue: '₩400K', availability: '80%', imageColor: 'from-yellow-100 to-orange-100' },
  ];

  const weeklyData = [65, 45, 72, 58, 85, 92, 78];
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const maxValue = Math.max(...weeklyData);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: { bg: string; text: string; dot: string } } = {
      confirmed: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
    };
    return colors[status] || colors.completed;
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      confirmed: '확정됨',
      in_progress: '진행 중',
      pending: '대기중',
      completed: '완료',
    };
    return texts[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-stone-100 to-stone-50 border-r border-stone-200 overflow-y-auto p-8 shadow-sm">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
              ✨
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">ELSPA</div>
          </div>
          <p className="text-xs text-gray-500 ml-10 font-light tracking-widest">MANAGEMENT SYSTEM</p>
        </div>

        <nav className="space-y-2 mb-8">
          <p className="text-xs font-bold text-gray-600 px-4 mb-3">📊 어드민</p>
          {[
            { id: 'dashboard', label: '📈 대시보드', href: '/' },
            { id: 'therapist', label: '💼 테라피스트 관리', href: '/admin/matching' },
            { id: 'companies', label: '🏢 업체 관리', href: '/admin/companies' },
            { id: 'guides', label: '👤 가이드 관리', href: '/admin/guides' },
            { id: 'settlement', label: '📊 월정산', href: '/admin/monthly-settlement' },
            { id: 'report', label: '📈 정산 보고서', href: '/admin/settlement-report' },
            { id: 'simulation', label: '🎯 시뮬레이션', href: '/admin/simulation' },
            { id: 'monitor', label: '🖥️ 카운터 모니터', href: '/monitor' },
          ].map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeNav === item.id
                  ? 'bg-white text-gray-900 shadow-md border border-stone-200'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              onClick={() => setActiveNav(item.id)}
            >
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <nav className="space-y-2 mb-8">
          <p className="text-xs font-bold text-gray-600 px-4 mb-3">👤 고객</p>
          {[
            { id: 'services', label: '💆 서비스', href: '/customer/services' },
            { id: 'booking', label: '📅 예약하기', href: '/customer/booking' },
            { id: 'mypage', label: '👤 마이페이지', href: '/customer/mypage' },
            { id: 'reviews', label: '⭐ 리뷰', href: '/customer/reviews' },
          ].map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-white/50 transition-all"
              onClick={() => setActiveNav(item.id)}
            >
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <nav className="space-y-2 mb-8">
          <p className="text-xs font-bold text-gray-600 px-4 mb-3">📋 문서</p>
          {[
            { id: 'flowchart', label: '🔄 워크플로우', href: '/flowchart' },
            { id: 'requirements', label: '📖 요구사항', href: '/requirements' },
          ].map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-white/50 transition-all"
              onClick={() => setActiveNav(item.id)}
            >
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="pt-8 border-t border-stone-200">
          <div className="p-4 bg-white rounded-lg border border-stone-200 shadow-sm mb-6">
            <p className="text-xs font-bold text-gray-900 mb-2">💡 팁</p>
            <p className="text-xs text-gray-600 leading-relaxed font-light">
              매일 아침 9시에 자동 보고서가 생성됩니다.
            </p>
          </div>
          <p className="text-xs text-gray-500 font-light">v 2.1.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-2 tracking-tight">
              ElSpa Dashboard
            </h1>
            <p className="text-sm text-gray-500 font-light">
              {new Date().toLocaleDateString('ko-KR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="p-3 bg-white rounded-full hover:bg-stone-100 transition-colors shadow-sm border border-stone-200">
              🔔
            </button>
            <button className="p-3 bg-white rounded-full hover:bg-stone-100 transition-colors shadow-sm border border-stone-200">
              👤
            </button>
          </div>
        </div>

        {/* UI Pages Guide */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 shadow-sm">
            <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
              📱 구현된 UI 페이지 (총 11개)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">어드민 대시보드</span></div>
              <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">카운터 모니터</span></div>
              <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">매칭 제어판</span></div>
              <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">예약 검색</span></div>
              <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">시뮬레이션</span></div>
              <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">고객 서비스</span></div>
              <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">예약 마법사</span></div>
              <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">마이페이지</span></div>
              <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">리뷰 페이지</span></div>
              <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">워크플로우</span></div>
              <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">요구사항</span></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200 shadow-sm">
            <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
              🎯 주요 기능
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span><strong>AI 매칭:</strong> 70/20/10 점수 기반 자동 배정</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span><strong>실시간 모니터:</strong> 86개 침대 상태 추적</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span><strong>What-if 시뮬:</strong> 조건별 매칭 미리보기</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span><strong>5가지 사용자:</strong> 고객, 매니저, 테라피스트, 드라이버, 카운터</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span><strong>루트 그룹핑:</strong> 마사지룸 1/2, VIP룸, 커플룸 관리</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 hover:shadow-md hover:border-stone-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center text-xl group-hover:bg-orange-50 transition-colors">
                  {stat.icon}
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-full ${stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {stat.change}
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2 font-light tracking-wide">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">최근 예약</h2>
                  <p className="text-xs text-gray-500 mt-1 font-light">총 {recentBookings.length}건</p>
                </div>
                <a href="#" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                  모두 보기 →
                </a>
              </div>

              <div className="space-y-3">
                {recentBookings.map((booking) => {
                  const badge = getStatusColor(booking.status);
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border border-stone-100 rounded-lg hover:bg-stone-50 transition-all group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-3 h-3 rounded-full ${badge.dot}`}></div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{booking.customer}</p>
                          <p className="text-xs text-gray-500 font-light mt-1">
                            {booking.therapist} · {booking.service}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 font-medium mb-1">{booking.time}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${badge.bg} ${badge.text}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 ml-4 min-w-fit">{booking.revenue}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Therapists Performance */}
          <div>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">성과 Top 4</h2>
                <p className="text-xs text-gray-500 mt-1 font-light">오늘의 테라피스트</p>
              </div>

              <div className="space-y-4">
                {therapists.map((therapist, idx) => (
                  <div key={idx} className="p-4 border border-stone-100 rounded-lg hover:border-orange-200 hover:bg-orange-50 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${therapist.imageColor} rounded-full flex items-center justify-center text-lg`}>
                        💆
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{therapist.name}</p>
                        <p className="text-xs text-gray-500 font-light mt-0.5">{therapist.bookings}명 예약</p>
                      </div>
                      <span className="text-sm font-bold text-orange-600">{therapist.rating}★</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
                            style={{ width: `${(therapist.bookings / 8) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-light text-gray-600">{therapist.revenue}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-light">가용률</p>
                        <p className="text-xs font-bold text-gray-900">{therapist.availability}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">주간 예약 추이</h2>
            <p className="text-xs text-gray-500 mt-1 font-light">지난 7일간의 예약 통계</p>
          </div>

          <div className="h-72 flex items-end justify-between gap-3 px-4 py-6 bg-gradient-to-t from-orange-50 to-transparent rounded-lg border border-stone-100">
            {weeklyData.map((value, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="relative w-full flex flex-col items-end">
                  <div
                    className="w-full bg-gradient-to-t from-orange-400 to-orange-300 rounded-t-lg transition-all hover:from-orange-500 hover:to-orange-400 cursor-pointer shadow-sm group-hover:shadow-md"
                    style={{ height: `${(value / maxValue) * 200}px` }}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-900 whitespace-nowrap">
                      {value}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-light">{days[idx]}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
              <p className="text-xs text-gray-600 font-light mb-1">최고</p>
              <p className="text-2xl font-bold text-gray-900">{Math.max(...weeklyData)}</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
              <p className="text-xs text-gray-600 font-light mb-1">평균</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(weeklyData.reduce((a, b) => a + b) / weeklyData.length)}</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
              <p className="text-xs text-gray-600 font-light mb-1">총합</p>
              <p className="text-2xl font-bold text-gray-900">{weeklyData.reduce((a, b) => a + b)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-stone-200">
          <p className="text-xs text-gray-500 font-light">
            마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
          </p>
        </div>
      </main>
    </div>
  );
}
