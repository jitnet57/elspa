/**
 * Store Types
 *
 * 전체 Zustand store의 타입 정의
 */

// ============================================================
// Bed Related
// ============================================================

export interface Bed {
  id: number;
  bed_number: number;
  room_zone: string;
  status: 'available' | 'reserved' | 'in_service' | 'cleaning';
  customer_name?: string;
  therapist_name?: string;
  therapist_id?: number;
  service_name?: string;
  service_minutes?: number;
  starts_at?: string;
  ends_at?: string;
}

export interface BedState {
  beds: Bed[];
  selectedBedId: number | null;
  isDetailModalOpen: boolean;

  // Actions
  setBeds: (beds: Bed[]) => void;
  selectBed: (bedId: number | null) => void;
  openDetailModal: (bedId: number) => void;
  closeDetailModal: () => void;
  updateBedStatus: (bedId: number, status: Bed['status'], data?: Partial<Bed>) => void;
}

// ============================================================
// Therapist Related
// ============================================================

export interface Therapist {
  id: number;
  name: string;
  status: 'idle' | 'in_service' | 'resting' | 'checked_out';
  current_bed?: number;
  remaining_minutes?: number;
  specialty?: string;
  rating?: number;
  checked_in_at?: string; // "HH:MM" 형식 (출근 시간)
}

export interface TherapistState {
  therapists: Therapist[];
  selectedTherapistId: number | null;

  // Actions
  setTherapists: (therapists: Therapist[]) => void;
  selectTherapist: (therapistId: number | null) => void;
  updateTherapistStatus: (therapistId: number, status: Therapist['status']) => void;
}

// ============================================================
// Booking Related
// ============================================================

export interface Booking {
  id: number;
  customer_name: string;
  service_type: string;
  service_minutes: number;
  status: 'requested' | 'matched' | 'confirmed' | 'in_progress' | 'completed';
  requested_at: string;
  scheduled_at: string;
  notes?: string;
}

export interface BookingState {
  bookings: Booking[];
  selectedBookingId: number | null;

  // Actions
  setBookings: (bookings: Booking[]) => void;
  selectBooking: (bookingId: number | null) => void;
  updateBookingStatus: (bookingId: number, status: Booking['status']) => void;
}

// ============================================================
// Matching Related
// ============================================================

export interface MatchingProposal {
  therapist_id: number;
  therapist_name: string;
  specialty: string;
  score: number;
  score_breakdown?: {
    expertise: number;
    availability: number;
    rating: number;
  };
  availability: string;
  estimated_start?: string;
}

export interface MatchingConfirmation {
  bed_id: number;
  therapist_id: number;
  booking_id: number;
  confirmed_at: string;
}

export interface MatchingState {
  // 매칭 제안
  proposals: MatchingProposal[];
  selectedProposalIndex: number | null;
  isProposalLoading: boolean;
  proposalError: string | null;

  // 확정된 매칭
  confirmedMatching: MatchingConfirmation | null;
  isConfirmationLoading: boolean;
  confirmationError: string | null;

  // 시뮬레이션
  simulationResults: MatchingProposal[];
  isSimulationLoading: boolean;

  // Actions
  setProposals: (proposals: MatchingProposal[]) => void;
  selectProposal: (index: number | null) => void;
  setProposalLoading: (loading: boolean) => void;
  setProposalError: (error: string | null) => void;

  setConfirmedMatching: (matching: MatchingConfirmation | null) => void;
  setConfirmationLoading: (loading: boolean) => void;
  setConfirmationError: (error: string | null) => void;

  setSimulationResults: (results: MatchingProposal[]) => void;
  setSimulationLoading: (loading: boolean) => void;

  clearMatching: () => void;
}

// ============================================================
// Notification Related
// ============================================================

export interface Notification {
  id: string;
  type: 'session_ending' | 'match_ready' | 'wait_alert' | 'check_in' | 'settlement_ready' | 'settlement_confirmed' | 'settlement_paid' | 'error';
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  isRead: boolean;
  action_url?: string; // 알림 클릭 시 이동할 URL
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (notificationId: string) => void;
  markAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
}

// ============================================================
// UI State
// ============================================================

export interface UIState {
  isDarkMode: boolean;
  sidebarOpen: boolean;
  activeTab: 'monitor' | 'matching' | 'analytics' | 'settings';

  // Actions
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: UIState['activeTab']) => void;
}

// ============================================================
// Walk-In Queue Related
// ============================================================

export interface WalkInGuest {
  id: string;
  queue_number: number; // 대기 번호 (1, 2, 3...)
  service_type: string; // 마사지 종류 (swedish, thai, hotstone, foot, aroma)
  requested_therapist_id?: number; // 특정 테라피스트 지정 (없으면 순번 배정)
  customer_name?: string;
  created_at: string; // ISO 형식 시각
  status: 'waiting' | 'assigned' | 'cancelled';
  assigned_therapist_id?: number;
  assigned_bed_id?: number;
}

