'use client';

/**
 * ============================================================
 * 📌 컴포넌트명: ExcelImportPage
 * 📋 목적: 4단계 Excel 데이터 가져오기 위자드
 *         (테이블 선택 → 파일 업로드 → 컬럼 매핑 → 미리보기 및 검증)
 * 🔧 기능: 드래그앤드롭 파일 업로드 + 컬럼 자동 감지 + 검증 경고
 * 📦 상태 관리: Zustand 기반 다단계 폼 상태
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

import { useState, useCallback, useMemo } from 'react';
import { useT } from '@/lib/i18n';
import * as XLSX from 'xlsx';

// ============================================================
// 🔧 타입 정의
// ============================================================

/** 지원되는 테이블 목록 */
interface SupportedTable {
  id: string;
  name: string;
  label: string;
  dbFields: DbField[];
  description: string;
}

/** 데이터베이스 필드 정의 */
interface DbField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'email';
  required: boolean;
  validator?: (value: any) => boolean | string;
}

/** 4단계 import 상태 */
interface ImportState {
  step: 1 | 2 | 3 | 4;
  selectedTable: SupportedTable | null;
  rawFile: File | null;
  sheetName: string;
  excelColumns: string[];
  data: any[];
  columnMapping: Record<string, string>; // excelCol -> dbField
  validationWarnings: ValidationWarning[];
  isProcessing: boolean;
}

