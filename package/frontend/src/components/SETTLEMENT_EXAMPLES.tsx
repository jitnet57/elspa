/**
 * ============================================================
 * 📌 Settlement Report Component — 실제 사용 예제
 * 📋 목적: 다양한 통합 시나리오 및 커스터마이징 방법 제시
 * 🔧 예제:
 *    1. 기본 통합 (Default Integration)
 *    2. 필터 프리셋 (Preset Filters)
 *    3. 고급 커스텀 (Advanced Customization)
 *    4. 다중 뷰 (Multi-View Dashboard)
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

import { useState, useEffect } from 'react';
import { SettlementReportTable, CompanySettlement, Company } from './SettlementReportTable';
import {
  getCompanySettlements,
  markSettlementAsSettled,
  getSettlementSummary,
  getCompanySettlementHistory,
} from '@/lib/api/settlement-report-client';
import { getCompanies } from '@/lib/api/companies-client';

// ═══════════════════════════════════════════════════════════
// 예제 1: 기본 통합 (가장 간단한 형태)
// ═══════════════════════════════════════════════════════════

export function Example1_BasicIntegration() {
  const [settlements, setSettlements] = useState<CompanySettlement[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, c] = await Promise.all([
          getCompanySettlements(),
          getCompanies(),
        ]);
        setSettlements(s);
        setCompanies(c as Company[]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleMarkSettled = async (id: number, method?: string) => {
    const updated = await markSettlementAsSettled(id, {
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: (method || 'bank_transfer') as any,
      paid_by: 'admin',
    });
    setSettlements(prev => prev.map(s => s.id === id ? updated : s));
  };

  return (
    <SettlementReportTable
      settlements={settlements}
      companies={companies}
      onMarkSettled={handleMarkSettled}
      loading={loading}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// 예제 2: 필터 프리셋 (특정 월, 특정 업체 기본 설정)
// ═══════════════════════════════════════════════════════════

export function Example2_FilterPresets() {
  const [settlements, setSettlements] = useState<CompanySettlement[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [year, month] = selectedMonth.split('-').map(Number);
        const s = await getCompanySettlements({
          year,
          month,
          company_id: selectedCompanyId || undefined,
          status: 'draft', // draft 상태만 필터
        });
        setSettlements(s);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedMonth, selectedCompanyId]);

  useEffect(() => {
    getCompanies().then(c => setCompanies(c as Company[]));
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="block font-semibold mb-2">Month Filter:</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="px-3 py-2 border rounded"
        />

        <label className="block font-semibold mt-4 mb-2">Company Filter:</label>
        <select
          value={selectedCompanyId || ''}
          onChange={e => setSelectedCompanyId(e.target.value ? parseInt(e.target.value) : null)}
          className="px-3 py-2 border rounded w-full"
        >
          <option value="">All Companies</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <SettlementReportTable
        settlements={settlements}
        companies={companies}
        loading={loading}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 예제 3: 고급 커스텀 (캐싱, 배치 처리, 에러 처리)
// ═══════════════════════════════════════════════════════════

export function Example3_AdvancedCustomization() {
  const [settlements, setSettlements] = useState<CompanySettlement[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);

  // 캐시: 마지막 로드 시간
  const [lastFetch, setLastFetch] = useState<number>(0);
  const CACHE_TTL = 5 * 60 * 1000; // 5분

  useEffect(() => {
    const load = async () => {
      // 캐시 체크: 5분 이내면 스킵
      if (Date.now() - lastFetch < CACHE_TTL) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [s, c] = await Promise.all([
          getCompanySettlements({ limit: 500 }),
          getCompanies(),
        ]);

        setSettlements(s);
        setCompanies(c as Company[]);
        setLastFetch(Date.now());
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load';
        setError(msg);
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [lastFetch]);

  // 개별 정산 완료
  const handleMarkSettled = async (id: number, method?: string) => {
    try {
      const updated = await markSettlementAsSettled(id, {
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: (method || 'bank_transfer') as any,
        paid_by: 'admin',
      });
      setSettlements(prev => prev.map(s => s.id === id ? updated : s));
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // 선택된 항목 일괄 처리
  const handleBatchProcess = async () => {
    if (selectedIds.length === 0) {
      alert('Please select settlements');
      return;
    }

    if (!window.confirm(`Process ${selectedIds.length} settlements?`)) {
      return;
    }

    setProcessing(true);
    try {
      const { default: settlement } = await import('@/lib/api/settlement-report-client');
      const result = await settlement.batchMarkSettled(
        selectedIds,
        new Date().toISOString().split('T')[0],
        'bank_transfer'
      );

      alert(
        `✅ Processed: ${result.succeeded}/${result.processed}\n` +
        `Failed: ${result.failed}`
      );

      // 데이터 새로고침
      setLastFetch(0);
      setSelectedIds([]);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Batch failed'}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setLastFetch(0)}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow flex gap-2">
        <input
          type="text"
          placeholder={`Select ${selectedIds.length} settlements`}
          readOnly
          className="flex-1 px-3 py-2 border rounded bg-gray-50"
        />
        <button
          onClick={handleBatchProcess}
          disabled={selectedIds.length === 0 || processing}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {processing ? 'Processing...' : 'Process All'}
        </button>
        <button
          onClick={() => setLastFetch(0)}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          Refresh
        </button>
      </div>

      <SettlementReportTable
        settlements={settlements}
        companies={companies}
        onMarkSettled={handleMarkSettled}
        loading={loading}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 예제 4: 다중 뷰 대시보드 (현재월, 이전월, 업체별 요약)
// ═══════════════════════════════════════════════════════════

export function Example4_MultiViewDashboard() {
  const [currentMonth, setCurrentMonth] = useState<CompanySettlement[]>([]);
  const [previousMonth, setPreviousMonth] = useState<CompanySettlement[]>([]);
  const [selectedCompanyHistory, setSelectedCompanyHistory] = useState<CompanySettlement[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'previous' | 'history'>('current');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  const getCurrentMonth = (): [number, number] => {
    const now = new Date();
    return [now.getFullYear(), now.getMonth() + 1];
  };

  const getPreviousMonth = (): [number, number] => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return [now.getFullYear(), now.getMonth() + 1];
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [currYear, currMonth] = getCurrentMonth();
        const [prevYear, prevMonth] = getPreviousMonth();

        const [curr, prev, comp] = await Promise.all([
          getCompanySettlements({ year: currYear, month: currMonth }),
          getCompanySettlements({ year: prevYear, month: prevMonth }),
          getCompanies(),
        ]);

        setCurrentMonth(curr);
        setPreviousMonth(prev);
        setCompanies(comp as Company[]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // 회사 선택 시 이력 로드
  useEffect(() => {
    if (!selectedCompanyId) return;

    const load = async () => {
      try {
        const history = await getCompanySettlementHistory(selectedCompanyId, 12);
        setSelectedCompanyHistory(history);
      } catch (err) {
        console.error('History load error:', err);
      }
    };

    load();
  }, [selectedCompanyId]);

  const handleMarkSettled = async (id: number, method?: string) => {
    const updated = await markSettlementAsSettled(id, {
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: (method || 'bank_transfer') as any,
      paid_by: 'admin',
    });

    // 모든 뷰 업데이트
    setCurrentMonth(prev => prev.map(s => s.id === id ? updated : s));
    setPreviousMonth(prev => prev.map(s => s.id === id ? updated : s));
    setSelectedCompanyHistory(prev => prev.map(s => s.id === id ? updated : s));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2 rounded ${
              activeTab === 'current'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Current Month
          </button>
          <button
            onClick={() => setActiveTab('previous')}
            className={`px-4 py-2 rounded ${
              activeTab === 'previous'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Previous Month
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Company History
          </button>
        </div>

        {activeTab === 'history' && (
          <div className="mb-4">
            <label className="block font-semibold mb-2">Select Company:</label>
            <select
              value={selectedCompanyId || ''}
              onChange={e => setSelectedCompanyId(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border rounded w-full"
            >
              <option value="">Select a company...</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeTab === 'current' && (
        <SettlementReportTable
          settlements={currentMonth}
          companies={companies}
          onMarkSettled={handleMarkSettled}
          loading={loading}
        />
      )}

      {activeTab === 'previous' && (
        <SettlementReportTable
          settlements={previousMonth}
          companies={companies}
          onMarkSettled={handleMarkSettled}
          loading={loading}
        />
      )}

      {activeTab === 'history' && selectedCompanyId && (
        <SettlementReportTable
          settlements={selectedCompanyHistory}
          companies={companies}
          onMarkSettled={handleMarkSettled}
          loading={loading}
        />
      )}

      {activeTab === 'history' && !selectedCompanyId && (
        <div className="p-12 text-center text-gray-600">
          Please select a company to view history
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Export default
// ═══════════════════════════════════════════════════════════

export const Examples = {
  BasicIntegration: Example1_BasicIntegration,
  FilterPresets: Example2_FilterPresets,
  AdvancedCustomization: Example3_AdvancedCustomization,
  MultiViewDashboard: Example4_MultiViewDashboard,
};

export default Examples;
