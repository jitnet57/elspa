# ElSpa 자동 스탬프 쿠폰 & 충성도 프로그램
**Loyalty & Stamp Coupon System Planning | Date: 2026-05-05**

---

## 1. 요구사항 개요

### 1.1 기본 정의

```
사용자 충성도 프로그램:

규칙:
├─ 고객이 서비스 10회 이용 → 1회 무료 서비스 (자동)
├─ 스탬프: 각 예약마다 1개 스탬프 적립
├─ 10개 스탬프 모음 → 쿠폰 생성 (자동)
├─ 쿠폰 가치: 1회 서비스 가격 (평균 80,000₩)
├─ 유효기간: 쿠폰 생성 후 3개월
└─ 알림: 쿠폰 생성 시 푸시/이메일/SMS 자동 발송

목표:
✅ 고객 재방문율 증대
✅ 경쟁사 대비 차별성
✅ 구전 마케팅 (친구 소개)
```

### 1.2 비즈니스 임팩트

```
손이익 분석:

정상 판매:
└─ 매달 500명 × 80,000₩ = 40M₩
   (마진율: 50% → 순익 20M₩)

스탬프 프로그램:
├─ 재방문율: 80% → 85% (+5%)
├─ 추가 고객: 500 × 5% = 25명/월
├─ 추가 매출: 25명 × 80,000₩ = 2M₩
├─ 쿠폰 비용: -25쿠폰 × 80,000₩ = -2M₩
└─ 순 임팩트: ±0 (초기), but 고객만족도 ⬆️

장기 효과 (6개월):
├─ 재방문율 ⬆️ 85% → 90%
├─ 고객생명가치 (LTV): 4회 → 5.5회
├─ 리뷰/평점 개선 (만족도 높음)
└─ 마진율 개선 (충성 고객 = 높은 마진)
```

---

## 2. 스탬프 시스템 상세 설계

### 2.1 스탬프 적립 규칙

```
스탬프 적립 조건:

1️⃣  조건 1: 예약 완료 (필수)
    ├─ 예약 상태: completed (투어 종료 후)
    ├─ 적립 시점: 서비스 완료 후 자동
    ├─ 적립 개수: 1회 = 1개 스탬프
    └─ 취소 시: 스탐프 회수 (상태: cancelled)

2️⃣  조건 2: 리뷰 작성 (선택)
    ├─ 리뷰 작성: +1 보너스 스탬프
    ├─ 조건: 별점 3점 이상
    └─ 시점: 리뷰 저장 후 즉시

3️⃣  조건 3: 친구 초대 (선택)
    ├─ 친구가 첫 예약: +1 스탬프 (초대자)
    ├─ 친구가 두 번째 예약: +1 스탐프 (친구도)
    └─ 무제한 반복 가능

4️⃣  조건 4: 프로모션 (관리자 설정)
    ├─ 생일 주간: +1 스탬프
    ├─ 특정 서비스: +1 스탬프 (예: 신규 서비스)
    └─ 계절 프로모션: +1 스탐프

스탐프 적립 흐름:
예약 완료
  ↓ (자동)
customer.stamps += 1 (DB 업데이트)
  ↓ (자동 확인: stamps >= 10?)
  ├─ YES → 쿠폰 생성
  │         customer.stamps = 0
  │         coupons.create()
  │         알림 발송 (푸시/이메일)
  │
  └─ NO → 스탐프만 업데이트
          User Site에서 "9/10" 표시
```

### 2.2 스탐프 표시 (User Site)