/** 검증 경고 메시지 */
interface ValidationWarning {
  rowIndex: number;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// ============================================================
// 📋 지원되는 테이블 설정
// ============================================================

const SUPPORTED_TABLES: SupportedTable[] = [
  {
    id: 'therapists',
    name: 'therapists',
    label: '테라피스트 (Therapists)',
    description: '마사지 테라피스트 정보',
    dbFields: [
      { name: 'name', label: '이름 (Name)', type: 'string', required: true },
      { name: 'phone', label: '전화번호 (Phone)', type: 'string', required: true },
      { name: 'email', label: '이메일 (Email)', type: 'email', required: false },
      { name: 'hourly_rate', label: '시급 (Hourly Rate)', type: 'number', required: true },
      { name: 'license_number', label: '자격증 번호', type: 'string', required: false },
      { name: 'start_date', label: '입사일 (Start Date)', type: 'date', required: false },
      { name: 'is_active', label: '활성 여부 (Active)', type: 'boolean', required: false },
    ],
  },
  {
    id: 'employees',
    name: 'employees',
    label: '직원 (Employees)',
    description: '관리자, 드라이버, 스태프 정보',
    dbFields: [
      { name: 'name', label: '이름 (Name)', type: 'string', required: true },
      { name: 'phone', label: '전화번호 (Phone)', type: 'string', required: true },
      { name: 'email', label: '이메일 (Email)', type: 'email', required: false },
      { name: 'employee_type', label: '직급 (Type)', type: 'string', required: true },
      { name: 'salary', label: '급여 (Salary)', type: 'number', required: true },
      { name: 'ssn', label: '사회보장번호', type: 'string', required: false },
      { name: 'start_date', label: '입사일 (Start Date)', type: 'date', required: false },
      { name: 'is_active', label: '활성 여부 (Active)', type: 'boolean', required: false },
    ],
  },
  {
    id: 'companies',
    name: 'companies',
    label: '업체 (Companies)',
    description: '고객사/협력사 정보',
    dbFields: [
      { name: 'company_name', label: '업체명 (Company Name)', type: 'string', required: true },
      { name: 'representative', label: '담당자 (Representative)', type: 'string', required: false },
      { name: 'phone', label: '전화번호 (Phone)', type: 'string', required: true },
      { name: 'email', label: '이메일 (Email)', type: 'email', required: false },
      { name: 'address', label: '주소 (Address)', type: 'string', required: false },
      { name: 'business_type', label: '업종 (Business Type)', type: 'string', required: false },
      { name: 'contract_date', label: '계약일 (Contract Date)', type: 'date', required: false },
      { name: 'is_active', label: '활성 여부 (Active)', type: 'boolean', required: false },
    ],
  },
  {
    id: 'massage_bookings',
    name: 'massage_bookings',
    label: '마사지 예약 (Massage Bookings)',
    description: '마사지 예약 내역',
    dbFields: [
      { name: 'guest_name', label: '손님 이름 (Guest Name)', type: 'string', required: true },
      { name: 'guest_phone', label: '손님 전화번호', type: 'string', required: true },
      { name: 'therapist_id', label: '테라피스트 ID', type: 'number', required: false },
      { name: 'service_type', label: '서비스 타입', type: 'string', required: true },
      { name: 'service_price', label: '서비스 가격', type: 'number', required: true },
      { name: 'date', label: '예약 날짜 (Date)', type: 'date', required: true },
      { name: 'time', label: '예약 시간 (Time)', type: 'string', required: true },
      { name: 'status', label: '상태 (Status)', type: 'string', required: false },
      { name: 'notes', label: '메모 (Notes)', type: 'string', required: false },
    ],
  },
  {
    id: 'expenses',
    name: 'expenses',
    label: '지출 (Expenses)',
    description: '운영비, 비용 기록',
    dbFields: [
      { name: 'category', label: '카테고리 (Category)', type: 'string', required: true },
      { name: 'description', label: '설명 (Description)', type: 'string', required: true },
      { name: 'amount', label: '금액 (Amount)', type: 'number', required: true },
      { name: 'report_date', label: '기록일 (Report Date)', type: 'date', required: true },
      { name: 'payment_method', label: '결제 방법 (Payment Method)', type: 'string', required: false },
      { name: 'approver', label: '승인자 (Approver)', type: 'string', required: false },
      { name: 'receipt_url', label: '영수증 URL', type: 'string', required: false },
    ],
  },
];

// ============================================================
// 📌 메인 컴포넌트
// ============================================================

export default function ExcelImportPage() {
  const t = useT();

  // 전체 상태 관리
  const [state, setState] = useState<ImportState>({
    step: 1,
    selectedTable: null,
    rawFile: null,
    sheetName: '',
    excelColumns: [],
    data: [],
    columnMapping: {},
    validationWarnings: [],
    isProcessing: false,
  });

  // ============================================================
  // 🔄 Step 1: 테이블 선택
  // ============================================================
  const handleSelectTable = (table: SupportedTable) => {
    setState((prev) => ({
      ...prev,
      selectedTable: table,
      step: 2,
      // Reset subsequent steps
      rawFile: null,
      sheetName: '',
      excelColumns: [],
      data: [],
      columnMapping: {},
      validationWarnings: [],
    }));
  };

  // ============================================================
  // 🔄 Step 2: 파일 업로드
  // ============================================================
  const handleFileSelect = async (file: File) => {
    setState((prev) => ({ ...prev, isProcessing: true }));
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Excel 데이터를 JSON으로 변환
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // 배열 형식
        defval: '',
      });

