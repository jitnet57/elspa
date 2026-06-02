"use client";

import { useState, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

// ============================================================
// 📌 컴포넌트명: ColumnMappingUI
// 📋 목적: Excel 칼럼을 DB 필드로 매핑하는 UI 컴포넌트
//   - 엑셀 컬럼 헤더와 DB 필드 자동 감지
//   - 드롭다운으로 수동 매핑 가능
//   - 필수 필드 vs 선택적 필드 구분
//   - 매핑되지 않은 컬럼 경고 표시
// 🔧 매개변수:
//   - excelColumns: string[] - 엑셀 파일의 컬럼명 배열
//   - dbFields: DBField[] - DB 테이블의 필드 정의
//   - onMappingChange: (mapping: ColumnMapping) => void - 매핑 변경 콜백
//   - autoDetect?: boolean - 자동 감지 활성화 여부 (기본값: true)
// 📤 반환값: JSX.Element
// 📅 작성일: 2026-06-02
// ============================================================

/**
 * DB 필드 정의 타입
 * - fieldName: 데이터베이스 컬럼명
 * - displayName: UI에서 표시할 필드명 (한국어/영어)
 * - dataType: 데이터 타입 (string, number, date, boolean, decimal)
 * - isRequired: 필수 필드 여부
 * - description: 필드 설명
 */
export interface DBField {
  fieldName: string;
  displayName: string;
  dataType: "string" | "number" | "date" | "boolean" | "decimal";
  isRequired: boolean;
  description?: string;
}

/**
 * 컬럼 매핑 타입
 * - excelColumn: 엑셀 컬럼명
 * - dbField: 매핑된 DB 필드명 (null이면 미매핑)
 * - isAutoDetected: 자동 감지 여부
 */
export interface ColumnMapping {
  excelColumn: string;
  dbField: string | null;
  isAutoDetected: boolean;
}

export interface ColumnMappingUIProps {
  excelColumns: string[];
  dbFields: DBField[];
  onMappingChange?: (mapping: ColumnMapping[]) => void;
  autoDetect?: boolean;
}

/**
 * 엑셀 컬럼명과 DB 필드명의 유사도를 계산합니다 (0~1)
 * - 정확히 일치: 1.0
 * - 부분 일치 (포함): 0.8
 * - 유사한 단어 조합: 0.6
 * - 일치 없음: 0.0
 */
function calculateSimilarity(excelCol: string, dbField: string): number {
  const excel = excelCol.toLowerCase().trim();
  const db = dbField.toLowerCase().trim();

  // 정확히 일치
  if (excel === db) return 1.0;

  // 단어 기반 비교 (공백이나 언더스코어로 분리)
  const excelWords = excel.split(/[\s_-]+/).filter((w) => w.length > 0);
  const dbWords = db.split(/[\s_-]+/).filter((w) => w.length > 0);

  // 매치되는 단어 개수
  const matchedWords = excelWords.filter((ew) =>
    dbWords.some((dw) => dw.includes(ew) || ew.includes(dw)),
  ).length;

  if (matchedWords === 0) return 0.0;
  if (matchedWords === excelWords.length && matchedWords === dbWords.length)
    return 0.9;

  // 부분 일치: 한 컬럼이 다른 컬럼에 포함되는 경우
  if (excel.includes(db) || db.includes(excel)) return 0.8;

  // 단어 일치 비율
  return (matchedWords / Math.max(excelWords.length, dbWords.length)) * 0.7;
}

/**
 * 자동 매핑 로직
 * 각 엑셀 컬럼에 대해 가장 유사한 DB 필드를 찾습니다 (threshold: 0.6 이상)
 */
function autoDetectMappings(
  excelColumns: string[],
  dbFields: DBField[],
): Map<string, string | null> {
  const mapping = new Map<string, string | null>();

  for (const excelCol of excelColumns) {
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const dbField of dbFields) {
      const score = calculateSimilarity(excelCol, dbField.displayName);
      if (score > bestScore && score >= 0.6) {
        bestScore = score;
        bestMatch = dbField.fieldName;
      }
    }

    mapping.set(excelCol, bestMatch);
  }

  return mapping;
}

