# 결제/정산 API — 빠른 참고서

**작성일:** 2026-06-02  
**프린트용:** A4 사이즈 추천

---

## 🚀 핵심 엔드포인트 (7개)

### 결제 방법 관리

```http
POST /api/bookings/{id}/payment-methods
PATCH /api/bookings/{id}/sss-option
PATCH /api/bookings/{id}/payment-from
GET /api/bookings/{id}/payment-info
```

### 정산 관리

```http
GET /api/settlements/pending
GET /api/settlements/{id}
PATCH /api/settlements/{id}/mark-settled
```

---

## 📊 결제 방법 종류

| 값 | 필수 필드 | 설명 |
|-----|---------|------|
| `bank_transfer` | account_number, account_name | 은행 송금 |
| `gcash` | gcash_number | GCash (필리핀 전자지갑) |
| `cash` | - | 현금 |
| `check` | - | 수표 |
| `card` | - | 카드 |
| `manual` | - | 수기 기록 |

---

## 🔐 SSS 상태

| 상태 | 설명 | 기여율 |
|------|------|--------|
| `not_applicable` | 해당 없음 | - |
| `prepaid` | 선지급 (회사 사전 지급) | 12.5% (기본) |
| `gov_invoice` | 정부 인보이스 기반 | 12.5% (기본) |
| `full_recovery` | 전액 회수 | 12.5% (기본) |

---

## 💳 결제 출처 & 회수율

| 출처 | 회수율 | 정산 카테고리 |
|------|--------|------------|
| `customer` | 100% | guest |
| `company_credit` | 변동 | credit |
| `voucher` | 0% | waived |
| `membership` | 100% | guest |
| `promo` | 0% | waived |

---

## 📈 정산 상태 전환

```
draft → pending → approved → settled → confirmed
         ↓
       rejected (재계산 필요)
```

| 상태 | 설명 |
|------|------|
| `draft` | 자동 계산 완료, 승인 대기 |
| `pending` | 검증 진행 중 |
| `approved` | 승인 완료, 지급 대기 |
| `settled` | 실제 지급 완료 |
| `confirmed` | 은행 거래 확인됨 |
| `rejected` | 거부됨 (재계산 필요) |

---

## 💻 curl 예제

### 결제 방법 추가
```bash
curl -X POST http://localhost:8000/api/bookings/12345/payment-methods \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "bank_transfer",
    "account_number": "123456789",
    "account_name": "John Doe",
    "bank_name": "BDO"
  }'
```

### SSS 옵션 설정
```bash
curl -X PATCH http://localhost:8000/api/bookings/12345/sss-option \
  -H "Content-Type: application/json" \
  -d '{
    "sss_status": "prepaid",
    "sss_contribution_percent": 12.5
  }'
```

### 정산 대기 목록
```bash
curl -X GET 'http://localhost:8000/api/settlements/pending?skip=0&limit=50'
```

### 정산 완료 처리
```bash
curl -X PATCH http://localhost:8000/api/settlements/1/mark-settled \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "bank_transfer",
    "payment_date": "2026-06-02",
    "paid_by": "admin_user"
  }'
```

---

## 🔧 Python 예제

```python
from app.routers.payment_settlement import payment_router, settlement_router
from app.schemas.payment_settlement import (
    PaymentMethodCreate,
    SSSOptionUpdate,
    PaymentSourceUpdate,
    SettlementMarkSettledRequest,
)

# FastAPI app에 등록
app.include_router(payment_router)
app.include_router(settlement_router)

# 스키마 사용
payment_data = PaymentMethodCreate(
    payment_method="bank_transfer",
    account_number="123456789",
    account_name="John Doe",
    bank_name="BDO"
)

sss_data = SSSOptionUpdate(
    sss_status="prepaid",
    sss_contribution_percent=12.5
)
```

---

## 📱 TypeScript 예제

```typescript
import { paymentSettlementClient } from '@/lib/api/payment-settlement-client';

// 결제 방법 추가
const paymentMethod = await paymentSettlementClient.addPaymentMethod(12345, {
  payment_method: 'bank_transfer',
  account_number: '123456789',
  account_name: 'John Doe',
  bank_name: 'BDO',
});

// SSS 옵션 설정
const sssOption = await paymentSettlementClient.updateSSSOption(12345, {
  sss_status: 'prepaid',
  sss_contribution_percent: 12.5,
});

// 정산 목록 조회
const settlements = await paymentSettlementClient.getPendingSettlements();

// 정산 완료 처리
const result = await paymentSettlementClient.markSettlementAsSettled(1, {
  payment_method: 'bank_transfer',
  payment_date: '2026-06-02',
  paid_by: 'admin_user',
});
```

---

## 🧮 정산 계산식

```
생성된 금액 (recovered) = 
  guest_revenue × 1.00 
  + credit_revenue × (recovery_rate / 100)

수수료 = (total_revenue - waived_revenue) × (fee_rate / 100)

순정산액 = 생성된금액 - 수수료 - 환불액 - 분쟁액 - 기타차감액
```

