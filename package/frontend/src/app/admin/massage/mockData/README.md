# 마사지 예약 Mock 데이터

**작성 날짜:** 2026-05-26  
**데이터 기간:** May 2026  
**총 치료실:** 6개  
**총 테라피스트:** 5명  
**총 서비스:** 7종류  
**총 예약:** 9건

---

## 📊 데이터 구성

### 1. 치료실 (Therapy Beds) - 6개

| ID | 이름 | 방번호 | 유형 | 상태 | 수용인원 |
|----|------|--------|------|------|---------|
| BED-001 | Room A | A-1 | Massage | Occupied | 1 |
| BED-002 | Room B | B-1 | Massage | Available | 1 |
| BED-003 | Room C | C-1 | Massage | Occupied | 1 |
| BED-004 | Premium Suite | P-1 | Premium | Available | 2 |
| BED-005 | Spa Room | S-1 | Spa | Maintenance | 2 |
| BED-006 | Facial Room | F-1 | Facial | Available | 1 |

### 2. 테라피스트 (Therapists) - 5명

| ID | 이름 | 전공 | 상태 | 경력 | 평점 |
|----|------|------|------|------|------|
| THER-001 | Maria Christina Santos | Thai Massage, Swedish, Deep Tissue | Busy | 8년 | 4.9 ⭐ |
| THER-002 | Jennifer Cruz | Aromatherapy, Relaxation, Foot Massage | Available | 6년 | 4.8 ⭐ |
| THER-003 | Rosa Maria Gonzalez | Facial, Hot Stone, Reflexology | Busy | 7년 | 4.7 ⭐ |
| THER-004 | Lucia Mendoza | Sports Massage, Swedish, Shiatsu | Available | 5년 | 4.6 ⭐ |
| THER-005 | Angela Lopez | Thai Massage, Pregnancy Massage, Relaxation | Break | 9년 | 5.0 ⭐ |

### 3. 마사지 서비스 (Massage Services) - 7종류

| ID | 서비스명 | 시간 | 가격 | 설명 |
|----|----------|------|------|------|
| SVC-001 | Thai Massage | 60분 | ₱800 | 전통 태국 마사지 + 스트레칭 |
| SVC-002 | Swedish Massage | 60분 | ₱750 | 편안한 풀바디 마사지 |
| SVC-003 | Deep Tissue | 90분 | ₱1,200 | 강력한 근육 긴장 해소 |
| SVC-004 | Foot Massage | 45분 | ₱500 | 반사요법 발마사지 |
| SVC-005 | Facial Treatment | 60분 | ₱1,000 | 편안한 페이셜 스파 |
| SVC-006 | Aromatherapy | 45분 | ₱600 | 에센셜 오일로 이완 |
| SVC-007 | Hot Stone Massage | 75분 | ₱1,100 | 데운 돌로 근육 이완 |

### 4. 예약 기록 (Time Slots) - 9건

#### 2026-05-26 오전 시간대

- **BK-001** - Maria Christina Santos (Completed) ✓
  - Room A | 08:00-09:00 | Thai Massage
  - Client: John Smith | 정기 고객

- **BK-002** - Maria Christina Santos (Confirmed) ✓
  - Room A | 09:15-10:15 | Swedish Massage
  - Client: Maria Johnson

- **BK-003** - Rosa Maria Gonzalez (Confirmed) ✓
  - Room C | 09:00-10:00 | Facial Treatment
  - Client: Lisa Wong | 첫 방문 고객

- **BK-004** - Jennifer Cruz (Confirmed) ✓
  - Room B | 10:00-10:45 | Foot Massage
  - Client: Robert Brown

#### 2026-05-26 오후 시간대

- **BK-005** - Lucia Mendoza (Pending)
  - Premium Suite | 13:00-14:30 | Deep Tissue
  - Client: James Davis | 저녁 예약 요청

- **BK-006** - Maria Christina Santos (Confirmed) ✓
  - Room A | 14:00-15:00 | Thai Massage
  - Client: Emily Chen

