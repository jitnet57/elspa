/**
 * Hook: useGetBeds
 *
 * 목적: 5초 폴링으로 침대 목록을 실시간 조회
 * 사용: const { data: beds, isLoading, error } = useGetBeds();
 *
 * 구현 방식:
 * - React Query useQuery로 캐싱 + 자동 갱신
 * - refetchInterval: 5000ms (5초)
 * - staleTime: 3000ms (3초 후 stale 처리)
 * - 윈도우 포커스 시 재갱신
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api/mock-adapter';

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

interface BedsResponse {
  data: Bed[];
  total_count: number;
}

/**
 * 침대 목록을 5초 폴링으로 조회
 *
 * @param roomZone - (선택) 필터: '마사지룸1' | '마사지룸2' | 'VIP룸' | '커플룸'
 * @returns { data: Bed[], isLoading, error, ... }
 */
export const useGetBeds = (roomZone?: string): UseQueryResult<Bed[], Error> => {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['beds', roomZone], // roomZone 변경 시 새 쿼리
    queryFn: async () => {
      const beds = await apiClient.getBeds(roomZone);
      return beds;
    },
    refetchInterval: 5000, // 5초마다 자동 갱신
    staleTime: 3000, // 3초 후 stale 처리 → refetch 가능
    gcTime: 10000, // 10초 후 캐시 제거 (이전 cacheTime)
    refetchOnWindowFocus: true, // 윈도우 포커스 시 갱신
    refetchOnReconnect: true, // 네트워크 재연결 시 갱신
    retry: 3, // 실패 시 3번 재시도
    retryDelay: 1000, // 1초 후 재시도
  });
};

/**
 * 특정 침대를 조회 (필요 시)
 *
 * @param bedId - 침대 ID
 * @returns { data: Bed, isLoading, error, ... }
 */
export const useGetBed = (bedId?: number): UseQueryResult<Bed | null, Error> => {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['bed', bedId],
    queryFn: async () => {
      if (!bedId) return null;
      return await apiClient.getBed(bedId);
    },
    enabled: !!bedId, // bedId가 있을 때만 쿼리 실행
    refetchInterval: 5000,
    staleTime: 3000,
  });
};

/**
 * 침대 목록 (room별로 분류)
 *
 * @returns { data: { [roomZone]: Bed[] }, isLoading, error, ... }
 */
export const useBedsByRoom = () => {
  const { data: beds = [], isLoading, error } = useGetBeds();

  const bedsByRoom = {
    '마사지룸1': beds.filter(b => b.room_zone === '마사지룸1'),
    '마사지룸2': beds.filter(b => b.room_zone === '마사지룸2'),
    'VIP룸': beds.filter(b => b.room_zone === 'VIP룸'),
    '커플룸': beds.filter(b => b.room_zone === '커플룸'),
  };

  return {
    bedsByRoom,
    beds,
    isLoading,
    error,
  };
};

/**
 * 침대 통계 (상태별 개수)
 *
 * @returns { stats: { available, reserved, in_service, cleaning }, isLoading, error }
 */
export const useBedStats = () => {
  const { data: beds = [], isLoading, error } = useGetBeds();

  const stats = {
    available: beds.filter(b => b.status === 'available').length,
    reserved: beds.filter(b => b.status === 'reserved').length,
    in_service: beds.filter(b => b.status === 'in_service').length,
    cleaning: beds.filter(b => b.status === 'cleaning').length,
  };

  return {
    stats,
    total: beds.length,
    isLoading,
    error,
  };
};
