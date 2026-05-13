/**
 * Hook: useMonitorPolling
 *
 * 목적: `/monitor` 페이지 전용 통합 폴링 (Beds + Therapists 동시 조회)
 * LANGGRAPH DAG 구현:
 *   BedsPolling ━━┓
 *                 ├─→ StatsCalculation ─→ PredictionEngine ─→ NotificationQueue
 *   TherapistsPolling ┛
 *
 * 사용: const { beds, therapists, stats, predictions, isLoading } = useMonitorPolling();
 */

'use client';

import { useEffect, useState } from 'react';
import { useGetBeds, useBedStats } from './useGetBeds';
import { useGetTherapists, useTherapistStats } from './useGetTherapists';
import { usePredictedWaitTime } from './useMatching';

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

interface Therapist {
  id: number;
  name: string;
  status: 'idle' | 'in_service' | 'resting' | 'checked_out';
  current_bed?: number;
  remaining_minutes?: number;
  specialty?: string;
}

interface BedStats {
  available: number;
  reserved: number;
  in_service: number;
  cleaning: number;
  total: number;
}

interface TherapistStats {
  idle: number;
  in_service: number;
  resting: number;
  checked_out: number;
  checkedIn: number;
  total: number;
}

interface Prediction {
  average_wait_minutes: number;
  next_available_therapist: {
    id: number;
    name: string;
    availability: string;
  };
  idle_therapists_count: number;
  in_service_therapists_count: number;
}

interface MonitorData {
  beds: Bed[];
  therapists: Therapist[];
  bedStats: BedStats;
  therapistStats: TherapistStats;
  predictions: Prediction | null;
  isLoading: boolean;
  error: Error | null;
  lastRefetch: Date | null;
  refetchCount: number;
}

/**
 * 모니터 페이지 통합 폴링 (5초 주기)
 *
 * 특징:
 * - BedsPolling + TherapistsPolling 병렬 실행 (독립적)
 * - StatsCalculation (자동 계산)
 * - PredictionEngine (자동 계산)
 * - refetchCount로 폴링 횟수 추적
 *
 * @returns { beds, therapists, bedStats, therapistStats, predictions, isLoading, error, lastRefetch, refetchCount }
 */
export const useMonitorPolling = (): MonitorData => {
  // Node 1, 2: BedsPolling + TherapistsPolling (병렬)
  const bedsQuery = useGetBeds();
  const therapistsQuery = useGetTherapists();

  // Node 3, 4: StatsCalculation + PredictionEngine
  const { stats: bedStats, isLoading: bedStatsLoading } = useBedStats();
  const { stats: therapistStats, isLoading: therapistStatsLoading } = useTherapistStats();
  const { data: prediction } = usePredictedWaitTime();

  // 메타데이터 (UI 디버깅용)
  const [lastRefetch, setLastRefetch] = useState<Date | null>(null);
  const [refetchCount, setRefetchCount] = useState(0);

  // 둘 다 성공 시 refetchCount 증가
  useEffect(() => {
    if (bedsQuery.data && therapistsQuery.data) {
      setLastRefetch(new Date());
      setRefetchCount(prev => prev + 1);
    }
  }, [bedsQuery.data, therapistsQuery.data]);

  // 오류 처리 (한쪽이라도 오류면 전체 오류)
  const error = (bedsQuery.error || therapistsQuery.error) as Error | null;

  // 로딩 상태 (둘 다 완료되어야 false)
  const isLoading = bedsQuery.isLoading || therapistsQuery.isLoading;

  return {
    // 데이터
    beds: bedsQuery.data || [],
    therapists: therapistsQuery.data || [],

    // 통계
    bedStats: {
      available: bedStats.available,
      reserved: bedStats.reserved,
      in_service: bedStats.in_service,
      cleaning: bedStats.cleaning,
      total: bedStats.total,
    },
    therapistStats: {
      idle: therapistStats.stats.idle,
      in_service: therapistStats.stats.in_service,
      resting: therapistStats.stats.resting,
      checked_out: therapistStats.stats.checked_out,
      checkedIn: therapistStats.checkedIn,
      total: therapistStats.total,
    },

    // 예측
    predictions: prediction || null,

    // 상태
    isLoading,
    error,
    lastRefetch,
    refetchCount,
  };
};

/**
 * 침대별 room 분류
 *
 * @param beds - 침대 배열
 * @returns { '마사지룸1': Bed[], '마사지룸2': Bed[], 'VIP룸': Bed[], '커플룸': Bed[] }
 */
export const classifyBedsByRoom = (beds: Bed[]) => {
  return {
    '마사지룸1': beds.filter(b => b.room_zone === '마사지룸1'),
    '마사지룸2': beds.filter(b => b.room_zone === '마사지룸2'),
    'VIP룸': beds.filter(b => b.room_zone === 'VIP룸'),
    '커플룸': beds.filter(b => b.room_zone === '커플룸'),
  };
};

/**
 * 테라피스트별 상태 분류
 *
 * @param therapists - 테라피스트 배열
 * @returns { idle: [], in_service: [], resting: [], checked_out: [] }
 */
export const classifyTherapistsByStatus = (therapists: Therapist[]) => {
  return {
    idle: therapists.filter(t => t.status === 'idle'),
    in_service: therapists.filter(t => t.status === 'in_service'),
    resting: therapists.filter(t => t.status === 'resting'),
    checked_out: therapists.filter(t => t.status === 'checked_out'),
  };
};

/**
 * 폴링 통계 (디버깅용)
 *
 * @param refetchCount - 폴링 횟수
 * @param lastRefetch - 마지막 갱신 시간
 * @returns { estimated_uptime_seconds, polls_per_minute, ... }
 */
export const calculatePollingStats = (refetchCount: number, lastRefetch: Date | null) => {
  if (!lastRefetch) return null;

  const now = new Date();
  const uptime = (now.getTime() - lastRefetch.getTime()) / 1000 + (refetchCount - 1) * 5;
  const pollingRate = (refetchCount / uptime) * 60; // polls per minute

  return {
    estimated_uptime_seconds: Math.round(uptime),
    polls_per_minute: Math.round(pollingRate),
    refetch_count: refetchCount,
    last_refetch: lastRefetch,
  };
};