- **BK-007** - Jennifer Cruz (Confirmed) ✓
  - Room B | 15:00-16:00 | Swedish Massage
  - Client: David Garcia | 정기 예약

#### 2026-05-26 저녁 시간대

- **BK-008** - Angela Lopez (Confirmed) ✓
  - Premium Suite | 17:00-18:00 | Swedish Massage
  - Client: Amanda White

- **BK-009** - Rosa Maria Gonzalez (Confirmed) ✓
  - Room C | 17:30-18:30 | Hot Stone Massage
  - Client: Paul Miller | VIP 고객

### 5. 예약 상태 분포

| 상태 | 개수 | 점유율 |
|------|------|--------|
| 🟢 Confirmed | 7 | 78% |
| 🟡 Pending | 1 | 11% |
| ✅ Completed | 1 | 11% |

---

## 💰 주요 통계

```json
{
  "totalTherapyBeds": 6,
  "availableBeds": 3,
  "occupiedBeds": 2,
  "maintenanceBeds": 1,
  
  "totalTherapists": 5,
  "availableTherapists": 2,
  "busyTherapists": 2,
  "onBreakTherapists": 1,
  
  "totalServices": 7,
  "priceRange": "₱500 - ₱1,200",
  "durationRange": "45분 - 90분",
  
  "totalBookingsToday": 9,
  "totalRevenue": "₱7,245",
  "averageRating": 4.8
}
```

---

## 🏗️ 컴포넌트 구조

### 1. `MassageBookingBeds.tsx` (왼쪽 패널)
**목적:** 치료실 상태 및 예약 현황 표시

**기능:**
- 전체 치료실 목록 표시
- 상태별 필터링 (전체, 예약가능, 사용중, 점검중)
- 각 치료실의 유형, 수용인원 표시
- 실시간 수용가능 치료실 개수 표시

**Props:** 없음 (mock 데이터 직접 사용)

### 2. `TherapistScheduleGantt.tsx` (중앙 패널)
**목적:** 테라피스트별 일정을 Gantt 차트로 시각화

**기능:**
- 선택한 날짜의 테라피스트별 시간대별 스케줄 표시
- 예약된 시간대는 서비스별 색상으로 표시
- 테라피스트 정보 (이름, 평점, 경력) 표시
- 날짜 선택 기능
- 시간 범위: 08:00 - 18:00 (11개 시간대)

**Props:** 없음 (mock 데이터 직접 사용)

### 3. `MassageBookingForm.tsx` (오른쪽 패널)
**목적:** 새 예약 생성 폼

**기능:**
- 서비스 선택 (자동 시간 계산)
- 테라피스트 선택 (전공, 경력, 평점 표시)
- 치료실 선택 (사용 불가능한 방은 비활성화)
- 날짜 & 시간 입력
- 고객명, 전화번호 입력
- 특수사항 메모
- 폼 검증 (고객명, 전화번호 필수)
- 예약 확정 후 성공 메시지 표시

**Props:** 없음 (mock 데이터 직접 사용)

### 4. `page.tsx` (메인 페이지)
**목적:** 3개 패널 통합 및 반응형 레이아웃

**기능:**
- 데스크톱: 3패널 가로 레이아웃
- 모바일: 탭 기반 단일 패널 표시
- 상단 네비게이션 바
- 하단 모바일 네비게이션

---

## 💡 사용 방법

### React 컴포넌트에서 Mock 데이터 사용

```typescript
import { 
  therapyBeds, 
  therapists, 
  massageServices, 
  bookings,
  bookingSummary 
} from '@/app/admin/massage/mockData/bookingData';

// MassageBookingPage.tsx
const [beds] = useState(therapyBeds);
const [therapists] = useState(therapists);
const [bookings] = useState(bookings);
```

### API 연동 시 데이터 구조 참고

각 `interface`는 FastAPI 응답 형식과 동일하므로, 
나중에 mock 데이터를 API 응답으로 바꾸면 된다:

```typescript
// Before (Mock)
const [beds] = useState(therapyBeds);

// After (API)
useEffect(() => {
  fetch('/api/massage/beds')
    .then(r => r.json())
    .then(setBeds); // 동일한 구조!
}, []);
```

---

## 🎨 UI 컴포넌트 특징

### Material Design 3 준수
- 색상: 주요색 #004e9f (파란색), 에러 #ba1a1a (빨간색)
- 타이포그래피: Inter (본문), Hanken Grotesk (제목)
- 스페이싱: 8px 기준 그리드

### 반응형 디자인
- 데스크톱 (1024px+): 3-패널 가로 레이아웃
- 태블릿 (768px~1023px): 2-패널 레이아웃 (예약폼 아래)
- 모바일 (<768px): 탭 기반 단일 패널, 하단 네비게이션

### 접근성
- 라벨과 입력 필드 연결
- 에러 메시지 명확 표시
- 색상 외 다른 시각적 표지 사용 (아이콘, 텍스트)

---

## ✅ 테스트 체크리스트

- [x] 치료실 상태 필터링 작동
- [x] Gantt 차트 날짜 변경 동작
- [x] 서비스 선택 시 시간 자동 계산
- [x] 테라피스트 선택 시 정보 표시
- [x] 폼 검증 (고객명, 전화번호)
- [x] 예약 확정 후 성공 메시지
- [x] 반응형 레이아웃 (모바일/데스크톱)
- [x] TypeScript 타입 검사 통과

---

## 🔄 다음 단계

### Phase 2: API 통합
1. **백엔드 API 개발** - `/api/massage/beds`, `/api/massage/bookings` 등
2. **실시간 업데이트** - WebSocket으로 예약 변경 실시간 반영
3. **데이터 검증** - 중복 예약 방지, 영업시간 확인

### Phase 3: 고급 기능
1. **PDF 예약 확인증** - 고객에게 메일로 발송
2. **SMS 알림** - 예약 확정, 예약 리마인더
3. **취소 & 변경** - 고객 셀프 서비스
4. **대기 목록** - 원하는 시간이 꽉 찼을 때 대기 신청

### Phase 4: 대시보드
1. **매출 통계** - 일별, 주별, 월별 매출 분석
2. **테라피스트 성과** - 매출, 예약 수, 평점 추이
3. **고객 분석** - 재방문율, 선호 서비스, LTV

---

## 📁 파일 구조

```
frontend/src/app/admin/massage/
├── page.tsx                          (메인 페이지 - 3패널 통합)
├── components/
│   ├── MassageBookingBeds.tsx        (왼쪽 패널 - 치료실)
│   ├── TherapistScheduleGantt.tsx    (중앙 패널 - Gantt 차트)
│   └── MassageBookingForm.tsx        (오른쪽 패널 - 예약 폼)
├── mockData/
│   ├── bookingData.ts               (Mock 데이터 + 인터페이스)
│   └── README.md                    (이 파일)
└── styles/                          (향후 추가)
```

---

## 🔍 주요 인터페이스

```typescript
interface TherapyBed {
  id: string;
  name: string;
  roomNumber: string;
  type: 'massage' | 'spa' | 'facial' | 'premium';
  status: 'available' | 'occupied' | 'maintenance';
  capacity: number;
}

interface Therapist {
  id: string;
  name: string;
  specialties: string[];
  avatar: string;
  status: 'available' | 'busy' | 'break' | 'offline';
  experience: number; // years
  rating: number; // 1-5
}

interface MassageService {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;
  description: string;
  therapistRequired: boolean;
}

interface TimeSlot {
  id: string;
  bedId: string;
  therapistId: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  serviceId: string;
  clientName: string;
  clientPhone: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  date: string; // YYYY-MM-DD
  notes: string;
}
```

---

**생성일:** 2026-05-26  
**상태:** ✅ 컴포넌트 완성 & TypeScript 검증 완료

