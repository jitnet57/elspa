/**
 * ============================================================
 * 📌 파일명: bed-split-service.ts
 * 📋 목적: 침대 그룹 분할 API 통신 서비스
 * 🔧 사용처: BedGroupingSettings 컴포넌트
 * 📤 API: PUT /api/admin/beds/reorganize
 * 📅 작성일: 2026-05-28
 * ============================================================
 */

import { BedSplitRequest, BedSplitResponse } from '../types/bed-split';

/**
 * 📌 함수명: splitBedGroup
 * 📋 목적: 침대 그룹을 분할하고 API에 저장
 * 🔧 매개변수:
 *    - groupId: 분할할 그룹 ID
 *    - splitInto: 분할할 그룹 수
 *    - newGroups: 분할된 새로운 그룹 정보
 * 📤 반환값: BedSplitResponse
 * 📅 작성일: 2026-05-28
 * ⚠️ 주의: API 엔드포인트는 백엔드에서 구현 필요
 */
export async function splitBedGroup(
  groupId: string,
  splitInto: number,
  newGroups: Array<{ name: string; description: string; bedIds: string[] }>
): Promise<BedSplitResponse> {
  try {
    const request: BedSplitRequest = {
      groupId,
      splitInto,
      newGroups,
    };

    const response = await fetch('/api/admin/beds/reorganize', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API 오류: ${response.statusText}`);
    }

    const data: BedSplitResponse = await response.json();
    return data;
  } catch (error) {
    console.error('침대 그룹 분할 오류:', error);
    return {
      success: false,
      message: '그룹 분할에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * 📌 함수명: validateSplitCount
 * 📋 목적: 분할 수 유효성 검사
 * 🔧 매개변수:
 *    - splitCount: 분할 수
 *    - totalBeds: 전체 침대 수
 * 📤 반환값: { valid: boolean, error?: string }
 * 📅 작성일: 2026-05-28
 */
export function validateSplitCount(
  splitCount: number,
  totalBeds: number
): { valid: boolean; error?: string } {
  if (splitCount < 2) {
    return { valid: false, error: '최소 2개 이상의 그룹으로 분할해야 합니다.' };
  }

  if (splitCount > totalBeds) {
    return {
      valid: false,
      error: `분할 수는 침대 수(${totalBeds}개)를 초과할 수 없습니다.`,
    };
  }

  return { valid: true };
}
