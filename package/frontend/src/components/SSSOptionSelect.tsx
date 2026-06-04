'use client';

import { useState } from 'react';
import { getTranslations } from '@/lib/translations';
import { useLanguage } from '@/lib/LanguageContext';

// ============================================================
// 📌 컴포넌트명: SSSOptionSelect
// 📋 목적: SSS 선지급(Prepaid) vs 보류(Hold) 선택 및 급여 영향도 시각화
// 🔧 매개변수:
//   - employeeId: 직원 ID
//   - currentMonth: 현재 정산 월 (예: "September 2024")
//   - currentOption: 현재 선택된 옵션 ("prepaid" | "hold")
//   - onOptionChange: 옵션 변경 콜백
//   - payrollImpact: 급여 계산 영향도 데이터
// 📤 반환값: JSX.Element
// 📅 작성일: 2026-06-02
// 📌 SSS 규칙: 선지급(Prepaid)은 정부 인보이스 기준, 보류(Hold)는 실제 선호도 기반
// ============================================================

export interface SSSOption {
  id: 'prepaid' | 'hold';
  labelKey: string;
  descriptionKey: string;
  badgeColor: 'emerald' | 'amber' | 'blue';
}

export interface PayrollImpact {
  grossSalary: number;           // 총 급여
  sssContribution: number;       // SSS 기여금 (Employee + Employer)
  prepaidAmount: number;         // 선지급액 (정부 인보이스 기준)
  holdAmount: number;            // 보류액 (실제 정산 기준)
  taxImplications: string;       // 세금 영향도 설명
  settlementDate: string;        // 정산 예정일
}

export interface SSSOptionSelectProps {
  employeeId: number;
  currentMonth: string;
  currentOption: 'prepaid' | 'hold';
  onOptionChange: (option: 'prepaid' | 'hold') => void;
  payrollImpact: PayrollImpact;
  isLoading?: boolean;
  disabled?: boolean;
}

// ─── SSS 옵션 정의 ────────────────────────────────────────────────
const SSS_OPTIONS: SSSOption[] = [
  {
    id: 'prepaid',
    labelKey: 'sss_option_prepaid_label',           // "정부 인보이스 선지급"
    descriptionKey: 'sss_option_prepaid_desc',      // "정부 인보이스 기준으로 즉시 계산 및 선지급"
    badgeColor: 'emerald',
  },
  {
    id: 'hold',
    labelKey: 'sss_option_hold_label',              // "실제 정산 보류"
    descriptionKey: 'sss_option_hold_desc',         // "실제 근무 현황에 따라 유연하게 정산"
    badgeColor: 'amber',
  },
];

