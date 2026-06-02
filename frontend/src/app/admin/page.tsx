'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import dynamic from 'next/dynamic';
import { usePayrollStore } from '@/lib/store/payroll-store';
import { usePayrollCalculation } from '@/hooks/usePayrollCalculation';
import { getSupabase } from '@/lib/supabase/client';

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

  // URL 쿼리 파라미터에서 탭 읽기 (클라이언트 사이드만)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as 'dashboard' | 'payroll' | 'payroll-calc' | 'knowledge-network' | null;
      if (tab) setAdminTab(tab);
    }
  }, []);

  // Dashboard KPI state
  const [dashRefresh, setDashRefresh] = useState(0);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashStats, setDashStats] = useState<{
    present: number; absent: number; earlyLeave: number;
    todayRevenue: number; todayExpense: number; todayBookings: number;
    pickupRequests: number; plannedBudget: number;
    newGuests: number; newCompanies: number; newTherapists: number;
    newStaff: number; resigned: number;
  } | null>(null);

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

  // ============================================================
  // 📌 대시보드 KPI 데이터 로드
  // 📋 목적: adminTab이 dashboard일 때 또는 새로고침 시 Supabase에서 KPI 집계
  // 🔄 의존성: adminTab, dashRefresh
  // ============================================================
  useEffect(() => {
    if (adminTab !== 'dashboard') return;
    setDashLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const d2 = new Date(); d2.setHours(0,0,0,0);
    const dow = d2.getDay(); const diff2 = dow === 0 ? -6 : 1 - dow;
    const mon = new Date(d2); mon.setDate(d2.getDate() + diff2);
    const weekStart = mon.toISOString().split('T')[0];
    const s = { present:0, absent:0, earlyLeave:0, todayRevenue:0, todayExpense:0, todayBookings:0, pickupRequests:0, plannedBudget:0, newGuests:0, newCompanies:0, newTherapists:0, newStaff:0, resigned:0 };
    (async () => {
      const sb = getSupabase();
      if (sb) {
        try { const {data:att} = await sb.from('attendance_logs').select('clock_in,clock_out,is_absent').eq('work_date',today); if(att){s.present=att.filter((a:any)=>a.clock_in&&!a.is_absent).length;s.absent=att.filter((a:any)=>a.is_absent).length;s.earlyLeave=att.filter((a:any)=>a.clock_out&&a.clock_out<'17:00').length;} } catch{}
        try { const {data:bk} = await sb.from('massage_bookings').select('service_price,status').eq('date',today); if(bk){const ac=bk.filter((b:any)=>b.status!=='cancelled');s.todayBookings=ac.length;s.todayRevenue=ac.reduce((t:number,b:any)=>t+(Number(b.service_price)||0),0);} } catch{}
        try { const {data:ex} = await sb.from('expenses').select('amount').eq('report_date',today); if(ex)s.todayExpense=ex.reduce((t:number,e:any)=>t+(Number(e.amount)||0),0); } catch{}
        try { const {data:pu} = await sb.from('bookings').select('id').gte('created_at',today+'T00:00:00').eq('status','pending'); if(pu)s.pickupRequests=pu.length; } catch{}
        try { const {data:em} = await sb.from('employees').select('employee_type,is_active,created_at').gte('created_at',weekStart+'T00:00:00'); if(em){s.newStaff=em.length;s.newTherapists=em.filter((e:any)=>e.employee_type==='therapist').length;} } catch{}
        try { const {data:re} = await sb.from('employees').select('id').eq('is_active',false).gte('updated_at',weekStart+'T00:00:00'); if(re)s.resigned=re.length; } catch{}
        try { const {data:co} = await sb.from('companies').select('id').gte('created_at',weekStart+'T00:00:00'); if(co)s.newCompanies=co.length; } catch{}
        try { const {data:gu} = await sb.from('massage_bookings').select('guest_name').gte('created_at',weekStart+'T00:00:00'); if(gu)s.newGuests=new Set(gu.map((g:any)=>g.guest_name)).size; } catch{}
      }
      setDashStats(s); setDashLoading(false);
    })();
  }, [adminTab, dashRefresh]);

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
      <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-hidden flex-wrap">
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

      {/* ============================================================
          📌 Dashboard 탭: 13개 KPI 카드 대시보드
          📋 목적: 오늘 출근·매출·예약·픽업 현황 + 이번 주 신규·변동 집계
          ============================================================ */}
      {adminTab === 'dashboard' && (
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-xs text-indigo-300/50">오늘 기준 · 이번주 신규/변동</p>
            <button onClick={()=>{ setDashStats(null); setDashRefresh(r=>r+1); }} className="text-xs text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg border border-indigo-500/30">↻ 새로고침</button>
          </div>

          {/* 출근 현황 */}
          <div>
            <p className="text-[10px] font-black text-indigo-300/50 uppercase tracking-widest mb-3">👥 출근 현황 (오늘)</p>
            <div className="grid grid-cols-3 gap-4">
              <DKpi icon="🟢" label="출근" value={dashStats?.present} loading={dashLoading} color="emerald" />
              <DKpi icon="🔴" label="결근" value={dashStats?.absent} loading={dashLoading} color="rose" />
              <DKpi icon="🟡" label="조기퇴근" value={dashStats?.earlyLeave} loading={dashLoading} color="amber" />
            </div>
          </div>

          {/* 운영 현황 */}
          <div>
            <p className="text-[10px] font-black text-indigo-300/50 uppercase tracking-widest mb-3">📊 운영 현황 (오늘)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DKpi icon="₱" label="매출" value={dashStats?.todayRevenue} loading={dashLoading} color="blue" currency />
              <DKpi icon="💸" label="비용" value={dashStats?.todayExpense} loading={dashLoading} color="orange" currency />
              <DKpi icon="📅" label="예약" value={dashStats?.todayBookings} loading={dashLoading} color="purple" />
              <DKpi icon="🚗" label="픽업 요청" value={dashStats?.pickupRequests} loading={dashLoading} color="cyan" />
            </div>
          </div>

          {/* 이번 주 신규·변동 */}
          <div>
            <p className="text-[10px] font-black text-indigo-300/50 uppercase tracking-widest mb-3">🆕 이번 주 신규·변동</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <DKpi icon="🙋" label="신규 손님" value={dashStats?.newGuests} loading={dashLoading} color="teal" />
              <DKpi icon="🏢" label="신규 업체" value={dashStats?.newCompanies} loading={dashLoading} color="indigo" />
              <DKpi icon="👨‍⚕️" label="신규 테라피스트" value={dashStats?.newTherapists} loading={dashLoading} color="violet" />
              <DKpi icon="👤" label="신규 직원" value={dashStats?.newStaff} loading={dashLoading} color="sky" />
              <DKpi icon="📦" label="지출 예정" value={dashStats?.plannedBudget} loading={dashLoading} color="slate" currency />
              <DKpi icon="🚪" label="퇴사자" value={dashStats?.resigned} loading={dashLoading} color="rose" />
            </div>
          </div>
        </div>
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

// ============================================================
// 📌 컴포넌트명: DKpi
// 📋 목적: 대시보드 KPI 단일 카드 렌더링
// 🔧 매개변수: icon, label, value, loading, color, currency
// 📅 작성일: 2026-06-02
// ============================================================
function DKpi({ icon, label, value, loading, color = 'indigo', currency }: {
  icon: string;
  label: string;
  value?: number;
  loading?: boolean;
  color?: string;
  currency?: boolean;
}) {
  // 색상별 border + text 클래스 매핑
  const c: Record<string, string> = {
    emerald: 'border-emerald-500/20 text-emerald-400',
    rose:    'border-rose-500/20 text-rose-400',
    amber:   'border-amber-500/20 text-amber-400',
    blue:    'border-blue-500/20 text-blue-400',
    orange:  'border-orange-500/20 text-orange-400',
    purple:  'border-purple-500/20 text-purple-400',
    cyan:    'border-cyan-500/20 text-cyan-400',
    teal:    'border-teal-500/20 text-teal-400',
    indigo:  'border-indigo-500/20 text-indigo-400',
    violet:  'border-violet-500/20 text-violet-400',
    sky:     'border-sky-500/20 text-sky-400',
    slate:   'border-slate-500/20 text-slate-400',
  };
  const cls = c[color] || c.indigo;

  // 표시할 값 결정: 로딩 중이면 '…', 없으면 '-', 통화면 ₱ 포맷, 일반 숫자
  const val = loading
    ? '…'
    : value === undefined
    ? '-'
    : currency
    ? '₱' + (value || 0).toLocaleString('en-PH', { maximumFractionDigits: 0 })
    : String(value);

  return (
    <div className={`bg-white/3 backdrop-blur-md border rounded-2xl p-5 flex flex-col gap-2 ${cls}`}>
      <span className="text-2xl">{icon}</span>
      <div className={`text-2xl font-black ${cls.split(' ')[1]}`}>{val}</div>
      <div className="text-[10px] font-bold text-indigo-300/50 uppercase tracking-widest leading-tight">{label}</div>
    </div>
  );
}
