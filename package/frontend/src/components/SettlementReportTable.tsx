'use client';

import { useState, useMemo } from 'react';
import { useT } from '@/lib/i18n';
import * as XLSX from 'xlsx';

/**
 * ============================================================
 * 📌 컴포넌트: SettlementReportTable
 * 📋 목적: 업체 정산 현황 보고서 테이블 + 필터링 + Excel 다운로드
 * 🔧 매개변수:
 *    - settlements: CompanySettlement[] (백엔드 정산 데이터)
 *    - companies: Company[] (업체 정보)
 *    - onMarkSettled: (settlementId: number) => Promise<void> (정산 완료 처리)
 * 📤 반환값: React Component (TSX)
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

export interface CompanySettlement {
  id: number;
  company_id: number;
  settlement_period_year: number;
  settlement_period_month: number;
  total_revenue: number;          // 총 매출액
  guest_revenue: number;          // 비회원 매출
  credit_revenue: number;         // 외상 매출
  waived_revenue: number;         // 제외 매출
  recovery_rate: number;          // 외상 회수율 (%)
  recovered_amount: number;       // 실제 회수액
  platform_fee_rate: number;      // 플랫폼 수수료율 (%)
  platform_fee: number;           // 플랫폼 수수료
  total_deductions: number;       // 총 차감액 (환불+분쟁+기타)
  net_settlement: number;         // 순정산액 (최종 지급액)
  status: 'draft' | 'approved' | 'settled' | 'rejected' | 'confirmed' | 'pending' | 'waived';
  settlement_date: string | null; // 정산 완료일 (YYYY-MM-DD)
  payment_date: string | null;    // 실제 지급일 (YYYY-MM-DD)
  payment_method: string | null;  // 지급 방법 (bank_transfer, gcash, cash, check, manual)
  notes: string | null;           // 일반 메모
  dispute_notes: string | null;   // 분쟁 관련 메모
  created_at: string;
  updated_at: string;
  transaction_count?: number;
}

export interface Company {
  id: number;
  name: string;
  representative?: string;
  phone?: string;
  settlement_day?: number;
}

interface SettlementReportTableProps {
  settlements: CompanySettlement[];
  companies: Company[];
  onMarkSettled?: (settlementId: number, paymentMethod?: string) => Promise<void>;
  loading?: boolean;
}

type SortField = 'company_name' | 'total_revenue' | 'net_settlement' | 'status' | 'settlement_date';
type SortOrder = 'asc' | 'desc';

export function SettlementReportTable({
  settlements = [],
  companies = [],
  onMarkSettled,
  loading = false,
}: SettlementReportTableProps) {
  const t = useT();

  // ─────────────────────────────────────────────────────
  // 필터 상태
  // ─────────────────────────────────────────────────────
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterCompanyId, setFilterCompanyId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('settlement_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // ─────────────────────────────────────────────────────
  // 정산 완료 처리 중 상태
  // ─────────────────────────────────────────────────────
  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<Record<number, string>>({});

  // ─────────────────────────────────────────────────────
  // 필터링 및 정렬
  // ─────────────────────────────────────────────────────
  const filteredSettlements = useMemo(() => {
    let filtered = settlements.filter(s => {
      // 월 필터 (YYYY-MM)
      if (filterMonth) {
        const period = `${s.settlement_period_year}-${String(s.settlement_period_month).padStart(2, '0')}`;
        if (period !== filterMonth) return false;
      }

      // 업체 필터
      if (filterCompanyId && s.company_id !== filterCompanyId) return false;

      // 상태 필터
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;

      return true;
    });

    // 정렬
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'company_name':
          const companyA = companies.find(c => c.id === a.company_id)?.name || '';
          const companyB = companies.find(c => c.id === b.company_id)?.name || '';
          aVal = companyA;
          bVal = companyB;
          break;
        case 'total_revenue':
          aVal = a.total_revenue;
          bVal = b.total_revenue;
          break;
        case 'net_settlement':
          aVal = a.net_settlement;
          bVal = b.net_settlement;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'settlement_date':
          aVal = a.settlement_date || '9999-12-31';
          bVal = b.settlement_date || '9999-12-31';
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [settlements, filterMonth, filterCompanyId, filterStatus, sortField, sortOrder, companies]);

  // ─────────────────────────────────────────────────────
  // 요약 통계
  // ─────────────────────────────────────────────────────
  const summary = useMemo(() => {
    return {
      totalCount: filteredSettlements.length,
      settledCount: filteredSettlements.filter(s => s.status === 'settled' || s.status === 'confirmed' || s.status === 'pending').length,
      pendingCount: filteredSettlements.filter(s => s.status === 'draft' || s.status === 'approved').length,
      waivedCount: filteredSettlements.filter(s => s.status === 'waived').length,
      grossTotal: filteredSettlements.reduce((sum, s) => sum + s.total_revenue, 0),
      actualCollected: filteredSettlements.reduce((sum, s) => sum + s.recovered_amount, 0),
      totalDeductions: filteredSettlements.reduce((sum, s) => sum + s.total_deductions, 0),
      netTotal: filteredSettlements.reduce((sum, s) => sum + s.net_settlement, 0),
    };
  }, [filteredSettlements]);

  // ─────────────────────────────────────────────────────
  // Excel 다운로드
  // ─────────────────────────────────────────────────────
  const handleExportExcel = () => {
    const data = filteredSettlements.map(s => ({
      '업체명': companies.find(c => c.id === s.company_id)?.name || `Company ${s.company_id}`,
      '정산월': `${s.settlement_period_year}-${String(s.settlement_period_month).padStart(2, '0')}`,
      '총 매출': s.total_revenue,
      '비회원 매출': s.guest_revenue,
      '외상 매출': s.credit_revenue,
      '제외 매출': s.waived_revenue,
      '외상 회수율 (%)': s.recovery_rate,
      '실제 회수액': s.recovered_amount,
      '플랫폼 수수료율 (%)': s.platform_fee_rate,
      '플랫폼 수수료': s.platform_fee,
      '총 차감액': s.total_deductions,
      '순정산액': s.net_settlement,
      '상태': t(s.status, getStatusLabel(s.status)),
      '정산 완료일': s.settlement_date || '-',
      '지급일': s.payment_date || '-',
      '지급 방법': s.payment_method || '-',
      '비고': s.notes || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Settlement Report');

    // 열 너비 자동 설정
    const colWidths = [
      { wch: 15 },  // 업체명
      { wch: 12 },  // 정산월
      { wch: 12 },  // 총 매출
      { wch: 12 },  // 비회원 매출
      { wch: 12 },  // 외상 매출
      { wch: 12 },  // 제외 매출
      { wch: 14 },  // 외상 회수율
      { wch: 12 },  // 실제 회수액
      { wch: 16 },  // 플랫폼 수수료율
      { wch: 14 },  // 플랫폼 수수료
      { wch: 12 },  // 총 차감액
      { wch: 12 },  // 순정산액
      { wch: 12 },  // 상태
      { wch: 14 },  // 정산 완료일
      { wch: 12 },  // 지급일
      { wch: 14 },  // 지급 방법
      { wch: 20 },  // 비고
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `settlement_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ─────────────────────────────────────────────────────
  // 정산 완료 처리
  // ─────────────────────────────────────────────────────
  const handleMarkSettled = async (settlementId: number) => {
    if (!onMarkSettled || settlingId) return;

    const settlement = settlements.find(s => s.id === settlementId);
    if (!settlement) return;

    const paymentMethod = selectedPaymentMethod[settlementId] || 'bank_transfer';

    try {
      setSettlingId(settlementId);
      await onMarkSettled(settlementId, paymentMethod);
      // 상태 업데이트는 부모에서 처리
    } catch (error) {
      console.error('Failed to mark settlement as settled:', error);
      alert(t('Failed to update settlement status', '정산 상태 업데이트에 실패했습니다'));
    } finally {
      setSettlingId(null);
    }
  };

  // ─────────────────────────────────────────────────────
  // 유틸리티 함수
  // ─────────────────────────────────────────────────────
  const getCompanyName = (companyId: number): string => {
    return companies.find(c => c.id === companyId)?.name || `Company ${companyId}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft':
      case 'approved':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'settled':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
      case 'waived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      draft: t('Draft', '초안'),
      approved: t('Approved', '승인됨'),
      settled: t('Settled', '정산 완료'),
      confirmed: t('Confirmed', '확정'),
      rejected: t('Rejected', '거부됨'),
      pending: t('Pending', '대기'),
      waived: t('Waived', '제외'),
    };
    return labels[status] || status;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getUniquePeriods = (): string[] => {
    const periods = settlements.map(s =>
      `${s.settlement_period_year}-${String(s.settlement_period_month).padStart(2, '0')}`
    );
    return Array.from(new Set(periods)).sort().reverse();
  };

  return (
    <div className="w-full space-y-4">
      {/* ═══════════════════════════════════════════════════════════
          필터 패널
          ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('Filters', '필터')}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 정산월 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('Settlement Period', '정산 월')}
            </label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">{t('All Periods', '전체 기간')}</option>
              {getUniquePeriods().map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>

          {/* 업체 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('Company', '업체')}
            </label>
            <select
              value={filterCompanyId || ''}
              onChange={(e) => setFilterCompanyId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">{t('All Companies', '전체 업체')}</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>

          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('Status', '상태')}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">{t('All Status', '전체 상태')}</option>
              <option value="draft">{t('Draft', '초안')}</option>
              <option value="approved">{t('Approved', '승인됨')}</option>
              <option value="pending">{t('Pending', '대기')}</option>
              <option value="settled">{t('Settled', '정산 완료')}</option>
              <option value="confirmed">{t('Confirmed', '확정')}</option>
              <option value="rejected">{t('Rejected', '거부됨')}</option>
              <option value="waived">{t('Waived', '제외')}</option>
            </select>
          </div>

          {/* Excel 다운로드 */}
          <div className="flex items-end">
            <button
              onClick={handleExportExcel}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>📥</span>
              <span>{t('Download Excel', 'Excel 다운로드')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          요약 통계
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 총 매출 vs 실제 회수액 */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4">
          <p className="text-xs text-blue-600 mb-1">{t('Gross Settlement Amount', '총 정산액')}</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(summary.grossTotal)}</p>
          <p className="text-xs text-blue-700 mt-2">{summary.totalCount} {t('records', '건')}</p>
        </div>

        {/* 실제 회수액 */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-4">
          <p className="text-xs text-green-600 mb-1">{t('Actual Collected', '실제 회수액')}</p>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(summary.actualCollected)}</p>
          <p className="text-xs text-green-700 mt-2">
            {((summary.actualCollected / summary.grossTotal) * 100).toFixed(1)}% {t('recovery', '회수율')}
          </p>
        </div>

        {/* 차감액 */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 p-4">
          <p className="text-xs text-orange-600 mb-1">{t('Total Deductions', '총 차감액')}</p>
          <p className="text-2xl font-bold text-orange-900">{formatCurrency(summary.totalDeductions)}</p>
          <p className="text-xs text-orange-700 mt-2">{summary.pendingCount} {t('pending', '대기 중')}</p>
        </div>

        {/* 순정산액 */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-4">
          <p className="text-xs text-purple-600 mb-1">{t('Net Settlement Amount', '순정산액')}</p>
          <p className="text-2xl font-bold text-purple-900">{formatCurrency(summary.netTotal)}</p>
          <p className="text-xs text-purple-700 mt-2">
            {summary.settledCount} {t('settled', '정산 완료')}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          정산 테이블
          ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="text-gray-600 mt-4">{t('Loading settlement data...', '정산 데이터를 불러오는 중...')}</p>
          </div>
        ) : filteredSettlements.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            {t('No settlement records found', '정산 기록이 없습니다')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 cursor-pointer hover:bg-gray-100" onClick={() => {
                    if (sortField === 'company_name') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('company_name');
                      setSortOrder('asc');
                    }
                  }}>
                    {t('Company', '업체')} {sortField === 'company_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900 cursor-pointer hover:bg-gray-100" onClick={() => {
                    if (sortField === 'settlement_date') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('settlement_date');
                      setSortOrder('desc');
                    }
                  }}>
                    {t('Period', '정산월')} {sortField === 'settlement_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900 cursor-pointer hover:bg-gray-100" onClick={() => {
                    if (sortField === 'total_revenue') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('total_revenue');
                      setSortOrder('desc');
                    }
                  }}>
                    {t('Total Revenue', '총 매출')} {sortField === 'total_revenue' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">
                    {t('Settled', '정산완료')}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">
                    {t('Pending', '대기중')}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">
                    {t('Waived', '제외')}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900 cursor-pointer hover:bg-gray-100" onClick={() => {
                    if (sortField === 'net_settlement') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('net_settlement');
                      setSortOrder('desc');
                    }
                  }}>
                    {t('Net Settlement', '순정산액')} {sortField === 'net_settlement' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900 cursor-pointer hover:bg-gray-100" onClick={() => {
                    if (sortField === 'status') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('status');
                      setSortOrder('asc');
                    }
                  }}>
                    {t('Status', '상태')} {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">
                    {t('Actions', '작업')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSettlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {getCompanyName(settlement.company_id)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {settlement.settlement_period_year}-{String(settlement.settlement_period_month).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(settlement.total_revenue)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                        {formatCurrency(settlement.recovered_amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                        {formatCurrency(settlement.total_deductions)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                        {formatCurrency(settlement.waived_revenue)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">
                      {formatCurrency(settlement.net_settlement)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(settlement.status)}`}>
                        {getStatusLabel(settlement.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(settlement.status === 'draft' || settlement.status === 'approved') && onMarkSettled ? (
                        <div className="flex items-center justify-center gap-1">
                          <select
                            value={selectedPaymentMethod[settlement.id] || 'bank_transfer'}
                            onChange={(e) => setSelectedPaymentMethod({
                              ...selectedPaymentMethod,
                              [settlement.id]: e.target.value
                            })}
                            className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                          >
                            <option value="bank_transfer">{t('Bank Transfer', '계좌이체')}</option>
                            <option value="gcash">GCash</option>
                            <option value="cash">{t('Cash', '현금')}</option>
                            <option value="check">{t('Check', '수표')}</option>
                          </select>
                          <button
                            onClick={() => handleMarkSettled(settlement.id)}
                            disabled={settlingId === settlement.id}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs font-semibold rounded transition-colors"
                          >
                            {settlingId === settlement.id ? '...' : '✓'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">{t('Processed', '처리됨')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          푸터 - 요약 정보
          ═══════════════════════════════════════════════════════════ */}
      {filteredSettlements.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('Summary', '요약')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('Total Records', '총 기록 수')}</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('Settled / Pending / Waived', '정산완료 / 대기 / 제외')}</p>
              <p className="text-lg font-semibold text-gray-900">
                <span className="text-blue-600">{summary.settledCount}</span> /
                <span className="text-yellow-600 ml-2">{summary.pendingCount}</span> /
                <span className="text-red-600 ml-2">{summary.waivedCount}</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('Gross vs Actual vs Net', '총매출 / 회수액 / 순액')}</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(summary.grossTotal)} / {formatCurrency(summary.actualCollected)} / {formatCurrency(summary.netTotal)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
