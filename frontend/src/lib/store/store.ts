/**
 * Zustand Store
 *
 * 전역 상태 관리 (Beds, Therapists, Matchings, Notifications, UI)
 *
 * 사용 예시:
 *   const { beds, selectedBedId, selectBed } = useStore();
 */

'use client';

import { create } from 'zustand';
import {
  RootState,
  BedState,
  TherapistState,
  BookingState,
  MatchingState,
  NotificationState,
  UIState,
  SettlementState,
  WalkInQueueState,
  CompanyState,
  GuideState,
  MonthlySettlementState,
  Bed,
  Therapist,
  Booking,
  MatchingProposal,
  MatchingConfirmation,
  Notification,
  DailySettlement,
  TherapistSettlement,
  ServiceBreakdown,
  HourlySales,
  WalkInGuest,
  Company,
  Guide,
  MonthlySettlement,
} from './types';

// ============================================================
// Bed Slice
// ============================================================

const createBedSlice = (set: any): BedState => ({
  beds: [],
  selectedBedId: null,
  isDetailModalOpen: false,

  setBeds: (beds: Bed[]) => set({ beds }),

  selectBed: (bedId: number | null) => set({ selectedBedId: bedId }),

  openDetailModal: (bedId: number) => {
    set({ selectedBedId: bedId, isDetailModalOpen: true });
  },

  closeDetailModal: () => {
    set({ isDetailModalOpen: false, selectedBedId: null });
  },

  updateBedStatus: (bedId: number, status: Bed['status'], data?: Partial<Bed>) => {
    set((state: any) => ({
      beds: state.beds.map((bed: Bed) =>
        bed.id === bedId ? { ...bed, status, ...data } : bed
      ),
    }));
  },
});

// ============================================================
// Booking Slice
// ============================================================

const createBookingSlice = (set: any): BookingState => ({
  bookings: [],
  selectedBookingId: null,

  setBookings: (bookings: Booking[]) => set({ bookings }),

  selectBooking: (bookingId: number | null) => set({ selectedBookingId: bookingId }),

  updateBookingStatus: (bookingId: number, status: Booking['status']) => {
    set((state: any) => ({
      bookings: state.bookings.map((booking: Booking) =>
        booking.id === bookingId ? { ...booking, status } : booking
      ),
    }));
  },
});

// ============================================================
// Therapist Slice
// ============================================================

const createTherapistSlice = (set: any): TherapistState => ({
  therapists: [],
  selectedTherapistId: null,

  setTherapists: (therapists: Therapist[]) => set({ therapists }),

  selectTherapist: (therapistId: number | null) => set({ selectedTherapistId: therapistId }),

  updateTherapistStatus: (therapistId: number, status: Therapist['status']) => {
    set((state: any) => ({
      therapists: state.therapists.map((therapist: Therapist) =>
        therapist.id === therapistId ? { ...therapist, status } : therapist
      ),
    }));
  },
});

// ============================================================
// Matching Slice
// ============================================================

const createMatchingSlice = (set: any): MatchingState => ({
  // 매칭 제안
  proposals: [],
  selectedProposalIndex: null,
  isProposalLoading: false,
  proposalError: null,

  // 확정된 매칭
  confirmedMatching: null,
  isConfirmationLoading: false,
  confirmationError: null,

  // 시뮬레이션
  simulationResults: [],
  isSimulationLoading: false,

  // Actions
  setProposals: (proposals: MatchingProposal[]) => set({ proposals, selectedProposalIndex: null }),

  selectProposal: (index: number | null) => set({ selectedProposalIndex: index }),

  setProposalLoading: (loading: boolean) => set({ isProposalLoading: loading }),

  setProposalError: (error: string | null) => set({ proposalError: error }),

  setConfirmedMatching: (matching: MatchingConfirmation | null) => set({ confirmedMatching: matching }),

  setConfirmationLoading: (loading: boolean) => set({ isConfirmationLoading: loading }),

  setConfirmationError: (error: string | null) => set({ confirmationError: error }),

  setSimulationResults: (results: MatchingProposal[]) => set({ simulationResults: results }),

  setSimulationLoading: (loading: boolean) => set({ isSimulationLoading: loading }),

  clearMatching: () =>
    set({
      proposals: [],
      selectedProposalIndex: null,
      confirmedMatching: null,
      simulationResults: [],
    }),
});

