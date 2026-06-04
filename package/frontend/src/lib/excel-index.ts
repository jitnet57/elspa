// ============================================================
// 📌 파일명: excel-index.ts
// 📋 목적: Excel 파싱 관련 모든 함수와 타입을 한 곳에서 내보냅니다
// 🔧 기술: TypeScript 인덱싱
// 📅 작성일: 2025-06-02
// ============================================================

/**
 * 📚 Excel 처리 모듈 인덱스
 *
 * 이 파일은 excel-parser.ts의 모든 공개 함수와 타입을 내보냅니다.
 * 더 편리한 import를 위해 사용하세요.
 *
 * 사용 예:
 * import { parseExcelFile, ParsedExcelFile } from '@/lib/excel-index';
 */

// ==================== 타입 내보내기 ====================
export type { ParsedExcelFile } from './excel-parser';

// ==================== 함수 내보내기 ====================
export {
  parseExcelFile,
  getExcelSheets,
  validateExcelFile,
  formatDataForDisplay,
} from './excel-parser';

// ==================== 타입 정의 (참고용) ====================

/**
 * 📖 Excel 처리 관련 주요 타입
 *
 * ParsedExcelFile:
 * - headers: 열 헤더 배열
 * - data: 파싱된 데이터 배열
 * - sheetName: 시트 이름
 * - rowCount: 행 개수
 * - error?: 에러 메시지
 */
