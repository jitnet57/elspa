'use client';

import { useState } from 'react';
import { getTranslations } from '@/lib/translations';
import { useLanguage } from '@/lib/LanguageContext';

// ============================================================
// 📌 컴포넌트명: PaymentFromSelect
// 📋 목적: 정산 수수료 기반 지급 방식(비회원/외상/제외) 선택 및 정산 영향도 시각화
// 🔧 매개변수:
//   - bookingId: 예약 ID
//   - currentPaymentFrom: 현재 선택된 지급 방식 ("guest" | "credit" | "waived")
//   - onPaymentFromChange: 지급 방식 변경 콜백
//   - settlementImpact: 정산액 계산 영향도 데이터
// 📤 반환값: JSX.Element
// 📅 작성일: 2026-06-02
// 📌 비즈니스 로직:
//    - GUEST(비회원): 회수율 100% → 플랫폼 수수료 25% → 최종 정산액 높음
//    - CREDIT(외상): 회수율 변동(기본 80%) → 플랫폼 수수료 25% → 회수 위험 고려
//    - WAIVED(제외): 회수율 0% → 플랫폼 수수료 0% → 정산 제외 (프로모션/분쟁)
// ============================================================

export interface PaymentOption {
  id: 'guest' | 'credit' | 'waived';
  labelKey: string;
  descriptionKey: string;
  badgeColor: 'blue' | 'amber' | 'red';
  recoveryRate: number;         // 기본 회수율 (%)
  platformFeeRate: number;      // 플랫폼 수수료율 (%)
}

export interface SettlementImpact {
  servicePrice: number;          // 서비스 가격 (원본)
  recoveryRate: number;          // 현재 회수율 (%)
  recoveredAmount: number;       // 실제 회수액
  platformFeeRate: number;       // 플랫폼 수수료율 (%)
  platformFee: number;           // 플랫폼 수수료액
  netSettlement: number;         // 최종 정산액
  settlementStatus: string;      // draft, approved, settled, confirmed
  settlementDate: string;        // 예상 정산일
  notes: string;                 // 추가 설명
}

export interface PaymentFromSelectProps {
  bookingId: number;
  currentPaymentFrom: 'guest' | 'credit' | 'waived';
  onPaymentFromChange: (paymentFrom: 'guest' | 'credit' | 'waived') => void;
  settlementImpact: SettlementImpact;
  isLoading?: boolean;
  disabled?: boolean;
}

// ─── 지급 방식 옵션 정의 ────────────────────────────────────────────────
const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'guest',
    labelKey: 'payment_from_guest_label',              // "비회원 (즉시 정산)"
    descriptionKey: 'payment_from_guest_desc',         // "비회원 현장 결제 — 회수율 100%"
    badgeColor: 'blue',
    recoveryRate: 100,
    platformFeeRate: 25,
  },
  {
    id: 'credit',
    labelKey: 'payment_from_credit_label',             // "외상 (유보 정산)"
    descriptionKey: 'payment_from_credit_desc',        // "기업 신용 결제 — 회수율 변동"
    badgeColor: 'amber',
    recoveryRate: 80,    // 기본값, 실제는 관리자가 갱신
    platformFeeRate: 25,
  },
  {
    id: 'waived',
    labelKey: 'payment_from_waived_label',             // "제외 (정산 제외)"
    descriptionKey: 'payment_from_waived_desc',        // "프로모션/분쟁 — 회수율 0%"
    badgeColor: 'red',
    recoveryRate: 0,
    platformFeeRate: 0,
  },
];

