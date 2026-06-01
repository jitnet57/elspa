'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePayrollStore } from '@/lib/store/payroll-store';
import { usePayrollCalculation } from '@/hooks/usePayrollCalculation';

// Lazy load 3D 네트워크 대시보드 (SSR 방지)
const NetworkDashboardAdmin = dynamic(
  () => import('@/components/20250529-2100-network-dashboard-admin'),
  { ssr: false, loading: () => <div className="p-8 text-center text-indigo-300/50">3D 네트워크 로딩 중...</div> }
);

// ============================================================
// 📌 컴포넌트명: AdminDashboard
// 📋 목적: ElSpa 관리자 대시보드 - 페이롤 API 통합 + 3D 네트워크
// 🔧 기능: KPI 카운터, 벤토 그리드, 실시간 급여 정산 테이블, 지식 네트워크
// 📅 작성일: 2026-05-28
// 🔄 업데이트: 2026-05-29 - 3D 네트워크 대시보드 통합
// ============================================================
export default function AdminDashboard() {
  // Main tab: Dashboard vs Payroll Periods vs Payroll Calculation vs Knowledge Network
  const [adminTab, setAdminTab] = useState<'dashboard' | 'payroll' | 'payroll-calc' | 'knowledge-network'>('dashboard');

  // Payroll Calculation API 훅
  const { calculateSingle, loading: apiLoading, error: apiError, result: apiResult, reset: resetCalc } = usePayrollCalculation();

  // Dashboard tab states
  const [payrollSearch, setPayrollSearch] = useState('');
  const [payrollTab, setPayrollTab] = useState('all');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Payroll tab states
  const [payGroup, setPayGroup] = useState<'weekly' | 'biweekly'>('weekly');
  const [selectedPeriod, setSelectedPeriod] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Payroll Calculation states
  const [calcForm, setCalcForm] = useState({
    employeeName: '',
    baseSalary: 0,
    commission: 0,
    sssTax: 0,
    incomeTax: 0,
    otherDeductions: 0
  });
  const [calcResult, setCalcResult] = useState<{
    employeeName: string;
    grossPay: number;
    totalDeductions: number;
    netPay: number;
    breakdown: { base: number; commission: number };
    deductionDetail: { sss: number; tax: number; other: number };
    warnings?: string[];
  } | null>(null);

  // 폴백 모킹 데이터 (API 데이터 없을 때만 사용)
  const fallbackMockData = [
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
      notes: "📌 Perfect attendance bonus applied. Verification complete."
    },
    {
      id: "TH-03",
      name: "Chloe",
      type: "therapist",
      roleLabel: "THERAPIST",
      gross: 8200,
      deductions: 8200,
      net: 0,
      status: "error",
      breakdown: { base: 6200, commission: 2000 },
      deductionDetail: { ca: 5000, sss: 2700, misc: 500 },
      notes: "⚠️ Safety Interlock active: Total deductions meet or exceed gross earnings."
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
      breakdown: { base: 30000, commission: 2000 },
      deductionDetail: { absence: 2000, sss: 2500 },
      notes: "📌 5/20 결근 1일 차감 적용 완료."
    }
  ];

  // Payroll store - periods for payroll tab
  const {
    periods = [],
    loading: payrollLoading,
    startCalculation,
    approvePeriodAction,
    records = [],
    employees = [],
    loading = false,
    error = null,
    fetchRecords,
    fetchEmployees
  } = usePayrollStore();

  // API 데이터 로드 (마운트 시 1회)
  useEffect(() => {
    if (fetchRecords) fetchRecords();
    if (fetchEmployees) fetchEmployees();
  }, [fetchRecords, fetchEmployees]);

  // API 데이터를 테이블 형식으로 변환
  const payrollData = records.map((record: any) => {
    const employee = employees.find(e => e.id === record.employee_id);
    const baseSalary = record.base_salary || record.base || 0;
    const grossPay = record.gross_pay || 0;
    return {
      id: record.id?.toString() || `REC-${record.employee_id}`,
      name: employee?.name || `Employee ${record.employee_id}`,
      type: 'staff',
      roleLabel: 'ADMIN STAFF',
      gross: grossPay,
      deductions: record.total_deductions || 0,
      net: grossPay - (record.total_deductions || 0),
      status: (grossPay - (record.total_deductions || 0)) === 0 ? 'error' : 'emerald',
      breakdown: {
        base: baseSalary,
        commission: grossPay - baseSalary,
      },
      deductionDetail: {
        sss: record.sss_contribution || 0,
        misc: (record.total_deductions || 0) - (record.sss_contribution || 0),
      },
      notes: `Record ID: ${record.id} | Period: ${record.period_id || 'N/A'}`
    };
  });

  // 실시간 검색 및 직군 탭 필터링 로직
  const displayData = payrollData.length > 0 ? payrollData : fallbackMockData;

  const filteredPayroll = displayData.filter(item => {
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        <button
          onClick={() => setAdminTab('dashboard')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            adminTab === 'dashboard'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setAdminTab('payroll')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            adminTab === 'payroll'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Payroll Periods
        </button>
        <button
          onClick={() => setAdminTab('payroll-calc')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            adminTab === 'payroll-calc'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          💰 Payroll Calc
        </button>
        <button
          onClick={() => setAdminTab('knowledge-network')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            adminTab === 'knowledge-network'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🧠 Knowledge Network
        </button>
      </div>

      {adminTab === 'dashboard' && (
        <>

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
                <Link className="flex-1 text-center py-2.5 bg-white/5 hover:bg-[#8aebff]/20 hover:text-[#8aebff] rounded-lg transition-all" href="/admin/therapists">DIRECTORY</Link>
                <Link className="flex-1 text-center py-2.5 bg-white/5 hover:bg-[#8aebff]/20 hover:text-[#8aebff] rounded-lg transition-all" href="/admin/therapist-schedule">SCHEDULE</Link>
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
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-[10px] font-black tracking-widest">
                <Link className="px-4 py-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-[#8aebff]/40 transition-all text-center" href="/admin/companies">COMPANIES</Link>
                <Link className="px-4 py-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-[#8aebff]/40 transition-all text-center" href="/admin/payroll">PAYROLL</Link>
                <Link className="px-4 py-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-[#8aebff]/40 transition-all text-center" href="/admin/deductions">💸 공제/선지급</Link>
                <Link className="px-4 py-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-[#8aebff]/40 transition-all text-center" href="/admin/monthly-settlement">THERAPIST</Link>
                <Link className="px-4 py-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-[#8aebff]/40 transition-all text-center" href="/admin/guide-referral-fee">GUIDE FEE</Link>
                <Link className="px-4 py-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-[#8aebff]/40 transition-all text-center" href="/admin/settlement-report">REPORTS</Link>
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
                <Link className="py-2.5 bg-white/5 rounded-lg text-center hover:bg-white/10" href="/admin/change-logs">LOGS</Link>
                <Link className="py-2.5 bg-white/5 rounded-lg text-center hover:bg-[#8aebff]/20 hover:text-[#8aebff]" href="/admin/test-data">VALIDATE</Link>
              </div>
            </div>

            {/* Card 4: Expense Management */}
            <div className="bg-white/3 backdrop-blur-md border border-[#8aebff]/10 p-6 rounded-2xl transition-all hover:bg-white/7 hover:border-[#8aebff]/40 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-[#8aebff]">receipt_long</span>
                <h4 className="font-bold text-sm text-white">Daily Reporting</h4>
              </div>
              <p className="text-xs text-indigo-200/50 mb-6 font-semibold leading-relaxed">Consolidated expense tracking for all regional sectors.</p>
              <Link
                href="/admin/expense"
                className="block w-full py-3.5 bg-[#8aebff]/15 border border-[#8aebff]/30 text-[#8aebff] font-black text-center rounded-xl hover:bg-[#8aebff]/35 transition-all text-xs tracking-widest"
              >
                OPEN EXPENSE LEDGER
              </Link>
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
              <Link
                href="/admin/sss"
                className="mt-4 px-4 py-3 bg-white/5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 border border-white/5 transition-all text-xs font-black tracking-widest"
              >
                <span className="material-symbols-outlined text-sm">file_export</span>
                EXPORT TO EXCEL
              </Link>
            </div>
          </section>

          {/* ============================================================
              📌 Embedded Payroll Panel (실시간 급여 정산 테이블)
              ============================================================ */}
          <section className="bg-white/3 backdrop-blur-md border border-indigo-500/20 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(99,102,241,0.15)]">

            {/* 에러 베너 */}
            {error && (
              <div className="bg-rose-500/10 border-b border-rose-500/30 px-6 py-4">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-rose-500 text-2xl">warning</span>
                  <div className="flex-1">
                    <p className="text-sm font-black text-rose-500 uppercase tracking-widest">API 연결 오류</p>
                    <p className="text-xs text-rose-300/80 font-semibold mt-1">{error}</p>
                  </div>
                  <button
                    onClick={() => {
                      // clearError?.();
                      fetchRecords?.();
                      fetchEmployees?.();
                    }}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded text-[10px] font-black text-rose-300 transition-all"
                  >
                    재시도
                  </button>
                </div>
              </div>
            )}

            {/* Header Area */}
            <div className="p-6 border-b border-indigo-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  💵 Payroll Overview
                  <span className={`text-[9px] tracking-widest px-2.5 py-0.5 rounded-full font-black uppercase ${
                    loading
                      ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                      : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                  }`}>
                    {loading ? 'Loading...' : 'Active Ledger'}
                  </span>
                </h3>
                <p className="text-xs text-indigo-200/50 mt-1 font-semibold">
                  {loading ? (
                    <span className="text-yellow-400">📊 Loading payroll records...</span>
                  ) : (
                    <span>✅ {payrollData.length} records loaded | Batch: May 16 - May 27</span>
                  )}
                </p>
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
              {loading ? (
                <div className="p-8">
                  {/* 로딩 상태 헤더 */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse"></div>
                    <p className="text-indigo-300 font-semibold">급여 데이터 로딩 중...</p>
                    <span className="text-[10px] text-indigo-300/50 ml-auto">(최대 5초)</span>
                  </div>

                  {/* 스켈레톤 테이블 */}
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-white/5 text-[10px] font-black tracking-widest text-indigo-300/60 border-b border-indigo-500/10">
                        <th className="px-6 py-4">ID / NAME</th>
                        <th className="px-6 py-4">ROLE</th>
                        <th className="px-6 py-4 text-right">GROSS PAY</th>
                        <th className="px-6 py-4 text-right">DEDUCTIONS</th>
                        <th className="px-6 py-4 text-right">NET PAY</th>
                        <th className="px-6 py-4 text-center">STATUS</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/10"></div>
                              <div className="space-y-2 w-full">
                                <div className="h-3 bg-white/10 rounded w-24"></div>
                                <div className="h-2 bg-white/5 rounded w-16"></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><div className="h-3 bg-white/10 rounded w-20"></div></td>
                          <td className="px-6 py-4"><div className="h-3 bg-white/10 rounded w-24 ml-auto"></div></td>
                          <td className="px-6 py-4"><div className="h-3 bg-white/10 rounded w-20 ml-auto"></div></td>
                          <td className="px-6 py-4"><div className="h-3 bg-white/10 rounded w-24 ml-auto"></div></td>
                          <td className="px-6 py-4 text-center"><div className="h-2 w-2 bg-white/10 rounded-full mx-auto"></div></td>
                          <td className="px-6 py-4"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
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
              )}
            </div>
          </section>
        </>
      )}

      {adminTab === 'payroll-calc' && (
        <section className="space-y-8">
          {/* Payroll Calculator Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Input Form */}
            <div className="bg-white/3 backdrop-blur-md border border-orange-500/20 rounded-3xl p-8 shadow-[0_0_40px_rgba(234,179,8,0.1)]">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-orange-400 text-3xl">calculate</span>
                <h3 className="text-xl font-black text-white">급여 정산 계산기</h3>
              </div>

              {/* API 에러 표시 */}
              {apiError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                  <p className="text-xs text-rose-400 font-semibold">⚠️ {apiError}</p>
                </div>
              )}

              <div className="space-y-5">
                {/* Employee Name */}
                <div>
                  <label className="text-xs font-black text-orange-300/60 uppercase tracking-widest block mb-2">직원명</label>
                  <input
                    type="text"
                    value={calcForm.employeeName}
                    onChange={(e) => setCalcForm({ ...calcForm, employeeName: e.target.value })}
                    placeholder="직원 이름 입력"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 font-medium"
                  />
                </div>

                {/* Base Salary */}
                <div>
                  <label className="text-xs font-black text-orange-300/60 uppercase tracking-widest block mb-2">기본 급여</label>
                  <input
                    type="number"
                    value={calcForm.baseSalary}
                    onChange={(e) => setCalcForm({ ...calcForm, baseSalary: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 font-medium"
                  />
                </div>

                {/* Commission */}
                <div>
                  <label className="text-xs font-black text-orange-300/60 uppercase tracking-widest block mb-2">커미션/보너스</label>
                  <input
                    type="number"
                    value={calcForm.commission}
                    onChange={(e) => setCalcForm({ ...calcForm, commission: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 font-medium"
                  />
                </div>

                {/* SSS Tax */}
                <div>
                  <label className="text-xs font-black text-rose-300/60 uppercase tracking-widest block mb-2">SSS 납입금</label>
                  <input
                    type="number"
                    value={calcForm.sssTax}
                    onChange={(e) => setCalcForm({ ...calcForm, sssTax: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 font-medium"
                  />
                </div>

                {/* Income Tax */}
                <div>
                  <label className="text-xs font-black text-rose-300/60 uppercase tracking-widest block mb-2">소득세</label>
                  <input
                    type="number"
                    value={calcForm.incomeTax}
                    onChange={(e) => setCalcForm({ ...calcForm, incomeTax: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 font-medium"
                  />
                </div>

                {/* Other Deductions */}
                <div>
                  <label className="text-xs font-black text-rose-300/60 uppercase tracking-widest block mb-2">기타 공제</label>
                  <input
                    type="number"
                    value={calcForm.otherDeductions}
                    onChange={(e) => setCalcForm({ ...calcForm, otherDeductions: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 font-medium"
                  />
                </div>

                {/* Calculate Button */}
                <button
                  onClick={async () => {
                    try {
                      const result = await calculateSingle({
                        employee_name: calcForm.employeeName,
                        base_salary: calcForm.baseSalary,
                        commission: calcForm.commission,
                        sss_tax: calcForm.sssTax,
                        income_tax: calcForm.incomeTax,
                        other_deductions: calcForm.otherDeductions,
                      });
                      setCalcResult({
                        employeeName: result.employee_name,
                        grossPay: result.gross_pay,
                        totalDeductions: result.total_deductions,
                        netPay: result.net_pay,
                        breakdown: result.breakdown,
                        deductionDetail: result.deduction_detail,
                        warnings: result.validation_warnings
                      });
                    } catch (err) {
                      console.error('계산 실패:', err);
                    }
                  }}
                  disabled={apiLoading}
                  className={`w-full mt-6 py-3 ${
                    apiLoading
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/30'
                  } text-white font-black rounded-lg transition-all`}
                >
                  {apiLoading ? '⏳ 계산 중...' : '📊 급여 정산하기'}
                </button>
              </div>
            </div>

            {/* Result Summary */}
            <div className="space-y-4">
              {calcResult ? (
                <>
                  {/* 경고 메시지 */}
                  {calcResult.warnings && calcResult.warnings.length > 0 && (
                    <div className="mb-6 space-y-2">
                      {calcResult.warnings.map((warning, idx) => (
                        <div key={idx} className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                          <p className="text-xs text-rose-400 font-semibold">{warning}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Result Card */}
                  <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(234,179,8,0.1)]">
                    <div className="mb-6 pb-6 border-b border-orange-500/20">
                      <p className="text-[10px] font-black text-orange-300/60 uppercase tracking-widest mb-1">정산 결과</p>
                      <h2 className="text-2xl font-black text-white">{calcResult.employeeName}</h2>
                    </div>

                    <div className="space-y-4">
                      {/* Gross Pay */}
                      <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-sm font-semibold text-indigo-200">총 급여</span>
                        <span className="text-lg font-mono font-black text-orange-400">₱{calcResult.grossPay.toLocaleString()}</span>
                      </div>

                      {/* Total Deductions */}
                      <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-sm font-semibold text-indigo-200">공제액</span>
                        <span className="text-lg font-mono font-black text-rose-400">-₱{calcResult.totalDeductions.toLocaleString()}</span>
                      </div>

                      {/* Net Pay - Highlighted */}
                      <div className="flex justify-between items-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30 mt-6">
                        <span className="text-sm font-black text-emerald-200">✅ 실수령액</span>
                        <span className="text-2xl font-mono font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">₱{calcResult.netPay.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Details */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* 수입 내역 */}
                    <div className="bg-white/3 border border-indigo-500/20 rounded-xl p-4">
                      <p className="text-[10px] font-black text-indigo-300/60 uppercase tracking-widest mb-3">수입</p>
                      <div className="space-y-2 text-xs text-indigo-200 font-semibold">
                        <div className="flex justify-between">
                          <span>기본급</span>
                          <span className="font-mono">₱{calcResult.breakdown.base.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>커미션</span>
                          <span className="font-mono">₱{calcResult.breakdown.commission.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* 공제 내역 */}
                    <div className="bg-white/3 border border-rose-500/20 rounded-xl p-4">
                      <p className="text-[10px] font-black text-rose-300/60 uppercase tracking-widest mb-3">공제</p>
                      <div className="space-y-2 text-xs text-rose-300 font-semibold">
                        <div className="flex justify-between">
                          <span>SSS</span>
                          <span className="font-mono">-₱{calcResult.deductionDetail.sss.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>소득세</span>
                          <span className="font-mono">-₱{calcResult.deductionDetail.tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>기타</span>
                          <span className="font-mono">-₱{calcResult.deductionDetail.other.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={() => {
                      setCalcForm({
                        employeeName: '',
                        baseSalary: 0,
                        commission: 0,
                        sssTax: 0,
                        incomeTax: 0,
                        otherDeductions: 0
                      });
                      setCalcResult(null);
                      resetCalc();
                    }}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-indigo-300 font-semibold rounded-lg transition-all border border-white/10"
                  >
                    새로 계산하기
                  </button>
                </>
              ) : (
                <div className="bg-white/3 border border-dashed border-indigo-500/30 rounded-3xl p-12 flex flex-col items-center justify-center h-full min-h-[400px]">
                  <span className="material-symbols-outlined text-5xl text-indigo-400/30 mb-4">calculate</span>
                  <p className="text-sm text-indigo-300/60 font-semibold text-center">좌측에서 급여 정보를 입력하고<br/>계산 버튼을 눌러주세요</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {adminTab === 'knowledge-network' && (
        <>
          {/* ============================================================
              📊 3D 지식 네트워크 통합 섹션
              ============================================================ */}
          <NetworkDashboardAdmin />
        </>
      )}

      {adminTab === 'payroll' && (
        <section className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold opacity-90">Total Periods</p>
                  <h3 className="text-3xl font-bold mt-2">{periods.length}</h3>
                </div>
                <span className="text-3xl">📊</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 text-white shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold opacity-90">Draft</p>
                  <h3 className="text-3xl font-bold mt-2">{periods.filter(p => p.status === 'draft').length}</h3>
                </div>
                <span className="text-3xl">📝</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg p-6 text-white shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold opacity-90">Approved</p>
                  <h3 className="text-3xl font-bold mt-2">{periods.filter(p => p.status === 'approved').length}</h3>
                </div>
                <span className="text-3xl">✅</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold opacity-90">Paid</p>
                  <h3 className="text-3xl font-bold mt-2">{periods.filter(p => p.status === 'paid').length}</h3>
                </div>
                <span className="text-3xl">💰</span>
              </div>
            </div>
          </div>

          {/* Pay Group Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setPayGroup('weekly')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                payGroup === 'weekly'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📅 Weekly
            </button>
            <button
              onClick={() => setPayGroup('biweekly')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                payGroup === 'biweekly'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📆 Bi-Weekly
            </button>
          </div>

          {/* Payroll Periods List */}
          <div className="space-y-4">
            {periods.length === 0 ? (
              <div className="bg-white/5 rounded-xl p-8 text-center text-gray-400 border border-white/10">
                <p className="text-lg font-semibold">No payroll periods found</p>
              </div>
            ) : (
              periods
                .filter(p => (p.pay_group === payGroup))
                .map(period => (
                  <div
                    key={period.id}
                    className="bg-white/5 rounded-lg border border-white/10 shadow-sm hover:bg-white/8 transition-all p-6"
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      {/* Period Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-white">
                            Period {period.id}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            period.status === 'draft' ? 'bg-yellow-500/20 text-yellow-300' :
                            period.status === 'approved' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                            {period.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${period.employeeCount ? ((period.processedCount || 0) / period.employeeCount) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">{period.processedCount || 0} / {period.employeeCount || 0} employees</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {period.status === 'draft' && (
                          <button className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-sm">
                            🧮 Calculate
                          </button>
                        )}
                        {period.status === 'approved' && (
                          <button className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg text-sm">
                            💳 Process
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>
      )}
        </div>
    );
}