export default function ColumnMappingUI({
  excelColumns,
  dbFields,
  onMappingChange,
  autoDetect = true,
}: ColumnMappingUIProps) {
  // 자동 매핑 로직으로 초기값 설정
  const initialAutoMappings = useMemo(
    () => (autoDetect ? autoDetectMappings(excelColumns, dbFields) : new Map()),
    [excelColumns, dbFields, autoDetect],
  );

  // 사용자 수정 매핑 추적 (로컬 상태)
  const [userMappings, setUserMappings] = useState<Map<string, string | null>>(
    new Map(initialAutoMappings),
  );

  // 매핑 업데이트 및 콜백 실행
  const handleMappingChange = (excelColumn: string, dbField: string | null) => {
    const newMappings = new Map(userMappings);
    newMappings.set(excelColumn, dbField);
    setUserMappings(newMappings);

    // 부모 컴포넌트에 알림
    if (onMappingChange) {
      const mappingArray: ColumnMapping[] = Array.from(
        newMappings.entries(),
      ).map(([excel, db]) => ({
        excelColumn: excel,
        dbField: db,
        isAutoDetected: initialAutoMappings.get(excel) === db,
      }));
      onMappingChange(mappingArray);
    }
  };

  // 통계 계산
  const stats = useMemo(() => {
    const total = excelColumns.length;
    const mapped = Array.from(userMappings.values()).filter(
      (v) => v !== null,
    ).length;
    const unmapped = total - mapped;
    const requiredUnmapped = excelColumns.filter((excel) => {
      const mappedField = userMappings.get(excel);
      if (!mappedField) return false;
      return (
        dbFields.find((f) => f.fieldName === mappedField)?.isRequired ?? false
      );
    }).length;

    return { total, mapped, unmapped, requiredUnmapped };
  }, [userMappings, excelColumns, dbFields]);

  const requiredFields = useMemo(
    () => dbFields.filter((f) => f.isRequired),
    [dbFields],
  );

  const optionalFields = useMemo(
    () => dbFields.filter((f) => !f.isRequired),
    [dbFields],
  );

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
      {/* 타이틀 및 설명 */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">엑셀 컬럼 매핑</h2>
        <p className="text-sm text-gray-600">
          엑셀 파일의 각 컬럼을 데이터베이스 필드로 매핑하세요. 필수 필드는
          반드시 매핑되어야 합니다.
        </p>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="총 컬럼" value={stats.total} color="blue" />
        <StatCard label="매핑됨" value={stats.mapped} color="emerald" />
        <StatCard
          label="미매핑"
          value={stats.unmapped}
          color={stats.unmapped > 0 ? "amber" : "gray"}
        />
        <StatCard
          label="필수 미매핑"
          value={stats.requiredUnmapped}
          color={stats.requiredUnmapped > 0 ? "red" : "gray"}
        />
      </div>

      {/* 필드 설명 (선택적) */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          <strong className="block mb-2">필드 분류:</strong>
          <div className="space-y-1">
            <div>
              • <span className="font-semibold">필수 필드</span> (
              {requiredFields.length}개):{" "}
              {requiredFields.map((f) => f.displayName).join(", ")}
            </div>
            <div>
              • <span className="font-semibold">선택적 필드</span> (
              {optionalFields.length}개):{" "}
              {optionalFields.map((f) => f.displayName).join(", ")}
            </div>
          </div>
        </div>
      </div>

      {/* 매핑 테이블 */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                엑셀 컬럼
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                매핑 대상
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                상태
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                설명
              </th>
            </tr>
          </thead>
          <tbody>
            {excelColumns.map((excelColumn, index) => {
              const mappedFieldName = userMappings.get(excelColumn);
              const mappedField = dbFields.find(
                (f) => f.fieldName === mappedFieldName,
              );
              const isAutoDetected =
                initialAutoMappings.get(excelColumn) === mappedFieldName;
              const isMapped = mappedFieldName !== null;
              const isMappedToRequired = isMapped && mappedField?.isRequired;

              return (
                <tr
                  key={index}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  {/* 엑셀 컬럼명 */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {excelColumn}
                    </div>
                  </td>

                  {/* 드롭다운 (매핑 선택) */}
                  <td className="px-4 py-3">
                    <ColumnDropdown
                      selectedField={mappedFieldName}
                      dbFields={dbFields}
                      onChange={(field) =>
                        handleMappingChange(excelColumn, field)
                      }
                    />
                  </td>

                  {/* 상태 표시 */}
                  <td className="px-4 py-3">
                    <StatusBadge
                      isMapped={isMapped}
                      isAutoDetected={isAutoDetected}
                      isMappedToRequired={isMappedToRequired}
                    />
                  </td>

                  {/* 필드 설명 */}
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {mappedField?.description || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 경고 메시지 */}
      {stats.unmapped > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900">미매핑 컬럼 있음</h4>
            <p className="text-sm text-amber-800 mt-1">
              {stats.unmapped}개의 컬럼이 아직 매핑되지 않았습니다. 모든 컬럼을
              매핑하거나 무시하도록 설정하세요.
            </p>
          </div>
        </div>
      )}

      {stats.requiredUnmapped > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">필수 필드 미매핑</h4>
            <p className="text-sm text-red-800 mt-1">
              필수 필드가 매핑되지 않았습니다. 데이터 임포트가 실패할 수
              있습니다.
            </p>
          </div>
        </div>
      )}

      {/* 성공 상태 */}
      {stats.unmapped === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-emerald-900">매핑 완료</h4>
            <p className="text-sm text-emerald-800 mt-1">
              모든 엑셀 컬럼이 매핑되었습니다. 임포트를 진행할 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 개별 통계 카드 컴포넌트
 */
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "emerald" | "amber" | "red" | "gray";
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    red: "bg-red-50 border-red-200 text-red-900",
    gray: "bg-gray-50 border-gray-200 text-gray-900",
  };

  return (
    <div className={`border rounded-lg p-4 text-center ${colorClasses[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium opacity-75">{label}</div>
    </div>
  );
}

/**
 * 드롭다운 컴포넌트 (매핑 선택)
 */
function ColumnDropdown({
  selectedField,
  dbFields,
  onChange,
}: {
  selectedField: string | null;
  dbFields: DBField[];
  onChange: (field: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedFieldDisplay = selectedField
    ? dbFields.find((f) => f.fieldName === selectedField)?.displayName ||
      selectedField
    : "선택 안함";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all flex items-center justify-between"
      >
        <span className="truncate">{selectedFieldDisplay}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
          {/* "선택 안함" 옵션 */}
          <button
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b border-gray-200 transition-colors"
          >
            <span className="text-gray-600">— 선택 안함 —</span>
          </button>

          {/* 필수 필드 그룹 */}
          {dbFields.filter((f) => f.isRequired).length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
                필수 필드
              </div>
              {dbFields
                .filter((f) => f.isRequired)
                .map((field) => (
                  <button
                    key={field.fieldName}
                    onClick={() => {
                      onChange(field.fieldName);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 transition-colors ${
                      selectedField === field.fieldName
                        ? "bg-blue-50 text-blue-900 font-medium"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {field.displayName}
                  </button>
                ))}
            </>
          )}

          {/* 선택적 필드 그룹 */}
          {dbFields.filter((f) => !f.isRequired).length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
                선택적 필드
              </div>
              {dbFields
                .filter((f) => !f.isRequired)
                .map((field) => (
                  <button
                    key={field.fieldName}
                    onClick={() => {
                      onChange(field.fieldName);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 transition-colors ${
                      selectedField === field.fieldName
                        ? "bg-blue-50 text-blue-900 font-medium"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {field.displayName}
                  </button>
                ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 상태 배지 컴포넌트
 */
function StatusBadge({
  isMapped,
  isAutoDetected,
  isMappedToRequired,
}: {
  isMapped: boolean;
  isAutoDetected: boolean;
  isMappedToRequired: boolean;
}) {
  if (!isMapped) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
        <AlertTriangle className="w-3 h-3" />
        미매핑
      </span>
    );
  }

  if (isAutoDetected) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
        자동 감지됨
      </span>
    );
  }

  if (isMappedToRequired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        필수 필드
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
      <CheckCircle2 className="w-3 h-3" />
      매핑됨
    </span>
  );
}
