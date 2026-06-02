# 결제/정산 API 엔드포인트 명세

**작성일:** 2026-06-02  
**버전:** 1.0  
**상태:** 구현 준비 완료

---

## 📋 개요

이 문서는 ElSpa 결제/정산 시스템의 API 엔드포인트를 정의합니다.

### 핵심 기능

1. **결제 방법 관리** — 예약별 지급 방법 기록
2. **SSS 옵션** — 필리핀 사회보장시스템 (선지급/정부 인보이스)
3. **결제 출처** — 고객 직접/외상/바우처/멤버십 구분
4. **정산 관리** — 월간 정산, 거래 추적, 완료 처리

---

## 📂 파일 구조

```
app/
├── schemas/
│   └── payment_settlement.py      # Pydantic 스키마 (8개)
├── routers/
│   └── payment_settlement.py      # API 라우터 (2개)
└── models/
    └── company_settlement.py      # SQLAlchemy 모델 (기존)
```

---

## 🔌 API 엔드포인트 (7개)

### 그룹 1: 결제 방법 관리 (4개)

#### 1. POST `/api/bookings/{id}/payment-methods`

**목적:** 예약에 결제 방법 추가

**요청**

```http
POST /api/bookings/12345/payment-methods HTTP/1.1
Content-Type: application/json

{
  "payment_method": "bank_transfer",
  "account_number": "123456789",
  "account_name": "John Doe",
  "bank_name": "BDO",
  "notes": "예약 관련 결제"
}
```

**요청 필드**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `payment_method` | enum | ✓ | `bank_transfer` \| `gcash` \| `cash` \| `check` \| `card` \| `manual` |
| `account_number` | string | 조건부 | 은행 송금 시 필수 |
| `account_name` | string | 조건부 | 은행 송금 시 필수 |
| `bank_name` | string | - | 은행명 (선택사항) |
| `gcash_number` | string | 조건부 | GCash 선택 시 필수 |
| `notes` | string | - | 비고 |

**응답 (201 Created)**

```json
{
  "id": 1,
  "booking_id": 12345,
  "payment_method": "bank_transfer",
  "account_number": "123456789",
  "account_name": "John Doe",
  "bank_name": "BDO",
  "gcash_number": null,
  "notes": "예약 관련 결제",
  "created_at": "2026-06-02T10:30:00Z",
  "updated_at": "2026-06-02T10:30:00Z"
}
```

**에러 응답**

```json
{
  "status": 404,
  "message": "예약을 찾을 수 없습니다",
  "detail": "Booking with ID 12345 not found"
}
```

**사용 시나리오**

- 관리자가 예약의 결제 방법을 등록
- 자동 정산 시 지급 대상 확인
- 거래 추적

---

#### 2. PATCH `/api/bookings/{id}/sss-option`

**목적:** SSS (Social Security System) 정산 옵션 업데이트

**개념 설명**

SSS는 필리핀 사회보장시스템으로, 다음 3가지 방식을 지원합니다:

- **prepaid**: 선지급 (사전에 정부 대신 회사가 지급)
- **gov_invoice**: 정부 인보이스 기반 정산
- **full_recovery**: 전액 회수

기본 기여율: **12.5%** (필리핀 표준)

**요청**

```http
PATCH /api/bookings/12345/sss-option HTTP/1.1
Content-Type: application/json

{
  "sss_status": "prepaid",
  "sss_contribution_percent": 12.5,
  "notes": "선지급 기반 정산"
}
```

**요청 필드**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `booking_id` | integer | ✓ | (URL에 포함) |
| `sss_status` | enum | ✓ | `not_applicable` \| `prepaid` \| `gov_invoice` \| `full_recovery` |
| `sss_contribution_percent` | float | - | 기여율 (0~100%) |
| `notes` | string | - | 비고 |

**응답 (200 OK)**

```json
{
  "booking_id": 12345,
  "sss_status": "prepaid",
  "sss_contribution_percent": 12.5,
  "notes": "선지급 기반 정산",
  "updated_at": "2026-06-02T10:30:00Z"
}
```

**사용 시나리오**

- 직원별 SSS 정산 방식 설정
- 월간 정산 시 자동 차감 기준 결정
- 정부 규정 준수 추적

---

#### 3. PATCH `/api/bookings/{id}/payment-from`

**목적:** 결제 출처 업데이트

**개념 설명**

결제 출처는 정산 카테고리를 결정합니다:

- **customer**: 고객 직접 결제 → 회수율 100%
- **company_credit**: 기업 외상 → 회수율 변동 (관리자 지정)
- **voucher**: 바우처 사용 → 회수율 0%
- **membership**: 멤버십 결제 → 회수율 100%
- **promo**: 프로모션 → 회수율 0%

**요청**

```http
PATCH /api/bookings/12345/payment-from HTTP/1.1
Content-Type: application/json

{
  "payment_from": "company_credit",
  "company_credit_id": 567,
  "notes": "ABC회사 신용"
}
```

**요청 필드**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `booking_id` | integer | ✓ | (URL에 포함) |
| `payment_from` | enum | ✓ | `customer` \| `company_credit` \| `voucher` \| `membership` \| `promo` |
| `company_credit_id` | integer | 조건부 | `company_credit` 선택 시 필수 |
| `voucher_id` | integer | 조건부 | `voucher` 선택 시 필수 |
| `notes` | string | - | 비고 |

**응답 (200 OK)**

```json
{
  "booking_id": 12345,
  "payment_from": "company_credit",
  "company_credit_id": 567,
  "voucher_id": null,
  "notes": "ABC회사 신용",
  "updated_at": "2026-06-02T10:30:00Z"
}
```

**사용 시나리오**

- 고객 유형별 정산 기준 설정
- 기업 외상 회수율 추적
- 프로모션/바우처 관리

---

#### 4. GET `/api/bookings/{id}/payment-info`

**목적:** 예약의 모든 결제 정보 조회

**요청**

```http
GET /api/bookings/12345/payment-info HTTP/1.1
```

**응답 (200 OK)**

```json
{
  "booking_id": 12345,
  "payment_method": "bank_transfer",
  "payment_from": "company_credit",
  "sss_status": "prepaid",
  "payment_method_details": {
    "id": 1,
    "account_number": "123456789",
    "account_name": "John Doe",
    "bank_name": "BDO"
  },
  "updated_at": "2026-06-02T10:30:00Z"
}
```

**사용 시나리오**

- 예약의 모든 결제 정보를 한 화면에서 확인
- 정산 기준 검증
- 감사 추적

---

### 그룹 2: 정산 관리 (3개)

#### 5. GET `/api/settlements/pending`

**목적:** 정산 대기 목록 조회

**개념 설명**

상태가 `draft`, `pending`, `approved`인 모든 정산을 조회합니다.
각 정산에는 거래 내역(transactions)이 포함됩니다.

**요청**

```http
GET /api/settlements/pending?skip=0&limit=50&company_id=100&status_filter=draft HTTP/1.1
```

**쿼리 파라미터**

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `skip` | integer | 0 | 오프셋 (페이지네이션) |
| `limit` | integer | 100 | 조회 건수 (1~1000) |
| `company_id` | integer | - | 업체 ID로 필터링 |
| `status_filter` | string | - | 상태 필터: `draft` \| `pending` \| `approved` |

**응답 (200 OK)**

```json
{
  "total": 5,
  "pending_count": 3,
  "items": [
    {
      "id": 1,
      "company_id": 100,
      "settlement_period_year": 2026,
      "settlement_period_month": 6,
      "total_revenue": "50000.00",
      "guest_revenue": "30000.00",
      "credit_revenue": "20000.00",
      "waived_revenue": "0.00",
      "recovery_rate": "100.00",
      "platform_fee": "12500.00",
      "net_settlement": "37500.00",
      "status": "draft",
      "transactions": [
        {
          "id": 101,
          "booking_id": 12345,
          "transaction_type": "booking",
          "settlement_category": "guest",
          "amount": "5000.00",
          "recovery_rate": "100.00",
          "recovered_amount": "5000.00",
          "transaction_date": "2026-06-02",
          "notes": "일반 고객 결제"
        }
      ],
      "created_at": "2026-06-02T10:30:00Z"
    }
  ]
}
```

**정산 상태 의미**

| 상태 | 설명 |
|------|------|
| `draft` | 초안 (자동 계산 완료, 승인 대기) |
| `pending` | 대기 중 (검증 진행 중) |
| `approved` | 승인됨 (지급 대기) |
| `settled` | 정산 완료 (지급 완료) |
| `confirmed` | 확정됨 (은행 거래 확인) |
| `rejected` | 거부됨 (재계산 필요) |

**사용 시나리오**

