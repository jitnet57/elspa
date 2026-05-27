'use client';

import { useState } from 'react';

export default function AdminPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('Invalid password');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md border border-indigo-200">
          <div className="text-center mb-8">
            <div className="text-4xl sm:text-5xl mb-4">🔐</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Login</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm sm:text-base"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 rounded-lg transition-all text-sm sm:text-base hover:shadow-lg hover:scale-105 active:scale-95 duration-300"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const [payrollSearch, setPayrollSearch] = useState('');
  const [payrollTab, setPayrollTab] = useState('all'); // all, therapist, staff
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  const mockPayrollData = [
    {
      id: "TH-01",
      name: "Therapist_Ana",
      type: "therapist",
      base: 15000,
      gross: 18800,
      deductions: 50500,
      net: 0,
      notes: "📌 [수입] 기본급 15,000 PHP + 커미션 3,800 PHP (세션 38회) | [차감] 보건소비 500 PHP + 13개월보너스누적적립 50,000 PHP (입사 40개월) | [보장] Net PHP 0 (음수 방지 적용)"
    },
    {
      id: "TH-03",
      name: "Therapist_Chloe",
      type: "therapist",
      base: 15000,
      gross: 19000,
      deductions: 50500,
      net: 0,
      notes: "📌 [수입] 기본급 15,000 PHP + 커미션 4,000 PHP (세션 40회) | [차감] CA차감(APPROVED) 5,000 PHP + 보건소비 500 PHP + 13개월보너스누적적립 45,000 PHP | [보장] Net PHP 0 (음수 방지 적용)"
    },
    {
      id: "EMP-01",
      name: "Staff_Kevin",
      type: "manager",
      base: 30000,
      gross: 30000,
      deductions: 164500,
      net: 0,
      notes: "📌 [수입] 기본급 30,000 PHP | [차감] 결근차감 2,000 PHP (결근 1일) + 13개월보너스누적적립 162,500 PHP (입사 65개월) | [보장] Net PHP 0 (음수 방지 적용)"
    },
    {
      id: "EMP-03",
      name: "Staff_Mason",
      type: "driver",
      base: 20000,
      gross: 20270,
      deductions: 80000,
      net: 0,
      notes: "📌 [수입] 기본급 20,000 PHP + 초과근무 70 PHP (60분) + 식대 200 PHP (Driver 전용) | [차감] 13개월보너스누적적립 80,000 PHP (CA 4,000 PENDING 차감 제외) | [보장] Net PHP 0 (음수 방지 적용)"
    }
  ];

  const filteredPayroll = mockPayrollData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(payrollSearch.toLowerCase()) || item.id.toLowerCase().includes(payrollSearch.toLowerCase());
    const matchesTab = payrollTab === 'all' 
      ? true 
      : payrollTab === 'therapist' 
        ? (item.type === 'therapist' || item.type === 'nail')
        : (item.type !== 'therapist' && item.type !== 'nail');
    return matchesSearch && matchesTab;
  });

  const adminMenus = [
    {
      category: '👥 Therapist Management',
      items: [
        { name: 'Therapist Directory', href: '/admin/therapists', icon: '👨‍⚕️' },
        { name: 'Daily Schedule', href: '/admin/therapist-schedule', icon: '📅' },
      ],
    },
    {
      category: '🏢 Company Management',
      items: [
        { name: 'Companies', href: '/admin/companies', icon: '🏢' },
      ],
    },
    {
      category: '💰 Settlement Management',
      items: [
        { name: 'Therapist Settlement', href: '/therapist-settlement', icon: '👨‍⚕️' },
        { name: 'Company Settlement', href: '/admin/monthly-settlement', icon: '🏢' },
        { name: 'Guide Referral Fee', href: '/admin/guide-referral-fee', icon: '🎯' },
        { name: 'Payroll Management', href: '/admin/payroll', icon: '💵' },
        { name: 'Settlement Report', href: '/admin/settlement-report', icon: '📊' },
        { name: 'Settlement Guide', href: '/settlement-management', icon: '📚' },
      ],
    },
    {
      category: '📈 Analytics & Audit',
      items: [
        { name: 'Billing Information', href: '/admin/billing', icon: '💳' },
        { name: 'Change Logs', href: '/admin/change-logs', icon: '📋' },
        { name: 'Commission Settings', href: '/admin/commission-settings', icon: '💰' },
        { name: 'Test Data & Validation', href: '/admin/test-data', icon: '🧪' },
      ],
    },
    {
      category: '💰 Expense Management',
      items: [
        { name: 'Daily Expense Report', href: '/admin/expense', icon: '🧾' },
      ],
    },
    {
      category: '📋 SSS Management',
      items: [
        { name: 'SSS Scan to Excel', href: '/admin/sss', icon: '🔍' },
      ],
    },
    {
      category: '📚 References',
      items: [
        { name: 'Deployment Guide', href: '/flowchart', icon: '📍' },
        { name: 'Policies', href: '/admin/policies', icon: '⚙️' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-400 to-indigo-500 text-white p-4 sm:p-6 lg:p-8 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="text-3xl sm:text-4xl">👥</div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Admin Dashboard</h1>
              <p className="text-indigo-100 text-sm sm:text-base">ELSPA Management System</p>
            </div>
          </div>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="w-full sm:w-auto px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm font-bold transition-colors"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6 sm:space-y-8">
          {adminMenus.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{section.category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {section.items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 transition-all hover:border-indigo-300 hover:shadow-lg hover:scale-105 active:scale-95 group hover:bg-indigo-50 duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                        <h3 className="text-sm sm:text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </div>
                      <div className="text-xl sm:text-2xl opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2 text-gray-400 group-hover:translate-x-1 transition-transform">
                        →
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================
            📌 Embedded Payroll Summary Section (실시간 급여 정산 테이블 내장)
            ============================================================ */}
        <div className="mt-12 bg-white border border-indigo-150 rounded-xl shadow-md p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                💵 실시간 급여 정산 현황 <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">Embedded View</span>
              </h2>
              <p className="text-gray-500 text-sm mt-1">로그인 상태에서 한 페이지로 수작업 정산 규정 대조 및 검증이 가능합니다.</p>
            </div>
            
            {/* Search & Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={payrollSearch}
                onChange={(e) => setPayrollSearch(e.target.value)}
                placeholder="직원 ID 또는 이름 검색"
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
              <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-semibold">
                <button 
                  onClick={() => setPayrollTab('all')} 
                  className={`px-3 py-1.5 rounded-md transition-colors ${payrollTab === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'}`}
                >전체</button>
                <button 
                  onClick={() => setPayrollTab('therapist')} 
                  className={`px-3 py-1.5 rounded-md transition-colors ${payrollTab === 'therapist' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'}`}
                >테라피스트</button>
                <button 
                  onClick={() => setPayrollTab('staff')} 
                  className={`px-3 py-1.5 rounded-md transition-colors ${payrollTab === 'staff' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'}`}
                >정직원</button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-indigo-50/50 border-b border-gray-200 text-gray-700 font-bold">
                  <th className="p-3">사번</th>
                  <th className="p-3">이름</th>
                  <th className="p-3">직무</th>
                  <th className="p-3 text-right">기본급 (PHP)</th>
                  <th className="p-3 text-right">Gross Pay</th>
                  <th className="p-3 text-right">Deductions</th>
                  <th className="p-3 text-right text-indigo-600">Net Pay</th>
                  <th className="p-3 text-center">상세 적요</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filteredPayroll.length > 0 ? (
                  filteredPayroll.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-semibold text-gray-600">{item.id}</td>
                        <td className="p-3 font-bold text-gray-800">{item.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.type === 'therapist' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {item.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium">{item.base.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium">{item.gross.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium text-red-600">-{item.deductions.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-indigo-600">{item.net.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setExpandedNotesId(expandedNotesId === item.id ? null : item.id)}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 rounded-md font-bold text-xs transition-colors"
                          >
                            {expandedNotesId === item.id ? "닫기 ▲" : "열기 ▼"}
                          </button>
                        </td>
                      </tr>
                      {expandedNotesId === item.id && (
                        <tr className="bg-indigo-50/20">
                          <td colSpan={8} className="p-4 border-t border-b border-indigo-100">
                            <div className="bg-white border border-indigo-100 rounded-lg p-3 text-xs sm:text-sm text-gray-700 font-medium whitespace-pre-line leading-relaxed shadow-sm">
                              {item.notes}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-400 font-bold">검색 결과가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 sm:mt-12 bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">🔗 Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <a
              href="/monitor"
              className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 sm:p-4 rounded-lg text-center text-xs sm:text-sm font-bold transition-all hover:shadow-md hover:scale-105 active:scale-95 duration-300"
            >
              📊 Dashboard
            </a>
            <a
              href="/"
              className="bg-gray-400 hover:bg-gray-500 text-white p-3 sm:p-4 rounded-lg text-center text-xs sm:text-sm font-bold transition-all hover:shadow-md hover:scale-105 active:scale-95 duration-300"
            >
              🏠 Home
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
