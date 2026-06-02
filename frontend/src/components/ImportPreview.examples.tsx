/**
 * 📚 ImportPreview.tsx 사용 예제
 * 다양한 데이터 임포트 시나리오에서 검증 및 미리보기를 사용하는 방법
 *
 * 작성일: 2026-06-02
 */

import ImportPreview, {
  createRequiredValidator,
  createNumberValidator,
  createDateValidator,
  type ValidationRule,
  type ImportPreviewProps
} from './ImportPreview';

// ============================================================
// 🔵 예제 1: 직원 급여 데이터 임포트
// ============================================================
export function PayrollImportExample() {
  const payrollData = [
    { 직원명: 'Kim, John', 부서: '마사지', 기본급: '3000000', 보너스: '500000', 입사일: '2025-01-15' },
    { 직원명: 'Lee, Sarah', 부서: '운전', 기본급: '2500000', 보너스: '', 입사일: '2024-06-01' },
    { 직원명: 'Park, Mike', 부서: '마사지', 기본급: '3000000', 보너스: '300000', 입사일: '2025-02-20' },
    { 직원명: '', 부서: '운전', 기본급: '2800000', 보너스: '200000', 입사일: '2024-12-15' },
    { 직원명: 'Oh, Jane', 부서: '관리', 기본급: 'N/A', 보너스: '1000000', 입사일: '2023-03-10' }
  ];

  const columns = ['직원명', '부서', '기본급', '보너스', '입사일'];

  const validators: ValidationRule[] = [
    // 필수 필드
    createRequiredValidator('직원명'),
    createRequiredValidator('부서'),

    // 숫자 검증 (기본급, 보너스)
    {
      field: '기본급',
      validate: (value) => {
        if (!value || value === '') {
          return { valid: false, message: '기본급은 필수입니다', type: 'error' };
        }
        const num = Number(value);
        if (isNaN(num)) {
          return { valid: false, message: '기본급은 숫자여야 합니다', type: 'error' };
        }
        if (num < 1000000) {
          return { valid: false, message: '기본급은 최소 1,000,000원 이상이어야 합니다', type: 'error' };
        }
        if (num > 10000000) {
          return { valid: false, message: '기본급이 비정상적으로 높습니다', type: 'warning' };
        }
        return { valid: true, type: 'error' };
      }
    },
    {
      field: '보너스',
      validate: (value) => {
        if (!value || value === '') return { valid: true, type: 'error' }; // 선택사항
        const num = Number(value);
        if (isNaN(num)) {
          return { valid: false, message: '보너스는 숫자여야 합니다', type: 'error' };
        }
        if (num < 0) {
          return { valid: false, message: '보너스는 음수가 될 수 없습니다', type: 'error' };
        }
        return { valid: true, type: 'error' };
      }
    },

    // 날짜 검증
    createDateValidator('입사일'),

    // 부서 검증
    {
      field: '부서',
      validate: (value) => {
        const validDepts = ['마사지', '운전', '관리', '회계'];
        if (!validDepts.includes(String(value))) {
          return {
            valid: false,
            message: `부서는 ${validDepts.join(', ')} 중 하나여야 합니다`,
            type: 'error'
          };
        }
        return { valid: true, type: 'error' };
      }
    }
  ];

  const handleValidate = (results: any) => {
    console.log('✅ 검증 완료:', {
      총행: results.totalRows,
      유효행: results.validRows,
      오류행: results.invalidRows,
      오류수: results.errors.length
    });
  };

  return (
    <ImportPreview
      data={payrollData}
      columns={columns}
      validators={validators}
      previewRows={5}
      onValidate={handleValidate}
    />
  );
}

