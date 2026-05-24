/**
 * 📌 드라이버 상태 관리 (Zustand)
 * 📋 목적: 드라이버 프로필, 예약, 위치, 수익 상태
 * 🔧 포함: 전역 상태, 액션, 미들웨어
 * 📅 작성일: 2026-05-24
 */

import { create } from 'zustand';
import { driverClient, DriverProfile, Booking, Location, Earnings } from '@/lib/api/driver-client';

interface DriverState {
  // 상태
  driverId: number | null;
  profile: DriverProfile | null;
  bookings: Booking[];
  earnings: Earnings | null;
  location: Location | null;
  loading: boolean;
  error: string | null;

  // 액션
  setDriverId: (id: number) => void;
  fetchProfile: () => Promise<void>;
  fetchTodayBookings: () => Promise<void>;
  fetchEarnings: () => Promise<void>;
  updateLocation: (lat: number, lng: number, accuracy?: number) => Promise<void>;
  getLocation: () => Promise<void>;
  acceptBooking: (bookingId: number) => Promise<void>;
  rejectBooking: (bookingId: number) => Promise<void>;
  startTrip: (bookingId: number) => Promise<void>;
  completeTrip: (bookingId: number) => Promise<void>;
  clearError: () => void;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  driverId: null,
  profile: null,
  bookings: [],
  earnings: null,
  location: null,
  loading: false,
  error: null,

  setDriverId: (id: number) => {
    set({ driverId: id });
  },

  fetchProfile: async () => {
    const { driverId } = get();
    if (!driverId) {
      set({ error: '드라이버 ID가 설정되지 않았습니다' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const profile = await driverClient.getProfile(driverId);
      set({ profile, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '프로필 조회 실패',
        loading: false,
      });
    }
  },

  fetchTodayBookings: async () => {
    const { driverId } = get();
    if (!driverId) {
      set({ error: '드라이버 ID가 설정되지 않았습니다' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const data = await driverClient.getTodayBookings(driverId);
      set({ bookings: data.bookings, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '배정 목록 조회 실패',
        loading: false,
      });
    }
  },

  fetchEarnings: async () => {
    const { driverId } = get();
    if (!driverId) {
      set({ error: '드라이버 ID가 설정되지 않았습니다' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const earnings = await driverClient.getEarnings(driverId);
      set({ earnings, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '수익 조회 실패',
        loading: false,
      });
    }
  },

  updateLocation: async (lat: number, lng: number, accuracy?: number) => {
    const { driverId } = get();
    if (!driverId) {
      set({ error: '드라이버 ID가 설정되지 않았습니다' });
      return;
    }

    try {
      const location = await driverClient.updateLocation(driverId, lat, lng, accuracy);
      set({ location, error: null });
    } catch (error) {
      console.error('위치 업데이트 실패:', error);
      // 위치 업데이트 실패는 무시 (백그라운드 작업)
    }
  },

  getLocation: async () => {
    const { driverId } = get();
    if (!driverId) {
      set({ error: '드라이버 ID가 설정되지 않았습니다' });
      return;
    }

    try {
      const location = await driverClient.getLocation(driverId);
      if (location) {
        set({ location, error: null });
      }
    } catch (error) {
      console.error('위치 조회 실패:', error);
    }
  },

  acceptBooking: async (bookingId: number) => {
    const { driverId } = get();
    if (!driverId) {
      set({ error: '드라이버 ID가 설정되지 않았습니다' });
      return;
    }

    set({ loading: true, error: null });
    try {
      await driverClient.acceptBooking(driverId, bookingId);
      // 예약 목록 새로고침
      await get().fetchTodayBookings();
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '예약 수락 실패',
        loading: false,
      });
    }
  },

  rejectBooking: async (bookingId: number) => {
    const { driverId } = get();
    if (!driverId) {
      set({ error: '드라이버 ID가 설정되지 않았습니다' });
      return;
    }

    set({ loading: true, error: null });
    try {
      await driverClient.rejectBooking(driverId, bookingId);
      // 예약 목록 새로고침
      await get().fetchTodayBookings();
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '예약 거절 실패',
        loading: false,
      });
    }
  },

  startTrip: async (bookingId: number) => {
    const { driverId } = get();
    if (!driverId) {
      set({ error: '드라이버 ID가 설정되지 않았습니다' });
      return;
    }

    set({ loading: true, error: null });
    try {
      await driverClient.startTrip(driverId, bookingId);
      // 예약 목록 새로고침
      await get().fetchTodayBookings();
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '여행 시작 실패',
        loading: false,
      });
    }
  },

  completeTrip: async (bookingId: number) => {
    const { driverId } = get();
    if (!driverId) {
      set({ error: '드라이버 ID가 설정되지 않았습니다' });
      return;
    }

    set({ loading: true, error: null });
    try {
      await driverClient.completeTrip(driverId, bookingId);
      // 예약 목록과 수익 새로고침
      await Promise.all([get().fetchTodayBookings(), get().fetchEarnings()]);
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '여행 완료 실패',
        loading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
