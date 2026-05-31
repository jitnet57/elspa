// ============================================================
// 📌 Hook: useBookings — BOOKING WITH THERAPIST CRUD + 30개 페이지네이션
// 📋 목적: 백엔드 없이 Supabase bookings 테이블에 등록/수정/조회
// 📄 페이지: 30개까지 1페이지, 초과 시 2nd, 또 초과 시 3rd … 로 분할
// 🔄 저장 즉시 무효화 → 화면 다시 불러옴 (Sheet 반영은 Apps Script가 1시간 단위)
// 📅 작성일: 2026-05-31
// ============================================================

'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api/get-client';
import type { Booking } from '@/lib/api/supabase-adapter';

export const BOOKINGS_PER_PAGE = 30;

/** 예약 목록 조회 (5초 폴링) */
export const useGetBookings = (bookingDate?: string) => {
  return useQuery<Booking[], Error>({
    queryKey: ['bookings', bookingDate ?? 'all'],
    queryFn: async () => {
      const client = getApiClient() as any;
      if (typeof client.getBookings !== 'function') return [];
      return client.getBookings(bookingDate);
    },
    refetchInterval: 5000,
    staleTime: 3000,
  });
};

/** 예약 등록 */
export const useCreateBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Booking>) => {
      const client = getApiClient() as any;
      return client.createBooking(input) as Promise<Booking>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
};

/** 예약 수정 */
export const useUpdateBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<Booking> }) => {
      const client = getApiClient() as any;
      return client.updateBooking(id, patch) as Promise<Booking>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
};

/** 예약 삭제 (soft delete) */
export const useDeleteBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const client = getApiClient() as any;
      return client.deleteBooking(id) as Promise<void>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
};

export interface PagedBookings {
  pageItems: Booking[];      // 현재 페이지 항목 (최대 30)
  totalPages: number;
  pageLabels: string[];      // ['1st','2nd','3rd', ...]
  currentLabel: string;
  canRegisterMore: boolean;  // 항상 true (초과 시 새 페이지 생성)
}

/** 서수 라벨 (1→1st, 2→2nd, 3→3rd, 4→4th …) */
export const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/**
 * 30개 단위 페이지 분할 헬퍼.
 * 30개 초과분은 자동으로 다음 페이지(2nd, 3rd …)로 넘어감.
 */
export const usePagedBookings = (
  bookings: Booking[],
  page: number,
  perPage: number = BOOKINGS_PER_PAGE
): PagedBookings => {
  return useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(bookings.length / perPage));
    const safePage = Math.min(Math.max(0, page), totalPages - 1);
    const start = safePage * perPage;
    const pageItems = bookings.slice(start, start + perPage);
    const pageLabels = Array.from({ length: totalPages }, (_, i) => ordinal(i + 1));
    return {
      pageItems,
      totalPages,
      pageLabels,
      currentLabel: ordinal(safePage + 1),
      canRegisterMore: true,
    };
  }, [bookings, page, perPage]);
};
