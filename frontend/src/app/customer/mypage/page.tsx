'use client';

import { useState, useRef } from 'react';

export default function MyPagePage() {
  const [activeTab, setActiveTab] = useState('stamps');
  const [hoveredStamp, setHoveredStamp] = useState<number | null>(null);
  const [clickedStamp, setClickedStamp] = useState<number | null>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userProfile = {
    name: 'Ji Eun Park',
    email: 'ji.eun@email.com',
    phone: '010-1234-5678',
    joinDate: '2024-01-15',
    membershipLevel: 'Gold',
    totalVisits: 12,
    nextBooking: {
      service: 'Swedish Massage 60 min',
      therapist: 'Yujin Park',
      date: '2026-05-22',
      time: '14:00',
    },
  };

  // Mock stamp data — replace with API call
  const stampData = {
    activeCount: 3,
    neededForCoupon: 10,
    remainingForCoupon: 7,
    nextExpiry: '2026-08-20',
    stamps: [
      { index: 0, date: 'May 8, 2026', service: 'Swedish Massage' },
      { index: 1, date: 'May 1, 2026', service: 'Foot Massage' },
      { index: 2, date: 'Apr 24, 2026', service: 'Thai Massage' },
    ],
  };

  // Mock coupon data — replace with API call
  const coupons = [
    {
      id: 1,
      code: 'ELSPA-AB12CD34',
      status: 'active',
      issuedAt: '2026-05-20',
      expiresAt: '2026-08-20',
      isValid: true,
    },
    {
      id: 2,
      code: 'ELSPA-XY98ZW76',
      status: 'used',
      issuedAt: '2026-02-10',
      expiresAt: '2026-05-10',
      isValid: false,
    },
  ];

  const bookingHistory = [
    { id: 1, service: 'Swedish Massage', therapist: 'Yujin Park', date: '2026-05-08', time: '10:00', price: '$80', status: 'completed' },
    { id: 2, service: 'Foot Massage', therapist: 'Da Hyun Lim', date: '2026-05-01', time: '15:00', price: '$50', status: 'completed' },
    { id: 3, service: 'Thai Massage', therapist: 'So Young Lee', date: '2026-04-24', time: '11:30', price: '$120', status: 'completed' },
  ];

  const tabs = [
    { id: 'stamps', label: '🎫 Stamps & Coupons' },
    { id: 'history', label: 'Booking History' },
    { id: 'payment', label: 'Payment History' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Page</h1>
        <p className="text-sm sm:text-lg text-gray-600">My profile and booking history</p>
      </div>

      {/* User Info Card */}
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
                  {userProfile.membershipLevel} Member
                </span>
                <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-semibold">
                  {userProfile.totalVisits} visits
                </span>
              </div>
            </div>
          </div>
          <button className="w-full sm:w-auto px-4 py-2 border border-stone-200 text-gray-900 rounded-lg hover:bg-stone-50 hover:scale-105 active:scale-95 transition-all font-medium text-sm sm:text-base">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Stamp Progress Card */}
        <div className="sm:col-span-2 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-orange-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm sm:text-base font-bold text-orange-800">🎫 ElSpa Stamps</p>
            <span className="text-2xl sm:text-3xl font-extrabold text-orange-600">
              {stampData.activeCount}
              <span className="text-base font-medium text-orange-400"> / {stampData.neededForCoupon}</span>
            </span>
          </div>

          {/* Stamp Grid */}
          <div className="flex gap-2 flex-wrap mb-3">
            {Array.from({ length: stampData.neededForCoupon }).map((_, i) => {
              const stamp = stampData.stamps.find(s => s.index === i);
              const isEarned = i < stampData.activeCount;
              const isActive = hoveredStamp === i || clickedStamp === i;

              return (
                <div key={i} className="relative">
                  {/* Tooltip */}
                  {isEarned && isActive && stamp && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                        <p className="font-bold text-orange-300">{stamp.date}</p>
                        <p className="text-gray-300 mt-0.5">{stamp.service}</p>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  )}

                  {/* Stamp Circle */}
                  <button
                    type="button"
                    onMouseEnter={() => isEarned && setHoveredStamp(i)}
                    onMouseLeave={() => {
                      setHoveredStamp(null);
                    }}
                    onClick={() => {
                      if (!isEarned) return;
                      if (clickedStamp === i) {
                        setClickedStamp(null);
                      } else {
                        setClickedStamp(i);
                        if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
                        tooltipTimeout.current = setTimeout(() => setClickedStamp(null), 3000);
                      }
                    }}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base border-2 transition-all duration-200 ${
                      isEarned
                        ? 'bg-orange-500 border-orange-600 shadow-md scale-110 cursor-pointer hover:scale-125 hover:shadow-orange-300 hover:shadow-lg active:scale-100'
                        : 'bg-white border-orange-200 text-orange-200 cursor-default'
                    }`}
                  >
                    {isEarned ? '🌟' : <span className="text-orange-200 text-lg leading-none">○</span>}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-xs sm:text-sm text-orange-700">
            {stampData.remainingForCoupon > 0
              ? `${stampData.remainingForCoupon} more visits until a free massage! 🎁`
              : '🎉 Coupon ready to claim!'}
          </p>
          <p className="text-xs text-orange-400 mt-1">Next expiry: {stampData.nextExpiry}</p>
        </div>

        {/* Total Visits */}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-stone-100 hover:shadow-md hover:scale-105 transition-all duration-300">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Total Visits</p>
          <p className="text-3xl sm:text-4xl font-bold text-green-600">{userProfile.totalVisits}</p>
          <p className="text-xs text-gray-500 mt-2">Since {userProfile.joinDate}</p>
        </div>
      </div>

      {/* Active Coupons Banner */}
      {coupons.filter(c => c.isValid).length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎁</span>
            <h3 className="text-base sm:text-lg font-bold text-green-800">
              You have {coupons.filter(c => c.isValid).length} free massage coupon{coupons.filter(c => c.isValid).length > 1 ? 's' : ''}!
            </h3>
          </div>
          <div className="space-y-2">
            {coupons.filter(c => c.isValid).map(coupon => (
              <div key={coupon.id} className="flex items-center justify-between bg-white rounded-xl p-3 sm:p-4 border border-green-200">
                <div>
                  <p className="font-mono font-bold text-green-700 text-sm sm:text-base tracking-wider">{coupon.code}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Valid until {coupon.expiresAt}</p>
                </div>
                <button className="px-3 sm:px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm font-bold transition-colors active:scale-95">
                  Use Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Booking */}
      {userProfile.nextBooking && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl sm:rounded-xl p-6 sm:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Next Booking</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
            <div>
              <p className="text-xs text-gray-600 mb-1">Service</p>
              <p className="text-xs sm:text-sm font-bold text-gray-900">{userProfile.nextBooking.service}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Therapist</p>
              <p className="text-xs sm:text-sm font-bold text-gray-900">{userProfile.nextBooking.therapist}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Date</p>
              <p className="text-xs sm:text-sm font-bold text-gray-900">{userProfile.nextBooking.date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Time</p>
              <p className="text-xs sm:text-sm font-bold text-gray-900">{userProfile.nextBooking.time}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2 sm:gap-3">
            <button className="flex-1 sm:flex-initial px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm font-medium border border-stone-200">
              Modify
            </button>
            <button className="flex-1 sm:flex-initial px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm font-medium border border-red-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 border-b border-stone-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-5 py-2 sm:py-3 font-medium text-xs sm:text-sm transition-all whitespace-nowrap rounded-t-lg ${
              activeTab === tab.id
                ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                : 'text-gray-500 hover:text-gray-800 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Stamps & Coupons */}
      {activeTab === 'stamps' && (
        <div className="space-y-6">
          {/* How it works */}
          <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-stone-100">
            <h4 className="font-bold text-gray-900 mb-4 text-base sm:text-lg">How the Stamp Program Works</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: '💆', step: '1', title: 'Visit & Relax', desc: 'Complete any massage session' },
                { icon: '🎫', step: '2', title: 'Earn a Stamp', desc: '1 stamp per visit, valid 3 months' },
                { icon: '🎁', step: '3', title: 'Free Massage!', desc: 'Collect 10 stamps → 1 free session' },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Coupons */}
          <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-stone-100">
            <h4 className="font-bold text-gray-900 mb-4 text-base sm:text-lg">My Coupons</h4>
            {coupons.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-4xl mb-2">🎫</p>
                <p className="text-sm">No coupons yet. Collect 10 stamps to earn one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {coupons.map(coupon => (
                  <div
                    key={coupon.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      coupon.isValid
                        ? 'border-green-300 bg-green-50'
                        : 'border-stone-200 bg-stone-50 opacity-60'
                    }`}
                  >
                    <div>
                      <p className={`font-mono font-bold tracking-wider text-sm sm:text-base ${coupon.isValid ? 'text-green-700' : 'text-gray-400'}`}>
                        {coupon.code}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Issued: {coupon.issuedAt} · Expires: {coupon.expiresAt}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      coupon.status === 'active' && coupon.isValid
                        ? 'bg-green-200 text-green-800'
                        : coupon.status === 'used'
                        ? 'bg-gray-200 text-gray-600'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {coupon.status === 'active' && coupon.isValid ? '✓ Valid' : coupon.status === 'used' ? 'Used' : 'Expired'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Booking History */}
      {activeTab === 'history' && (
        <div className="space-y-3 sm:space-y-4">
          {bookingHistory.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:shadow-md hover:scale-[1.02] transition-all duration-300"
            >
              <div>
                <h4 className="text-sm sm:text-base font-bold text-gray-900">{booking.service}</h4>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {booking.therapist} · {booking.date} {booking.time}
                </p>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <p className="text-base sm:text-lg font-bold text-orange-600">{booking.price}</p>
                <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  ✓ Completed
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Payment History */}
      {activeTab === 'payment' && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
          <p className="text-gray-500 mb-6 text-sm">Recent payment records</p>
          <div className="space-y-4">
            {bookingHistory.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border border-stone-200 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{booking.service}</p>
                  <p className="text-xs text-gray-500 mt-1">{booking.date}</p>
                </div>
                <p className="font-bold text-gray-900">{booking.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100 space-y-6">
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Notifications</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-orange-500" />
                <span className="text-sm text-gray-700">Booking confirmation alerts</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-orange-500" />
                <span className="text-sm text-gray-700">Stamp & coupon notifications</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 accent-orange-500" />
                <span className="text-sm text-gray-700">Promotional emails</span>
              </label>
            </div>
          </div>
          <div className="border-t border-stone-200 pt-6">
            <h3 className="font-bold text-gray-900 mb-4">Account</h3>
            <button className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm">
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