export const PaymentFromSelect = ({
  bookingId,
  currentPaymentFrom,
  onPaymentFromChange,
  settlementImpact,
  isLoading = false,
  disabled = false,
}: PaymentFromSelectProps) => {
  const t = getTranslations();
  const { language } = useLanguage();
  const [selectedPaymentFrom, setSelectedPaymentFrom] = useState<'guest' | 'credit' | 'waived'>(currentPaymentFrom);
  const [showDetails, setShowDetails] = useState(false);

  // ─── 지급 방식 변경 핸들러 ────────────────────────────────────────────────
  const handlePaymentFromChange = (paymentFrom: 'guest' | 'credit' | 'waived') => {
    if (disabled || isLoading) return;

    setSelectedPaymentFrom(paymentFrom);
    onPaymentFromChange(paymentFrom);
  };

  // ─── 날짜 포맷팅 (국가/언어별) ────────────────────────────────────────
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return language === 'ko'
      ? date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
      : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // ─── 통화 포맷팅 (PHP) ────────────────────────────────────────────────
  const formatPHP = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // ─── 백분율 포맷팅 ────────────────────────────────────────────────────
  const formatPercent = (value: number): string => {
    return `${value.toFixed(0)}%`;
  };

  // ─── 뱃지 컬러 매핑 ────────────────────────────────────────────────────
  const getBadgeStyles = (color: 'blue' | 'amber' | 'red') => {
    const styles = {
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      amber: 'bg-amber-100 text-amber-800 border-amber-300',
      red: 'bg-red-100 text-red-800 border-red-300',
    };
    return styles[color];
  };

  // ─── 라디오 버튼 스타일 (선택 상태) ────────────────────────────────────
  const getRadioStyles = (isSelected: boolean, isDisabled: boolean) => {
    if (isDisabled) {
      return 'opacity-60 cursor-not-allowed';
    }
    return isSelected
      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-300'
      : 'border-gray-300 bg-white hover:border-blue-400';
  };

  // ─── 정산액 바 시각화 (100% 기준) ────────────────────────────────────────
  const getSettlementBarWidth = (): string => {
    if (settlementImpact.servicePrice === 0) return '0%';
    const percentage = (settlementImpact.netSettlement / settlementImpact.servicePrice) * 100;
    return `${Math.min(Math.max(percentage, 0), 100)}%`;
  };

  // ─── 상태 배지 스타일 ────────────────────────────────────────────────
  const getStatusBadgeStyles = () => {
    const status = settlementImpact.settlementStatus;
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      approved: 'bg-blue-100 text-blue-800',
      settled: 'bg-emerald-100 text-emerald-800',
      confirmed: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-sm">
      {/* ═══ 헤더 ═══════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span>💳</span>
          {t('payment_from_title') || '지급 방식 (정산 분류)'}
        </h2>
        <p className="text-sm text-gray-600">
          {t('payment_from_subtitle') || `예약 ID: ${bookingId}`}
        </p>
      </div>

      {/* ═══ 라디오 옵션 그룹 ═════════════════════════════════════════════ */}
      <div className="space-y-4 mb-8">
        {PAYMENT_OPTIONS.map((option) => {
          const isSelected = selectedPaymentFrom === option.id;
          const isDisabled = disabled || isLoading;

          return (
            <label
              key={option.id}
              className={`
                relative flex items-start p-4 rounded-lg border-2 cursor-pointer
                transition-all duration-200
                ${getRadioStyles(isSelected, isDisabled)}
              `}
            >
              {/* 라디오 버튼 */}
              <input
                type="radio"
                name="payment-from"
                value={option.id}
                checked={isSelected}
                onChange={() => handlePaymentFromChange(option.id)}
                disabled={isDisabled}
                className="w-5 h-5 mt-1 cursor-pointer flex-shrink-0 accent-blue-600"
              />

              {/* 라벨 & 설명 */}
              <div className="ml-4 flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-800">
                    {t(option.labelKey) || option.labelKey}
                  </span>
                  <span
                    className={`
                      inline-block px-2 py-1 text-xs font-semibold rounded
                      border ${getBadgeStyles(option.badgeColor)}
                    `}
                  >
                    {t(`payment_badge_${option.id}`) || option.id.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {t(option.descriptionKey) || option.descriptionKey}
                </p>

                {/* 회수율 & 수수료 미리보기 */}
                <div className="flex gap-4 mt-2 text-xs text-gray-700">
                  <span className="flex items-center gap-1">
                    <span className="text-blue-600 font-semibold">회수율</span>
                    {formatPercent(option.recoveryRate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-purple-600 font-semibold">수수료</span>
                    {formatPercent(option.platformFeeRate)}
                  </span>
                </div>
              </div>

              {/* 선택 체크마크 */}
              {isSelected && (
                <div className="absolute top-4 right-4 text-emerald-600">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </label>
          );
        })}
      </div>

      {/* ═══ 정산액 영향도 요약 ═════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>📊</span>
            {t('payment_settlement_impact') || '정산액 영향도'}
          </h3>
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

        {/* 주요 금액 (항상 표시) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-1">
              {t('payment_service_price') || '서비스 가격'}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {formatPHP(settlementImpact.servicePrice)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
            <p className="text-xs font-semibold text-blue-800 mb-1">
              {t('payment_recovery_rate') || '회수율'}
            </p>
            <p className="text-lg font-bold text-blue-900">
              {formatPercent(settlementImpact.recoveryRate)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
            <p className="text-xs font-semibold text-purple-800 mb-1">
              {t('payment_platform_fee') || '플랫폼 수수료'}
            </p>
            <p className="text-lg font-bold text-purple-900">
              {formatPercent(settlementImpact.platformFeeRate)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 border border-emerald-200">
            <p className="text-xs font-semibold text-emerald-800 mb-1">
              {t('payment_net_settlement') || '최종 정산액'}
            </p>
            <p className="text-lg font-bold text-emerald-900">
              {formatPHP(settlementImpact.netSettlement)}
            </p>
          </div>
        </div>

        {/* 정산액 비율 바 */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold text-gray-700">
              {t('payment_settlement_ratio') || '정산액 비율'}
            </p>
            <p className="text-xs font-bold text-gray-700">
              {formatPercent((settlementImpact.netSettlement / settlementImpact.servicePrice) * 100)}
            </p>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
              style={{ width: getSettlementBarWidth() }}
            />
          </div>
        </div>

        {/* 상세 정보 (펼침) */}
        {showDetails && (
          <div className="pt-4 border-t border-gray-200 space-y-3 animate-in fade-in duration-200">
            {/* 회수액 계산 */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs font-semibold text-blue-800 mb-1">
                {t('payment_recovered_amount') || '회수액 계산'}
              </p>
              <p className="text-sm text-blue-900">
                {formatPHP(settlementImpact.servicePrice)} × {formatPercent(settlementImpact.recoveryRate)} = {formatPHP(settlementImpact.recoveredAmount)}
              </p>
            </div>

            {/* 수수료 계산 */}
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <p className="text-xs font-semibold text-purple-800 mb-1">
                {t('payment_fee_calculation') || '수수료 계산'}
              </p>
              <p className="text-sm text-purple-900">
                {formatPHP(settlementImpact.recoveredAmount)} × {formatPercent(settlementImpact.platformFeeRate)} = {formatPHP(settlementImpact.platformFee)}
              </p>
            </div>

            {/* 최종 정산 계산 */}
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-800 mb-1">
                {t('payment_final_calculation') || '최종 정산액'}
              </p>
              <p className="text-sm text-emerald-900">
                {formatPHP(settlementImpact.recoveredAmount)} - {formatPHP(settlementImpact.platformFee)} = {formatPHP(settlementImpact.netSettlement)}
              </p>
            </div>

            {/* 정산 상태 & 날짜 */}
            <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-200">
              <div>
                <span className="text-gray-600">{t('payment_settlement_status') || '정산 상태'}:</span>
                <span
                  className={`
                    inline-block ml-2 px-2 py-1 text-xs font-semibold rounded
                    ${getStatusBadgeStyles()}
                  `}
                >
                  {t(`payment_status_${settlementImpact.settlementStatus}`) || settlementImpact.settlementStatus}
                </span>
              </div>
              <div>
                <span className="text-gray-600">{t('payment_settlement_date') || '정산예정일'}:</span>
                <span className="font-semibold text-gray-800 ml-2">
                  {formatDate(settlementImpact.settlementDate)}
                </span>
              </div>
            </div>

            {/* 추가 설명 */}
            {settlementImpact.notes && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  {t('payment_notes') || '추가 설명'}
                </p>
                <p className="text-sm text-gray-700">
                  {settlementImpact.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ 안내 메시지 ═════════════════════════════════════════════════ */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-sm text-blue-800">
        <p className="font-semibold mb-1">💡 {t('payment_important_note') || '중요 안내'}</p>
        <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
          <li>
            {t('payment_note_guest') || '비회원: 현장 현금 결제 → 회수율 100%'}
          </li>
          <li>
            {t('payment_note_credit') || '외상: 기업 신용 → 회수율 변동 (관리자 승인 필요)'}
          </li>
          <li>
            {t('payment_note_waived') || '제외: 프로모션/분쟁 → 정산 제외'}
          </li>
          <li>
            {t('payment_note_settlement') || '정산 기한: 매월 25일'}
          </li>
        </ul>
      </div>

      {/* ═══ 로딩 상태 오버레이 ═════════════════════════════════════════ */}
      {isLoading && (
        <div className="absolute inset-0 rounded-lg bg-white/60 flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-gray-600">
              {t('payment_processing') || '처리 중...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
  onChange,
  allowanceBalance = 0,
  salaryBalance = 0,
  currency = '₱',
  disabled = false,
}: PaymentFromSelectProps) {
  const tr = useT();
  const [isOpen, setIsOpen] = useState(false);

  const balances: Record<PaymentFrom, number> = {
    allowance: allowanceBalance,
    salary: salaryBalance,
    other: 0,
  };

  const config = PAYMENT_FROM_CONFIG[value];

  return (
    <div className="relative w-full">
      {/* ===== Trigger Button ===== */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2
          px-3 py-2 rounded-lg border text-sm font-medium
          transition-all duration-200
          ${
            disabled
              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400'
          }
          ${isOpen ? 'ring-2 ring-blue-400 border-blue-400' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <div className="text-left">
            <p className="font-semibold text-xs text-gray-600">
              {tr(value === 'allowance' ? 'Allowance' : value === 'salary' ? 'Salary' : 'Other',
                   value === 'allowance' ? '수당' : value === 'salary' ? '급여' : '기타')}
            </p>
            <p className="text-xs text-gray-500">{config.description}</p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* ===== Dropdown Menu ===== */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {(Object.keys(PAYMENT_FROM_CONFIG) as PaymentFrom[]).map((option) => {
            const optConfig = PAYMENT_FROM_CONFIG[option];
            const balance = balances[option];
            const isSelected = value === option;

            return (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between gap-3
                  px-4 py-3 border-b last:border-b-0 text-left
                  transition-colors duration-150
                  ${
                    isSelected
                      ? 'bg-blue-50 border-b-blue-200'
                      : 'hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xl">{optConfig.icon}</span>
                  <div>
                    <p className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {optConfig.label}
                    </p>
                    <p className="text-xs text-gray-500">{optConfig.description}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-semibold text-gray-700">
                    {currency}{balance.toFixed(2)}
                  </span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
