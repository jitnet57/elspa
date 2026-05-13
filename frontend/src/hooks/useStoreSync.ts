/**
 * Hook: useStoreSync
 *
 * 목적: React Query에서 가져온 데이터를 Zustand store에 자동 동기화
 * 사용: useStoreSyncBeds() → beds를 store에 저장
 */

'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store/store';
import { useGetBeds, useBedStats } from './useGetBeds';
import { useGetTherapists, useTherapistStats } from './useGetTherapists';
import { useProposeMatching, useConfirmMatching, useSimulateMatching } from './useMatching';

/**
 * React Query beds → Zustand store beds 동기화
 */
export const useStoreSyncBeds = () => {
  const { setBeds } = useStore();
  const { data: beds } = useGetBeds();

  useEffect(() => {
    if (beds) {
      setBeds(beds);
    }
  }, [beds, setBeds]);
};

/**
 * React Query therapists → Zustand store therapists 동기화
 */
export const useStoreSyncTherapists = () => {
  const { setTherapists } = useStore();
  const { data: therapists } = useGetTherapists();

  useEffect(() => {
    if (therapists) {
      setTherapists(therapists);
    }
  }, [therapists, setTherapists]);
};

/**
 * 매칭 제안 상태 동기화
 */
export const useProposalSync = (bookingId?: number, serviceType?: string) => {
  const { setProposals, setProposalLoading, setProposalError } = useStore();
  const { mutate: propose, isPending, data: proposals, error } = useProposeMatching();

  useEffect(() => {
    setProposalLoading(isPending);
  }, [isPending, setProposalLoading]);

  useEffect(() => {
    if (proposals) {
      setProposals(proposals);
    }
  }, [proposals, setProposals]);

  useEffect(() => {
    if (error) {
      setProposalError((error as Error).message);
    }
  }, [error, setProposalError]);

  return {
    propose,
    isPending,
    proposals,
    error,
  };
};

/**
 * 매칭 확정 상태 동기화
 */
export const useConfirmationSync = () => {
  const { setConfirmedMatching, setConfirmationLoading, setConfirmationError } = useStore();
  const { mutate: confirm, isPending, data: confirmed, error } = useConfirmMatching();

  useEffect(() => {
    setConfirmationLoading(isPending);
  }, [isPending, setConfirmationLoading]);

  useEffect(() => {
    if (confirmed) {
      setConfirmedMatching(confirmed);
    }
  }, [confirmed, setConfirmedMatching]);

  useEffect(() => {
    if (error) {
      setConfirmationError((error as Error).message);
    }
  }, [error, setConfirmationError]);

  return {
    confirm,
    isPending,
    confirmed,
    error,
  };
};

/**
 * What-if 시뮬레이션 상태 동기화
 */
export const useSimulationSync = () => {
  const { setSimulationResults, setSimulationLoading } = useStore();
  const { mutate: simulate, isPending, data: results } = useSimulateMatching();

  useEffect(() => {
    setSimulationLoading(isPending);
  }, [isPending, setSimulationLoading]);

  useEffect(() => {
    if (results) {
      setSimulationResults(results);
    }
  }, [results, setSimulationResults]);

  return {
    simulate,
    isPending,
    results,
  };
};

/**
 * 전체 동기화 (Monitor 페이지 용)
 *
 * 사용: useFullStoreSync()
 */
export const useFullStoreSync = () => {
  useStoreSyncBeds();
  useStoreSyncTherapists();

  return useStore();
};