### 예제 계산
```
guest_revenue         = 30,000
credit_revenue        = 20,000
recovery_rate         = 100%
waived_revenue        = 0
platform_fee_rate     = 25%
refund_amount         = 0

guest_recovered       = 30,000 × 1.00 = 30,000
credit_recovered      = 20,000 × 1.00 = 20,000
platform_fee          = 50,000 × 0.25 = 12,500

net_settlement        = 30,000 + 20,000 - 12,500 = 37,500
```

---

## 📋 에러 코드

| 상태 | 설명 | 해결 방법 |
|------|------|----------|
| 201 | Created | 성공 ✅ |
| 200 | OK | 성공 ✅ |
| 400 | Bad Request | 요청 필드 확인 |
| 404 | Not Found | ID 존재 확인 |
| 500 | Server Error | 로그 확인 |

### 일반적인 오류

```
"필드가 필수입니다"
→ 필수 필드 확인 (예: bank_transfer는 account_number 필수)

"예약을 찾을 수 없습니다"
→ booking_id 확인

"중복된 데이터"
→ 이미 동일한 결제 방법이 등록되어 있음
```

---

## 📦 의존성

```bash
# 백엔드
pip install fastapi pydantic sqlalchemy

# 프론트엔드
npm install axios zod zustand
```

---

## 📚 관련 문서

| 문서 | 용도 |
|-----|------|
| `API_PAYMENT_SETTLEMENT_SPEC.md` | 전체 명세 |
| `INTEGRATION_GUIDE.md` | 백엔드 통합 |
| `FRONTEND_API_CLIENT.md` | 프론트엔드 |
| `PAYMENT_SETTLEMENT_SUMMARY.md` | 개요 |

---

## ⚡ 원라이너 (One-Liners)

```bash
# Swagger 문서 확인
open http://localhost:8000/docs

# 라우터 임포트 테스트
python -c "from app.routers.payment_settlement import payment_router; print('OK')"

# 스키마 임포트 테스트
python -c "from app.schemas.payment_settlement import PaymentMethodCreate; print('OK')"

# 정산 목록 조회
curl http://localhost:8000/api/settlements/pending | jq .
```

---

## 🎯 작업 흐름 (5단계)

```
1️⃣ 예약 생성
   └─ /bookings POST

2️⃣ 결제 정보 등록
   ├─ /bookings/{id}/payment-methods POST
   ├─ /bookings/{id}/sss-option PATCH
   └─ /bookings/{id}/payment-from PATCH

3️⃣ 정산 조회
   ├─ /settlements/pending GET (목록)
   └─ /settlements/{id} GET (상세)

4️⃣ 정산 승인
   └─ (관리자 승인, 상태: draft → approved)

5️⃣ 정산 지급
   └─ /settlements/{id}/mark-settled PATCH
```

---

## 🔒 보안 체크리스트

- [ ] JWT 토큰 인증 적용
- [ ] 역할 기반 권한 검증
- [ ] 민감한 필드 암호화
- [ ] API 레이트 리미팅
- [ ] SQL 인젝션 방지
- [ ] HTTPS 강제
- [ ] 감사 로그 기록

---

## 📞 문제 해결

### 스키마 임포트 오류
```bash
export PYTHONPATH=/Users/kwangseobpark/elspa:$PYTHONPATH
python -c "from app.schemas.payment_settlement import *"
```

### 라우터 등록 오류
```python
# main.py에서 확인
app.include_router(payment_router)
app.include_router(settlement_router)
print(app.routes)  # 라우터가 등록되었는지 확인
```

### 데이터베이스 오류
```bash
# 마이그레이션 확인
alembic current
alembic history

# 마이그레이션 실행
alembic upgrade head
```

---

## 💡 팁 & 트릭

1. **Swagger 문서 활용**
   - `http://localhost:8000/docs` 방문
   - Try it out 버튼으로 API 테스트

2. **curl 명령어 저장**
   - `curl_examples.sh` 파일로 저장
   - `chmod +x curl_examples.sh` 후 실행

3. **환경 변수 설정**
   - `.env` 파일에 API_URL 저장
   - 프론트엔드에서 `process.env.NEXT_PUBLIC_API_URL` 사용

4. **로깅 활성화**
   ```python
   import logging
   logging.basicConfig(level=logging.DEBUG)
   ```

---

## 📅 다음 단계

- [ ] 백엔드 통합 (1-2일)
- [ ] API 테스트 (1일)
- [ ] 프론트엔드 클라이언트 (1-2일)
- [ ] UI 컴포넌트 (2-3일)
- [ ] 전체 테스트 (1일)
- [ ] 배포 (1일)

---

**최종 수정:** 2026-06-02  
**담당자:** jitnet-gif (kangjichul@hanmail.net)
