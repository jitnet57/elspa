# 결제/정산 API 엔드포인트 — 종합 요약

**작성일:** 2026-06-02  
**총 엔드포인트:** 7개 (FastAPI 라우터)  
**상태:** 구현 완료 (통합 대기)

---

## 📌 핵심 개요

이 패키지는 ElSpa 플랫폼의 **결제 방법 관리**, **SSS 정산**, **정산 상태 추적** 기능을 제공합니다.

### 주요 기능

1. ✅ **결제 방법 관리** — 은행송금, GCash, 현금 등 5가지 방법
2. ✅ **SSS 옵션** — 필리핀 사회보장시스템 (선지급/정부 인보이스)
3. ✅ **결제 출처** — 고객 직접/외상/바우처/멤버십/프로모션 구분
4. ✅ **정산 관리** — 월간 정산, 거래 추적, 상태 관리

---

## 📂 생성된 파일 목록

### 백엔드

| 파일 | 설명 | 라인 수 |
|-----|------|--------|
| `app/schemas/payment_settlement.py` | Pydantic 스키마 (8개) | ~350 |
| `app/routers/payment_settlement.py` | FastAPI 라우터 (7개) | ~480 |

### 문서

| 파일 | 설명 | 대상 |
|-----|------|------|
| `API_PAYMENT_SETTLEMENT_SPEC.md` | API 엔드포인트 명세 | 모든 개발자 |
| `INTEGRATION_GUIDE.md` | 백엔드 통합 가이드 | 백엔드 개발자 |
| `FRONTEND_API_CLIENT.md` | 프론트엔드 클라이언트 | 프론트엔드 개발자 |
| `PAYMENT_SETTLEMENT_SUMMARY.md` | 이 문서 | 리더 |

---

## 🔌 API 엔드포인트 (7개)

### 그룹 1: 결제 방법 (4개)

#### 1. `POST /api/bookings/{id}/payment-methods`
결제 방법 추가 (은행송금, GCash, 현금 등)

**요청:**
```json
{
  "payment_method": "bank_transfer",
  "account_number": "123456789",
  "account_name": "John Doe",
  "bank_name": "BDO"
}
```

**응답:** 201 Created
```json
{
  "id": 1,
  "booking_id": 12345,
  "payment_method": "bank_transfer",
  "account_number": "123456789",
  ...
}
```

---

#### 2. `PATCH /api/bookings/{id}/sss-option`
SSS (Social Security System) 정산 옵션 업데이트

**개념:**
- `prepaid`: 선지급 (회사가 정부 대신 지급)
- `gov_invoice`: 정부 인보이스 기반
- `full_recovery`: 전액 회수
- 기본 기여율: 12.5%

**요청:**
```json
{
  "sss_status": "prepaid",
  "sss_contribution_percent": 12.5
}
```

**응답:** 200 OK
```json
{
  "booking_id": 12345,
  "sss_status": "prepaid",
  "sss_contribution_percent": 12.5,
  "updated_at": "2026-06-02T10:30:00Z"
}
```

---

#### 3. `PATCH /api/bookings/{id}/payment-from`
결제 출처 업데이트

**종류:**
- `customer`: 고객 직접 (회수율 100%)
- `company_credit`: 기업 외상 (회수율 변동)
- `voucher`: 바우처 (회수율 0%)
- `membership`: 멤버십 (회수율 100%)
- `promo`: 프로모션 (회수율 0%)

**요청:**
```json
{
  "payment_from": "company_credit",
  "company_credit_id": 567
}
```

**응답:** 200 OK
```json
{
  "booking_id": 12345,
  "payment_from": "company_credit",
  "company_credit_id": 567,
  "updated_at": "2026-06-02T10:30:00Z"
}
```

---

#### 4. `GET /api/bookings/{id}/payment-info`
예약의 모든 결제 정보 조회

**응답:** 200 OK
```json
{
  "booking_id": 12345,
  "payment_method": "bank_transfer",
  "payment_from": "company_credit",
  "sss_status": "prepaid",
  "payment_method_details": {...},
  "updated_at": "2026-06-02T10:30:00Z"
}
```

---

### 그룹 2: 정산 (3개)

#### 5. `GET /api/settlements/pending`
정산 대기 목록 조회

**쿼리 파라미터:**
```
?skip=0&limit=50&company_id=100&status_filter=draft
```

