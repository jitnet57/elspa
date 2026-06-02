/**
 * ============================================================
 * 📌 파일명: ColumnMappingUI.example.tsx
 * 📋 목적: ColumnMappingUI 컴포넌트 사용 예시 및 통합 가이드
 * 🔧 사용법:
 *   1. CompanySettlement(업체 정산) 임포트에 사용
 *   2. SettlementTransaction(정산 거래) 임포트에 사용
 *   3. 커스텀 데이터 모델과 통합 가능
 * 📤 반환값: React 페이지 컴포넌트
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

"use client";

import { useState } from "react";
import ColumnMappingUI, { DBField, ColumnMapping } from "./ColumnMappingUI";

/**
 * 예시 1: CompanySettlement 모델 매핑
 * - 업체 월간 정산 데이터를 엑셀에서 임포트
 * - 필수 필드: company_id, settlement_period_year, settlement_period_month
 * - 선택적 필드: total_revenue, guest_revenue, credit_revenue 등
 */
export function CompanySettlementMappingExample() {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [selectedExcelData, setSelectedExcelData] = useState<string[]>([
    "Company ID",
    "Settlement Year",
    "Settlement Month",
    "Total Revenue",
    "Guest Revenue",
    "Credit Revenue",
    "Waived Revenue",
    "Recovery Rate",
    "Platform Fee Rate",
    "Status",
    "Notes",
  ]);

  // CompanySettlement DB 필드 정의
  const companySettlementFields: DBField[] = [
    {
      fieldName: "company_id",
      displayName: "업체 ID",
      dataType: "number",
      isRequired: true,
      description: "고유한 업체 ID (필수)",
    },
    {
      fieldName: "settlement_period_year",
      displayName: "정산 연도",
      dataType: "number",
      isRequired: true,
      description: "정산 기간 연도 (예: 2026)",
    },
    {
      fieldName: "settlement_period_month",
      displayName: "정산 월",
      dataType: "number",
      isRequired: true,
      description: "정산 기간 월 (1-12)",
    },
    {
      fieldName: "total_revenue",
      displayName: "총 매출액",
      dataType: "decimal",
      isRequired: false,
      description: "총 매출액 (PHP)",
    },
    {
      fieldName: "guest_revenue",
      displayName: "비회원 매출",
      dataType: "decimal",
      isRequired: false,
      description: "회수율 100% 매출",
    },
    {
      fieldName: "credit_revenue",
      displayName: "외상 매출",
      dataType: "decimal",
      isRequired: false,
      description: "회수율 변동 매출",
    },
    {
      fieldName: "waived_revenue",
      displayName: "제외 매출",
      dataType: "decimal",
      isRequired: false,
      description: "정산 제외 매출",
    },
    {
      fieldName: "recovery_rate",
      displayName: "회수율",
      dataType: "decimal",
      isRequired: false,
      description: "외상 회수율 (%)",
    },
    {
      fieldName: "platform_fee_rate",
      displayName: "플랫폼 수수료율",
      dataType: "decimal",
      isRequired: false,
      description: "플랫폼 수수료 (%)",
    },
    {
      fieldName: "status",
      displayName: "정산 상태",
      dataType: "string",
      isRequired: false,
      description: "draft, approved, settled, rejected, confirmed",
    },
    {
      fieldName: "notes",
      displayName: "메모",
      dataType: "string",
      isRequired: false,
      description: "일반 메모",
    },
  ];

  const handleMappingChange = (newMappings: ColumnMapping[]) => {
    setMappings(newMappings);
    console.log("업체 정산 매핑 변경:", newMappings);

    // 백엔드에 전송할 데이터 형식
    const mappingForApi = {
      model: "CompanySettlement",
      mappings: newMappings,
      timestamp: new Date().toISOString(),
    };
    console.log("API 전송 데이터:", mappingForApi);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">업체 정산 데이터 임포트</h1>
      <ColumnMappingUI
        excelColumns={selectedExcelData}
        dbFields={companySettlementFields}
        onMappingChange={handleMappingChange}
        autoDetect={true}
      />

      {/* 매핑 결과 표시 */}
      {mappings.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">매핑 결과</h3>
          <pre className="text-xs bg-white p-3 rounded border border-blue-100 overflow-auto">
            {JSON.stringify(mappings, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * 예시 2: SettlementTransaction 모델 매핑
 * - 정산 거래 상세 기록 임포트
 * - 필수 필드: company_settlement_id, transaction_type, settlement_category, amount
 * - 선택적 필드: booking_id, customer_id, recovery_rate 등
 */
export function SettlementTransactionMappingExample() {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [selectedExcelData, setSelectedExcelData] = useState<string[]>([
    "Settlement ID",
    "Transaction Type",
    "Category",
    "Booking ID",
    "Customer ID",
    "Amount",
    "Recovery Rate",
    "Transaction Date",
    "Notes",
  ]);

  const settlementTransactionFields: DBField[] = [
    {
      fieldName: "company_settlement_id",
      displayName: "정산 ID",
      dataType: "number",
      isRequired: true,
      description: "정산 레코드 ID (필수)",
    },
    {
      fieldName: "transaction_type",
      displayName: "거래 유형",
      dataType: "string",
      isRequired: true,
      description: "booking, refund, dispute, adjustment",
    },
    {
      fieldName: "settlement_category",
      displayName: "정산 분류",
      dataType: "string",
      isRequired: true,
      description: "guest, credit, waived",
    },
    {
      fieldName: "amount",
      displayName: "거래 금액",
      dataType: "decimal",
      isRequired: true,
      description: "거래 금액 (PHP)",
    },
    {
      fieldName: "booking_id",
      displayName: "예약 ID",
      dataType: "number",
      isRequired: false,
      description: "연관된 예약 ID",
    },
    {
      fieldName: "customer_id",
      displayName: "고객 ID",
      dataType: "number",
      isRequired: false,
      description: "고객 ID",
    },
    {
      fieldName: "recovery_rate",
      displayName: "회수율",
      dataType: "decimal",
      isRequired: false,
      description: "거래별 회수율 (%)",
    },
    {
      fieldName: "transaction_date",
      displayName: "거래 날짜",
      dataType: "date",
      isRequired: false,
      description: "YYYY-MM-DD 형식",
    },
    {
      fieldName: "notes",
      displayName: "메모",
      dataType: "string",
      isRequired: false,
      description: "거래 관련 메모",
    },
  ];

  const handleMappingChange = (newMappings: ColumnMapping[]) => {
    setMappings(newMappings);
    console.log("정산 거래 매핑 변경:", newMappings);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">정산 거래 데이터 임포트</h1>
      <ColumnMappingUI
        excelColumns={selectedExcelData}
        dbFields={settlementTransactionFields}
        onMappingChange={handleMappingChange}
        autoDetect={true}
      />

      {mappings.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h3 className="font-semibold text-emerald-900 mb-2">매핑 결과</h3>
          <pre className="text-xs bg-white p-3 rounded border border-emerald-100 overflow-auto">
            {JSON.stringify(mappings, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * 예시 3: 커스텀 데이터 모델 매핑
 * - 임의의 데이터베이스 테이블과 통합 가능한 제너릭 사용법
 */
export function CustomDataModelMappingExample() {
  const [modelName, setModelName] = useState<
    "therapist" | "booking" | "customer"
  >("therapist");
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);

  // 다양한 모델의 필드 정의
  const modelFields: Record<string, DBField[]> = {
    therapist: [
      {
        fieldName: "name",
        displayName: "테라피스트 이름",
        dataType: "string",
        isRequired: true,
      },
      {
        fieldName: "specialty",
        displayName: "전문 분야",
        dataType: "string",
        isRequired: true,
      },
      {
        fieldName: "experience_years",
        displayName: "경력 년수",
        dataType: "number",
        isRequired: false,
      },
      {
        fieldName: "phone",
        displayName: "전화번호",
        dataType: "string",
        isRequired: false,
      },
      {
        fieldName: "email",
        displayName: "이메일",
        dataType: "string",
        isRequired: false,
      },
    ],
    booking: [
      {
        fieldName: "customer_id",
        displayName: "고객 ID",
        dataType: "number",
        isRequired: true,
      },
      {
        fieldName: "therapist_id",
        displayName: "테라피스트 ID",
        dataType: "number",
        isRequired: true,
      },
      {
        fieldName: "booking_date",
        displayName: "예약 날짜",
        dataType: "date",
        isRequired: true,
      },
      {
        fieldName: "total_price",
        displayName: "총 가격",
        dataType: "decimal",
        isRequired: false,
      },
      {
        fieldName: "status",
        displayName: "상태",
        dataType: "string",
        isRequired: false,
      },
    ],
    customer: [
      {
        fieldName: "name",
        displayName: "고객명",
        dataType: "string",
        isRequired: true,
      },
      {
        fieldName: "phone",
        displayName: "전화번호",
        dataType: "string",
        isRequired: true,
      },
      {
        fieldName: "email",
        displayName: "이메일",
        dataType: "string",
        isRequired: false,
      },
      {
        fieldName: "address",
        displayName: "주소",
        dataType: "string",
        isRequired: false,
      },
      {
        fieldName: "registration_date",
        displayName: "등록 날짜",
        dataType: "date",
        isRequired: false,
      },
    ],
  };

  // 모델별 샘플 엑셀 컬럼
  const sampleExcelColumns: Record<string, string[]> = {
    therapist: [
      "Name",
      "Specialty",
      "Years of Experience",
      "Phone",
      "Email",
      "Bio",
    ],
    booking: [
      "Customer ID",
      "Therapist ID",
      "Date",
      "Price",
      "Payment Status",
      "Notes",
    ],
    customer: [
      "Customer Name",
      "Phone Number",
      "Email Address",
      "Street Address",
      "Registration Date",
      "Membership Type",
    ],
  };

  const currentFields = modelFields[modelName];
  const currentExcelColumns = sampleExcelColumns[modelName];

  const handleMappingChange = (newMappings: ColumnMapping[]) => {
    setMappings(newMappings);
    console.log(`${modelName} 모델 매핑:`, newMappings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">커스텀 데이터 모델 임포트</h1>

        {/* 모델 선택 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            임포트할 데이터 모델 선택:
          </label>
          <div className="grid grid-cols-3 gap-4">
            {(["therapist", "booking", "customer"] as const).map((model) => (
              <button
                key={model}
                onClick={() => {
                  setModelName(model);
                  setMappings([]);
                }}
                className={`p-4 rounded-lg border-2 transition-all font-medium text-center ${
                  modelName === model
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                {model === "therapist" && "테라피스트"}
                {model === "booking" && "예약"}
                {model === "customer" && "고객"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ColumnMappingUI
        excelColumns={currentExcelColumns}
        dbFields={currentFields}
        onMappingChange={handleMappingChange}
        autoDetect={true}
      />

      {mappings.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">매핑 결과</h3>
          <div className="text-xs space-y-2">
            {mappings.map((m, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center bg-white p-2 rounded border border-gray-100"
              >
                <span className="font-medium text-gray-700">
                  {m.excelColumn}
                </span>
                <span className="text-gray-600">→</span>
                <span
                  className={
                    m.dbField
                      ? "text-emerald-600 font-medium"
                      : "text-amber-600"
                  }
                >
                  {m.dbField || "(미매핑)"}
                </span>
                {m.isAutoDetected && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    자동
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 예시 4: API 통합 패턴
 * - 매핑된 데이터를 백엔드에 전송하는 방법
 */
export async function sendMappingToBackend(
  mappings: ColumnMapping[],
  model: string,
  excelFileData: unknown,
): Promise<{ success: boolean; importedRows: number; errors: string[] }> {
  try {
    // 1. 매핑 데이터 검증
    const unmappedColumns = mappings.filter((m) => m.dbField === null);
    if (unmappedColumns.length > 0) {
      return {
        success: false,
        importedRows: 0,
        errors: [
          `미매핑 컬럼: ${unmappedColumns.map((m) => m.excelColumn).join(", ")}`,
        ],
      };
    }

    // 2. 백엔드에 매핑 데이터 전송
    const response = await fetch("/api/import/mapping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        mappings,
        excelData: excelFileData,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      importedRows: 0,
      errors: [
        `API 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
      ],
    };
  }
}

/**
 * 예시 5: 완전한 페이지 컴포넌트
 * - 파일 업로드 + 매핑 + 임포트의 전체 워크플로우
 */
export function CompleteImportWorkflowExample() {
  const [step, setStep] = useState<"upload" | "mapping" | "import">("upload");
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 실제로는 xlsx 라이브러리로 파일 읽기
    console.log("파일 업로드:", file.name);
    setExcelColumns([
      "Company ID",
      "Settlement Year",
      "Settlement Month",
      "Total Revenue",
    ]);
    setStep("mapping");
  };

  const handleImport = async () => {
    setIsLoading(true);
    try {
      const result = await sendMappingToBackend(
        mappings,
        "CompanySettlement",
        {}, // 실제 데이터
      );

      if (result.success) {
        setStep("import");
        alert(`성공! ${result.importedRows}행을 임포트했습니다.`);
      } else {
        alert(`실패: ${result.errors.join(", ")}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* 단계 표시 */}
      <div className="flex items-center justify-between">
        {["upload", "mapping", "import"].map((s, idx) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step === s
                  ? "bg-blue-500 text-white"
                  : step > s
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-300 text-white"
              }`}
            >
              {idx + 1}
            </div>
            {idx < 2 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  step > s ? "bg-emerald-500" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* 단계별 콘텐츠 */}
      {step === "upload" && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="block w-full"
          />
        </div>
      )}

      {step === "mapping" && excelColumns.length > 0 && (
        <>
          <ColumnMappingUI
            excelColumns={excelColumns}
            dbFields={[
              {
                fieldName: "company_id",
                displayName: "업체 ID",
                dataType: "number",
                isRequired: true,
              },
              {
                fieldName: "settlement_period_year",
                displayName: "정산 연도",
                dataType: "number",
                isRequired: true,
              },
              {
                fieldName: "settlement_period_month",
                displayName: "정산 월",
                dataType: "number",
                isRequired: true,
              },
              {
                fieldName: "total_revenue",
                displayName: "총 매출액",
                dataType: "decimal",
                isRequired: false,
              },
            ]}
            onMappingChange={setMappings}
          />

          <button
            onClick={handleImport}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? "임포트 중..." : "임포트 시작"}
          </button>
        </>
      )}

      {step === "import" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-emerald-900 mb-2">
            임포트 완료!
          </h2>
          <p className="text-emerald-800">
            데이터가 성공적으로 업로드되었습니다.
          </p>
        </div>
      )}
    </div>
  );
}