export const SSSOptionSelect = ({
  employeeId,
  currentMonth,
  currentOption,
  onOptionChange,
  payrollImpact,
  isLoading = false,
  disabled = false,
}: SSSOptionSelectProps) => {
  const t = getTranslations();
  const { language } = useLanguage();
  const [selectedOption, setSelectedOption] = useState<'prepaid' | 'hold'>(currentOption);
  const [showDetails, setShowDetails] = useState(false);

  // ─── 옵션 변경 핸들러 ────────────────────────────────────────────────
  const handleOptionChange = (option: 'prepaid' | 'hold') => {
    if (disabled || isLoading) return;

    setSelectedOption(option);
    onOptionChange(option);
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

  // ─── 뱃지 컬러 매핑 ────────────────────────────────────────────────────
  const getBadgeStyles = (color: 'emerald' | 'amber' | 'blue') => {
    const styles = {
      emerald: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      amber: 'bg-amber-100 text-amber-800 border-amber-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
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

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-sm">
      {/* ═══ 헤더 ═══════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span>💼</span>
          {t('sss_option_title') || 'SSS 기여금 정산 방식'}
        </h2>
        <p className="text-sm text-gray-600">
          {t('sss_option_subtitle') || `${currentMonth} — 직원 ID: ${employeeId}`}
        </p>
      </div>

      {/* ═══ 라디오 옵션 그룹 ═════════════════════════════════════════════ */}
      <div className="space-y-4 mb-8">
        {SSS_OPTIONS.map((option) => {
          const isSelected = selectedOption === option.id;
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
                name="sss-option"
                value={option.id}
                checked={isSelected}
                onChange={() => handleOptionChange(option.id)}
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
                    {option.id === 'prepaid'
                      ? t('sss_badge_government') || 'Government Invoice'
                      : t('sss_badge_flexible') || 'Flexible'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {t(option.descriptionKey) || option.descriptionKey}
                </p>
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

      {/* ═══ 급여 영향도 요약 ═════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>📊</span>
            {t('sss_payroll_impact') || '급여 영향도'}
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
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
            <p className="text-xs font-semibold text-blue-800 mb-1">
              {t('sss_gross_salary') || 'Gross Salary'}
            </p>
            <p className="text-lg font-bold text-blue-900">
              {formatPHP(payrollImpact.grossSalary)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
            <p className="text-xs font-semibold text-purple-800 mb-1">
              {t('sss_contribution') || 'SSS Contribution'}
            </p>
            <p className="text-lg font-bold text-purple-900">
              {formatPHP(payrollImpact.sssContribution)}
            </p>
          </div>

          <div className={`rounded-lg p-3 border ${
            selectedOption === 'prepaid'
              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
              : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
          }`}>
            <p className={`text-xs font-semibold mb-1 ${
              selectedOption === 'prepaid' ? 'text-emerald-800' : 'text-gray-600'
            }`}>
              {t('sss_prepaid_amount') || 'Prepaid Amount'}
            </p>
            <p className={`text-lg font-bold ${
              selectedOption === 'prepaid' ? 'text-emerald-900' : 'text-gray-600'
            }`}>
              {formatPHP(payrollImpact.prepaidAmount)}
            </p>
          </div>

          <div className={`rounded-lg p-3 border ${
            selectedOption === 'hold'
              ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200'
              : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
          }`}>
            <p className={`text-xs font-semibold mb-1 ${
              selectedOption === 'hold' ? 'text-amber-800' : 'text-gray-600'
            }`}>
              {t('sss_hold_amount') || 'Hold Amount'}
            </p>
            <p className={`text-lg font-bold ${
              selectedOption === 'hold' ? 'text-amber-900' : 'text-gray-600'
            }`}>
              {formatPHP(payrollImpact.holdAmount)}
            </p>
          </div>
        </div>

        {/* 상세 정보 (펼침) */}
        {showDetails && (
          <div className="pt-4 border-t border-gray-200 space-y-3 animate-in fade-in duration-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('sss_settlement_date') || 'Settlement Date'}:</span>
              <span className="font-semibold text-gray-800">{formatDate(payrollImpact.settlementDate)}</span>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs font-semibold text-blue-800 mb-1">
                {t('sss_tax_implications') || '세금 영향도'}
              </p>
              <p className="text-sm text-blue-900">
                {payrollImpact.taxImplications || t('sss_tax_info_default') || '세금 정보 계산 중...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ═══ 안내 메시지 ═════════════════════════════════════════════════ */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-sm text-blue-800">
        <p className="font-semibold mb-1">💡 {t('sss_important_note') || '중요 안내'}</p>
        <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
          <li>
            {t('sss_note_prepaid') || '선지급: 정부 인보이스 기준의 고정액'}
          </li>
          <li>
            {t('sss_note_hold') || '보류: 실제 근무 시간/이벤트에 따라 유연한 정산'}
          </li>
          <li>
            {t('sss_note_settlement') || '정산 기한: 매월 25일'}
          </li>
        </ul>
      </div>

      {/* ═══ 로딩 상태 오버레이 ═════════════════════════════════════════ */}
      {isLoading && (
        <div className="absolute inset-0 rounded-lg bg-white/60 flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-gray-600">
              {t('sss_processing') || '처리 중...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
