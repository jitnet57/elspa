/**
 * Hook: useGetTherapists
 *
 * 목적: 5초 폴링으로 테라피스트 현황을 실시간 조회
 * 사용: const { data: therapists, isLoading } = useGetTherapists();
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api/mock-adapter';

interface Therapist {
  id: number;
  name: string;
  status: 'idle' | 'in_service' | 'resting' | 'checked_out';
  current_bed?: number;
  remaining_minutes?: number;
  specialty?: string;
}

interface TherapistsResponse {
  data: Therapist[];
  total_count: number;
  idle_count: number;
  in_service_count: number;
  resting_count: number;
  checked_out_count: number;
}

/**
 * 테라피스트 목록을 5초 폴링으로 조회
 *
 * @param status - (선택) 필터: 'idle' | 'in_service' | 'resting' | 'checked_out'
 * @returns { data: Therapist[], isLoading, error, ... }
 */
export const useGetTherapists = (
  status?: string
): UseQueryResult<Therapist[], Error> => {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['therapists', status],
    queryFn: async () => {
      const therapists = await apiClient.getTherapists(status);
      return therapists;
    },
    refetchInterval: 5000,
    staleTime: 3000,
    gcTime: 10000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: 1000,
  });
};

/**
 * 테라피스트 상태별 통계
 *
 * @returns { stats: { idle, in_service, resting, checked_out }, total }
 */
export const useTherapistStats = () => {
  const { data: therapists = [], isLoading, error } = useGetTherapists();

  const stats = {
    idle: therapists.filter(t => t.status === 'idle').length,
    in_service: therapists.filter(t => t.status === 'in_service').length,
    resting: therapists.filter(t => t.status === 'resting').length,
    checked_out: therapists.filter(t => t.status === 'checked_out').length,
  };

  const checkedIn = stats.idle + stats.in_service + stats.resting;

  return {
    stats,
    checkedIn,
    total: therapists.length,
    isLoading,
    error,
  };
};

/**
 * 대기 중인 테라피스트 (즉시 배정 가능)
 *
 * @returns { data: Therapist[], isLoading, error }
 */
export const useIdleTherapists = (): UseQueryResult<Therapist[], Error> => {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['therapists-idle'],
    queryFn: async () => {
      const therapists = await apiClient.getTherapists('idle');
      return therapists;
    },
    refetchInterval: 5000,
    staleTime: 3000,
    gcTime: 10000,
  });
};

/**
 * 현재 서비스 중인 테라피스트
 *
 * @returns { data: Therapist[], isLoading, error }
 */
export const useInServiceTherapists = (): UseQueryResult<Therapist[], Error> => {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['therapists-in_service'],
    queryFn: async () => {
      const therapists = await apiClient.getTherapists('in_service');
      return therapists;
    },
    refetchInterval: 5000,
    staleTime: 3000,
    gcTime: 10000,
  });
};

/**
 * 휴식 중인 테라피스트
 *
 * @returns { data: Therapist[], isLoading, error }
 */
export const useRestingTherapists = (): UseQueryResult<Therapist[], Error> => {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['therapists-resting'],
    queryFn: async () => {
      const therapists = await apiClient.getTherapists('resting');
      return therapists;
    },
    refetchInterval: 5000,
    staleTime: 3000,
    gcTime: 10000,
  });
};

/**
 * 특정 테라피스트 조회
 *
 * @param therapistId - 테라피스트 ID
 * @returns { data: Therapist, isLoading, error }
 */
export const useGetTherapist = (
  therapistId?: number
): UseQueryResult<Therapist | null, Error> => {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['therapist', therapistId],
    queryFn: async () => {
      if (!therapistId) return null;
      return await apiClient.getTherapist(therapistId);
    },
    enabled: !!therapistId,
    refetchInterval: 5000,
    staleTime: 3000,
  });
};