// ============================================================
// 🟠 예제 2: 경비 영수증 데이터 임포트
// ============================================================
export function ExpenseImportExample() {
  const expenseData = [
    { 날짜: '2026-06-01', 카테고리: '식비', 금액: '45000', 설명: '팀 회식' },
    { 날짜: '2026-06-02', 카테고리: '교통비', 금액: '5500', 설명: '택시' },
    { 날짜: '2026-06-03', 카테고리: '소모품', 금액: '120000', 설명: '사무용품' },
    { 날짜: '2026-06-04', 카테고리: '식비', 금액: '', 설명: '카페 음료' },
    { 날짜: '2026-06-05', 카테고리: '기타', 금액: '999999999', 설명: '정크 금액' }
  ];

  const columns = ['날짜', '카테고리', '금액', '설명'];

  const validators: ValidationRule[] = [
    createRequiredValidator('날짜'),
    createRequiredValidator('카테고리'),
    createRequiredValidator('금액'),

    createDateValidator('날짜'),

    {
      field: '금액',
      validate: (value) => {
        if (!value || value === '') {
          return { valid: false, message: '금액은 필수입니다', type: 'error' };
        }
        const num = Number(value);
        if (isNaN(num)) {
          return { valid: false, message: '금액은 숫자여야 합니다', type: 'error' };
        }
        if (num <= 0) {
          return { valid: false, message: '금액은 0보다 커야 합니다', type: 'error' };
        }
        if (num > 1000000) {
          return {
            valid: true,
            message: '금액이 1,000,000원을 초과합니다 (검토 필요)',
            type: 'warning'
          };
        }
        return { valid: true, type: 'error' };
      }
    },

    {
      field: '카테고리',
      validate: (value) => {
        const validCategories = ['식비', '교통비', '소모품', '통신비', '공과금', '기타'];
        if (!validCategories.includes(String(value))) {
          return {
            valid: false,
            message: `유효한 카테고리: ${validCategories.join(', ')}`,
            type: 'error'
          };
        }
        return { valid: true, type: 'error' };
      }
    }
  ];

  return (
    <ImportPreview
      data={expenseData}
      columns={columns}
      validators={validators}
      previewRows={5}
    />
  );
}

// ============================================================
// 🟢 예제 3: 고객 데이터 임포트
// ============================================================
export function CustomerImportExample() {
  const customerData = [
    { 이름: 'Kim, Alice', 전화: '01012345678', 이메일: 'alice@example.com', 가입일: '2025-06-01', 신용도: 'A' },
    { 이름: 'Lee, Bob', 전화: '01087654321', 이메일: 'bob@example.com', 가입일: '2025-05-15', 신용도: 'B' },
    { 이름: 'Park, Carol', 전화: '010987', 이메일: 'invalid-email', 가입일: '2025-06-05', 신용도: 'X' },
    { 이름: '', 전화: '01011111111', 이메일: 'david@example.com', 가입일: '2025-06-10', 신용도: 'A' },
    { 이름: 'Oh, Eve', 전화: '', 이메일: 'eve@example.com', 가입일: '2025-06-12', 신용도: 'C' }
  ];

  const columns = ['이름', '전화', '이메일', '가입일', '신용도'];

  const validators: ValidationRule[] = [
    createRequiredValidator('이름'),
    createDateValidator('가입일'),

    {
      field: '전화',
      validate: (value) => {
        if (!value || value === '') {
          return { valid: false, message: '전화번호는 필수입니다', type: 'error' };
        }
        const phoneRegex = /^01[0-9]\d{7,8}$/;
        if (!phoneRegex.test(String(value).replace(/[^\d]/g, ''))) {
          return { valid: false, message: '전화번호 형식이 잘못되었습니다 (예: 01012345678)', type: 'error' };
        }
        return { valid: true, type: 'error' };
      }
    },

    {
      field: '이메일',
      validate: (value) => {
        if (!value || value === '') {
          return { valid: false, message: '이메일은 필수입니다', type: 'error' };
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          return { valid: false, message: '이메일 형식이 잘못되었습니다', type: 'error' };
        }
        return { valid: true, type: 'error' };
      }
    },

    {
      field: '신용도',
      validate: (value) => {
        const validGrades = ['A', 'B', 'C', 'D', 'F'];
        if (!validGrades.includes(String(value).toUpperCase())) {
          return {
            valid: false,
            message: `신용도는 ${validGrades.join(', ')} 중 하나여야 합니다`,
            type: 'error'
          };
        }
        return { valid: true, type: 'error' };
      }
    }
  ];

  return (
    <ImportPreview
      data={customerData}
      columns={columns}
      validators={validators}
      previewRows={5}
    />
  );
}