export interface WalkInQueueState {
  walkInQueue: WalkInGuest[];

  // Actions
  addToQueue: (guest: Omit<WalkInGuest, 'id' | 'queue_number' | 'created_at' | 'status'>) => string;
  removeFromQueue: (guestId: string) => void;
  assignGuest: (guestId: string, therapistId: number, bedId: number) => void;
  clearQueue: () => void;
}

// ============================================================
// Settlement Related
// ============================================================

export interface Transaction {
  id: string;
  therapistId: number;
  therapistName: string;
  serviceType: string;
  price: number;
  commission: number;
  status: 'completed' | 'pending' | 'cancelled';
  startTime: string;
  endTime: string;
}

export interface TherapistSettlement {
  therapistId: number;
  name: string;
  sessionCount: number;
  totalRevenue: number;
  totalCommission: number;
  commissionRate: number;
  status?: 'idle' | 'in_service' | 'resting' | 'checked_out';
}

export interface DailySettlement {
  totalRevenue: number;
  totalCommission: number;
  netProfit: number;
  sessionCount: number;
  timestamp: string;
}

export interface ServiceBreakdown {
  serviceType: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface HourlySales {
  hour: number;
  count: number;
  revenue: number;
}

export interface SettlementState {
  dailySettlement: DailySettlement | null;
  therapistSettlements: TherapistSettlement[];
  serviceBreakdown: ServiceBreakdown[];
  hourlySales: HourlySales[];

  // Actions
  setDailySettlement: (settlement: DailySettlement | null) => void;
  setTherapistSettlements: (settlements: TherapistSettlement[]) => void;
  setServiceBreakdown: (breakdown: ServiceBreakdown[]) => void;
  setHourlySales: (sales: HourlySales[]) => void;
}

// ============================================================
// Company & Guide Related (월정산 시스템)
// ============================================================

export interface Company {
  id: number;
  name: string; // 여행사명
  representative: string; // 대표명
  phone: string;
  address: string;
  settlement_day: number; // 정산일 (5 = 5일, 20 = 20일)
  commission_rate: number; // 기본 수수료율 (30 = 30%)
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Guide {
  id: number;
  company_id: number; // 소속 업체
  name: string; // 가이드명 (therapist 이름과 동일)
  specialty: string; // 전문분야
  phone: string;
  bank_name: string; // 은행명
  bank_account: string; // 계좌번호
  commission_rate?: number; // 개별 수수료율 (null = company 기본값 사용)
  status: 'active' | 'inactive';
  created_at: string;
}

export interface MonthlySettlement {
  id: number;
  company_id: number;
  guide_id: number;
  settlement_month: string; // "2026-05"
  settlement_date: string; // "2026-05-20" (실제 정산 날짜)
  total_sessions: number; // 총 세션 수
  total_revenue: number; // 총 매출
  commission_rate: number; // 적용된 수수료율
  commission_amount: number; // 차감액
  payment_amount: number; // 최종 지급액
  service_breakdown: Record<string, { sessions: number; revenue: number }>; // 서비스별 상세
  status: 'pending' | 'confirmed' | 'paid';
  notes?: string;
  created_at: string;
}

export interface CompanyState {
  companies: Company[];

  // Actions
  setCompanies: (companies: Company[]) => void;
  addCompany: (company: Company) => void;
  updateCompany: (id: number, company: Partial<Company>) => void;
  deleteCompany: (id: number) => void;
}

export interface GuideState {
  guides: Guide[];

  // Actions
  setGuides: (guides: Guide[]) => void;
  addGuide: (guide: Guide) => void;
  updateGuide: (id: number, guide: Partial<Guide>) => void;
  deleteGuide: (id: number) => void;
}

export interface MonthlySettlementState {
  monthlySettlements: MonthlySettlement[];

  // Actions
  setMonthlySettlements: (settlements: MonthlySettlement[]) => void;
  addMonthlySettlement: (settlement: MonthlySettlement) => void;
  updateMonthlySettlement: (id: number, settlement: Partial<MonthlySettlement>) => void;
  updateSettlementStatus: (id: number, status: 'pending' | 'confirmed' | 'paid') => void;
  deleteMonthlySettlement: (id: number) => void;

  // 월정산 자동 계산
  calculateMonthlySettlements: (month: string) => void;
}

// ============================================================
// Root Store State
// ============================================================

export interface RootState
  extends BedState,
    TherapistState,
    BookingState,
    MatchingState,
    NotificationState,
    UIState,
    WalkInQueueState,
    SettlementState,
    CompanyState,
    GuideState,
    MonthlySettlementState {
  // Combined state
}
