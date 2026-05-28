import { create } from 'zustand';

// ============================================================
// 📌 Admin Gate Store (Authentication)
// 📋 목적: 관리자 로그인 상태 관리
// 🔧 매개변수: password (string) - 검증할 비밀번호
// 📤 반환값: { isAdminAuthenticated, login, logout }
// 📅 작성일: 2026-05-28
// ============================================================

interface AdminGateState {
  isAdminAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

export const useAdminGate = create<AdminGateState>()(
  (set) => ({
    isAdminAuthenticated: true,

    login: (password: string) => {
      if (password === 'admin123') {
        set({ isAdminAuthenticated: true });
        return true;
      }
      return false;
    },

    logout: () => {
      set({ isAdminAuthenticated: false });
    },
  })
);