**응답:** 200 OK
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
      "transactions": [...]
    }
  ]
}
```

**정산 상태:**
- `draft`: 초안 (자동 계산 완료)
- `pending`: 대기 중 (검증 진행)
- `approved`: 승인됨 (지급 대기)
- `settled`: 정산 완료 (지급 완료)
- `confirmed`: 확정됨 (은행 거래 확인)
- `rejected`: 거부됨 (재계산 필요)

---

#### 6. `GET /api/settlements/{id}`
정산 상세 조회

**응답:** 200 OK
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
      "transaction_date": "2026-06-02"
    }
  ]
}
```

---

#### 7. `PATCH /api/settlements/{id}/mark-settled`
정산 완료 처리 (관리자 전용)

**요청:**
```json
{
  "payment_method": "bank_transfer",
  "payment_date": "2026-06-02",
  "notes": "BDO 계좌로 이체",
  "paid_by": "admin_user"
}
```

**응답:** 200 OK
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

---

## 📊 정산 금액 계산식

```
guest_recovered = guest_revenue × 1.00

credit_recovered = credit_revenue × (recovery_rate / 100)

platform_fee = (total_revenue - waived_revenue) × (platform_fee_rate / 100)

net_settlement = guest_recovered + credit_recovered 
               - platform_fee 
               - refund_amount 
               - dispute_deduction 
               - other_deduction
```

---

## 🔐 보안 및 권한

### 권한 매핑

| 엔드포인트 | 권한 | 설명 |
|---------|------|------|
| POST payment-methods | `booking.write` | 결제 방법 추가 |
| PATCH sss-option | `booking.write` | SSS 옵션 수정 |
| PATCH payment-from | `booking.write` | 결제 출처 수정 |
| GET payment-info | `booking.read` | 결제 정보 조회 |
| GET settlements/pending | `settlement.read` | 정산 목록 조회 |
| GET settlements/{id} | `settlement.read` | 정산 상세 조회 |
| PATCH mark-settled | `settlement.admin` | **관리자 전용** |

### 권장 구현

1. **인증 (Authentication)**
   - JWT 토큰 기반
   - Authorization: Bearer <token>

2. **권한 제어 (Authorization)**
   - 역할 기반 접근 제어 (RBAC)
   - 정산 완료는 관리자만

3. **감시 (Audit Trail)**
   - 모든 쓰기 작업 기록
   - created_by, updated_by, paid_by 필드 추적

---

## 🔄 정산 처리 흐름

```
1️⃣ 예약 생성
   ↓
2️⃣ 결제 방법 등록
   POST /api/bookings/{id}/payment-methods
   ↓
3️⃣ SSS/결제 출처 설정
   PATCH /api/bookings/{id}/sss-option
   PATCH /api/bookings/{id}/payment-from
   ↓
4️⃣ 월간 정산 자동 생성 (배치)
   ↓
5️⃣ 정산 목록 조회
   GET /api/settlements/pending
   ↓
6️⃣ 정산 상세 확인
   GET /api/settlements/{id}
   ↓
7️⃣ 정산 승인
   (상태 변경: draft → approved)
   ↓
8️⃣ 정산 완료 처리
   PATCH /api/settlements/{id}/mark-settled
   ↓
9️⃣ 지급 확인
   (상태 변경: settled → confirmed)
```

---

## 🚀 빠른 통합 가이드

### 1단계: 파일 복사
```bash
# 스키마 파일
cp app/schemas/payment_settlement.py /project/app/schemas/

# 라우터 파일
cp app/routers/payment_settlement.py /project/app/routers/
```

### 2단계: main.py 업데이트
```python
from app.routers.payment_settlement import payment_router, settlement_router

app = FastAPI()
app.include_router(payment_router)
app.include_router(settlement_router)
```

### 3단계: 테스트
```bash
# Swagger UI에서 확인
http://localhost:8000/docs

# 또는 curl 테스트
curl -X GET http://localhost:8000/api/settlements/pending
```

---

## 📝 구현 필수 작업

### Booking 모델 확장 (필수)
```python
class Booking(Base):
    # 기존 필드...
    payment_method: str = Column(String(50))
    payment_from: str = Column(String(50))
    sss_status: str = Column(String(50))
    sss_contribution_percent: float = Column(Float, default=12.5)
```