// ============================================================
// 📋 예제 4: 예약 데이터 임포트
// ============================================================
export function BookingImportExample() {
  const bookingData = [
    { 예약일: '2026-06-10', 예약시간: '10:00', 손님: '고객A', 테라피스트: '김테라', 금액: '150000' },
    { 예약일: '2026-06-10', 예약시간: '11:00', 손님: '고객B', 테라피스트: '이테라', 금액: '120000' },
    { 예약일: '2026-06-11', 예약시간: '14:30', 손님: '고객C', 테라피스트: '', 금액: '150000' },
    { 예약일: '2026-06-11', 예약시간: '25:00', 손님: '고객D', 테라피스트: '박테라', 금액: '100000' },
    { 예약일: '2026-06-12', 예약시간: '16:00', 손님: '고객E', 테라피스트: '최테라', 금액: '-50000' }
  ];

  const columns = ['예약일', '예약시간', '손님', '테라피스트', '금액'];

  const validators: ValidationRule[] = [
    createRequiredValidator('예약일'),
    createRequiredValidator('예약시간'),
    createRequiredValidator('손님'),
    createRequiredValidator('테라피스트'),
    createRequiredValidator('금액'),

    createDateValidator('예약일'),

    {
      field: '예약시간',
      validate: (value) => {
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(String(value))) {
          return { valid: false, message: '시간 형식이 잘못되었습니다 (예: 14:30)', type: 'error' };
        }
        return { valid: true, type: 'error' };
      }
    },

    {
      field: '금액',
      validate: (value) => {
        const num = Number(value);
        if (isNaN(num)) {
          return { valid: false, message: '금액은 숫자여야 합니다', type: 'error' };
        }
        if (num <= 0) {
          return { valid: false, message: '금액은 0보다 커야 합니다', type: 'error' };
        }
        return { valid: true, type: 'error' };
      }
    }
  ];

  return (
    <ImportPreview
      data={bookingData}
      columns={columns}
      validators={validators}
      previewRows={5}
    />
  );
}

// ============================================================
// 🎯 예제 5: 커스텀 검증 규칙 만들기
// ============================================================
export function CustomValidatorExample() {
  /**
   * 범위 검증 함수
   * 숫자가 지정된 범위 내에 있는지 확인
   */
  function createRangeValidator(
    field: string,
    min: number,
    max: number
  ): ValidationRule {
    return {
      field,
      validate: (value) => {
        if (!value && value !== 0) return { valid: true, type: 'error' };
        const num = Number(value);
        if (isNaN(num)) {
          return {
            valid: false,
            message: `${field}은(는) 숫자여야 합니다`,
            type: 'error'
          };
        }
        if (num < min || num > max) {
          return {
            valid: false,
            message: `${field}은(는) ${min} ~ ${max} 범위여야 합니다`,
            type: 'error'
          };
        }
        return { valid: true, type: 'error' };
      }
    };
  }

  /**
   * 길이 검증 함수
   * 문자열 길이가 범위 내에 있는지 확인
   */
  function createLengthValidator(
    field: string,
    minLength: number,
    maxLength: number
  ): ValidationRule {
    return {
      field,
      validate: (value) => {
        const str = String(value || '');
        if (str.length < minLength) {
          return {
            valid: false,
            message: `${field}은(는) 최소 ${minLength}자 이상이어야 합니다`,
            type: 'error'
          };
        }
        if (str.length > maxLength) {
          return {
            valid: false,
            message: `${field}은(는) 최대 ${maxLength}자 이하여야 합니다`,
            type: 'error'
          };
        }
        return { valid: true, type: 'error' };
      }
    };
  }

  /**
   * 정규식 검증 함수
   * 지정된 패턴과 일치하는지 확인
   */
  function createRegexValidator(
    field: string,
    pattern: RegExp,
    errorMessage: string
  ): ValidationRule {
    return {
      field,
      validate: (value) => {
        if (!value || value === '') return { valid: true, type: 'error' };
        if (!pattern.test(String(value))) {
          return { valid: false, message: errorMessage, type: 'error' };
        }
        return { valid: true, type: 'error' };
      }
    };
  }

  const testData = [
    { 상품코드: 'ABC123', 점수: 85, 상품명: 'Product A', SKU: 'SKU001' },
    { 상품코드: 'XY', 점수: 45, 상품명: 'Product B', SKU: 'INVALID' },
    { 상품코드: 'DEF456', 점수: 150, 상품명: 'Very Long Product Name That Exceeds Maximum Length', SKU: 'S' }
  ];

  const validators: ValidationRule[] = [
    createRangeValidator('점수', 0, 100),
    createLengthValidator('상품명', 3, 50),
    createRegexValidator('상품코드', /^[A-Z]{3}\d{3}$/, '상품코드는 영문 3자 + 숫자 3자 형식이어야 합니다'),
    createRegexValidator('SKU', /^SKU\d{3}$/, 'SKU는 SKU + 숫자 3자 형식이어야 합니다')
  ];

  return (
    <ImportPreview
      data={testData}
      columns={['상품코드', '점수', '상품명', 'SKU']}
      validators={validators}
      previewRows={3}
    />
  );
}
