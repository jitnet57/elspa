'use client';

import { useState } from 'react';
import { SSSOptionSelect, PayrollImpact, SSSOptionSelectProps } from './SSSOptionSelect';

/**
 * ============================================================
 * 📌 컴포넌트명: SSSOptionSelectExample
 * 📋 목적: SSSOptionSelect 컴포넌트의 사용 예제 및 테스트 케이스
 * 🔧 매개변수: 없음 (예제용 스탠드얼론)
 * 📤 반환값: JSX.Element
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

// ─── 예제 데이터: 급여 영향도 ────────────────────────────────────────
const EXAMPLE_PAYROLL_IMPACT: PayrollImpact = {
  grossSalary: 45000,           // 총 급여 ₱45,000
  sssContribution: 1912.50,     // SSS 기여금 (Employee + Employer)
  prepaidAmount: 1912.50,       // 선지급액 (정부 인보이스 기준)
  holdAmount: 1850.00,          // 보류액 (실제 정산 기준)
  taxImplications: '선지급 옵션: 정부 인보이스 기준으로 계산되며, 매월 25일에 자동 공제됩니다. 보류 옵션: 실제 근무 시간과 이벤트 참여도를 기반으로 유연하게 계산됩니다.',
  settlementDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 25).toISOString(),
};

// ─── 예제 데이터: 높은 급여 케이스 ────────────────────────────────────
const EXAMPLE_PAYROLL_IMPACT_HIGH: PayrollImpact = {
  grossSalary: 85000,           // 총 급여 ₱85,000
  sssContribution: 3612.50,     // SSS 기여금
  prepaidAmount: 3612.50,       // 선지급액
  holdAmount: 3450.00,          // 보류액
  taxImplications: '높은 급여 범주에서 SSS 기여금이 증가합니다. 선지급 옵션은 예산 계획이 명확하고, 보류 옵션은 성과급이 포함된 달에 유연합니다.',
  settlementDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 25).toISOString(),
};

export const SSSOptionSelectExample = () => {
  const [selectedOption, setSelectedOption] = useState<'prepaid' | 'hold'>('prepaid');
  const [selectedOption2, setSelectedOption2] = useState<'prepaid' | 'hold'>('hold');
  const [isLoading, setIsLoading] = useState(false);

  // ─── 옵션 변경 핸들러 (선택지 동기화) ────────────────────────────────
  const handleOptionChange = (option: 'prepaid' | 'hold') => {
    setSelectedOption(option);
    // 실제 사용 시: API 호출하여 DB에 저장
    // await updateEmployeeSSSOption(employeeId, option);
  };

  const handleOptionChange2 = (option: 'prepaid' | 'hold') => {
    setSelectedOption2(option);
  };

  // ─── 로딩 시뮬레이션 (API 호출) ────────────────────────────────────
  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ═══ 페이지 헤더 ═══════════════════════════════════════════════ */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SSS Option Select Component
          </h1>
          <p className="text-lg text-gray-600">
            정부 선지급(Prepaid) vs 유연한 보류(Hold) 정산 방식 선택
          </p>
        </div>

        {/* ═══ 예제 1: 기본 급여 레벨 ═══════════════════════════════════ */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📋 예제 1: 일반 급여 직원 (₱45,000)
          </h2>
          <p className="text-sm text-gray-600 mb-6 bg-gray-100 p-3 rounded">
            <strong>직원 정보:</strong> Employee ID: 12345, 월: September 2024<br />
            <strong>SSS 기여금:</strong> ₱1,912.50 (정부 인보이스 기준)<br />
            <strong>예상 정산일:</strong> 매월 25일
          </p>
          <SSSOptionSelect
            employeeId={12345}
            currentMonth="September 2024"
            currentOption={selectedOption}
            onOptionChange={handleOptionChange}
            payrollImpact={EXAMPLE_PAYROLL_IMPACT}
            isLoading={false}
            disabled={false}
          />
        </div>

        {/* ═══ 예제 2: 높은 급여 레벨 + 로딩 상태 ═════════════════════ */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📋 예제 2: 고급 급여 직원 (₱85,000) + 로딩 상태 데모
          </h2>
          <p className="text-sm text-gray-600 mb-6 bg-blue-50 p-3 rounded border border-blue-200">
            <strong>직원 정보:</strong> Employee ID: 67890, 월: September 2024<br />
            <strong>SSS 기여금:</strong> ₱3,612.50 (선지급 기준)<br />
            <strong>상황:</strong> 높은 급여 범주에서는 SSS 기여금도 증가합니다.<br />
            <button
              onClick={simulateLoading}
              disabled={isLoading}
              className={`mt-3 px-4 py-2 rounded font-semibold text-white transition-colors ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? '처리 중...' : '로딩 상태 시뮬레이션 (2초)'}
            </button>
          </p>
          <SSSOptionSelect
            employeeId={67890}
            currentMonth="September 2024"
            currentOption={selectedOption2}
            onOptionChange={handleOptionChange2}
            payrollImpact={EXAMPLE_PAYROLL_IMPACT_HIGH}
            isLoading={isLoading}
            disabled={false}
          />
        </div>

        {/* ═══ 예제 3: 비활성화 상태 ═════════════════════════════════════ */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📋 예제 3: 비활성화 상태 (읽기 전용)
          </h2>
          <p className="text-sm text-gray-600 mb-6 bg-yellow-50 p-3 rounded border border-yellow-200">
            <strong>상황:</strong> HR 검토 중이거나 관리자 승인 대기 중인 경우 옵션 선택이 비활성화됩니다.
          </p>
          <SSSOptionSelect
            employeeId={99999}
            currentMonth="September 2024"
            currentOption="prepaid"
            onOptionChange={handleOptionChange}
            payrollImpact={EXAMPLE_PAYROLL_IMPACT}
            isLoading={false}
            disabled={true}
          />
        </div>

        {/* ═══ 주요 기능 설명 ═════════════════════════════════════════════ */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            🎯 주요 기능
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 기능 1: 라디오 버튼 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                📻 라디오 버튼 선택
              </h3>
              <p className="text-gray-600 text-sm">
                Prepaid (정부 인보이스 기준 선지급) 또는 Hold (실제 근무 기반 보류) 중 선택합니다.
              </p>
            </div>

            {/* 기능 2: SSS 금액 표시 */}
            <div className="border-l-4 border-emerald-500 pl-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                💰 SSS 금액 표시
              </h3>
              <p className="text-gray-600 text-sm">
                Gross Salary, SSS Contribution, Prepaid Amount, Hold Amount을 한눈에 확인합니다.
              </p>
            </div>

            {/* 기능 3: 영향도 상세 정보 */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                📊 영향도 상세 정보
              </h3>
              <p className="text-gray-600 text-sm">
                정산 예정일, 세금 영향도, 선택에 따른 장단점을 펼침 버튼으로 확인합니다.
              </p>
            </div>

            {/* 기능 4: 에러 처리 & 상태 관리 */}
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                ⚠️ 에러 처리 & 상태 관리
              </h3>
              <p className="text-gray-600 text-sm">
                로딩 상태(isLoading), 비활성화(disabled) 처리로 견고한 사용자 경험을 제공합니다.
              </p>
            </div>

            {/* 기능 5: 다국어 지원 */}
            <div className="border-l-4 border-cyan-500 pl-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                🌐 다국어 지원
              </h3>
              <p className="text-gray-600 text-sm">
                getTranslations()와 useLanguage Hook으로 한국어/영어 자동 변환됩니다.
              </p>
            </div>

            {/* 기능 6: 스타일링 & 반응형 */}
            <div className="border-l-4 border-pink-500 pl-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                🎨 Tailwind CSS + 반응형
              </h3>
              <p className="text-gray-600 text-sm">
                모바일/태블릿/PC 모든 화면 크기에서 자동으로 레이아웃이 조정됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* ═══ Props 설명 ═══════════════════════════════════════════════ */}
        <div className="bg-gray-900 text-gray-100 rounded-lg p-6 mt-12 font-mono text-sm overflow-x-auto">
          <h3 className="text-lg font-bold mb-4 text-white">💻 Props 인터페이스</h3>
          <pre>{`interface SSSOptionSelectProps {
  employeeId: number;              // 직원 ID
  currentMonth: string;            // 현재 정산 월 (예: "September 2024")
  currentOption: 'prepaid' | 'hold'; // 현재 선택된 옵션
  onOptionChange: (option) => void; // 옵션 변경 콜백
  payrollImpact: PayrollImpact;    // 급여 영향도 데이터
  isLoading?: boolean;             // 로딩 상태 (기본값: false)
  disabled?: boolean;              // 비활성화 (기본값: false)
}

interface PayrollImpact {
  grossSalary: number;    // 총 급여
  sssContribution: number; // SSS 기여금
  prepaidAmount: number;  // 선지급액
  holdAmount: number;     // 보류액
  taxImplications: string; // 세금 영향도 설명
  settlementDate: string; // 정산 예정일
}`}</pre>
        </div>

        {/* ═══ 사용 예제 코드 ═════════════════════════════════════════════ */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-bold text-blue-900 mb-4">📝 사용 예제</h3>
          <pre className="bg-white rounded p-4 overflow-x-auto text-xs text-gray-800 border border-blue-200">{`import { SSSOptionSelect, PayrollImpact } from '@/components/SSSOptionSelect';
import { useState } from 'react';

export default function PayrollPage() {
  const [sssOption, setSssOption] = useState<'prepaid' | 'hold'>('prepaid');

  // API에서 급여 데이터 가져오기
  const payrollData: PayrollImpact = {
    grossSalary: 45000,
    sssContribution: 1912.50,
    prepaidAmount: 1912.50,
    holdAmount: 1850.00,
    taxImplications: '선지급 기준으로 계산됩니다...',
    settlementDate: '2024-09-25',
  };

  const handleSSSChange = async (option: 'prepaid' | 'hold') => {
    setSssOption(option);
    // API 호출: POST /api/employees/\${employeeId}/sss-option
    // 데이터베이스에 선택지 저장
  };

  return (
    <SSSOptionSelect
      employeeId={12345}
      currentMonth="September 2024"
      currentOption={sssOption}
      onOptionChange={handleSSSChange}
      payrollImpact={payrollData}
      isLoading={false}
      disabled={false}
    />
  );
}`}</pre>
        </div>

        {/* ═══ 상태 관리 플로우 ═════════════════════════════════════════════ */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-bold text-green-900 mb-4">🔄 상태 관리 플로우</h3>
          <div className="space-y-3 text-sm text-green-800">
            <div className="flex items-start gap-3">
              <span className="font-bold text-lg">1️⃣</span>
              <div>
                <strong>초기 상태 로드:</strong> currentOption props로 "prepaid" 또는 "hold" 설정
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-lg">2️⃣</span>
              <div>
                <strong>사용자 선택:</strong> 라디오 버튼 클릭 시 selectedOption state 업데이트
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-lg">3️⃣</span>
              <div>
                <strong>콜백 호출:</strong> onOptionChange 콜백으로 부모 컴포넌트에 변경 알림
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-lg">4️⃣</span>
              <div>
                <strong>API 저장:</strong> 부모에서 POST /api/employees/:id/sss-option으로 DB 저장
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-bold text-lg">5️⃣</span>
              <div>
                <strong>UI 업데이트:</strong> 금액과 영향도 정보가 자동으로 업데이트됨
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SSS 규칙 설명 ═════════════════════════════════════════════ */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-bold text-purple-900 mb-4">📚 SSS 기여금 규칙</h3>
          <div className="space-y-4 text-sm text-purple-800">
            <div>
              <strong className="block text-purple-950 mb-1">
                💼 Prepaid (정부 인보이스 선지급)
              </strong>
              <p className="ml-4">
                정부 인보이스 기준의 고정된 금액으로 매월 자동 공제됩니다.
                예산 계획이 명확하고 변동이 적은 직원에게 적합합니다.
              </p>
            </div>
            <div>
              <strong className="block text-purple-950 mb-1">
                🔄 Hold (실제 정산 보류)
              </strong>
              <p className="ml-4">
                실제 근무 시간, 이벤트 참여도, 성과급을 기반으로 유연하게 계산됩니다.
                매월 급여가 변동하는 직원에게 적합합니다.
              </p>
            </div>
            <div>
              <strong className="block text-purple-950 mb-1">
                ✅ 정산 원칙
              </strong>
              <p className="ml-4">
                선택한 옵션에 관계없이 매월 25일에 정산되며,
                세금과 정부 요구사항을 모두 준수합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