```
User Site - 마이페이지:

┌────────────────────────────────────────┐
│ 👤 내 정보                              │
├────────────────────────────────────────┤
│                                        │
│ 🎁 충성도 프로그램                     │
│ ┌────────────────────────────────┐   │
│ │                                │   │
│ │ 🟢🟢🟢🟢🟢🟢🟢🟢🟢⭕           │ 9/10  │
│ │                                │   │
│ │ "거의 다 왔어요! 1회 더 예약  │   │
│ │  하면 무료 서비스 쿠폰 지급!" │   │
│ │                                │   │
│ │ [다음 서비스 예약하기]          │   │
│ │                                │   │
│ └────────────────────────────────┘   │
│                                        │
│ 📋 내 쿠폰                             │
│ ├─ 사용 가능: 3개                      │
│ │  ├─ 무료 마사지 (2026-06-30 만료) │
│ │  ├─ 무료 마사지 (2026-07-15 만료) │
│ │  └─ 무료 마사지 (2026-08-20 만료) │
│ │                                      │
│ ├─ 사용 완료: 5개                     │
│ │  ├─ 무료 마사지 ✅ (2026-03-10)  │
│ │  └─ ... (3개 더)                   │
│ │                                      │
│ └─ 만료됨: 0개                        │
│                                        │
│ 📊 통계                               │
│ ├─ 총 방문: 45회                      │
│ ├─ 총 적립: 45개 스탐프               │
│ ├─ 사용한 쿠폰: 5개                   │
│ └─ 절감액: 400,000₩                  │
│                                        │
└────────────────────────────────────────┘
```

### 2.3 스탐프 보기 (대시보드 카드)

```
메인 대시보드 / 예약 후:

┌─────────────────────────────────────┐
│ 축하합니다! 🎉                       │
├─────────────────────────────────────┤
│                                     │
│ 스탐프 획득:                         │
│ ┌─────────────────────────────┐   │
│ │                             │   │
│ │  🟢🟢🟢🟢🟢 5/10             │   │
│ │  다음 무료 서비스까지 5회!  │   │
│ │  [예약하기]                 │   │
│ │                             │   │
│ └─────────────────────────────┘   │
│                                     │
│ + 보너스 스탐프!                   │
│ ├─ 리뷰 작성 하시면: +1 스탐프    │
│ └─ [리뷰 작성]                     │
│                                     │
│ [다음] [쿠폰 보기]                 │
│                                     │
└─────────────────────────────────────┘
```

---

## 3. 쿠폰 시스템

### 3.1 쿠폰 생성 & 관리

```
쿠폰 (Coupon) 정의:

쿠폰 레코드:
├─ id (PK: 예: COUP-2026-05-001)
├─ customer_id (FK)
├─ coupon_type ('free_service')
├─ discount_value (80,000₩ 고정 또는 계산)
├─ service_type ('massage' / 'guide' / 'any')
├─ created_at (2026-05-15 10:30)
├─ expires_at (2026-08-15 23:59)
├─ status ('active' | 'used' | 'expired')
├─ used_at (쿠폰 사용 시간)
├─ used_booking_id (FK → bookings)
└─ notes (메모)

쿠폰 생성 프로세스:
1. 고객 스탐프 10개 도달 (자동 감지)
   → Bull Queue 트리거

2. 쿠폰 생성
   ├─ coupon_type: 'free_service'
   ├─ discount_value: 고객의 최근 서비스 가격 평균
   │  (또는 고정값: 80,000₩)
   ├─ expires_at: created_at + 3개월
   └─ status: 'active'

3. 고객 스탐프 초기화
   └─ customer.stamps = 0

4. 알림 발송
   ├─ Push: "무료 서비스 쿠폰이 생성되었습니다! 🎉"
   ├─ Email: "축하합니다! 쿠폰 사용하기"
   ├─ SMS: "ElSpa: 무료 쿠폰 생성됨"
   └─ In-app: "마이페이지에서 쿠폰 확인"

5. 히스토리 저장
   └─ customer_events 테이블에 로그 저장
```

### 3.2 쿠폰 사용 (예약 플로우)

```
예약 페이지 - 결제 전:

┌────────────────────────────────────┐
│ 예약 상세                          │
├────────────────────────────────────┤
│ 서비스: 스웨디시 60분              │
│ 가격: 80,000₩                     │
│ 테라피스트: 박영희                │
│ 시간: 2026-05-20 14:00            │
│                                    │
│ 💳 결제 정보                        │
│ ├─ 기본 가격: 80,000₩             │
│ ├─ 할인쿠폰: ▼                    │
│ │  ├─ 미적용                      │
│ │  ├─ 🎁 무료 서비스 쿠폰 (1개)   │
│ │  │  └─ -80,000₩                 │
│ │  └─ [프로모션 코드]             │
│ │                                  │
│ ├─ 최종 가격: 0₩ (무료)           │
│ │  "쿠폰 사용!" ✅                 │
│ │                                  │
│ └─ [결제하기]                      │
│    (결제 불필요)                  │
│                                    │
│ [약관 동의] [예약]                │
│                                    │
└────────────────────────────────────┘

사용 프로세스:
1. [할인쿠폰] 드롭다운 클릭
   ↓
2. 활성화된 쿠폰 목록 표시
   - 무료 서비스 쿠폰 (3개)
   - 프로모션 코드 (예: WELCOME10 - 10%)
   ↓
3. 무료 쿠폰 선택
   ↓
4. 가격 자동 계산
   - 기본 가격 - 쿠폰값 = 최종 가격
   ↓
5. [예약] 클릭
   ↓
6. 예약 완료
   - booking.coupon_id = 저장
   - coupon.status = 'used'
   - coupon.used_at = 현재시간
   - coupon.used_booking_id = booking_id
```

