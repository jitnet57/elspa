'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n';
import { SettlementReportTable, CompanySettlement, Company } from '@/components/SettlementReportTable';
import {
  getCompanySettlements,
  markSettlementAsSettled,
} from '@/lib/api/settlement-report-client';
import { getCompanies } from '@/lib/api/companies-client';

/**
 * ============================================================
 * 📌 페이지: Settlement Report Dashboard
 * 📋 목적: 업체 정산 현황 보고서 관리 페이지
 * 🔧 기능:
 *    - 정산 데이터 조회 및 표시
 *    - 월별·업체별·상태별 필터링
 *    - 정산 완료 처리 (상태 변경)
 *    - Excel 다운로드
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

export default function SettlementReportPage() {
  const t = useT();

  // 상태 관리
  const [settlements, setSettlements] = useState<CompanySettlement[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────
  // 데이터 로드
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 병렬 로드: 정산 데이터 + 업체 정보
        const [settlementData, companyData] = await Promise.all([
          getCompanySettlements({ limit: 1000 }),
          getCompanies(),
        ]);

        setSettlements(settlementData);
        setCompanies(companyData as Company[]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '데이터 로드 오류';
        setError(errorMessage);
        console.error('Failed to load settlement data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ─────────────────────────────────────────────────────
  // 정산 완료 처리
  // ─────────────────────────────────────────────────────
  const handleMarkSettled = async (settlementId: number, paymentMethod?: string) => {
    try {
      const updated = await markSettlementAsSettled(settlementId, {
        payment_date: new Date().toISOString().split('T')[0], // Today
        payment_method: (paymentMethod || 'bank_transfer') as
          | 'bank_transfer'
          | 'gcash'
          | 'cash'
          | 'check'
          | 'manual',
        paid_by: 'admin',
      });

      // UI 업데이트: 해당 정산의 상태를 변경
      setSettlements(prev =>
        prev.map(s => (s.id === settlementId ? updated : s))
      );

      // 성공 알림 표시
      alert(t('Settlement marked as settled successfully', '정산이 완료되었습니다'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '정산 완료 처리 실패';
      console.error('Failed to mark settlement:', err);
      alert(t(`Failed to mark settlement: ${errorMessage}`, `정산 완료 처리에 실패했습니다: ${errorMessage}`));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 sm:p-6 lg:p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-4 mb-2">
            <div className="text-2xl sm:text-3xl lg:text-4xl">📋</div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold">
                {t('Settlement Report Dashboard', '정산 보고서 대시보드')}
              </h1>
              <p className="text-green-100 text-xs sm:text-sm mt-1">
                {t(
                  'Monitor and manage company settlements with detailed financial tracking',
                  '업체 정산 현황을 상세하게 추적하고 관리합니다'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              <strong>{t('Error', '오류')}:</strong> {error}
            </p>
          </div>
        )}

        {/* 정산 보고서 테이블 컴포넌트 */}
        <SettlementReportTable
          settlements={settlements}
          companies={companies}
          onMarkSettled={handleMarkSettled}
          loading={loading}
        />

        {/* 도움말 섹션 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-blue-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {t('Help & Information', '도움말 및 정보')}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📊 {t('Column Meanings', '열 설명')}</h3>
              <ul className="space-y-1 text-xs">
                <li>
                  <strong>{t('Total Revenue', '총 매출')}:</strong> {t('Sum of all guest, credit, and waived revenue', '비회원·외상·제외 매출의 합계')}
                </li>
                <li>
                  <strong>{t('Settled', '정산완료')}:</strong> {t('Recovered amount after collection (guest + recovered credit)', '회수된 금액 (비회원+외상회수액)')}
                </li>
                <li>
                  <strong>{t('Pending', '대기중')}:</strong> {t('Total deductions (refunds, disputes, adjustments)', '차감액 (환불·분쟁·조정)')}
                </li>
                <li>
                  <strong>{t('Waived', '제외')}:</strong> {t('Revenue excluded from settlement (recovery rate 0%)', '정산 제외 매출')}
                </li>
                <li>
                  <strong>{t('Net Settlement', '순정산액')}:</strong> {t('Final payment amount (recovered - fee - deductions)', '최종 지급액')}
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🔄 {t('Status Workflow', '상태 흐름')}</h3>
              <ul className="space-y-1 text-xs">
                <li>
                  <strong>{t('Draft', '초안')}:</strong> {t('Auto-calculated, awaiting review', '자동 계산 완료, 검토 대기')}
                </li>
                <li>
                  <strong>{t('Approved', '승인됨')}:</strong> {t('Verified by admin, ready to settle', '관리자 승인, 정산 대기')}
                </li>
                <li>
                  <strong>{t('Settled', '정산 완료')}:</strong> {t('Payment processed', '지급 완료')}
                </li>
                <li>
                  <strong>{t('Confirmed', '확정')}:</strong> {t('Bank transfer verified', '은행 거래 확인됨')}
                </li>
                <li>
                  <strong>{t('Waived', '제외')}:</strong> {t('Excluded from settlement (dispute/writeoff)', '정산 제외 (분쟁/부도)')}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 요약 정보 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('Key Metrics', '주요 지표')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 font-semibold mb-1">
                {t('Total Settlements', '총 정산 건수')}
              </p>
              <p className="text-2xl font-bold text-blue-900">{settlements.length}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 font-semibold mb-1">
                {t('Completed', '완료된 건수')}
              </p>
              <p className="text-2xl font-bold text-green-900">
                {settlements.filter(s => s.status === 'settled' || s.status === 'confirmed').length}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-600 font-semibold mb-1">
                {t('Pending', '대기 중')}
              </p>
              <p className="text-2xl font-bold text-yellow-900">
                {settlements.filter(s => s.status === 'draft' || s.status === 'approved').length}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-600 font-semibold mb-1">
                {t('Gross Total', '총 매출액')}
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {new Intl.NumberFormat('en-PH', {
                  style: 'currency',
                  currency: 'PHP',
                  maximumFractionDigits: 0,
                }).format(settlements.reduce((sum, s) => sum + s.total_revenue, 0))}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
