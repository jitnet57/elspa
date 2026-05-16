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
import { persist, createJSONStorage } from 'zustand/middleware';
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
  InvoiceState,
  ExchangeRateState,
  LanguageState,
  ChangeLogState,
  ChangeLog,
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
  Invoice,
  Receipt,
  Message,
  ExpenseRecord,
  BudgetAnalysis,
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

  addBooking: async (booking: Omit<Booking, 'id' | 'requested_at' | 'status'>) => {
    const newBooking: Booking = {
      id: Math.max(0, ...useStore.getState().bookings.map(b => b.id), 0) + 1,
      ...booking,
      requested_at: new Date().toISOString(),
      status: 'requested',
    };
    set((state: any) => ({
      bookings: [...state.bookings, newBooking],
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

  calculateMonthlySettlements: (month: string) => {
    set((state: any) => {
      const { therapistSettlements, guides, companies, monthlySettlements: existingSettlements } = state;

      // 중복 방지: 해당 월 정산이 이미 있으면 기존 것 유지
      const monthSettlementsExist = guides.some((guide: Guide) =>
        existingSettlements.some(
          (s: MonthlySettlement) => s.guide_id === guide.id && s.settlement_month === month
        )
      );

      if (monthSettlementsExist) {
        return { monthlySettlements: existingSettlements };
      }

      // 각 가이드별로 월정산 계산
      const newSettlements: MonthlySettlement[] = guides.map((guide: Guide) => {
        const company = companies.find((c: Company) => c.id === guide.company_id);
        if (!company) return null;

        // 같은 이름의 therapist 찾기 (therapist.name == guide.name)
        const therapistSettlement = therapistSettlements.find(
          (ts: TherapistSettlement) => ts.name === guide.name
        );

        if (!therapistSettlement || therapistSettlement.totalRevenue === 0) return null;

        // 수수료율 결정 (가이드 개별 설정 or 회사 기본값)
        const commissionRate = guide.commission_rate || company.commission_rate;
        const totalRevenue = therapistSettlement.totalRevenue || 0;
        const commissionAmount = Math.floor(totalRevenue * (commissionRate / 100));
        const paymentAmount = totalRevenue - commissionAmount;

        // settlement_date: 회사의 settlement_day를 기반으로 계산
        const [year, monthNum] = month.split('-').map(Number);
        const settlementDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(company.settlement_day).padStart(2, '0')}`;

        return {
          id: Math.random() * 1000000,
          company_id: company.id,
          guide_id: guide.id,
          settlement_month: month,
          settlement_date: settlementDate,
          total_sessions: therapistSettlement.sessionCount || 0,
          total_revenue: totalRevenue,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          payment_amount: paymentAmount,
          service_breakdown: {},
          status: 'pending' as const,
          notes: `${month} 월정산 자동 계산`,
          created_at: new Date().toISOString().split('T')[0],
        };
      }).filter((s: MonthlySettlement | null) => s !== null) as MonthlySettlement[];

      return {
        monthlySettlements: [...existingSettlements, ...newSettlements],
      };
    });
  },
});

// ============================================================
// Invoice Slice (정산/영수증 시스템)
// ============================================================

const createInvoiceSlice = (set: any): InvoiceState => ({
  invoices: [],
  receipts: [],
  messages: [],
  expenseRecords: [],
  budgetAnalysis: [],

  addInvoice: async (invoice: Omit<Invoice, 'id'>) => {
    const id = `INV-${Date.now()}`;
    set((state: any) => ({
      invoices: [...state.invoices, { id, ...invoice }],
    }));
    return id;
  },

  updateInvoice: (id: string, data: Partial<Invoice>) => {
    set((state: any) => ({
      invoices: state.invoices.map((inv: Invoice) =>
        inv.id === id ? { ...inv, ...data } : inv
      ),
    }));
  },

  addReceipt: async (receipt: Omit<Receipt, 'id'>) => {
    const id = `REC-${Date.now()}`;
    set((state: any) => ({
      receipts: [...state.receipts, { id, ...receipt }],
    }));
    return id;
  },

  addMessage: async (message: Omit<Message, 'id'>) => {
    const id = `MSG-${Date.now()}`;
    set((state: any) => ({
      messages: [...state.messages, { id, ...message, retry_count: 0 }],
    }));
    return id;
  },

  updateMessageStatus: (messageId: string, status: Message['status']) => {
    set((state: any) => ({
      messages: state.messages.map((msg: Message) =>
        msg.id === messageId ? { ...msg, status } : msg
      ),
    }));
  },

  addExpenseRecord: async (record: Omit<ExpenseRecord, 'id'>) => {
    const id = `EXP-${Date.now()}`;
    set((state: any) => ({
      expenseRecords: [...state.expenseRecords, { id, ...record }],
    }));
    return id;
  },

  updateExpenseRecord: (id: string, data: Partial<ExpenseRecord>) => {
    set((state: any) => ({
      expenseRecords: state.expenseRecords.map((rec: ExpenseRecord) =>
        rec.id === id ? { ...rec, ...data } : rec
      ),
    }));
  },

  generateInvoicePDF: async (invoiceId: string) => {
    // 임시 구현 - Track 1에서 실제 PDF 생성
    return new Blob(['PDF content'], { type: 'application/pdf' });
  },

  generateReceiptPDF: async (receiptId: string) => {
    // 임시 구현 - Track 1에서 실제 PDF 생성
    return new Blob(['PDF content'], { type: 'application/pdf' });
  },
});

// ============================================================
// Language Slice
// ============================================================

const createLanguageSlice = (set: any): LanguageState => ({
  language: 'en',
  setLanguage: (language: 'en' | 'ko') => set({ language }),
});

// ============================================================
// Change Log Slice
// ============================================================

const createChangeLogSlice = (set: any): ChangeLogState => ({
  changeLogs: [],

  addChangeLog: (log: Omit<ChangeLog, 'id' | 'timestamp'>) => {
    const newLog: ChangeLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    set((state: any) => ({
      changeLogs: [newLog, ...state.changeLogs],
    }));
  },

  getChangeLogsByBed: (bedId: number) => {
    const state = useStore.getState();
    return state.changeLogs.filter(log => log.bedId === bedId);
  },

  clearChangeLogs: () => set({ changeLogs: [] }),
});

// ============================================================
// Exchange Rate Slice
// ============================================================

const createExchangeRateSlice = (set: any) => ({
  rates: {
    USD: 1,
    PHP: 56.5,
    lastUpdated: new Date().toISOString(),
  },
  updateExchangeRate: (rates: { USD: number; PHP: number }) => {
    set((state: any) => ({
      rates: {
        ...rates,
        lastUpdated: new Date().toISOString(),
      },
    }));
  },
});

// ============================================================
// Root Store
// ============================================================

export const useStore = create<RootState>()(
  persist(
    (set) => ({
      ...createBedSlice(set),
      ...createTherapistSlice(set),
      ...createBookingSlice(set),
      ...createMatchingSlice(set),
      ...createInvoiceSlice(set),
      ...createNotificationSlice(set),
      ...createUISlice(set),
      ...createSettlementSlice(set),
      ...createWalkInQueueSlice(set),
      ...createCompanySlice(set),
      ...createGuideSlice(set),
      ...createMonthlySettlementSlice(set),
      ...createLanguageSlice(set),
      ...createChangeLogSlice(set),
      ...createExchangeRateSlice(set),
    }),
    {
      name: 'elspa-store',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        beds: state.beds,
        therapists: state.therapists,
        bookings: state.bookings,
        walkInQueue: state.walkInQueue,
        companies: state.companies,
        guides: state.guides,
        monthlySettlements: state.monthlySettlements,
        rates: state.rates,
      }),
    }
  )
);

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
