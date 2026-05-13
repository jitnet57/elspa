/**
 * Hook: useMatching
 *
 * 목적: 매칭 제안, 확정, What-if 시뮬레이션
 * 사용 방식: useMutation 기반 (수동 트리거)
 */

'use client';

import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api/mock-adapter';

interface MatchingProposal {
  therapist_id: number;
  therapist_name: string;
  specialty: string;
  score: number;
  availability: string;
}

interface MatchingConfirmation {
  bed_id: number;
  therapist_id: number;
  booking_id: number;
  confirmed_at: string;
}

/**
 * 매칭 제안 생성
 *
 * 사용 예시:
 * ```
 * const { mutate, isPending, data } = useProposeMatching();
 *
 * const handlePropose = async () => {
 *   mutate({ booking_id: 1001, service_type: '스웨디시' });
 * };
 * ```
 */
export const useProposeMatching = () => {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ bookingId, serviceType }: { bookingId: number; serviceType: string }) => {
      return await apiClient.proposeMatching(bookingId, serviceType);
    },
    onSuccess: (data) => {
      console.log('✅ 매칭 제안 생성됨:', data);
    },
    onError: (error) => {
      console.error('❌ 매칭 제안 실패:', error);
    },
  });
};

/**
 * 매칭 확정
 *
 * 사용 예시:
 * ```
 * const { mutate, isPending } = useConfirmMatching();
 *
 * const handleConfirm = async () => {
 *   mutate({ booking_id: 1001, therapist_id: 1 });
 * };
 * ```
 */
export const useConfirmMatching = () => {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ bookingId, therapistId }: { bookingId: number; therapistId: number }) => {
      return await apiClient.confirmMatching(bookingId, therapistId);
    },
    onSuccess: (data) => {
      console.log('✅ 매칭 확정됨:', data);
      // 여기서 캐시 무효화 (invalidateQueries)를 해야 함
      // 하지만 hooks에서는 queryClient가 필요하므로, 컴포넌트에서 처리
    },
    onError: (error) => {
      console.error('❌ 매칭 확정 실패:', error);
    },
  });
};

/**
 * What-if 시뮬레이션 (DB 쓰기 없음)
 *
 * 사용 예시:
 * ```
 * const { mutate, isPending, data } = useSimulateMatching();
 *
 * const handleSimulate = async () => {
 *   mutate({ service_type: '스웨디시' });
 * };
 * ```
 */
export const useSimulateMatching = () => {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({ serviceType }: { serviceType: string }) => {
      return await apiClient.simulateMatching(serviceType);
    },
    onSuccess: (data) => {
      console.log('📊 시뮬레이션 결과:', data);
    },
    onError: (error) => {
      console.error('❌ 시뮬레이션 실패:', error);
    },
  });
};

/**
 * 테라피스트 체크인
 *
 * 사용 예시:
 * ```
 * const { mutate } = useCheckInTherapist();
 * mutate(therapist_id);
 * ```
 */
export const useCheckInTherapist = () => {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (therapistId: number) => {
      return await apiClient.checkInTherapist(therapistId);
    },
    onSuccess: (data) => {
      console.log('✅ 체크인 완료:', data?.name);
    },
    onError: (error) => {
      console.error('❌ 체크인 실패:', error);
    },
  });
};

/**
 * 테라피스트 체크아웃
 *
 * 사용 예시:
 * ```
 * const { mutate } = useCheckOutTherapist();
 * mutate(therapist_id);
 * ```
 */
export const useCheckOutTherapist = () => {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async (therapistId: number) => {
      return await apiClient.checkOutTherapist(therapistId);
    },
    onSuccess: (data) => {
      console.log('✅ 체크아웃 완료:', data?.name);
    },
    onError: (error) => {
      console.error('❌ 체크아웃 실패:', error);
    },
  });
};

/**
 * 침대 상태 업데이트
 *
 * 사용 예시:
 * ```
 * const { mutate } = useUpdateBedStatus();
 * mutate({
 *   bed_id: 5,
 *   status: 'in_service',
 *   customer_name: '김민준',
 *   therapist_name: '박유진'
 * });
 * ```
 */
export const useUpdateBedStatus = () => {
  const apiClient = getApiClient();

  return useMutation({
    mutationFn: async ({
      bedId,
      status,
      ...rest
    }: {
      bedId: number;
      status: string;
      customer_name?: string;
      therapist_id?: number;
      therapist_name?: string;
      service_name?: string;
    }) => {
      return await apiClient.updateBedStatus(bedId, status as any, rest);
    },
    onSuccess: (data) => {
      console.log('✅ 침대 상태 업데이트:', data);
    },
    onError: (error) => {
      console.error('❌ 상태 업데이트 실패:', error);
    },
  });
};

/**
 * 예측: 평균 대기시간
 *
 * 사용 예시:
 * ```
 * const { data: prediction } = usePredictedWaitTime();
 * ```
 */
export const usePredictedWaitTime = () => {
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['prediction-wait-time'],
    queryFn: async () => {
      return await apiClient.getPredictedWaitTime();
    },
    refetchInterval: 5000,
    staleTime: 3000,
    gcTime: 10000,
  });
};
