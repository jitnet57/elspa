// ============================================================
// 📌 모듈명: excel-parser
// 📋 목적: Excel/CSV 파일을 파싱하고 헤더를 추출하는 유틸리티
// 🔧 의존성: xlsx 라이브러리
// 📅 작성일: 2025-06-02
// ============================================================

import * as XLSX from 'xlsx';

/**
 * 📊 Excel 파일 헤더 및 데이터 추출 인터페이스
 */
export interface ParsedExcelFile {
  headers: string[];
  data: Record<string, any>[];
  sheetName: string;
  rowCount: number;
  error?: string;
}

/**
 * ============================================================
 * 📌 함수명: parseExcelFile
 * 📋 목적: Excel/CSV 파일을 읽고 헤더와 데이터를 추출합니다
 * 🔧 매개변수:
 *    - file: File - 업로드한 Excel/CSV 파일
 *    - sheetIndex?: number - 읽을 시트 인덱스 (기본값: 0)
 * 📤 반환값: Promise<ParsedExcelFile>
 * ============================================================
 */
export async function parseExcelFile(
  file: File,
  sheetIndex: number = 0
): Promise<ParsedExcelFile> {
  try {
    // 1️⃣ 파일을 ArrayBuffer로 읽기
    const arrayBuffer = await file.arrayBuffer();

    // 2️⃣ XLSX 라이브러리로 워크북 파싱
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

    // 3️⃣ 요청한 시트가 존재하는지 확인
    if (sheetIndex >= workbook.SheetNames.length) {
      return {
        headers: [],
        data: [],
        sheetName: '',
        rowCount: 0,
        error: `Sheet index ${sheetIndex} does not exist. Available sheets: ${workbook.SheetNames.length}`,
      };
    }

    // 4️⃣ 지정된 시트 가져오기
    const sheetName = workbook.SheetNames[sheetIndex];
    const worksheet = workbook.Sheets[sheetName];

    // 5️⃣ 워크시트를 JSON으로 변환 (첫 행을 헤더로 사용)
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

    // 6️⃣ 헤더 추출 (첫 번째 행의 키)
    const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

    // 7️⃣ 결과 반환
    return {
      headers,
      data: jsonData,
      sheetName,
      rowCount: jsonData.length,
      error: undefined,
    };
  } catch (error) {
    // 파싱 실패 시 에러 메시지 반환
    const errorMessage = error instanceof Error ? error.message : '파일 파싱 실패';
    console.error('❌ Excel 파싱 오류:', errorMessage);
    return {
      headers: [],
      data: [],
      sheetName: '',
      rowCount: 0,
      error: errorMessage,
    };
  }
}

/**
 * ============================================================
 * 📌 함수명: getExcelSheets
 * 📋 목적: Excel 파일의 모든 시트명을 조회합니다
 * 🔧 매개변수: file: File - Excel 파일
 * 📤 반환값: Promise<string[]> - 시트명 배열
 * ============================================================
 */
export async function getExcelSheets(file: File): Promise<string[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    return workbook.SheetNames;
  } catch (error) {
    console.error('❌ 시트명 조회 실패:', error);
    return [];
  }
}

/**
 * ============================================================
 * 📌 함수명: validateExcelFile
 * 📋 목적: 파일 타입 및 크기 유효성 검사
 * 🔧 매개변수:
 *    - file: File - 검증할 파일
 *    - maxSizeMB?: number - 최대 파일 크기 (MB, 기본값: 10)
 * 📤 반환값: { valid: boolean, error?: string }
 * ============================================================
 */
export function validateExcelFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // 허용된 파일 확장자
  const allowedExtensions = ['xlsx', 'xls', 'csv'];

  // 파일 확장자 추출
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

  // 1️⃣ 파일 타입 검증
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `지원하지 않는 파일 형식입니다. (지원: ${allowedExtensions.join(', ')})`,
    };
  }

  // 2️⃣ 파일 크기 검증
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `파일 크기가 ${maxSizeMB}MB를 초과했습니다. (현재: ${fileSizeMB.toFixed(2)}MB)`,
    };
  }

  return { valid: true };
}

/**
 * ============================================================
 * 📌 함수명: formatDataForDisplay
 * 📋 목적: 파싱된 데이터를 테이블 표시용으로 포맷팅합니다
 * 🔧 매개변수:
 *    - data: Record<string, any>[] - 파싱된 데이터
 *    - maxRows?: number - 표시할 최대 행 수
 * 📤 반환값: Record<string, any>[]
 * ============================================================
 */
export function formatDataForDisplay(
  data: Record<string, any>[],
  maxRows: number = 10
): Record<string, any>[] {
  // 데이터가 maxRows를 초과하면 처음 maxRows개만 반환
  return data.slice(0, maxRows);
}