### PaymentMethod 모델 생성 (권장)
```python
class PaymentMethod(Base):
    id = Column(Integer, primary_key=True)
    booking_id = Column(BigInteger, ForeignKey("bookings.id"))
    payment_method = Column(String(50))
    account_number = Column(String(100))
    account_name = Column(String(100))
    # ...
```

### 마이그레이션 생성
```bash
alembic revision --autogenerate -m "Add payment and SSS fields"
alembic upgrade head
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 고객 직접 결제
```bash
# 결제 방법 추가
POST /api/bookings/12345/payment-methods
{
  "payment_method": "bank_transfer",
  "account_number": "123456789",
  "account_name": "John Doe",
  "bank_name": "BDO"
}

# 결제 출처 설정
PATCH /api/bookings/12345/payment-from
{
  "payment_from": "customer"
}

# 정산 목록 조회
GET /api/settlements/pending

# 정산 완료 처리
PATCH /api/settlements/1/mark-settled
{
  "payment_method": "bank_transfer",
  "payment_date": "2026-06-02",
  "paid_by": "admin_user"
}
```

### 시나리오 2: 기업 외상
```bash
# 결제 출처 설정 (기업 외상)
PATCH /api/bookings/12345/payment-from
{
  "payment_from": "company_credit",
  "company_credit_id": 567,
  "notes": "ABC회사 신용"
}

# SSS 옵션 설정
PATCH /api/bookings/12345/sss-option
{
  "sss_status": "prepaid",
  "sss_contribution_percent": 12.5
}
```

---

## 📚 참고 문서

| 문서 | 내용 | 대상 |
|-----|------|------|
| `API_PAYMENT_SETTLEMENT_SPEC.md` | 전체 API 명세 | 모든 개발자 |
| `INTEGRATION_GUIDE.md` | 백엔드 통합 단계별 가이드 | 백엔드 개발자 |
| `FRONTEND_API_CLIENT.md` | 프론트엔드 클라이언트 & 컴포넌트 | 프론트엔드 개발자 |

---

## ✅ 체크리스트

### 구현
- [ ] `app/schemas/payment_settlement.py` 생성
- [ ] `app/routers/payment_settlement.py` 생성
- [ ] Booking 모델 필드 추가
- [ ] PaymentMethod 모델 생성 (선택)
- [ ] 마이그레이션 작성 및 실행
- [ ] main.py에 라우터 등록

### 테스트
- [ ] 스키마 임포트 테스트
- [ ] API 엔드포인트 테스트
- [ ] 데이터베이스 쿼리 테스트
- [ ] 권한 검증 테스트

### 배포
- [ ] Swagger 문서 확인
- [ ] 프로덕션 마이그레이션
- [ ] 모니터링 설정
- [ ] 사용자 가이드 배포

---

## 💡 주요 특징

### 1. 완전한 타입 검증 (Pydantic)
- 모든 입력/출력 데이터 Zod/Pydantic 검증
- IDE 자동완성 지원

### 2. 명확한 에러 처리
- HTTP 상태 코드 (201, 200, 404, 400)
- 구조화된 에러 응답

### 3. 확장 가능한 설계
- 새로운 결제 방법 추가 용이
- 정산 규칙 커스터마이징 가능
- 감사 로그 추적

### 4. 문서화
- OpenAPI/Swagger 호환
- 스키마별 예제 포함
- 사용 시나리오 제시

---

## 🔧 기술 스택

### 백엔드
- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **검증**: Pydantic
- **데이터베이스**: PostgreSQL (Supabase)

### 프론트엔드
- **Framework**: Next.js 16
- **HTTP 클라이언트**: Axios
- **검증**: Zod
- **상태 관리**: Zustand
- **스타일**: Tailwind CSS

---

## 📞 지원 및 문의

**담당자:** jitnet-gif  
**이메일:** kangjichul@hanmail.net  
**작성일:** 2026-06-02

---

## 📊 성능 고려사항

### 대규모 정산 조회
- `limit` 파라미터로 페이지네이션 필수
- 인덱스: `company_settlement_id`, `status`, `payment_date`

### 거래 추적
- SettlementTransaction 테이블 인덱스:
  - `company_settlement_id`
  - `booking_id`
  - `transaction_type`

### 캐싱 권장
- 정산 목록: 5분
- 정산 상세: 10분
- 결제 정보: 실시간

---

**최종 상태:** ✅ 완료 & 통합 준비  
**다음 단계:** 백엔드 통합 → 테스트 → 배포
