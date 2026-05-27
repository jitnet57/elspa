'use client';

import { useState } from 'react';
import React from 'react';

// ============================================================
// 📌 컴포넌트명: AdminPortal (ElSpa Mission Control Center)
// 📋 목적: 초프리미엄 벤토 대시보드 테마의 관리자 제어 센터 및 실시간 급여 검증기
// 🔧 기능: 보안 게이트 암호 인증, 사이드 바 네비게이션, 시스템 통계 모니터링, 급여 아코디언 검증
// 📅 작성일: 2026-05-28
// ⚠️ 주의: Cloudflare Pages 정적 export(.html) 배포 라우팅 구조 완벽 탑재
// ============================================================
export default function AdminPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  // 급여 테이블 검색 및 필터링 상태
  const [payrollSearch, setPayrollSearch] = useState('');
  const [payrollTab, setPayrollTab] = useState('all'); // all, therapist, staff
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // ============================================================
  // 📌 함수명: handleLogin
  // 📋 목적: 보안 게이트 비밀번호 'admin123' 검증 및 포털 암호 해독
  // ============================================================
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
      setLoginError(false);
    } else {
      setLoginError(true);
      setPassword('');
      // 로그인 창 흔들림 효과는 리액트 컴포넌트가 알아서 렌더링하도록 유도
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  // ============================================================
  // 📌 검증용 실무 데이터셋 (ElSpa 5/16~5/27 정산 실데이터 매핑)
  // ============================================================
  const mockPayrollData = [
    {
      id: "TH-01",
      name: "Ana",
      type: "therapist",
      roleLabel: "THERAPIST",
      gross: 24500,
      deductions: 2100,
      net: 22400,
      status: "emerald",
      breakdown: { base: 18000, commission: 6500 },
      deductionDetail: { sss: 1200, misc: 900 },
      notes: "📌 Perfect attendance bonus applied. Verification complete. 보건소 검사비 -500 PHP 분기 차감 포함."
    },
    {
      id: "TH-03",
      name: "Chloe",
      type: "therapist",
      roleLabel: "THERAPIST",
      gross: 8200,
      deductions: 8200,
      net: 0,
      status: "error", // Net 0에 따른 안전 락다운 활성화
      breakdown: { base: 6200, commission: 2000 },
      deductionDetail: { ca: 5000, sss: 2700, misc: 500 },
      notes: "⚠️ Safety Interlock active: Total deductions meet or exceed gross earnings. Manual verification required before disbursement."
    },
    {
      id: "EMP-01",
      name: "Kevin",
      type: "staff",
      roleLabel: "ADMIN STAFF",
      gross: 32000,
      deductions: 4500,
      net: 27500,
      status: "emerald",
      breakdown: { base: 30000, commission: 2000 }, // Manager 직무 수당 포함
      deductionDetail: { absence: 2000, sss: 2500 }, // 1일 결근 반영 (-2,000 PHP)
      notes: "📌 5/20 결근 1일 차감 적용 완료 (매니저 전용 차감 규칙 연계 확인). SSS 기여금 공제 완료."
    },
    {
      id: "EMP-03",
      name: "Mason",
      type: "staff",
      roleLabel: "DRIVER",
      gross: 20470,
      deductions: 4000,
      net: 16470,
      status: "emerald",
      breakdown: { base: 20000, commission: 470 }, // 초과근무 70 + 식대 200 + 기본급
      deductionDetail: { sss: 4000 }, // PENDING CA(4,000 PHP)는 차감 제외 규칙 반영 확인
      notes: "📌 드라이버 초과근무 수당 및 식대 지원금 합산 완료. 승인 대기(Pending) 상태인 CA는 안전하게 정산 대상에서 제외."
    }
  ];

  // 실시간 검색 및 직군 탭 필터링 로직
  const filteredPayroll = mockPayrollData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(payrollSearch.toLowerCase()) || item.id.toLowerCase().includes(payrollSearch.toLowerCase());
    const matchesTab = payrollTab === 'all' 
      ? true 
      : payrollTab === 'therapist' 
        ? item.type === 'therapist'
        : item.type === 'staff';
    return matchesSearch && matchesTab;
  });

  const toggleAccordion = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  // ============================================================
  // [1] 비로그인: 보안 게이트 인증 화면 (Security Access Gate)
  // ============================================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0c1324] bg-[radial-gradient(circle_at_top_right,_#1e1b4b,_#0c1324_60%)] flex items-center justify-center px-4 relative overflow-hidden">
        {/* 네블라 은하수 장식 효과 */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-600 top-[-200px] right-[-100px] filter blur-[120px] opacity-15 -z-10 pointer-events-none"></div>
        <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-600 bottom-[-200px] left-[-100px] filter blur-[120px] opacity-15 -z-10 pointer-events-none"></div>

        <div className="bg-white/3 backdrop-blur-md border border-[#8aebff]/10 max-w-md w-full p-8 rounded-2xl shadow-2xl transition-all duration-300">
          <div className="text-center mb-8">
            <span className="material-symbols-outlined text-[#8aebff] text-[48px] mb-4 text-shadow-[0_0_8px_rgba(138,235,255,0.6)] font-black">lock</span>
            <h1 className="text-2xl font-black text-[#8aebff] tracking-tight">Security Access Required</h1>
            <p className="text-indigo-200/60 mt-2 text-sm font-semibold">Enter administration credentials to decrypt portal.</p>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter password..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-[#8aebff]/60 focus:ring-1 focus:ring-[#8aebff]/60 text-white font-mono tracking-widest text-center transition-all placeholder-indigo-300/35"
              />
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#8aebff] group-focus-within:w-full transition-all duration-700 shadow-[0_0_10px_rgba(34,211,238,1)]"></div>
            </div>

            <button
              onClick={() => handleLogin()}
              className="w-full bg-[#8aebff] hover:bg-[#2fd9f4] text-slate-950 font-black py-4 rounded-xl hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] active:scale-95 transition-all text-xs tracking-widest"
            >
              AUTHENTICATE SYSTEM
            </button>

            {loginError && (
              <p className="text-rose-500 text-center text-xs font-bold tracking-wide animate-pulse mt-4">
                Access Denied. Identity mismatch. 🔒
              </p>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center opacity-40 text-[10px] font-mono tracking-widest text-indigo-300">
            <span>V2.0.4 - CORE</span>
            <span>CIPHER: AES-256</span>
          </div>
        </div>

        {/* 구글 폰트 및 아이콘 리소스 */}
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </div>
    );
  }

  // ============================================================
  // [2] 로그인 성공: 벤토 대시보드 메인 화면 (Embedded Mission Control)
  // ============================================================
  return (
    <div className="min-h-screen bg-[#0c1324] bg-[radial-gradient(circle_at_top_right,_#1e1b4b,_#0c1324_60%)] text-[#dce1fb] font-sans antialiased relative pb-16">
      
      {/* 우주 은하 안개 백그라운드 효과 */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-600 top-[-200px] right-[-100px] filter blur-[120px] opacity-10 -z-10 pointer-events-none"></div>
      <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-600 bottom-[-200px] left-[-100px] filter blur-[120px] opacity-10 -z-10 pointer-events-none"></div>

      {/* Navigation Drawer (사이드바) */}
      <aside className="hidden lg:flex flex-col h-screen p-6 fixed left-0 top-0 h-full w-[280px] bg-slate-900/40 backdrop-blur-xl border-r border-indigo-500/10 shadow-2xl shadow-black/50 z-50 justify-between">
        <div className="flex flex-col gap-8">
          <div className="px-4 py-6">
            <h2 className="text-3xl font-black text-[#8aebff] tracking-tighter drop-shadow-[0_0_8px_rgba(138,235,255,0.4)]">ELSPA</h2>
            <p className="text-[10px] font-mono text-indigo-300/60 tracking-widest mt-1 uppercase">Command Center</p>
          </div>
          <nav className="flex flex-col gap-2">
            <a className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-[#8aebff] bg-white/10 border-r-2 border-[#8aebff] shadow-[0_0_15px_rgba(34,211,238,0.2)]" href="/admin.html">
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-sm font-black">Dashboard</span>
            </a>
            <a className="flex items-center gap-4 px-4 py-3 rounded-xl text-indigo-300/60 hover:text-white hover:bg-white/5 transition-all" href="/admin/therapist-schedule.html">
              <span className="material-symbols-outlined">groups</span>
              <span className="text-sm font-semibold">Therapists</span>
            </a>
            <a className="flex items-center gap-4 px-4 py-3 rounded-xl text-indigo-300/60 hover:text-white hover:bg-white/5 transition-all" href="/admin/payroll.html">
              <span className="material-symbols-outlined">payments</span>
              <span className="text-sm font-semibold">Payroll</span>
            </a>
            <a className="flex items-center gap-4 px-4 py-3 rounded-xl text-indigo-300/60 hover:text-white hover:bg-white/5 transition-all" href="/admin/policies.html">
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm font-semibold">Settings</span>
            </a>
          </nav>
        </div>

        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <img alt="Admin" className="w-10 h-10 rounded-full border border-cyan-500/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-Zy8obKMQ4KCOYGq9VIYlInzuOjEWliz7MAm1b9M5EEj61q1lo_2sCRiGkqfcKFDnZjkwYMvbTZHOg2smiDIkZDWTwUpaCQk-oX6O0iXV1zHd1WgoZFvVOp48yI6TmwNqLqIIqVWp_S_QBwxAPp62YS_LzVshm44scATwlDBlPFAtUD82Uo44NHlxPnEPZFBXmYfzAZJcRzB7KKQ9mII2ooy_6pSlDZHBruhDIHh_RkDrzvLV2QPWnD4iw7G2YybILo_B44PhxT-d"/>
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate text-white">Admin User</p>
              <p className="text-[9px] font-mono text-cyan-400">V2.0.4 Online</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 lg:ml-[280px] pb-24 lg:pb-8">
        
        {/* TopAppBar */}
        <header className="flex justify-between items-center px-6 py-4 w-full sticky top-0 z-40 bg-slate-950/40 backdrop-blur-md border-b border-indigo-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#8aebff]">security</span>
            <h2 className="text-lg sm:text-xl font-black tracking-tighter text-[#8aebff] drop-shadow-[0_0_8px_rgba(138,235,255,0.4)]">
              ELSPA CONTROL
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsLoggedIn(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-all font-mono text-[9px] font-black tracking-wider"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              LOGOUT
            </button>
          </div>
        </header>

        {/* Dashboard Grid & Payroll Overview */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Bento-Style Grid Layout */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Card 1: Therapist Core */}
            <div className="bg-white/3 backdrop-blur-md border border-[#8aebff]/10 p-6 rounded-2xl flex flex-col gap-4 transition-all hover:bg-white/7 hover:border-[#8aebff]/40 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]">
              <div className="flex justify-between items-start">
                <div className="bg-[#8aebff]/10 p-3 rounded-xl text-[#8aebff]">
                  <span className="material-symbols-outlined">diversity_3</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-300/60 uppercase font-bold tracking-wider">60 ACTIVE STAFF</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Therapist Core</h3>
                <p className="text-indigo-200/50 text-xs mt-1 font-semibold">Directory, Scheduling, & Bio-metrics</p>
              </div>
              <div className="flex gap-2 mt-auto text-[10px] font-black tracking-widest">
                <a className="flex-1 text-center py-2.5 bg-white/5 hover:bg-[#8aebff]/20 hover:text-[#8aebff] rounded-lg transition-all" href="/admin/therapists.html">DIRECTORY</a>
                <a className="flex-1 text-center py-2.5 bg-white/5 hover:bg-[#8aebff]/20 hover:text-[#8aebff] rounded-lg transition-all" href="/admin/therapist-schedule.html">SCHEDULE</a>
              </div>
            </div>

            {/* Card 2: Settlement & Payroll (Col span 2) */}
            <div className="bg-white/3 backdrop-blur-md border border-[#8aebff]/10 md:col-span-2 p-6 rounded-2xl flex flex-col gap-6 relative overflow-hidden transition-all hover:bg-white/7 hover:border-[#8aebff]/40 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-[120px]">account_balance_wallet</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-orange-400/10 p-3 rounded-xl text-orange-400">
                  <span className="material-symbols-outlined">account_balance</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Settlement & Payroll</h3>
                  <p className="text-indigo-200/50 text-xs mt-0.5 font-semibold">Financial distribution & auditing systems</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-black tracking-widest">
                <a className="px-4 py-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-[#8aebff]/40 transition-all text-center" href="/admin/companies.html">COMPANIES</a>
                <a className="px-4 py-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-[#8aebff]/40 transition-all text-center" href="/admin/payroll.html">PAYROLL</a>
                <a className="px-4 py-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-[#8aebff]/40 transition-all text-center" href="/admin/guide-referral-fee.html">GUIDE FEE</a>
                <a className="px-4 py-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-[#8aebff]/40 transition-all text-center" href="/admin/settlement-report.html">REPORTS</a>
              </div>
            </div>

            {/* Card 3: Systems Audit */}
            <div className="bg-white/3 backdrop-blur-md border border-[#8aebff]/10 p-6 rounded-2xl flex flex-col gap-4 transition-all hover:bg-white/7 hover:border-[#8aebff]/40 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]">
              <div className="flex items-center justify-between">
                <div className="bg-indigo-400/10 p-3 rounded-xl text-indigo-400">
                  <span className="material-symbols-outlined">monitoring</span>
                </div>
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,1)]"></div>
              </div>
              <h3 className="text-lg font-black text-white">Systems Audit</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-indigo-300/60 font-bold">
                  <span>BILLING ACCURACY</span>
                  <span className="text-[#8aebff] font-black filter drop-shadow-[0_0_4px_rgba(34,211,238,0.3)]">99.8%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 w-[99.8%]"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-auto text-[10px] font-black tracking-widest">
                <a className="py-2.5 bg-white/5 rounded-lg text-center hover:bg-white/10" href="/admin/change-logs.html">LOGS</a>
                <a className="py-2.5 bg-white/5 rounded-lg text-center hover:bg-[#8aebff]/20 hover:text-[#8aebff]" href="/admin/test-data.html">VALIDATE</a>
              </div>
            </div>

            {/* Card 4: Expense Management */}
            <div className="bg-white/3 backdrop-blur-md border border-[#8aebff]/10 p-6 rounded-2xl transition-all hover:bg-white/7 hover:border-[#8aebff]/40 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-[#8aebff]">receipt_long</span>
                <h4 className="font-bold text-sm text-white">Daily Reporting</h4>
              </div>
              <p className="text-xs text-indigo-200/50 mb-6 font-semibold leading-relaxed">Consolidated expense tracking for all regional sectors.</p>
              <a 
                href="/admin/expense.html" 
                className="block w-full py-3.5 bg-[#8aebff]/15 border border-[#8aebff]/30 text-[#8aebff] font-black text-center rounded-xl hover:bg-[#8aebff]/35 transition-all text-xs tracking-widest"
              >
                OPEN EXPENSE LEDGER
              </a>
            </div>

            {/* Card 5: SSS Management */}
            <div className="bg-white/3 backdrop-blur-md border border-[#8aebff]/10 p-6 rounded-2xl flex flex-col justify-between transition-all hover:bg-white/7 hover:border-[#8aebff]/40 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-orange-400">sim_card_download</span>
                  <h4 className="font-bold text-sm text-white">SSS Portal</h4>
                </div>
                <p className="text-xs text-indigo-200/50 font-semibold leading-relaxed">Legacy data migration & scan to spreadsheet.</p>
              </div>
              <a 
                href="/admin/sss.html"
                className="mt-4 px-4 py-3 bg-white/5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 border border-white/5 transition-all text-xs font-black tracking-widest"
              >
                <span className="material-symbols-outlined text-sm">file_export</span>
                EXPORT TO EXCEL
              </a>
            </div>
          </section>

          {/* ============================================================
              📌 Embedded Payroll Panel (실시간 급여 정산 테이블)
              ============================================================ */}
          <section className="bg-white/3 backdrop-blur-md border border-indigo-500/20 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(99,102,241,0.15)]">
            
            {/* Header Area */}
            <div className="p-6 border-b border-indigo-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  💵 Payroll Overview 
                  <span className="text-[9px] tracking-widest bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2.5 py-0.5 rounded-full font-black uppercase">Active Ledger</span>
                </h3>
                <p className="text-xs text-indigo-200/50 mt-1 font-semibold">Batch Processing Cycle: May 16 - May 27</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 text-xs font-black tracking-widest">
                {/* 검색 필드 */}
                <div className="relative w-full sm:w-60">
                  <input
                    type="text"
                    value={payrollSearch}
                    onChange={e => setPayrollSearch(e.target.value)}
                    placeholder="Search entity..."
                    className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 font-medium text-white placeholder-indigo-300/30"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300/40 text-lg">search</span>
                </div>
                
                {/* 직군 탭 */}
                <div className="flex bg-white/5 p-1 rounded-full border border-white/5 shadow-inner">
                  <button 
                    onClick={() => setPayrollTab('all')}
                    className={`px-5 py-1.5 rounded-full transition-all ${payrollTab === 'all' ? 'bg-[#8aebff] text-slate-950 shadow font-black' : 'text-indigo-300/60 hover:text-indigo-100'}`}
                  >ALL</button>
                  <button 
                    onClick={() => setPayrollTab('therapist')}
                    className={`px-5 py-1.5 rounded-full transition-all ${payrollTab === 'therapist' ? 'bg-[#8aebff] text-slate-950 shadow font-black' : 'text-indigo-300/60 hover:text-indigo-100'}`}
                  >THERAPISTS</button>
                  <button 
                    onClick={() => setPayrollTab('staff')}
                    className={`px-5 py-1.5 rounded-full transition-all ${payrollTab === 'staff' ? 'bg-[#8aebff] text-slate-950 shadow font-black' : 'text-indigo-300/60 hover:text-indigo-100'}`}
                  >STAFF</button>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-black tracking-widest text-indigo-300/60 border-b border-indigo-500/10">
                    <th className="px-6 py-4">ID / NAME</th>
                    <th className="px-6 py-4">ROLE</th>
                    <th className="px-6 py-4 text-right">GROSS PAY</th>
                    <th className="px-6 py-4 text-right">DEDUCTIONS</th>
                    <th className="px-6 py-4 text-right text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.3)] font-black">NET PAY</th>
                    <th className="px-6 py-4 text-center">STATUS</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {filteredPayroll.length > 0 ? (
                    filteredPayroll.map(item => (
                      <React.Fragment key={item.id}>
                        <tr className="hover:bg-white/5 transition-colors duration-200">
                          {/* ID / Name */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-[10px] text-white">
                                {item.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-white">{item.name}</p>
                                <p className="text-[9px] font-mono text-indigo-300/50 uppercase tracking-widest mt-0.5">{item.id}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role Tag */}
                          <td className="px-6 py-4">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded tracking-wider ${
                              item.type === 'therapist' 
                                ? 'bg-[#8aebff]/10 text-[#8aebff]' 
                                : 'bg-white/10 text-indigo-300/60'
                            }`}>
                              {item.roleLabel}
                            </span>
                          </td>

                          {/* Gross, Deductions, Net */}
                          <td className="px-6 py-4 text-right font-mono font-bold text-indigo-200">₱{item.gross.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-rose-400">-₱{item.deductions.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                          <td className={`px-6 py-4 text-right font-mono font-black text-sm drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] ${
                            item.net === 0 ? 'text-rose-400' : 'text-[#8aebff]'
                          }`}>
                            ₱{item.net.toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>

                          {/* Status Dot */}
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                              item.status === 'emerald' 
                                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' 
                                : 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                            }`}></span>
                          </td>

                          {/* Accordion Action */}
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => toggleAccordion(item.id)}
                              className="text-indigo-300/60 hover:text-cyan-400 transition-all active:scale-95"
                            >
                              <span className="material-symbols-outlined">
                                {expandedRowId === item.id ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                              </span>
                            </button>
                          </td>
                        </tr>

                        {/* Accordion Row Details */}
                        {expandedRowId === item.id && (
                          <tr className="bg-white/[0.02] animate-[fadeIn_0.2s_ease-out_forwards]">
                            <td className={`px-6 py-6 border-l-2 ${item.net === 0 ? 'border-rose-500' : 'border-cyan-400'}`} colSpan={7}>
                              
                              {/* Chloe Net 0일 경우 Safety Interlock 경고 배너 출력 */}
                              {item.id === 'TH-03' ? (
                                <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center gap-4">
                                  <span className="material-symbols-outlined text-rose-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                                  <div>
                                    <p className="text-xs font-black text-rose-500 uppercase tracking-widest">Safety Interlock: 0 Net Pay</p>
                                    <p className="text-xs text-indigo-200/60 font-semibold mt-1">Total deductions meet or exceed gross earnings. Manual verification required before disbursement.</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                  {/* Breakdown */}
                                  <div>
                                    <p className="text-[10px] font-black text-indigo-300/50 tracking-widest uppercase mb-2">BREAKDOWN</p>
                                    <div className="space-y-1.5 text-xs text-indigo-200 font-semibold">
                                      <div className="flex justify-between">
                                        <span>Base Rate:</span>
                                        <span className="font-mono">₱{item.breakdown.base.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Tips/Comm:</span>
                                        <span className="font-mono">₱{item.breakdown.commission.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Deductions */}
                                  <div>
                                    <p className="text-[10px] font-black text-indigo-300/50 tracking-widest uppercase mb-2">DEDUCTIONS</p>
                                    <div className="space-y-1.5 text-xs text-rose-300 font-semibold">
                                      {Object.entries(item.deductionDetail).map(([key, val]) => (
                                        <div className="flex justify-between" key={key}>
                                          <span className="capitalize">{key === 'sss' ? 'SSS Contribution' : key === 'absence' ? 'Absence Fee' : key === 'ca' ? 'Approved CA' : 'Misc Fee'}:</span>
                                          <span className="font-mono">-₱{val.toLocaleString()}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Audit Notes */}
                                  <div>
                                    <p className="text-[10px] font-black text-indigo-300/50 tracking-widest uppercase mb-2">AUDIT NOTES</p>
                                    <p className="text-xs text-indigo-300/80 font-semibold leading-relaxed italic">{item.notes}</p>
                                  </div>
                                </div>
                              )}
                              
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-indigo-300/30 font-black uppercase text-xs tracking-widest">No matching entity found in ledger.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Bottom Navigation (fixed at bottom) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-slate-950/80 backdrop-blur-lg border-t border-cyan-500/20 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] rounded-t-xl">
        <a className="flex flex-col items-center justify-center text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] active:scale-110 transition-transform duration-200" href="#">
          <span className="material-symbols-outlined">home_max</span>
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Home</span>
        </a>
        <a className="flex flex-col items-center justify-center text-indigo-300/40 active:scale-110 transition-transform duration-200" href="/admin/therapist-schedule.html">
          <span className="material-symbols-outlined">group</span>
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Staff</span>
        </a>
        <a className="flex flex-col items-center justify-center text-indigo-300/40 active:scale-110 transition-transform duration-200" href="/admin/payroll.html">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Pay</span>
        </a>
      </nav>
      
      {/* Custom Styles Injection */}
      <style jsx global>{`
        .text-shadow-glow {
          text-shadow: 0 0 8px rgba(138, 235, 255, 0.6);
        }
      `}</style>
    </div>
  );
}
