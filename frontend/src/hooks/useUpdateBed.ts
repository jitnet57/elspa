// ============================================================
// 📌 Hook: useUpdateBed
// 📋 목적: Monitor에서 침대 상태/배정이 바뀌면 "즉시" Supabase에 저장
// 🔄 흐름: 변경 → 우선 저장(Supabase) → 성공 시 쿼리 무효화 → 모니터 다시 불러옴
//         (Google Sheet 반영은 Apps Script가 1시간 단위로 별도 처리)
// 📅 작성일: 2026-05-31
// ============================================================

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api/get-client';

interface Bed {
  id: number;
  bed_number: number;
  room_zone: string;
  status: 'available' | 'reserved' | 'in_service' | 'cleaning';
  customer_name?: string;
  therapist_name?: string;
  service_name?: string;
  starts_at?: string;
  ends_at?: string;
}

/**
 * 침대 변경을 즉시 저장하는 mutation 훅.
 *
 * @example
 *   const { mutate: updateBed, isPending } = useUpdateBed();
 *   updateBed({ bedId: 1, patch: { status: 'in_service', therapist_name: '최준호' } });
 */
export const useUpdateBed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bedId, patch }: { bedId: number; patch: Partial<Bed> }) => {
      const client = getApiClient() as any;
      if (typeof client.updateBed !== 'function') {
        throw new Error('현재 데이터 소스는 쓰기를 지원하지 않습니다 (Supabase 활성화 필요).');
      }
      return client.updateBed(bedId, patch) as Promise<Bed>;
    },
    // ✅ 저장 성공 → 모니터 폴링 쿼리 무효화 → 즉시 다시 불러옴
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['bed'] });
    },
  });
};
