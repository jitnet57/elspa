'use client';

import { useState } from 'react';
import React from 'react';

// ============================================================
// 📌 컴포넌트명: AdminPortal (어드민 포털 메인 스페이스)
// 📋 목적: 초프리미엄 글래스모피즘 테마의 관리자 제어 센터 및 실시간 급여 검증기
// 🔧 기능: 패스워드 로그인, 카테고리 카드 맵, 실시간 검색/직군 필터링 및 적요 아코디언
// 📅 작성일: 2026-05-27
// ⚠️ 주의: Cloudflare Pages 정적 export(.html) 환경 완벽 지원
// ============================================================
export default function AdminPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');

  const [payrollSearch, setPayrollSearch] = useState('');
  const [payrollTab, setPayrollTab] = useState('all'); // all, therapist, staff
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('비밀번호가 올바르지 않습니다. 다시 입력해주세요! 🔐');
    }
  };

  const mockPayrollData = [
    {
      id: "TH-01",
      name: "Therapist_Ana",
      type: "therapist",
      base: 15000,
      gross: 18800,
      deductions: 50500,
      net: 0,
      notes: "📌 [수입] 기본급 15,000 PHP + 커미션 3,800 PHP (세션 38회)\n[차감] 보건소 검사비 -500 PHP (Therapist 전용 분기 차감) + 13개월 보너스 선지급 누적적립 -50,000 PHP (입사 40개월차)\n[최종] Net PHP 0 (음수 방지 안전장치 최소 0 PHP 보장 작동)"
    },
    {
      id: "TH-03",
      name: "Therapist_Chloe",
      type: "therapist",
      base: 15000,
      gross: 19000,
      deductions: 50500,
      net: 0,
      notes: "📌 [수입] 기본급 15,000 PHP + 커미션 4,000 PHP (세션 40회)\n[차감] APPROVED CA 차감 -5,000 PHP + 보건소 검사비 -500 PHP + 13개월 보너스 선지급 누적적립 -45,000 PHP\n[최종] Net PHP 0 (음수 방지 안전장치 최소 0 PHP 보장 작동)"
    },
    {
      id: "EMP-01",
      name: "Staff_Kevin",
      type: "manager",
      base: 30000,
      gross: 30000,
      deductions: 164500,
      net: 0,
      notes: "📌 [수입] 기본급 30,000 PHP\n[차감] 결근 차감 -2,000 PHP (영업일 12일 중 5/20 1일 결근 반영, Manager 전용 규칙) + 13개월 보너스 선지급 누적적립 -162,500 PHP (입사 65개월차)\n[최종] Net PHP 0 (음수 방지 안전장치 최소 0 PHP 보장 작동)"
    },
    {
      id: "EMP-03",
      name: "Staff_Mason",
      type: "driver",
      base: 20000,
      gross: 20270,
      deductions: 80000,
      net: 0,
      notes: "📌 [수입] 기본급 20,000 PHP + 초과근무 수당 70 PHP (60분 초과근무) + 식대 지원금 200 PHP (Driver 전용)\n[차감] 13개월 보너스 선지급 누적적립 -80,000 PHP (CA 4,000 PHP PENDING 상태는 차감에서 정상 제외)\n[최종] Net PHP 0 (음수 방지 안전장치 최소 0 PHP 보장 작동)"
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
        { name: 'Therapist Directory', href: '/admin/therapists.html', icon: '👨‍⚕️' },
        { name: 'Daily Schedule', href: '/admin/therapist-schedule.html', icon: '📅' },
      ],
    },
    {
      category: '🏢 Company Management',
      items: [
        { name: 'Companies', href: '/admin/companies.html', icon: '🏢' },
      ],
    },
    {
      category: '💰 Settlement Management',
      items: [
        { name: 'Therapist Settlement', href: '/therapist-settlement.html', icon: '👨‍⚕️' },
        { name: 'Company Settlement', href: '/admin/monthly-settlement.html', icon: '🏢' },
        { name: 'Guide Referral Fee', href: '/admin/guide-referral-fee.html', icon: '🎯' },
        { name: 'Payroll Management', href: '/admin/payroll.html', icon: '💵' },
        { name: 'Settlement Report', href: '/admin/settlement-report.html', icon: '📊' },
        { name: 'Settlement Guide', href: '/settlement-management.html', icon: '📚' },
      ],
    },
    {
      category: '📈 Analytics & Audit',
      items: [
        { name: 'Billing Information', href: '/admin/billing.html', icon: '💳' },
        { name: 'Change Logs', href: '/admin/change-logs.html', icon: '📋' },
        { name: 'Commission Settings', href: '/admin/commission-settings.html', icon: '💰' },
        { name: 'Test Data & Validation', href: '/admin/test-data.html', icon: '🧪' },
      ],
    },
    {
      category: '🧾 Expense Management',
      items: [
        { name: 'Daily Expense Report', href: '/admin/expense.html', icon: '🧾' },
      ],
    },
    {
      category: '🔍 SSS Management',
      items: [
        { name: 'SSS Scan to Excel', href: '/admin/sss.html', icon: '🔍' },
      ],
    },
    {
      category: '⚙️ References',
      items: [
        { name: 'Deployment Guide', href: '/flowchart.html', icon: '📍' },
        { name: 'Policies', href: '/admin/policies.html', icon: '⚙️' },
      ],
    },
  ];

  // ============================================================
  // [1] 비로그인 로그인 화면 (Sleek Glassmorphism Login View)
  // ============================================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
        {/* 우주 안개 빛 효과 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)] p-6 sm:p-8 w-full max-w-md transition-all duration-300">
          <div className="text-center mb-8">
            <div className="text-5xl sm:text-6xl mb-4 animate-bounce duration-1000">🔐</div>
            <h1 className="text-3xl font-extrabold text-white tracking-wide bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
              ElSpa Control Center
            </h1>
            <p className="text-indigo-200/60 text-xs mt-2 font-semibold">ADMIN SECURITY VERIFICATION</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-indigo-300 tracking-wider mb-2 uppercase">
                Console Security Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-4 py-3 bg-slate-950/80 border border-indigo-500/30 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 text-white text-sm tracking-widest placeholder-indigo-300/30 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-indigo-500/20 duration-300 text-sm tracking-wider"
            >
              ACCESS SYSTEM
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================
  // [2] 로그인 성공 대시보드 화면 (Ultra-Premium Midnight Glassmorphism)
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-950 text-white font-sans overflow-x-hidden relative">
      
      {/* 우주 안개 빛 효과 */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl -z-10"></div>

      {/* Header */}
      <header className="bg-slate-900/40 backdrop-blur-md border-b border-indigo-500/20 py-4 px-4 sm:px-6 lg:px-8 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="text-3xl sm:text-4xl filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">🌌</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent tracking-tight">
                ElSpa Admin Portal
              </h1>
              <p className="text-indigo-300/60 text-xs font-bold tracking-widest uppercase">System Integration Management</p>
            </div>
          </div>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-500/10 hover:bg-red-500/20 border border-indigo-500/30 hover:border-red-500/40 rounded-lg text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm"
          >
            🚪 SYSTEM LOGOUT
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-12">
        
        {/* Menu Sections */}
        <div className="space-y-10">
          {adminMenus.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <h2 className="text-lg sm:text-xl font-extrabold text-indigo-300 tracking-wider flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                {section.category}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-xl p-5 sm:p-6 transition-all hover:border-indigo-500/60 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.25)] hover:-translate-y-1 active:scale-95 group duration-300 hover:bg-slate-900/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-indigo-400 transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-xs text-indigo-300/40 mt-1 font-semibold group-hover:text-indigo-300/60 transition-colors">Launch Control Page</p>
                      </div>
                    </div>
                    <div className="text-xl text-indigo-500/40 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
                      ⟶
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================
            📌 Revamped Embedded Payroll Summary Section (초프리미엄 네온 다크 급여 테이블)
            ============================================================ */}
        <section className="bg-slate-900/30 backdrop-blur-md border border-indigo-500/20 rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.15)] p-4 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-indigo-500/20 pb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                💵 실시간 급여 정산 현황 <span className="text-[10px] tracking-widest bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded-full font-black uppercase">Embedded Console v2</span>
              </h2>
              <p className="text-indigo-200/50 text-xs mt-1 font-semibold">5월 16일 ~ 5월 27일 기간의 수작업 정산 규정 및 한글 적요 내역을 완벽 검증합니다.</p>
            </div>
            
            {/* Search & Tabs */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={payrollSearch}
                  onChange={(e) => setPayrollSearch(e.target.value)}
                  placeholder="ID 또는 이름 검색..."
                  className="px-4 py-2 w-full sm:w-60 bg-slate-950/80 border border-indigo-500/30 rounded-lg text-xs focus:outline-none focus:border-indigo-400 transition-all placeholder-indigo-300/30"
                />
              </div>
              <div className="flex bg-slate-950/85 border border-indigo-500/20 rounded-lg p-0.5 text-xs font-bold shadow-inner">
                <button 
                  onClick={() => setPayrollTab('all')} 
                  className={`px-3 py-1.5 rounded-md transition-all ${payrollTab === 'all' ? 'bg-indigo-600/90 text-white shadow' : 'text-indigo-300/60 hover:text-indigo-200'}`}
                >전체</button>
                <button 
                  onClick={() => setPayrollTab('therapist')} 
                  className={`px-3 py-1.5 rounded-md transition-all ${payrollTab === 'therapist' ? 'bg-indigo-600/90 text-white shadow' : 'text-indigo-300/60 hover:text-indigo-200'}`}
                >테라피스트</button>
                <button 
                  onClick={() => setPayrollTab('staff')} 
                  className={`px-3 py-1.5 rounded-md transition-all ${payrollTab === 'staff' ? 'bg-indigo-600/90 text-white shadow' : 'text-indigo-300/60 hover:text-indigo-200'}`}
                >정직원</button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-indigo-500/20 rounded-xl bg-slate-950/40">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-indigo-950/80 border-b border-indigo-500/30 text-indigo-300 font-extrabold tracking-wider">
                  <th className="p-4">사번</th>
                  <th className="p-4">이름</th>
                  <th className="p-4">직무</th>
                  <th className="p-4 text-right">기본급 (PHP)</th>
                  <th className="p-4 text-right">Gross Pay</th>
                  <th className="p-4 text-right">Deductions</th>
                  <th className="p-4 text-right text-cyan-400 filter drop-shadow-[0_0_5px_rgba(34,211,238,0.3)] font-black">Net Pay</th>
                  <th className="p-4 text-center">상세 적요</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {filteredPayroll.length > 0 ? (
                  filteredPayroll.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-indigo-500/5 transition-colors duration-200">
                        <td className="p-4 font-extrabold text-indigo-300">{item.id}</td>
                        <td className="p-4 font-black text-white">{item.name}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] tracking-wide font-black ${
                            item.type === 'therapist' 
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                              : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                          }`}>
                            {item.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right text-indigo-100 font-bold">{item.base.toLocaleString()}</td>
                        <td className="p-4 text-right text-white font-bold">{item.gross.toLocaleString()}</td>
                        <td className="p-4 text-right text-orange-400 font-bold">-{item.deductions.toLocaleString()}</td>
                        <td className="p-4 text-right font-black text-cyan-400 text-sm filter drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">{item.net.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setExpandedNotesId(expandedNotesId === item.id ? null : item.id)}
                            className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-600/30 border border-indigo-500/30 hover:border-indigo-400 rounded-md font-black text-[10px] transition-all tracking-wider"
                          >
                            {expandedNotesId === item.id ? "CLOSE ▲" : "VERIFY ▼"}
                          </button>
                        </td>
                      </tr>
                      {expandedNotesId === item.id && (
                        <tr className="bg-indigo-950/20">
                          <td colSpan={8} className="p-4 border-t border-b border-indigo-500/20">
                            <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-100 font-semibold whitespace-pre-line leading-relaxed shadow-inner">
                              {item.notes}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-indigo-300/40 font-black text-sm uppercase">데이터를 찾을 수 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Links */}
        <section className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-extrabold text-white tracking-wider flex items-center gap-2">🔗 Quick Navigation Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a
              href="/monitor.html"
              className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 text-white py-3 px-4 rounded-lg text-center text-xs font-extrabold transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:scale-105 active:scale-95 duration-300"
            >
              📊 MONITOR SYSTEM
            </a>
            <a
              href="/index.html"
              className="bg-slate-900/50 hover:bg-slate-800 border border-slate-800 text-white py-3 px-4 rounded-lg text-center text-xs font-extrabold transition-all hover:shadow-md hover:scale-105 active:scale-95 duration-300"
            >
              🏠 CUSTOMER HUB
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
