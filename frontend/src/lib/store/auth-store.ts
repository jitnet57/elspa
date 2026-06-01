/**
 * ============================================================
 * 📌 인증 상태 관리 (Zustand)
 * 📋 목적: JWT 토큰 & 사용자 정보 관리
 * 🔧 저장소: localStorage (accessToken, refreshToken)
 * 📅 작성일: 2026-05-22
 * ============================================================
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  user_id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  performTokenRefresh: () => Promise<void>;  // ✅ 이름 변경 (refreshToken과 구분)
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearError: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      // Login
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
          }

          const data = await response.json();
          set({
            user: data.user,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({
            error: message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        const state = get();
        if (state.accessToken) {
          try {
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token: state.accessToken }),
            });
          } catch (error) {
            console.error('Logout error:', error);
          }
        }

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
        });
      },

      // ✅ Perform Token Refresh (메서드명 변경)
      performTokenRefresh: async () => {
        const state = get();
        if (!state.refreshToken) {
          set({ error: 'No refresh token available' });
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: state.refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();
          set({
            accessToken: data.access_token,
            error: null,
          });
        } catch (error) {
          // If refresh fails, logout
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            error: 'Token refresh failed',
          });
        }
      },

      // Set User
      setUser: (user: User | null) => {
        set({ user });
      },

      // Set Tokens
      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },

      // Clear Error
      clearError: () => {
        set({ error: null });
      },

      // Is Authenticated
      isAuthenticated: () => {
        return get().accessToken !== null;
      },

      // Is Admin
      isAdmin: () => {
        return get().user?.role === 'admin';
      },
    }),
    {
      name: 'auth-store', // localStorage 키
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