### 3.3 쿠폰 만료 & 정리

```
만료 정책:

쿠폰 유효기간:
├─ 쿠폰 생성일: 2026-05-15
├─ 만료일: 2026-08-15 (3개월)
├─ 3일 전 알림 (2026-08-12): "쿠폰이 3일 후 만료됩니다"
└─ 만료 후: status = 'expired' (사용 불가)

자동 만료 Job (Cron):
매일 02:30 실행
├─ 어제 만료된 쿠폰 조회
│  WHERE expires_at = YESTERDAY AND status = 'active'
├─ 상태 업데이트
│  UPDATE coupon SET status = 'expired'
└─ 히스토리 저장
   INSERT INTO coupon_events
```

---

## 4. 알림 시스템

### 4.1 알림 시나리오

```
시나리오 1: 쿠폰 생성 알림
┌──────────────────────────────┐
│ 🎉 축하합니다!               │
├──────────────────────────────┤
│ 무료 서비스 쿠폰이           │
│ 생성되었습니다!              │
│                              │
│ 사용 가능: 2026-08-15까지   │
│                              │
│ [쿠폰 확인하기]              │
│ [다음 예약하기]              │
│                              │
│ 전달: Push + Email + SMS      │
└──────────────────────────────┘

시나리오 2: 스탐프 진행 알림 (1회 후)
┌──────────────────────────────┐
│ 📍 진행상황                   │
├──────────────────────────────┤
│ 스탐프: 1/10                 │
│                              │
│ 아직 9회 더 필요합니다!      │
│ 다음 서비스 예약하기         │
│                              │
│ [예약하기]                   │
│                              │
│ 전달: In-app 배너             │
└──────────────────────────────┘

시나리오 3: 중간 진행 (5회 후)
┌──────────────────────────────┐
│ 🌟 어? 벌써 중간이네요!      │
├──────────────────────────────┤
│ 스탐프: 5/10                 │
│                              │
│ "반은 왔어요! 다음 달에    │
│  무료 서비스를 받을 수 있어요" │
│                              │
│ [계속 예약하기]              │
│                              │
│ 전달: Email                   │
└──────────────────────────────┘

시나리오 4: 쿠폰 만료 3일 전
┌──────────────────────────────┐
│ ⏰ 쿠폰 곧 만료!             │
├──────────────────────────────┤
│ 무료 쿠폰이 3일 후           │
│ 만료됩니다.                  │
│                              │
│ "지금 예약하세요!"          │
│                              │
│ [예약하기]                   │
│                              │
│ 전달: Push + SMS              │
└──────────────────────────────┘

시나리오 5: 쿠폰 만료됨
┌──────────────────────────────┐
│ ❌ 쿠폰 만료됨              │
├──────────────────────────────┤
│ 무료 쿠폰이 만료되었습니다.  │
│                              │
│ "다시 10개 스탐프를 모아    │
│  새로운 쿠폰을 받으세요!"  │
│                              │
│ [새로 예약하기]              │
│                              │
│ 전달: Push + Email            │
└──────────────────────────────┘
```

### 4.2 알림 채널별 템플릿

