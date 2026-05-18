/**
 * Translation file for multi-language support
 * Supported languages: English (en), Korean (ko)
 */

export type Language = 'en' | 'ko';

export const translations = {
  en: {
    // Header & Navigation
    header: {
      title: '✨ ELSPA Monitor',
      bedMode: '🛏️ Real-time Bed Mode',
      scheduleMode: '📅 Therapist Daily Schedule',
      admin: 'Admin',
      pollingLabel: 'Polling',
      times: 'times',
      startNewMassage: '+ Start New Massage',
      adminDetail: '📅 Admin Detailed Management',
    },

    // Bed Status
    bedStatus: {
      available: 'Available',
      inService: 'In Service',
      reserved: 'Reserved',
      cleaning: 'Cleaning',
      unknown: 'Unknown',
      statusLabel: {
        available: '✅ Available',
        reserved: '🔵 Reserved',
        inService: '💆 In Service',
        cleaning: '🧹 Cleaning',
      },
      immediatelyAvailable: '🟢 Immediately Available',
      cleaning_in_progress: '⏳ Cleaning...',
    },

    // Therapist Status
    therapistStatus: {
      available: 'Available',
      inSession: 'In Session',
      break: 'Break',
      offDuty: 'Off Duty',
      idle: 'Ready',
      inService: 'In Service',
      resting: 'Resting',
      checkedOut: 'Checked Out',
    },

    // Legend
    legend: {
      title: 'Bed Status Legend',
      availableDesc: 'Available (Ready to Use)',
      inServiceDesc: 'In Service (Running Timer)',
      reservedDesc: 'Reserved (Customer Arriving)',
      cleaningDesc: 'Cleaning (Maintenance)',
    },

    // Stats
    stats: {
      totalRevenue: 'Total Revenue',
      activeTherapists: 'Active Therapists',
      completedSessions: 'Completed Sessions',
      currentlyActive: 'Currently Active',
      nextAppointment: 'Next Appointment',
      returnTime: 'Return Time',
    },

    // Therapist Panel
    therapistPanel: {
      title: 'Therapist Status',
      checkedIn: 'Checked In',
      total: 'Total',
      waiting: 'Waiting',
      inSession: 'In Session',
      resting: 'Resting',
      avgWaitTime: '⏳ Avg Wait Time',
      nextAvailable: 'Next Available',
      nextAssignmentTarget: 'Next Assignment Target',
      immediately: 'Immediately Available',
    },

    // Walk-in Modal
    walkIn: {
      title: 'Walk-in Guest Registration',
      selectService: 'Select Service',
      customerName: 'Customer Name (Optional)',
      preferTherapist: 'Preferred Therapist (Optional)',
      suggestedTherapists: 'Suggested Therapists',
      suggestedBeds: 'Suggested Beds',
      proceed: 'Proceed',
      cancel: 'Cancel',
    },

    // Service Types
    services: {
      swedish: 'Swedish Massage',
      thai: 'Thai Massage',
      hotstone: 'Hot Stone Therapy',
      foot: 'Foot Massage',
      aroma: 'Aromatherapy',
    },

    // Schedule
    schedule: {
      therapists: 'Therapists',
      sessions: 'Sessions',
      noScheduleEdit: 'View only in monitor. Use admin site for detailed editing.',
    },

    // Buttons & Actions
    buttons: {
      details: 'Details',
      checkout: 'Checkout',
      close: 'Close',
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      edit: 'Edit',
    },

    // Schedule Labels
    scheduleLabels: {
      therapists: 'Therapists (8)',
      checkedIn: 'Checked In',
      available: 'Available',
      inSession: 'In Session',
      resting: 'Resting',
      offDuty: 'Off Duty',
      sessions: 'Sessions',
      avgWaitTime: '⏳ Avg Wait Time',
      nextAvailable: 'Next Available',
    },

    // Dashboard Labels
    dashboard: {
      realTimeMonitor: 'Real-time Bed Monitor',
      bedStatus: 'Bed Status',
      therapistStatus: 'Therapist Status',
      walkInQueue: 'Walk-in Queue',
      avgRevenue: 'Avg Revenue',
      completedSessions: 'Completed Sessions',
      currentlyActive: 'Currently Active',
      nextAppointment: 'Next Appointment',
      returnTime: 'Return Time',
      loading: 'Loading real-time data...',
    },

    // Room Zones
    roomZones: {
      'room_a': 'Room A',
      'room_b': 'Room B',
      'room_c': 'Room C',
      'vip_room': 'VIP Room',
      'couple_room': 'Couple Room',
    },

    // Form Labels & Fields
    labels: {
      therapist: 'Therapist',
      customer: 'Customer',
      service: 'Service',
      time: 'Time',
      reservationTime: 'Reservation Time',
      duration: 'Duration',
      price: 'Price',
      notes: 'Notes',
      status: 'Status',
      date: 'Date',
      bedNumber: 'Bed Number',
    },

    // Modal & Dialog
    modal: {
      confirmPassword: 'Confirm Password',
      enterPassword: 'Enter Password',
      passwordRequired: 'Password is required',
      invalidPassword: 'Invalid password',
    },

    // Menu Items
    menu: {
      monitor: 'Monitor',
      schedule: 'Schedule',
      therapists: 'Therapists',
      customers: 'Customers',
      bookings: 'Bookings',
      finances: 'Finances',
      settings: 'Settings',
      logout: 'Logout',
      changeLogs: 'Change Logs',
      analytics: 'Analytics',
      reports: 'Reports',
    },
  },

  ko: {
    // Header & Navigation
    header: {
      title: '✨ ELSPA 모니터',
      bedMode: '🛏️ 침대 실시간 모드',
      scheduleMode: '📅 테라피스트 일일 스케줄',
      admin: '어드민',
      pollingLabel: '폴링',
      times: '회',
      startNewMassage: '+ 마사지 시작',
      adminDetail: '📅 어드민 상세관리',
    },

    // Bed Status
    bedStatus: {
      available: '비어있음',
      inService: '서비스중',
      reserved: '예약됨',
      cleaning: '정리중',
      unknown: '상태불명',
      statusLabel: {
        available: '✅ 비어있음',
        reserved: '🔵 예약됨',
        inService: '💆 서비스중',
        cleaning: '🧹 정리중',
      },
      immediatelyAvailable: '🟢 즉시 이용 가능',
      cleaning_in_progress: '⏳ 정리 중...',
    },

    // Therapist Status
    therapistStatus: {
      available: '가능',
      inSession: '세션중',
      break: '휴식',
      offDuty: '퇴근',
      idle: '대기중',
      inService: '서비스중',
      resting: '휴식중',
      checkedOut: '퇴근함',
    },

    // Legend
    legend: {
      title: '침대 상태 범례',
      availableDesc: '비어있음 (사용 가능)',
      inServiceDesc: '서비스중 (타이머)',
      reservedDesc: '예약됨 (고객 곧 도착)',
      cleaningDesc: '정리중 (청소/정리)',
    },

    // Stats
    stats: {
      totalRevenue: '총 매출액',
      activeTherapists: '활동 테라피스트',
      completedSessions: '완료된 세션',
      currentlyActive: '진행 중',
      nextAppointment: '다음 일정',
      returnTime: '복귀 예정',
    },

    // Therapist Panel
    therapistPanel: {
      title: '테라피스트 현황',
      checkedIn: '출근',
      total: '총',
      waiting: '대기',
      inSession: '서비스중',
      resting: '휴식',
      avgWaitTime: '⏳ 평균 대기시간',
      nextAvailable: '다음 가용',
      nextAssignmentTarget: '다음 배정 대상',
      immediately: '즉시 가능',
    },

    // Walk-in Modal
    walkIn: {
      title: '워크인 손님 등록',
      selectService: '서비스 선택',
      customerName: '고객명 (선택)',
      preferTherapist: '선호 테라피스트 (선택)',
      suggestedTherapists: '추천 테라피스트',
      suggestedBeds: '추천 침대',
      proceed: '진행',
      cancel: '취소',
    },

    // Service Types
    services: {
      swedish: '스웨디시 마사지',
      thai: '타이 마사지',
      hotstone: '핫스톤 테라피',
      foot: '발마사지',
      aroma: '아로마테라피',
    },

    // Schedule
    schedule: {
      therapists: '테라피스트',
      sessions: '세션',
      noScheduleEdit: '모니터에서 일정을 보기만 할 수 있습니다. 상세 편집은 어드민 사이트를 사용하세요.',
    },

    // Buttons & Actions
    buttons: {
      details: '상세정보',
      checkout: '체크아웃',
      close: '닫기',
      confirm: '확인',
      cancel: '취소',
      save: '저장',
      edit: '편집',
    },

    // Schedule Labels
    scheduleLabels: {
      therapists: '테라피스트 (8)',
      checkedIn: '출근',
      available: '가능',
      inSession: '세션중',
      resting: '휴식',
      offDuty: '퇴근',
      sessions: '세션',
      avgWaitTime: '⏳ 평균 대기시간',
      nextAvailable: '다음 가용',
    },

    // Dashboard Labels
    dashboard: {
      realTimeMonitor: '실시간 침대 모니터',
      bedStatus: '침대 상태',
      therapistStatus: '테라피스트 현황',
      walkInQueue: '워크인 대기열',
      avgRevenue: '평균 매출',
      completedSessions: '완료된 세션',
      currentlyActive: '진행 중',
      nextAppointment: '다음 일정',
      returnTime: '복귀 예정',
      loading: '실시간 데이터 로드 중...',
    },

    // Room Zones
    roomZones: {
      'room_a': '룸 A',
      'room_b': '룸 B',
      'room_c': '룸 C',
      'vip_room': 'VIP 룸',
      'couple_room': '커플 룸',
    },

    // Form Labels & Fields
    labels: {
      therapist: '테라피스트',
      customer: '고객',
      service: '서비스',
      time: '시간',
      reservationTime: '예약시간',
      duration: '소요시간',
      price: '가격',
      notes: '메모',
      status: '상태',
      date: '날짜',
      bedNumber: '침대번호',
    },

    // Modal & Dialog
    modal: {
      confirmPassword: '비밀번호 확인',
      enterPassword: '비밀번호 입력',
      passwordRequired: '비밀번호를 입력하세요',
      invalidPassword: '비밀번호가 틀렸습니다',
    },

    // Menu Items
    menu: {
      monitor: '모니터',
      schedule: '스케줄',
      therapists: '테라피스트',
      customers: '고객',
      bookings: '예약',
      finances: '정산',
      settings: '설정',
      logout: '로그아웃',
      changeLogs: '변경 로그',
      analytics: '분석',
      reports: '보고서',
    },
  },
};

/**
 * Get translation by language and path
 */
export const getTranslation = (language: Language, path: string): string => {
  const keys = path.split('.');
  let result: any = translations[language];

  for (const key of keys) {
    result = result?.[key];
  }

  return result || path;
};

/**
 * Get translation object for current language
 */
export const getTranslations = (language: Language) => {
  return translations[language];
};