      // 첫 번째 행을 헤더로 처리
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1);

      setState((prev) => ({
        ...prev,
        step: 3,
        rawFile: file,
        sheetName: firstSheetName,
        excelColumns: headers,
        data: rows.map((row: any) =>
          headers.reduce(
            (acc, col, idx) => {
              acc[col] = row[idx] || '';
              return acc;
            },
            {} as Record<string, any>
          )
        ),
        columnMapping: {}, // 초기화 - 자동 매핑 전에
      }));
    } catch (error) {
      console.error('Excel 파일 읽기 오류:', error);
      alert(t('파일을 읽을 수 없습니다. Excel 형식인지 확인하세요.', 'Could not read file. Please check if it is a valid Excel file.'));
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  // 드래그앤드롭 핸들러
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // ============================================================
  // 🔄 Step 3: 컬럼 매핑
  // ============================================================
  const handleMapColumn = (excelCol: string, dbFieldName: string) => {
    setState((prev) => ({
      ...prev,
      columnMapping: {
        ...prev.columnMapping,
        [excelCol]: dbFieldName,
      },
    }));
  };

  const proceedToPreview = () => {
    setState((prev) => ({ ...prev, step: 4 }));
    validateData();
  };

  // ============================================================
  // 🔄 Step 4: 데이터 검증
  // ============================================================
  const validateData = () => {
    if (!state.selectedTable) return;

    const warnings: ValidationWarning[] = [];
    const reversedMapping = Object.fromEntries(
      Object.entries(state.columnMapping).map(([excel, db]) => [db, excel])
    );

    state.data.forEach((row, rowIndex) => {
      state.selectedTable!.dbFields.forEach((field) => {
        const excelCol = reversedMapping[field.name];
        const value = excelCol ? row[excelCol] : undefined;

        // 필수 필드 검증
        if (field.required && (!value || String(value).trim() === '')) {
          warnings.push({
            rowIndex: rowIndex + 2, // +2: 헤더 1줄 + 1부터 시작
            field: field.label,
            message: `필수 항목입니다 (Required field)`,
            severity: 'error',
          });
        }

        // 타입 별 검증
        if (value && String(value).trim() !== '') {
          if (field.type === 'email' && !isValidEmail(String(value))) {
            warnings.push({
              rowIndex: rowIndex + 2,
              field: field.label,
              message: `유효하지 않은 이메일 주소 (Invalid email)`,
              severity: 'warning',
            });
          }
          if (field.type === 'number' && isNaN(Number(value))) {
            warnings.push({
              rowIndex: rowIndex + 2,
              field: field.label,
              message: `숫자가 아닙니다 (Not a number)`,
              severity: 'error',
            });
          }
          if (field.type === 'date' && !isValidDate(String(value))) {
            warnings.push({
              rowIndex: rowIndex + 2,
              field: field.label,
              message: `유효하지 않은 날짜 형식 (Invalid date format)`,
              severity: 'warning',
            });
          }
        }

        // 커스텀 검증
        if (field.validator && value) {
          const result = field.validator(value);
          if (result !== true) {
            warnings.push({
              rowIndex: rowIndex + 2,
              field: field.label,
              message: typeof result === 'string' ? result : '검증 실패 (Validation failed)',
              severity: 'warning',
            });
          }
        }
      });
    });

    setState((prev) => ({
      ...prev,
      validationWarnings: warnings,
      isProcessing: false,
    }));
  };

  // ============================================================
  // 🎨 UI 렌더링
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
            📊 Excel 데이터 가져오기 (Excel Import Wizard)
          </h1>
          <p className="text-gray-400 text-sm">
            4단계 위자드로 데이터를 가져오세요. 컬럼을 매핑하고 검증 후 일괄 저장합니다.
          </p>
        </div>

        {/* 진행률 표시 */}
        <div className="mb-8">
          <StepIndicator currentStep={state.step} totalSteps={4} />
        </div>

        {/* 단계별 콘텐츠 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {state.step === 1 && <Step1TableSelection tables={SUPPORTED_TABLES} onSelect={handleSelectTable} />}

          {state.step === 2 && state.selectedTable && (
            <Step2FileUpload
              table={state.selectedTable}
              onFileSelect={handleFileSelect}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              isProcessing={state.isProcessing}
              onBack={() => setState((prev) => ({ ...prev, step: 1, selectedTable: null }))}
            />
          )}

          {state.step === 3 && state.selectedTable && (
            <Step3ColumnMapping
              table={state.selectedTable}
              excelColumns={state.excelColumns}
              columnMapping={state.columnMapping}
              sampleData={state.data.slice(0, 3)}
              onMapColumn={handleMapColumn}
              onNext={proceedToPreview}
              onBack={() => setState((prev) => ({ ...prev, step: 2, columnMapping: {} }))}
            />
          )}

          {state.step === 4 && state.selectedTable && (
            <Step4Preview
              table={state.selectedTable}
              data={state.data}
              columnMapping={state.columnMapping}
              validationWarnings={state.validationWarnings}
              onBack={() => setState((prev) => ({ ...prev, step: 3 }))}
              onSubmit={() => {
                // TODO: API 호출로 데이터 저장
                alert('✅ 데이터 저장 준비 완료! (API 연결 대기)');
              }}
            />
          )}
        </div>

        {/* 푸터 */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>최대 10,000줄 까지 한번에 가져올 수 있습니다. (Max 10,000 rows per import)</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 📌 Step 1: 테이블 선택
// ============================================================

function Step1TableSelection({
  tables,
  onSelect,
}: {
  tables: SupportedTable[];
  onSelect: (table: SupportedTable) => void;
}) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
        Step 1: 테이블 선택 (Select Table)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => onSelect(table)}
            className="group text-left p-5 rounded-xl border border-white/10 hover:border-purple-500/50 bg-white/3 hover:bg-white/8 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition">
                {table.label}
              </h3>
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-sm text-gray-400 mb-3">{table.description}</p>
            <div className="text-xs text-gray-500">
              필드 {table.dbFields.length}개 • 필수 {table.dbFields.filter((f) => f.required).length}개
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 📌 Step 2: 파일 업로드
// ============================================================

function Step2FileUpload({
  table,
  onFileSelect,
  onDrop,
  onDragOver,
  isProcessing,
  onBack,
}: {
  table: SupportedTable;
  onFileSelect: (file: File) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  isProcessing: boolean;
  onBack: () => void;
}) {
  const fileInputRef = useState<HTMLInputElement | null>(null)[1];

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
        Step 2: 파일 업로드 (Upload File)
      </h2>
      <p className="text-gray-400 text-sm mb-6">
        선택된 테이블: <span className="font-bold text-purple-300">{table.label}</span>
      </p>

      {/* 드래그앤드롭 영역 */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="border-2 border-dashed border-purple-400/50 rounded-xl p-8 sm:p-12 text-center bg-white/5 hover:bg-white/8 hover:border-purple-400 transition-all duration-300 cursor-pointer"
      >
        <div className="text-4xl mb-3">📁</div>
        <h3 className="text-lg font-bold text-white mb-2">
          Excel 파일을 여기로 드래그하세요 (Drag Excel file here)
        </h3>
        <p className="text-sm text-gray-400 mb-4">또는 (or)</p>
        <label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => e.target.files && onFileSelect(e.target.files[0])}
            disabled={isProcessing}
            className="hidden"
          />
          <span className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition cursor-pointer">
            {isProcessing ? '처리 중... (Processing...)' : '파일 선택 (Choose File)'}
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-4">
          지원 형식: .xlsx, .xls, .csv (MAX 10MB)
        </p>
      </div>

      {/* 네비게이션 */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition"
        >
          ← 뒤로 (Back)
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 📌 Step 3: 컬럼 매핑
// ============================================================

function Step3ColumnMapping({
  table,
  excelColumns,
  columnMapping,
  sampleData,
  onMapColumn,
  onNext,
  onBack,
}: {
  table: SupportedTable;
  excelColumns: string[];
  columnMapping: Record<string, string>;
  sampleData: Record<string, any>[];
  onMapColumn: (excelCol: string, dbFieldName: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  // 자동 매핑 (컬럼명 유사도 기반)
  const suggestMapping = useCallback(() => {
    const auto: Record<string, string> = {};
    excelColumns.forEach((excelCol) => {
      const suggestion = table.dbFields.find((f) =>
        f.name.toLowerCase().includes(excelCol.toLowerCase()) ||
        excelCol.toLowerCase().includes(f.name.toLowerCase())
      );
      if (suggestion) {
        auto[excelCol] = suggestion.name;
      }
    });
    Object.entries(auto).forEach(([excel, db]) => onMapColumn(excel, db));
  }, [excelColumns, table.dbFields, onMapColumn]);

  // 매핑 상태 확인
  const allMapped = excelColumns.every((col) => columnMapping[col]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Step 3: 컬럼 매핑 (Map Columns)
        </h2>
        <button
          onClick={suggestMapping}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition"
        >
          💡 자동 매핑 (Auto Map)
        </button>
      </div>

      <p className="text-gray-400 text-sm mb-6">
        Excel의 컬럼을 데이터베이스 필드에 매핑하세요. (Map Excel columns to database fields)
      </p>

      {/* 매핑 테이블 */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-gray-300 font-bold">Excel 컬럼</th>
              <th className="text-left py-3 px-4 text-gray-300 font-bold">→ 매핑 →</th>
              <th className="text-left py-3 px-4 text-gray-300 font-bold">DB 필드</th>
              <th className="text-left py-3 px-4 text-gray-300 font-bold">샘플 데이터</th>
            </tr>
          </thead>
          <tbody>
            {excelColumns.map((excelCol, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/3 transition">
                <td className="py-3 px-4 text-white font-mono text-xs">{excelCol}</td>
                <td className="py-3 px-4 text-center text-purple-400">→</td>
                <td className="py-3 px-4">
                  <select
                    value={columnMapping[excelCol] || ''}
                    onChange={(e) => onMapColumn(excelCol, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:border-purple-400 focus:outline-none"
                  >
                    <option value="">선택... (Select)</option>
                    {table.dbFields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.label}
                        {field.required ? ' *' : ''}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-4 text-gray-400 text-xs font-mono truncate">
                  {sampleData[0]?.[excelCol] || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 매핑 상태 경고 */}
      {!allMapped && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-300">
            ⚠️ 아직 매핑되지 않은 Excel 컬럼이 있습니다. (Some columns are not mapped yet)
          </p>
        </div>
      )}

      {/* 필수 필드 확인 */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-300 font-bold mb-2">필수 필드 (Required Fields):</p>
        <div className="text-xs text-blue-200 space-y-1">
          {table.dbFields
            .filter((f) => f.required)
            .map((f) => {
              const isMapped = Object.values(columnMapping).includes(f.name);
              return (
                <div key={f.name} className={isMapped ? 'text-emerald-300' : 'text-red-300'}>
                  {isMapped ? '✓' : '✗'} {f.label}
                </div>
              );
            })}
        </div>
      </div>

      {/* 네비게이션 */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition"
        >
          ← 뒤로 (Back)
        </button>
        <button
          onClick={onNext}
          disabled={!allMapped}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-bold transition"
        >
          미리보기 → (Preview →)
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 📌 Step 4: 미리보기 및 검증
// ============================================================

function Step4Preview({
  table,
  data,
  columnMapping,
  validationWarnings,
  onBack,
  onSubmit,
}: {
  table: SupportedTable;
  data: Record<string, any>[];
  columnMapping: Record<string, string>;
  validationWarnings: ValidationWarning[];
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [expandedWarnings, setExpandedWarnings] = useState<boolean>(false);

  const reversedMapping = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(columnMapping).map(([excel, db]) => [db, excel])
      ),
    [columnMapping]
  );

  // 검증 통계
  const errorCount = validationWarnings.filter((w) => w.severity === 'error').length;
  const warningCount = validationWarnings.filter((w) => w.severity === 'warning').length;
  const canSubmit = errorCount === 0;

  // 테이블로 변환된 데이터
  const transformedData = data.map((row) => {
    const transformed: Record<string, any> = {};
    table.dbFields.forEach((field) => {
      const excelCol = reversedMapping[field.name];
      transformed[field.label] = excelCol ? row[excelCol] : '';
    });
    return transformed;
  });

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
        Step 4: 미리보기 & 검증 (Preview & Validation)
      </h2>

      {/* 요약 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="📊"
          label="가져올 행 (Rows)"
          value={data.length}
          color="blue"
        />
        <StatCard
          icon="✓"
          label="에러 (Errors)"
          value={errorCount}
          color={errorCount > 0 ? 'red' : 'green'}
        />
        <StatCard
          icon="⚠️"
          label="경고 (Warnings)"
          value={warningCount}
          color={warningCount > 0 ? 'yellow' : 'green'}
        />
        <StatCard
          icon="🎯"
          label="상태 (Status)"
          value={canSubmit ? '준비됨' : '오류'}
          color={canSubmit ? 'green' : 'red'}
        />
      </div>

      {/* 검증 결과 */}
      {validationWarnings.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setExpandedWarnings(!expandedWarnings)}
            className="w-full p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-left font-bold text-yellow-300 hover:bg-yellow-500/20 transition"
          >
            {expandedWarnings ? '▼' : '▶'} 검증 메시지 (Validation Messages):
            {validationWarnings.length}개
          </button>
          {expandedWarnings && (
            <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
              {validationWarnings.map((w, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-xs font-mono ${
                    w.severity === 'error'
                      ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                      : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300'
                  }`}
                >
                  <span className="font-bold">행 {w.rowIndex}:</span> {w.field} — {w.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 데이터 미리보기 테이블 */}
      <div className="mb-6 overflow-x-auto">
        <h3 className="text-sm font-bold text-white mb-3">
          샘플 행 (Sample Rows) — 처음 5개만 표시
        </h3>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              {table.dbFields.slice(0, 5).map((field) => (
                <th
                  key={field.name}
                  className="py-2 px-3 text-left text-gray-300 font-bold"
                >
                  {field.label}
                </th>
              ))}
              {table.dbFields.length > 5 && (
                <th className="py-2 px-3 text-left text-gray-400">
                  +{table.dbFields.length - 5}개 필드
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {transformedData.slice(0, 5).map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-white/5 hover:bg-white/3 transition"
              >
                {table.dbFields.slice(0, 5).map((field) => (
                  <td
                    key={field.name}
                    className="py-2 px-3 text-gray-300 truncate"
                  >
                    {row[field.label]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 제출 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition"
        >
          ← 뒤로 (Back)
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded-lg font-bold transition flex-1 sm:flex-none"
        >
          {canSubmit ? '✓ 저장하기 (Submit)' : '오류 수정 후 제출 (Fix errors to submit)'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 🎨 보조 컴포넌트들
// ============================================================

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const steps = [
    { num: 1, label: '테이블 선택' },
    { num: 2, label: '파일 업로드' },
    { num: 3, label: '컬럼 매핑' },
    { num: 4, label: '미리보기' },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center gap-2 sm:gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
              step.num <= currentStep
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-400'
            }`}
          >
            {step.num < currentStep ? '✓' : step.num}
          </div>
          <span
            className={`hidden sm:inline text-sm font-bold ${
              step.num <= currentStep ? 'text-white' : 'text-gray-500'
            }`}
          >
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div
              className={`h-0.5 w-6 sm:w-12 ${
                step.num < currentStep ? 'bg-purple-600' : 'bg-white/10'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'red' | 'yellow';
}) {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-500/30 bg-blue-500/10',
    green: 'border-emerald-500/30 bg-emerald-500/10',
    red: 'border-red-500/30 bg-red-500/10',
    yellow: 'border-yellow-500/30 bg-yellow-500/10',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

// ============================================================
// 🔧 유틸리티 함수들
// ============================================================

function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function isValidDate(dateStr: string): boolean {
  // ISO, YYYY-MM-DD, MM/DD/YYYY 형식 지원
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
}