```
Push Notification:
- 제목: "🎉 축하합니다! 무료 서비스 쿠폰이 생성되었어요"
- 본문: "3개월 이내에 사용하세요. [쿠폰 보기]"
- 딥링크: "elspa://coupons"

Email:
- 제목: "[ElSpa] 무료 서비스 쿠폰 생성 안내"
- 본문: 
  * Tailwind CSS 이메일 템플릿
  * 쿠폰 코드 표시
  * 사용 방법 설명
  * 쿠폰 이미지 (QR 코드)
  * [쿠폰 사용하기] CTA 버튼
- 발신: noreply@elspa.com

SMS:
- "ElSpa: 무료 서비스 쿠폰이 생성되었어요! 📱 앱에서 확인 후 예약하세요"
- 발신: ElSpa (약 160자)

In-App Banner:
- 위치: 대시보드 상단 또는 마이페이지
- 스타일: Tailwind CSS (축하 배너, 애니메이션)
- 액션: [쿠폰 보기] [예약하기] [닫기]
```

---

## 5. 데이터 모델

### 5.1 신규 테이블

```
customers 테이블 (확장):
├─ 추가: stamps (정수, 기본값 0)
│  └─ 누적 스탐프 개수 (0-9)
└─ 추가: lifetime_stamps (정수, 기본값 0)
   └─ 생명주기 누적 (분석용)

coupons 테이블 (신규):
├─ id (PK: COUP-2026-05-001 형식)
├─ customer_id (FK)
├─ coupon_type (string: 'free_service')
├─ discount_value (정수: 80000)
├─ service_type (string: 'massage' | 'guide' | 'any')
├─ discount_percentage (NULL, free_service는 고정값)
├─ code (UUID, 실제 쿠폰 코드)
├─ created_at
├─ expires_at
├─ status (enum: 'active', 'used', 'expired')
├─ used_at
├─ used_booking_id (FK → bookings)
└─ notes

stamp_events 테이블 (히스토리):
├─ id (PK)
├─ customer_id (FK)
├─ event_type (enum: 'service_completed', 'review_written', 'referral', 'bonus')
├─ stamps_delta (정수: +1, -1 등)
├─ reason (string: '서비스 완료', '리뷰 작성' 등)
├─ reference_id (FK: booking_id 또는 review_id)
├─ created_at
└─ notes

coupon_events 테이블 (히스토리):
├─ id (PK)
├─ coupon_id (FK)
├─ event_type (enum: 'created', 'used', 'expired')
├─ status_before
├─ status_after
├─ created_at
└─ notes
```

### 5.2 API 엔드포인트

```
기존 Booking Service 확장:

GET /api/customers/:id/stamps
→ { stamps: 9, lifetime_stamps: 45, next_coupon_date: "2026-05-20" }

GET /api/customers/:id/coupons
→ {
    active: [
      { id: 'COUP-2026-05-001', value: 80000, expires_at: '2026-08-15' },
      { id: 'COUP-2026-04-005', value: 80000, expires_at: '2026-07-10' }
    ],
    used: [...],
    expired: [...]
  }

POST /api/bookings (결제 시)
- Request: { coupon_id: 'COUP-2026-05-001', ... }
- Logic:
  1. 쿠폰 유효성 확인 (status, expires_at)
  2. 쿠폰 서비스 타입 확인 (service_type)
  3. 최종 가격 계산 (price - discount)
  4. 예약 생성 (booking.coupon_id 저장)
  5. 쿠폰 상태 업데이트 (status = 'used')

Customer 승격 (자동):
POST /api/internal/promote-stamp
- Trigger: Bull Queue (매시간 확인)
- Logic:
  1. stamps >= 10인 고객 찾기
  2. 쿠폰 생성
  3. stamps = 0 초기화
  4. 알림 발송 (Push, Email, SMS)
```

---

## 6. Admin 관리 기능

### 6.1 Admin Dashboard - 충성도 관리