- 정산 대기 업무 확인
- 월간 정산 승인 프로세스
- 업체별 정산 현황 조회

---

#### 6. GET `/api/settlements/{id}`

**목적:** 정산 상세 조회

**요청**

```http
GET /api/settlements/1 HTTP/1.1
```

**응답 (200 OK)**

```json
{
  "id": 1,
  "company_id": 100,
  "settlement_period_year": 2026,
  "settlement_period_month": 6,
  "total_revenue": "50000.00",
  "guest_revenue": "30000.00",
  "credit_revenue": "20000.00",
  "waived_revenue": "0.00",
  "recovery_rate": "100.00",
  "platform_fee": "12500.00",
  "net_settlement": "37500.00",
  "status": "draft",
  "transactions": [
    {
      "id": 101,
      "booking_id": 12345,
      "transaction_type": "booking",
      "settlement_category": "guest",
      "amount": "5000.00",
      "recovery_rate": "100.00",
      "recovered_amount": "5000.00",
      "transaction_date": "2026-06-02",
      "notes": "일반 고객 결제"
    },
    {
      "id": 102,
      "booking_id": 12346,
      "transaction_type": "refund",
      "settlement_category": "guest",
      "amount": "-1000.00",
      "recovery_rate": "100.00",
      "recovered_amount": "-1000.00",
      "transaction_date": "2026-06-02",
      "notes": "부분 환불"
    }
  ],
  "created_at": "2026-06-02T10:30:00Z"
}
```

**정산 금액 계산식**

```
guest_recovered = guest_revenue × 1.00
credit_recovered = credit_revenue × (recovery_rate / 100)
platform_fee = (total_revenue - waived_revenue) × (fee_rate / 100)

net_settlement = guest_recovered + credit_recovered 
               - platform_fee 
               - refunds 
               - disputes 
               - other_deductions
```

**사용 시나리오**

- 정산 내역 상세 검증
- 거래별 회수율 확인
- 분쟁/환불 추적

---

#### 7. PATCH `/api/settlements/{id}/mark-settled`

**목적:** 정산 완료 처리

**개념 설명**

정산 상태를 `settled` 또는 `confirmed`로 변경하고,
실제 지급 정보(payment_method, payment_date)를 기록합니다.

이 엔드포인트는 **관리자만** 호출 가능합니다.

**요청**

```http
PATCH /api/settlements/1/mark-settled HTTP/1.1
Content-Type: application/json

{
  "payment_method": "bank_transfer",
  "payment_date": "2026-06-02",
  "notes": "BDO 계좌로 이체",
  "paid_by": "admin_user"
}
```

**요청 필드**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `settlement_id` | integer | ✓ | (URL에 포함) |
| `payment_method` | enum | ✓ | `bank_transfer` \| `gcash` \| `cash` \| `check` \| `manual` |
| `payment_date` | date | ✓ | 실제 지급 날짜 (YYYY-MM-DD) |
| `notes` | string | - | 처리 메모 |
| `paid_by` | string | - | 처리자 (관리자 ID/이름) |

**응답 (200 OK)**

```json
{
  "id": 1,
  "status": "settled",
  "payment_method": "bank_transfer",
  "payment_date": "2026-06-02",
  "net_settlement": "37500.00",
  "updated_at": "2026-06-02T15:30:00Z"
}
```

**상태 전환 규칙**

```
draft → pending → approved → settled → confirmed

draft:       자동 계산 완료
pending:     검증/승인 진행
approved:    승인 완료, 지급 대기
settled:     실제 지급 완료
confirmed:   은행 거래 확인
```

**사용 시나리오**

- 월간 정산 지급 처리
- 지급 날짜/방법 기록
- 감사 로그 생성

---

## 🔐 보안 & 권한

### 권한 매핑

| 엔드포인트 | 필요 권한 | 설명 |
|---------|---------|------|
| POST payment-methods | `booking.write` | 결제 방법 추가 |
| PATCH sss-option | `booking.write` | SSS 옵션 수정 |
| PATCH payment-from | `booking.write` | 결제 출처 수정 |
| GET payment-info | `booking.read` | 결제 정보 조회 |
| GET settlements/pending | `settlement.read` | 정산 목록 조회 |
| GET settlements/{id} | `settlement.read` | 정산 상세 조회 |
| PATCH settlements/.../mark-settled | `settlement.admin` | **관리자 전용** |

### 권장 사항

