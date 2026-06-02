import { useState, useCallback, useEffect } from 'react';
import { PayrollImpact } from '@/components/SSSOptionSelect';

// ============================================================
// 📌 훅명: useSSSOptionSelect
// 📋 목적: SSS 선지급/보류 옵션 선택 상태 관리 및 급여 영향도 계산
// 🔧 매개변수:
//   - employeeId: 직원 ID
//   - currentMonth: 정산 월 (예: "September 2024")
//   - initialOption: 초기 선택 옵션 ("prepaid" | "hold")
//   - onSave: 저장 콜백 함수
// 📤 반환값: 상태 및 메서드 객체
// 📅 작성일: 2026-06-02
// 📌 SSS 규칙: 선지급은 정부 인보이스 기준 고정액, 보류는 실제 정산 기준
// ============================================================

export interface SSSOptionSelectHookResult {
  selectedOption: 'prepaid' | 'hold';
  payrollImpact: PayrollImpact;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  changeOption: (option: 'prepaid' | 'hold') => void;
  saveOption: () => Promise<void>;
  calculateImpact: (option: 'prepaid' | 'hold') => Promise<PayrollImpact>;
}

export interface SSSCalculationParams {
  employeeId: number;
  currentMonth: string;
  sssContribution: number;        // SSS 기여금 (Employee + Employer 합)
  governmentInvoiceAmount: number; // 정부 인보이스 기준액
  grossSalary: number;            // 총 급여
  workdaysInMonth: number;        // 해당 월 근무일 수
  actualWorkdaysWorked: number;   // 실제 근무일 수
}

// ─── SSS 계산 로직 ────────────────────────────────────────────────
/**
 * SSS 선지급(Prepaid) vs 보류(Hold) 금액 계산
 *
 * Prepaid (선지급):
 *   - 정부 인보이스 기준의 고정액
 *   - 근무 현황과 무관하게 즉시 계산
 *   - 월말에 차액 정산
 *
 * Hold (보류):
 *   - 실제 근무일 기준으로 유동적 계산
 *   - 근무일 수 = (실제 근무일 / 전체 근무일) × SSS 기여금
 *   - 더 공정한 정산 방식
 */
export const calculateSSSImpact = (
  params: SSSCalculationParams
): PayrollImpact => {
  const {
    employeeId,
    currentMonth,
    sssContribution,
    governmentInvoiceAmount,
    grossSalary,
    workdaysInMonth,
    actualWorkdaysWorked,
  } = params;

  // ─── Prepaid 계산 ──────────────────────────────────────────────
  // 정부 인보이스 기준 고정액
  const prepaidAmount = governmentInvoiceAmount;

  // ─── Hold 계산 ──────────────────────────────────────────────────
  // 실제 근무일 기준 유동액
  // 예시: 근무일 22일 중 20일 근무 → (20/22) × SSS 기여금
  const attendanceRatio = workdaysInMonth > 0 ? actualWorkdaysWorked / workdaysInMonth : 1;
  const holdAmount = sssContribution * attendanceRatio;

  // ─── 정산 예정일 (매월 25일) ───────────────────────────────────────
  const settlementDate = getSettlementDate(currentMonth);

  // ─── 세금 영향도 설명 ─────────────────────────────────────────────
  const taxImplications = generateTaxImplications({
    option: 'both', // 선지급과 보류 비교
    prepaidAmount,
    holdAmount,
    sssContribution,
    grossSalary,
    attendanceRatio,
  });

  return {
    grossSalary,
    sssContribution,
    prepaidAmount,
    holdAmount,
    taxImplications,
    settlementDate,
  };
};

/**
 * 정산 예정일 계산 (매월 25일)
 * 예: "September 2024" → "2024-09-25"
 */