```
Admin Site - 충성도 프로그램:

┌─────────────────────────────────────┐
│ 💳 충성도 프로그램 관리              │
├─────────────────────────────────────┤
│                                     │
│ 📊 통계                             │
│ ├─ 총 활성 고객: 342명              │
│ ├─ 쿠폰 생성: 180개 (이달)         │
│ ├─ 쿠폰 사용: 165개 (이달)         │
│ ├─ 만료됨: 5개 (이달)              │
│ └─ 절감액: 13.2M₩                  │
│                                     │
│ ⚙️  설정                            │
│ ├─ 스탐프 기본값: 1개/예약         │
│ ├─ 쿠폰 가치: 80,000₩ (또는 동적) │
│ ├─ 쿠폰 유효기간: 90일             │
│ ├─ 보너스 스탐프:                  │
│ │  ├─ 리뷰 작성: +1                │
│ │  ├─ 친구 초대: +1                │
│ │  └─ 생일주간: +1                 │
│ └─ [설정 저장]                      │
│                                     │
│ 🎯 프로모션 설정                   │
│ ├─ 특정 서비스: [마사지▼] +1스탐프 │
│ ├─ 기간: [2026-05-01] ~ [2026-06-30]
│ ├─ 대상: [활성 고객▼]              │
│ └─ [프로모션 추가] [활성화]        │
│                                     │
│ 📋 쿠폰 관리                        │
│ ├─ 필터: [상태▼] [고객▼] [기간▼]  │
│ ├─ 쿠폰 목록                       │
│ │  ├─ COUP-2026-05-001 (김영희)    │
│ │  │  상태: 활성, 2026-08-15 만료 │
│ │  │  [세부] [수동 사용] [취소]    │
│ │  └─ ...                          │
│ └─ [일괄 작업] [내보내기]          │
│                                     │
│ 👥 고객 분석                        │
│ ├─ 스탐프 분포:                    │
│ │  ├─ 0개: 150명 (44%)             │
│ │  ├─ 1-5개: 120명 (35%)           │
│ │  ├─ 6-9개: 65명 (19%)            │
│ │  └─ 10개+: 7명 (2%, 쿠폰 받음)  │
│ │                                   │
│ └─ 차트: 스탐프 보유분포            │
│                                     │
└─────────────────────────────────────┘
```

### 6.2 Admin 수동 작업

```
Admin이 할 수 있는 작업:

1. 쿠폰 수동 생성
   ├─ 고객 선택
   ├─ 쿠폰 가치 (기본값 또는 커스텀)
   ├─ 유효기간 설정
   └─ [생성] → 알림 자동 발송

2. 쿠폰 수동 적용
   ├─ 고객의 쿠폰을 예약에 자동 적용
   ├─ (고객이 깜빡한 경우)
   └─ 예약에 쿠폰_id 추가

3. 스탐프 수동 부여
   ├─ 고객 선택
   ├─ 스탐프 개수 입력 (+1, -1 등)
   ├─ 사유 입력 (예: "고객 요청 환불")
   └─ [저장] → 히스토리 기록

4. 쿠폰 취소/만료 강제
   ├─ 문제있는 쿠폰 수동 취소
   ├─ 상태 변경: active → cancelled
   └─ 히스토리 기록

5. 프로모션 설정
   ├─ 특정 기간에만 보너스 스탐프
   ├─ 특정 서비스만 추가 스탐프
   └─ 자동으로 계산
```

---

## 7. 프로세스 흐름도

### 7.1 전체 스탐프 → 쿠폰 생명주기

```
고객 여정:

Day 1: 첫 예약
┌────────────────────────────┐
│ 1. 예약 완료               │
│    서비스: 스웨디시 60분    │
│    가격: 80,000₩           │
│ 2. 자동 스탐프 적립        │
│    stamps = 1              │
│ 3. UI 알림                 │
│    "스탐프 1개 획득! 9개   │
│     더 필요합니다"         │
│ 4. 옵션: 리뷰 작성 → +1   │
│    ("리뷰 작성 시 +1      │
│     스탐프 추가!")        │
└────────────────────────────┘
         ↓ (반복: Day 5, 10, 15, 20, 25)

Day 25: 9개 스탐프 도달
┌────────────────────────────┐
│ "거의 다 왔어요! 1회만    │
│  더 예약하면 무료 쿠폰!" │
└────────────────────────────┘
         ↓

Day 30: 10번째 예약
┌────────────────────────────┐
│ 1. 10번째 예약 완료        │
│ 2. 스탐프 +1 → 10개 도달  │
│ 3. 자동 쿠폰 생성          │
│    - ID: COUP-2026-05-001 │
│    - 가치: 80,000₩         │
│    - 만료: 2026-08-30     │
│ 4. 스탐프 초기화           │
│    stamps = 0              │
│ 5. 알림 발송 (3채널)       │
│    - Push: 🎉 쿠폰 생성!   │
│    - Email: 상세 안내      │
│    - SMS: 간단 안내        │
└────────────────────────────┘
         ↓

Day 31~120 (3개월): 쿠폰 사용 기간
┌────────────────────────────┐
│ Option A: 사용             │
│ ├─ 예약 시 쿠폰 선택       │
│ ├─ 가격 자동 할인          │
│ ├─ 예약 완료 (0원)        │
│ └─ 쿠폰 상태 = 'used'     │
│                           │
│ Option B: 미사용           │
│ └─ 날짜 흐름 (사용 가능)  │
│                           │
│ Day 118: 만료 3일전        │
│ ├─ 알림: "3일 후 만료!"  │
│ └─ [지금 예약하기]        │
│                           │
│ Day 121: 만료             │
│ ├─ 상태 = 'expired'       │
│ └─ 더 이상 사용 불가      │
└────────────────────────────┘
         ↓

Day 150: 재시작 (또는 아님)
┌────────────────────────────┐
│ 고객이 계속 이용 중        │
│ ├─ Option A: 다시 10회    │
│ │  → 새 쿠폰 생성        │
│ │                         │
│ └─ Option B: 이용 단절    │
│    (마케팅 캠페인 대상)   │
└────────────────────────────┘
```

