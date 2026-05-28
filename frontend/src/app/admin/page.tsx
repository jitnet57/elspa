'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { usePayrollStore } from '@/lib/store/payroll-store';

// ============================================================
// 📌 컴포넌트명: AdminDashboard
// 📋 목적: ElSpa 관리자 대시보드 - 페이롤 API 통합
// 🔧 기능: KPI 카운터, 벤토 그리드, 실시간 급여 정산 테이블
// 📅 작성일: 2026-05-28
// 🔄 업데이트: 2026-05-28 - 모킹 데이터 → API 통합
// ============================================================
export default function AdminDashboard() {
  const [payrollSearch, setPayrollSearch] = useState('');
  const [payrollTab, setPayrollTab] = useState('all');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // API 데이터
  const { records, employees, loading, error, fetchRecords, fetchEmployees, clearError } = usePayrollStore();

  // 페이롤 데이터 로드
  useEffect(() => {
    fetchRecords();
    fetchEmployees();
  }, [fetchRecords, fetchEmployees]);

  // 에러 표시 및 자동 정리
  useEffect(() => {
    if (error) {
      console.error('Payroll Data Error:', error);
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // API 데이터를 테이블 형식으로 변환
  const payrollData = records.map((record) => {
    const employee = employees.find(e => e.id === record.employee_id);
    return {
      id: record.id?.toString() || `REC-${record.employee_id}`,
      name: employee?.name || `Employee ${record.employee_id}`,
      type: 'staff',
      roleLabel: 'ADMIN STAFF',
      gross: record.gross_pay || 0,
      deductions: record.total_deductions || 0,
      net: (record.gross_pay || 0) - (record.total_deductions || 0),
      status: ((record.gross_pay || 0) - (record.total_deductions || 0)) === 0 ? 'error' : 'emerald',
      breakdown: {
        base: record.base_salary || 0,
        commission: (record.gross_pay || 0) - (record.base_salary || 0),
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

  const toggleAccordion = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  return (
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
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-[10px] font-black tracking-widest">
                <a className="px-4 py-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-[#8aebff]/40 transition-all text-center" href="/admin/companies.html">COMPANIES</a>
                <a className="px-4 py-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-[#8aebff]/40 transition-all text-center" href="/admin/payroll.html">PAYROLL</a>
                <a className="px-4 py-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-[#8aebff]/40 transition-all text-center" href="/therapist-settlement.html">THERAPIST</a>
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
                  <span className={`text-[9px] tracking-widest px-2.5 py-0.5 rounded-full font-black uppercase ${
                    loading
                      ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                      : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                  }`}>
                    {loading ? 'Loading...' : 'Active Ledger'}
                  </span>
                </h3>
                <p className="text-xs text-indigo-200/50 mt-1 font-semibold">
                  {error ? (
                    <span className="text-rose-400">⚠️ Error loading payroll data</span>
                  ) : loading ? (
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
              {loading && (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse"></div>
                    <p className="text-indigo-300 font-semibold">Loading payroll records...</p>
                  </div>
                </div>
              )}

              {!loading && (
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
        </div>
    );
}