const getSettlementDate = (monthStr: string): string => {
  try {
    const [month, year] = monthStr.split(' ');
    const months: { [key: string]: string } = {
      January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
      July: '07', August: '08', September: '09', October: '10', November: '11', December: '12',
    };

    const monthNum = months[month] || '09';
    return `${year}-${monthNum}-25`;
  } catch {
    // 파싱 실패 시 현재월 25일 반환
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-25`;
  }
};

/**
 * 세금 영향도 설명 생성
 */
const generateTaxImplications = (data: {
  option: 'prepaid' | 'hold' | 'both';
  prepaidAmount: number;
  holdAmount: number;
  sssContribution: number;
  grossSalary: number;
  attendanceRatio: number;
}): string => {
  const { prepaidAmount, holdAmount, sssContribution, attendanceRatio } = data;
  const difference = Math.abs(prepaidAmount - holdAmount);
  const percentDiff = ((difference / sssContribution) * 100).toFixed(1);

  return `
선지급(Prepaid): ₱${prepaidAmount.toFixed(2)} — 정부 인보이스 기준, 고정액
보류(Hold): ₱${holdAmount.toFixed(2)} — 실제 근무 ${(attendanceRatio * 100).toFixed(0)}% 기준, 유동액
차액: ₱${difference.toFixed(2)} (${percentDiff}%)

📌 선택 시 영향:
• 선지급 선택: 초과분은 월말 차액 정산
• 보류 선택: 실제 근무에 따라 정확한 정산 (더 공정)
  `.trim();
};

// ─── React Hook ────────────────────────────────────────────────────

export const useSSSOptionSelect = (
  employeeId: number,
  currentMonth: string,
  initialOption: 'prepaid' | 'hold' = 'prepaid',
  onSave?: (option: 'prepaid' | 'hold') => Promise<void>
): SSSOptionSelectHookResult => {
  const [selectedOption, setSelectedOption] = useState<'prepaid' | 'hold'>(initialOption);
  const [payrollImpact, setPayrollImpact] = useState<PayrollImpact>({
    grossSalary: 0,
    sssContribution: 0,
    prepaidAmount: 0,
    holdAmount: 0,
    taxImplications: '',
    settlementDate: getSettlementDate(currentMonth),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── 급여 데이터 로드 및 영향도 계산 ───────────────────────────────
  useEffect(() => {
    const loadPayrollData = async () => {
      setIsLoading(true);
      try {
        // API에서 급여 데이터 조회
        // 예: GET /api/payroll/employees/{employeeId}/monthly-summary?month=September%202024
        const response = await fetch(
          `/api/payroll/employees/${employeeId}/monthly-summary?month=${encodeURIComponent(currentMonth)}`
        );

        if (!response.ok) {
          throw new Error(`Failed to load payroll data: ${response.statusText}`);
        }

        const data = await response.json();

        // 영향도 계산
        const impact = calculateSSSImpact({
          employeeId,
          currentMonth,
          sssContribution: data.sssContribution,
          governmentInvoiceAmount: data.governmentInvoiceAmount,
          grossSalary: data.grossSalary,
          workdaysInMonth: data.workdaysInMonth,
          actualWorkdaysWorked: data.actualWorkdaysWorked,
        });

        setPayrollImpact(impact);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error loading payroll data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPayrollData();
  }, [employeeId, currentMonth]);

  // ─── 옵션 변경 핸들러 ────────────────────────────────────────────────
  const changeOption = useCallback((option: 'prepaid' | 'hold') => {
    setSelectedOption(option);
  }, []);

  // ─── 옵션 저장 핸들러 ────────────────────────────────────────────────
  const saveOption = useCallback(async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      // API에 옵션 저장
      // PUT /api/payroll/employees/{employeeId}/sss-option
      const response = await fetch(
        `/api/payroll/employees/${employeeId}/sss-option`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            option: selectedOption,
            month: currentMonth,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save SSS option: ${response.statusText}`);
      }

      // 콜백 실행
      await onSave(selectedOption);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error saving SSS option:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [employeeId, currentMonth, selectedOption, onSave]);

  // ─── 수동 영향도 계산 ────────────────────────────────────────────────
  const calculateImpact = useCallback(
    async (option: 'prepaid' | 'hold'): Promise<PayrollImpact> => {
      // 선택한 옵션의 영향도 조회 (필요시 추가 API 호출)
      return payrollImpact;
    },
    [payrollImpact]
  );

  return {
    selectedOption,
    payrollImpact,
    isLoading,
    isSaving,
    error,
    changeOption,
    saveOption,
    calculateImpact,
  };
};