### 7.2 백엔드 자동화 (Bull Queue)

```
Job 1: 스탐프 적립 (예약 완료 후 즉시)
┌────────────────────────────────────┐
│ Trigger: booking.status = 'completed'
│                                    │
│ Logic:                             │
│ 1. customer_id 조회                │
│ 2. customer.stamps += 1            │
│ 3. stamp_events 기록               │
│ 4. if stamps >= 10:                │
│    ├─ 쿠폰 생성                   │
│    ├─ stamps = 0 초기화            │
│    └─ 알림 발송 3채널            │
│    else:                           │
│    └─ 진행률 UI 업데이트          │
└────────────────────────────────────┘

Job 2: 쿠폰 만료 알림 (매일 09:00)
┌────────────────────────────────────┐
│ SELECT * FROM coupons              │
│ WHERE expires_at = TODAY + 3 DAYS  │
│ AND status = 'active'              │
│                                    │
│ FOR EACH coupon:                   │
│ └─ 알림 발송 (Push + SMS)         │
│    "쿠폰이 3일 후 만료됩니다!"    │
└────────────────────────────────────┘

Job 3: 쿠폰 자동 만료 (매일 02:30)
┌────────────────────────────────────┐
│ SELECT * FROM coupons              │
│ WHERE expires_at <= TODAY          │
│ AND status = 'active'              │
│                                    │
│ FOR EACH coupon:                   │
│ ├─ coupon.status = 'expired'      │
│ ├─ coupon_events 기록             │
│ └─ (선택) 이메일 발송            │
│    "쿠폰이 만료되었습니다"      │
└────────────────────────────────────┘

Job 4: 리뷰 보너스 스탐프 (리뷰 저장 시)
┌────────────────────────────────────┐
│ Trigger: review.created_at          │
│                                    │
│ Logic:                             │
│ 1. review.rating >= 3 확인         │
│ 2. 이미 스탐프받았는지 확인       │
│ 3. customer.stamps += 1            │
│ 4. stamp_events 기록               │
│ 5. if stamps >= 10: 쿠폰 생성     │
└────────────────────────────────────┘

Job 5: 친구 초대 보너스 (예약 생성 시)
┌────────────────────────────────────┐
│ Trigger: 새로운 고객 첫 예약      │
│          (referral_code 있음)      │
│                                    │
│ Logic:                             │
│ 1. referrer_id 조회 (recommender) │
│ 2. referrer.stamps += 1            │
│ 3. new_customer.stamps += 1        │
│ 4. 둘 다 스탐프 이벤트 기록       │
│ 5. 각각 if >= 10: 쿠폰 생성      │
│ 6. 알림 발송                      │
│    "친구 소개로 스탐프 획득!"    │
└────────────────────────────────────┘
```

---

## 8. 데이터베이스 구조 (SQL)

### 8.1 테이블 정의