// ============================================================
// Notification Slice
// ============================================================

const createNotificationSlice = (set: any): NotificationState => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = `notif_${Date.now()}_${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      isRead: false,
    };

    set((state: any) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50), // 최대 50개
      unreadCount: state.unreadCount + 1,
    }));

    // 5초 후 자동 제거 (info 타입만)
    if (notification.type === 'match_ready' || notification.type === 'wait_alert') {
      setTimeout(() => {
        set((state: any) => ({
          notifications: state.notifications.filter((n: Notification) => n.id !== id),
        }));
      }, 5000);
    }
  },

  removeNotification: (notificationId: string) => {
    set((state: any) => ({
      notifications: state.notifications.filter((n: Notification) => n.id !== notificationId),
    }));
  },

  markAsRead: (notificationId: string) => {
    set((state: any) => ({
      notifications: state.notifications.map((n: Notification) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
});

// ============================================================
// UI Slice
// ============================================================

const createUISlice = (set: any): UIState => ({
  isDarkMode: true,
  sidebarOpen: true,
  activeTab: 'monitor',

  toggleDarkMode: () => set((state: any) => ({ isDarkMode: !state.isDarkMode })),

  toggleSidebar: () => set((state: any) => ({ sidebarOpen: !state.sidebarOpen })),

  setActiveTab: (tab: UIState['activeTab']) => set({ activeTab: tab }),
});

// ============================================================
// Settlement Slice
// ============================================================

const createSettlementSlice = (set: any): SettlementState => ({
  dailySettlement: null,
  therapistSettlements: [],
  serviceBreakdown: [],
  hourlySales: [],

  setDailySettlement: (settlement: DailySettlement | null) => set({ dailySettlement: settlement }),
  setTherapistSettlements: (therapistSettlements: TherapistSettlement[]) => set({ therapistSettlements }),
  setServiceBreakdown: (serviceBreakdown: ServiceBreakdown[]) => set({ serviceBreakdown }),
  setHourlySales: (hourlySales: HourlySales[]) => set({ hourlySales }),
});

// ============================================================
// Walk-In Queue Slice
// ============================================================

const createWalkInQueueSlice = (set: any): WalkInQueueState => ({
  walkInQueue: [],

  addToQueue: (guest: Omit<WalkInGuest, 'id' | 'queue_number' | 'created_at' | 'status'>) => {
    const id = `walk_in_${Date.now()}_${Math.random()}`;
    const newGuest: WalkInGuest = {
      ...guest,
      id,
      queue_number: 0, // 실제로는 현재 큐 길이 + 1로 설정될 예정
      created_at: new Date().toISOString(),
      status: 'waiting',
    };

    set((state: any) => {
      const newQueue = [...state.walkInQueue, newGuest];
      // 큐 번호 재계산
      const updatedQueue = newQueue.map((g: WalkInGuest, idx: number) => ({
        ...g,
        queue_number: idx + 1,
      }));
      return { walkInQueue: updatedQueue };
    });

    return id;
  },

  removeFromQueue: (guestId: string) => {
    set((state: any) => {
      const newQueue = state.walkInQueue.filter((g: WalkInGuest) => g.id !== guestId);
      // 큐 번호 재계산
      const updatedQueue = newQueue.map((g: WalkInGuest, idx: number) => ({
        ...g,
        queue_number: idx + 1,
      }));
      return { walkInQueue: updatedQueue };
    });
  },

  assignGuest: (guestId: string, therapistId: number, bedId: number) => {
    set((state: any) => ({
      walkInQueue: state.walkInQueue.map((g: WalkInGuest) =>
        g.id === guestId
          ? { ...g, assigned_therapist_id: therapistId, assigned_bed_id: bedId, status: 'assigned' }
          : g
      ),
    }));
  },

  clearQueue: () => set({ walkInQueue: [] }),
});

// ============================================================
// Company Slice
// ============================================================

const createCompanySlice = (set: any): CompanyState => ({
  companies: [],

  setCompanies: (companies: Company[]) => set({ companies }),

  addCompany: (company: Company) => {
    set((state: any) => ({
      companies: [...state.companies, company],
    }));
  },

  updateCompany: (id: number, company: Partial<Company>) => {
    set((state: any) => ({
      companies: state.companies.map((c: Company) =>
        c.id === id ? { ...c, ...company } : c
      ),
    }));
  },

  deleteCompany: (id: number) => {
    set((state: any) => ({
      companies: state.companies.filter((c: Company) => c.id !== id),
    }));
  },
});

// ============================================================
// Guide Slice
// ============================================================

const createGuideSlice = (set: any): GuideState => ({
  guides: [],

  setGuides: (guides: Guide[]) => set({ guides }),

  addGuide: (guide: Guide) => {
    set((state: any) => ({
      guides: [...state.guides, guide],
    }));
  },

  updateGuide: (id: number, guide: Partial<Guide>) => {
    set((state: any) => ({
      guides: state.guides.map((g: Guide) =>
        g.id === id ? { ...g, ...guide } : g
      ),
    }));
  },

  deleteGuide: (id: number) => {
    set((state: any) => ({
      guides: state.guides.filter((g: Guide) => g.id !== id),
    }));
  },
});

// ============================================================
// Monthly Settlement Slice
// ============================================================

const createMonthlySettlementSlice = (set: any): MonthlySettlementState => ({
  monthlySettlements: [],

  setMonthlySettlements: (settlements: MonthlySettlement[]) => set({ monthlySettlements: settlements }),

  addMonthlySettlement: (settlement: MonthlySettlement) => {
    set((state: any) => ({
      monthlySettlements: [...state.monthlySettlements, settlement],
    }));
  },

  updateMonthlySettlement: (id: number, settlement: Partial<MonthlySettlement>) => {
    set((state: any) => ({
      monthlySettlements: state.monthlySettlements.map((s: MonthlySettlement) =>
        s.id === id ? { ...s, ...settlement } : s
      ),
    }));
  },

  updateSettlementStatus: (id: number, status: 'pending' | 'confirmed' | 'paid') => {
    set((state: any) => ({
      monthlySettlements: state.monthlySettlements.map((s: MonthlySettlement) =>
        s.id === id ? { ...s, status } : s
      ),
    }));
  },

  deleteMonthlySettlement: (id: number) => {
    set((state: any) => ({
      monthlySettlements: state.monthlySettlements.filter((s: MonthlySettlement) => s.id !== id),
    }));
  },
});

// ============================================================
// Root Store
// ============================================================

export const useStore = create<RootState>((set) => ({
  ...createBedSlice(set),
  ...createTherapistSlice(set),
  ...createBookingSlice(set),
  ...createMatchingSlice(set),
  ...createNotificationSlice(set),
  ...createUISlice(set),
  ...createSettlementSlice(set),
  ...createWalkInQueueSlice(set),
  ...createCompanySlice(set),
  ...createGuideSlice(set),
  ...createMonthlySettlementSlice(set),
}));

// ============================================================
// Convenience Selectors
// ============================================================

/**
 * 선택된 침대 객체 조회
 */
export const useSelectedBed = () => {
  const { beds, selectedBedId } = useStore();
  return beds.find(b => b.id === selectedBedId) || null;
};

/**
 * 선택된 테라피스트 객체 조회
 */
export const useSelectedTherapist = () => {
  const { therapists, selectedTherapistId } = useStore();
  return therapists.find(t => t.id === selectedTherapistId) || null;
};

/**
 * 선택된 매칭 제안 조회
 */
export const useSelectedProposal = () => {
  const { proposals, selectedProposalIndex } = useStore();
  if (selectedProposalIndex === null) return null;
  return proposals[selectedProposalIndex] || null;
};

/**
 * 읽지 않은 알림만 조회
 */
export const useUnreadNotifications = () => {
  const { notifications } = useStore();
  return notifications.filter(n => !n.isRead);
};
