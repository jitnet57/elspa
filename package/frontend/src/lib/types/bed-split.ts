/**
 * ============================================================
 * 📌 파일명: bed-split.ts
 * 📋 목적: 침대 그룹 분할 관련 타입 정의
 * 🔧 사용처: BedGroupingSettings, API 통신
 * 📅 작성일: 2026-05-28
 * ============================================================
 */

export interface BedSplitRequest {
  /** 분할할 그룹 ID */
  groupId: string;

  /** 분할할 그룹 수 (2 이상) */
  splitInto: number;

  /** 분할된 새로운 그룹들 */
  newGroups: Array<{
    name: string;
    description: string;
    bedIds: string[];
  }>;
}

export interface BedSplitResponse {
  /** 성공 여부 */
  success: boolean;

  /** 응답 메시지 */
  message: string;

  /** 분할된 그룹 ID 배열 */
  newGroupIds?: string[];

  /** 에러 상세 정보 */
  error?: string;
}