```sql
-- customers 테이블 확장
ALTER TABLE customers ADD COLUMN (
  stamps INT DEFAULT 0,
  lifetime_stamps INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- coupons 테이블 (신규)
CREATE TABLE coupons (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID NOT NULL,
  coupon_type VARCHAR(50) NOT NULL DEFAULT 'free_service',
  discount_value INTEGER NOT NULL,
  service_type VARCHAR(50) DEFAULT 'any',
  code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  status ENUM('active', 'used', 'expired') DEFAULT 'active',
  used_at TIMESTAMP NULL,
  used_booking_id UUID NULL,
  notes TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (used_booking_id) REFERENCES bookings(id),
  INDEX idx_customer_status (customer_id, status),
  INDEX idx_expires_at (expires_at)
);

-- stamp_events 테이블 (히스토리)
CREATE TABLE stamp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  event_type ENUM('service_completed', 'review_written', 'referral', 'bonus', 'manual', 'correction') NOT NULL,
  stamps_delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_customer_created (customer_id, created_at)
);

-- coupon_events 테이블 (히스토리)
CREATE TABLE coupon_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id VARCHAR(50) NOT NULL,
  event_type ENUM('created', 'used', 'expired', 'cancelled') NOT NULL,
  status_before VARCHAR(20),
  status_after VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  INDEX idx_coupon_created (coupon_id, created_at)
);

-- bookings 테이블 확장
ALTER TABLE bookings ADD COLUMN (
  coupon_id VARCHAR(50),
  discount_amount INTEGER DEFAULT 0,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id)
);
```

---

## 9. Epic/Stories 추가 영향

### 9.1 새로운 스토리 (v4에 추가)

```
Epic 17: 충성도 프로그램 & 스탐프 쿠폰 시스템
- Points: 80
- Duration: W4-W5 (Phase A 후반 ~ Phase B 초반)
- Stories:
  S17.1: 스탐프 시스템 데이터 모델 (12pt)
  S17.2: 자동 스탐프 적립 로직 (18pt)
  S17.3: 자동 쿠폰 생성 엔진 (15pt)
  S17.4: 쿠폰 사용 (예약 플로우) (14pt)
  S17.5: User Site - 스탐프/쿠폰 UI (18pt)
  S17.6: 알림 시스템 (Push+Email+SMS) (12pt)
  S17.7: Admin 관리 대시보드 (15pt)
```

### 9.2 기존 Epic 영향

```
Epic 3 (Booking): +15pt
  └─ 예약 플로우에 쿠폰 적용 로직

Epic 4 (Finance): +10pt
  └─ 할인 금액 정산 처리

Epic 12 (Marketing): +5pt
  └─ 쿠폰/스탐프 분석 리포트

총 추가: 25pt
```

---

## 10. 성과 추적

### 10.1 KPI (Key Performance Indicators)

```
추적할 메트릭:

1. 참여도:
   ├─ 스탐프 보유 고객: 300명 (목표: 3개월 내 50%)
   ├─ 쿠폰 생성: 180개/월 (목표)
   └─ 쿠폰 사용률: 90% (목표: 90% 이상)

2. 재방문:
   ├─ 재방문율: 80% → 85%+ (목표)
   ├─ 월간 반복 구매율: 65% → 75%+ (목표)
   └─ 고객생명가치 (LTV): 상승

3. 만족도:
   ├─ NPS (순추천도): +10pt 상승
   ├─ 평균 평점: 4.7/5.0 → 4.8/5.0
   └─ 리뷰 작성율: 20% → 30% (쿠폰 유인)

4. 비용:
   ├─ 쿠폰 비용 (할인): 2M₩/월
   ├─ 푸시/이메일 비용: 100K₩/월
   └─ ROI: 쿠폰 비용 < 추가 매출
```

---

## 11. 다음 단계

```
✅ 완료된 작업:
- 스탐프 시스템 정의
- 쿠폰 구조 설계
- 알림 전략 수립
- 데이터 모델링
- Admin 기능 정의
- 프로세스 흐름도

⏭️  다음 단계:
1. v4 Final Epic/Stories 작성
   └─ v3 + 여행가이드 (4 Epic) + 스탐프쿠폰 (1 Epic)
   
2. UX 디자인 (Tailwind)
   ├─ User Site: 스탐프 표시, 쿠폰 관리
   └─ Admin: 충성도 대시보드

3. Notification Service API 설계
   └─ Push, Email, SMS 템플릿

4. 일정 재계획
   └─ Phase A 재구성 (W1-W4 → W1-W5?)
```