1. **인증 (Authentication)**
   - JWT 토큰 기반 (Authorization: Bearer <token>)
   - 모든 엔드포인트에 인증 필수

2. **권한 제어 (Authorization)**
   - 역할 기반 접근 제어 (RBAC)
   - 정산 완료는 관리자만 가능

3. **감사 로그 (Audit Trail)**
   - 모든 쓰기 작업 기록
   - 누가, 언제, 무엇을 변경했는지 추적

---

## 📊 데이터 구조

### Booking 모델 확장 필요 필드

```python
class Booking(Base):
    # 기존 필드...
    
    # 결제 관련 새 필드
    payment_method: str          # bank_transfer, gcash, cash, check, card, manual
    payment_from: str            # customer, company_credit, voucher, membership, promo
    
    # SSS 관련 필드
    sss_status: str              # not_applicable, prepaid, gov_invoice, full_recovery
    sss_contribution_percent: float  # 0~100
```

### PaymentMethod 모델 추가 필요

```python
class PaymentMethod(Base):
    id: int
    booking_id: int (FK)
    payment_method: str
    account_number: str
    account_name: str
    bank_name: str
    gcash_number: str
    notes: str
    created_at: datetime
    updated_at: datetime
```

---

## 🔄 정산 프로세스 흐름

```
1️⃣ 예약 생성
   ↓
2️⃣ 결제 방법 등록 (POST payment-methods)
   ↓
3️⃣ SSS/결제 출처 설정 (PATCH sss-option, PATCH payment-from)
   ↓
4️⃣ 월간 정산 자동 생성 (배치 작업)
   ↓
5️⃣ 정산 목록 조회 (GET settlements/pending)
   ↓
6️⃣ 정산 승인 (상태 변경: draft → approved)
   ↓
7️⃣ 정산 완료 처리 (PATCH mark-settled)
   ↓
8️⃣ 지급 확인 (상태 변경: settled → confirmed)
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 고객 직접 결제

```bash
# 1. 결제 방법 추가
curl -X POST /api/bookings/12345/payment-methods \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "bank_transfer",
    "account_number": "123456789",
    "account_name": "John Doe",
    "bank_name": "BDO"
  }'

# 2. 결제 출처 설정 (고객 직접)
curl -X PATCH /api/bookings/12345/payment-from \
  -H "Content-Type: application/json" \
  -d '{
    "payment_from": "customer"
  }'

# 3. 정산 대기 목록 조회
curl -X GET /api/settlements/pending

# 4. 정산 완료 처리
curl -X PATCH /api/settlements/1/mark-settled \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "bank_transfer",
    "payment_date": "2026-06-02",
    "paid_by": "admin_user"
  }'
```

### 시나리오 2: 기업 외상

```bash
# 1. 결제 출처 설정 (기업 외상)
curl -X PATCH /api/bookings/12345/payment-from \
  -H "Content-Type: application/json" \
  -d '{
    "payment_from": "company_credit",
    "company_credit_id": 567,
    "notes": "ABC회사 신용"
  }'

# 2. SSS 옵션 설정
curl -X PATCH /api/bookings/12345/sss-option \
  -H "Content-Type: application/json" \
  -d '{
    "sss_status": "prepaid",
    "sss_contribution_percent": 12.5
  }'
```

---

## 📝 구현 체크리스트

### Phase 1: 모델 & 스키마 (완료)
- [x] PaymentMethod 스키마
- [x] SSSOption 스키마
- [x] PaymentSource 스키마
- [x] Settlement 스키마

### Phase 2: 라우터 (진행 중)
- [x] 라우터 골격 작성
- [ ] 데이터베이스 쿼리 구현
- [ ] 에러 처리 개선
- [ ] 입력 유효성 검사 강화

### Phase 3: 모델 확장
- [ ] Booking 모델에 필드 추가
- [ ] PaymentMethod 모델 생성
- [ ] 마이그레이션 스크립트 작성

### Phase 4: 테스트 & 문서
- [ ] 통합 테스트 작성
- [ ] API 문서 (Swagger) 생성
- [ ] 사용 가이드 작성

---

## 📚 참고 자료

- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [Pydantic 입력 검증](https://docs.pydantic.dev/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [필리핀 SSS 시스템](https://www.sss.gov.ph/)

---

## ✉️ 문의 & 피드백

**담당자:** jitnet-gif  
**이메일:** kangjichul@hanmail.net  
**최종 수정:** 2026-06-02
