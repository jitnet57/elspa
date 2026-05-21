# Phase 8-4: 메시지 발송 시스템 (WhatsApp + 카카오톡)

**작성일:** 2026-05-22  
**상태:** ✅ 완료  
**커밋:** 59db185, de3e224

## 📋 개요

정산이 완료된 직원들에게 WhatsApp 및 카카오톡을 통해 자동으로 알림을 발송하는 메시징 시스템을 구현했습니다.

### 핵심 기능
- **WhatsApp 연동** (Twilio API)
- **카카오톡 연동** (Kakao Business Message API)
- **메시지 발송 추적** (MessageLog 모델)
- **다국어 지원** (한국어, 영어)
- **테스트 모드** (Mock 구현)
- **Dry-Run 기능** (발송 시뮬레이션)

---

## 📁 생성/수정된 파일

### 1. 서비스 계층

#### `app/services/messaging_service.py` (489 lines)
```python
# WhatsAppService
- send_payroll_notification(payload) → Dict
- _build_payroll_message(payload) → str
- _normalize_phone(phone) → str

# KakaoService
- send_payroll_notification(kakao_user_id, payload) → Dict
- _build_payroll_message(payload) → str

# MessagingService (통합)
- send_payroll_notification(payload, channels, kakao_user_id) → Dict
```

**특징:**
- 비동기 지원 (async/await)
- Mock 모드 (테스트 환경)
- 전화번호 자동 정규화
- 에러 처리 및 로깅

### 2. API 라우터

#### `app/routers/messaging.py` (356 lines)
```
POST /api/messaging/periods/{period_id}/send-notifications
GET  /api/messaging/message-logs
GET  /api/messaging/message-logs/{log_id}
GET  /api/messaging/stats
```

**특징:**
- 어드민 전용 (require_admin)
- 대량 발송 지원
- 채널 선택 가능
- Dry-Run 모드
- 통계 조회

### 3. 데이터 모델

#### `app/models/payroll.py` - MessageLog 추가
```python
class MessageLog(Base):
    """
    메시지 발송 기록
    
    필드:
    - payroll_record_id: 정산 결과 FK
    - employee_id: 직원 FK
    - message_type: payroll_notification, settlement_approved, etc.
    - channel: whatsapp, kakao, sms
    - status: pending, sent, failed, bounced
    - message_sid: Twilio/Kakao 메시지 ID
    - error_message: 발송 실패 시 에러 메시지
    
    인덱스:
    - (payroll_record_id, channel) UNIQUE
    - idx_message_payroll_record
    - idx_message_employee
    - idx_message_status
    - idx_message_channel
    - idx_message_created_at
    """
```

### 4. Pydantic 스키마

#### `app/schemas/payroll.py` - 메시지 스키마 추가
```python
class MessageLogCreate(BaseModel)
class MessageLogResponse(BaseModel)
class MessageLogDetailResponse(BaseModel)
```

### 5. 환경 설정

#### `.env.example` - API 자격증명 추가
```
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=+1234567890
KAKAO_API_KEY=your_key
KAKAO_ADMIN_KEY=your_admin_key
```

### 6. 테스트

#### `tests/test_messaging.py` (328 lines)
```python
TestWhatsAppService
- test_whatsapp_message_formatting
- test_phone_number_normalization
- test_whatsapp_send_mock

TestKakaoService
- test_kakao_message_formatting
- test_kakao_send_mock

TestMessagingService
- test_send_multiple_channels
- test_single_channel

TestMessageLogModel
- test_message_log_creation
- test_message_log_error_tracking
```

### 7. 마이그레이션 가이드

#### `migrations_notes.md`
- message_logs 테이블 생성 SQL (PostgreSQL, SQLite)
- Alembic 마이그레이션 명령어
- 필수 패키지 설치 가이드

---

## 🔧 설정 및 설치

### 1. 패키지 설치
```bash
pip install twilio
# Kakao는 requests 기반 (기존 설치됨)
```

### 2. 환경 변수 설정
```bash
# .env 파일에 추가
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=+1234567890

KAKAO_API_KEY=your_kakao_key
KAKAO_ADMIN_KEY=your_admin_key
```

### 3. 데이터베이스 마이그레이션

**Alembic 사용:**
```bash
cd e:/elspa
alembic revision --autogenerate -m "Add MessageLog model"
alembic upgrade head
```

**수동 SQL 실행 (PostgreSQL):**
```sql
-- migrations_notes.md 참조
CREATE TABLE message_logs (
    id SERIAL PRIMARY KEY,
    payroll_record_id INTEGER REFERENCES payroll_records(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_kakao_id VARCHAR(255),
    subject VARCHAR(255),
    body VARCHAR(2000) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    message_sid VARCHAR(255),
    error_message VARCHAR(1000),
    amount NUMERIC(10, 2),
    payment_date DATE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (payroll_record_id, channel)
);

CREATE INDEX idx_message_payroll_record ON message_logs(payroll_record_id);
CREATE INDEX idx_message_employee ON message_logs(employee_id);
CREATE INDEX idx_message_status ON message_logs(status);
CREATE INDEX idx_message_channel ON message_logs(channel);
CREATE INDEX idx_message_created_at ON message_logs(created_at);
```

---

## 🚀 사용 방법

### 1. WhatsApp 메시지 발송

```bash
curl -X POST "http://localhost:8000/api/messaging/periods/1/send-notifications" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channels": ["whatsapp"],
    "dry_run": false
  }'
```

**응답:**
```json
{
  "total_employees": 10,
  "sent_count": 10,
  "failed_count": 0,
  "channels": ["whatsapp"],
  "dry_run": false,
  "message_logs": [
    {
      "id": 1,
      "employee_id": 1,
      "channel": "whatsapp",
      "status": "sent",
      "error": null
    }
  ]
}
```

### 2. 여러 채널로 동시 발송

```bash
curl -X POST "http://localhost:8000/api/messaging/periods/1/send-notifications" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "channels": ["whatsapp", "kakao"],
    "dry_run": false
  }'
```

### 3. Dry-Run으로 테스트

```bash
curl -X POST "http://localhost:8000/api/messaging/periods/1/send-notifications" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"dry_run": true}'
```

실제 발송 없이 메시지를 구성하고 로그를 `pending` 상태로 저장합니다.

### 4. 발송 로그 조회

```bash
# 모든 로그
curl "http://localhost:8000/api/messaging/message-logs" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 상태별 필터
curl "http://localhost:8000/api/messaging/message-logs?status=sent" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 채널별 필터
curl "http://localhost:8000/api/messaging/message-logs?channel=whatsapp&status=failed" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 정산 기간별 필터
curl "http://localhost:8000/api/messaging/message-logs?payroll_period_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. 메시지 로그 상세 조회

```bash
curl "http://localhost:8000/api/messaging/message-logs/123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**응답:**
```json
{
  "id": 123,
  "payroll_record_id": 45,
  "employee_id": 10,
  "message_type": "payroll_notification",
  "channel": "whatsapp",
  "recipient_phone": "+639171234567",
  "status": "sent",
  "message_sid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "error_message": null,
  "amount": "10000.00",
  "payment_date": "2026-05-22",
  "sent_at": "2026-05-22T14:35:00",
  "created_at": "2026-05-22T14:35:00",
  "updated_at": "2026-05-22T14:35:00"
}
```

### 6. 발송 통계

```bash
# 최근 7일 통계
curl "http://localhost:8000/api/messaging/stats?period_days=7" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**응답:**
```json
{
  "period_days": 7,
  "total_sent": 45,
  "total_failed": 2,
  "total_pending": 3,
  "total_logs": 50,
  "by_channel": {
    "whatsapp": {
      "total": 30,
      "sent": 28,
      "failed": 1,
      "pending": 1
    },
    "kakao": {
      "total": 20,
      "sent": 17,
      "failed": 1,
      "pending": 2
    },
    "sms": {
      "total": 0,
      "sent": 0,
      "failed": 0,
      "pending": 0
    }
  },
  "by_status": {
    "pending": 3,
    "sent": 45,
    "failed": 2,
    "bounced": 0
  }
}
```

---

## 📱 메시지 템플릿

### WhatsApp (한국어)

```
안녕하세요 {name}님!

급여가 정산되었습니다.

순지급액: ₱{net_pay:,.2f}
지급일: {payment_date}
정산기간: {period_start} ~ {period_end}

자세한 내용은 ElSpa Manager 앱에서 확인하실 수 있습니다.

감사합니다!
ElSpa Manager
```

### 카카오톡 (한국어)

```
[ElSpa Manager]

안녕하세요 {name}님!
급여가 정산되었습니다.

💰 순지급액: ₱{net_pay:,.2f}
📅 지급일: {payment_date}
📆 정산기간: {period_start} ~ {period_end}

감사합니다!
```

---

## 🧪 테스트

### 단위 테스트 실행

```bash
pytest tests/test_messaging.py -v
```

### Mock 모드로 테스트

Mock 모드는 API 키 없이도 작동합니다. 환경 변수가 설정되지 않으면 자동으로 활성화됩니다.

```python
# Mock 메시지 발송 테스트
from app.services.messaging_service import messaging_service
from app.services.messaging_service import PayrollNotificationPayload
from decimal import Decimal

payload = PayrollNotificationPayload(
    recipient_phone="09171234567",
    recipient_name="테스트 직원",
    net_pay=Decimal("10000.00"),
    payment_date="2026-05-22"
)

result = await messaging_service.send_payroll_notification(payload)
# result: {"overall_success": True, "channels": {...}}
```

---

## 🔐 보안 고려사항

### 1. 인증 및 권한
- 모든 메시징 엔드포인트는 `require_admin` 보호
- JWT 토큰 기반 인증

### 2. 전화번호 보안
- 전화번호는 데이터베이스에 암호화되지 않음 (향후 개선)
- 마스킹된 형태로 로그에 저장 권장

### 3. API 키 관리
- .env 파일에 저장 (버전 관리에서 제외)
- 환경 변수로 주입
- Mock 모드로 테스트 (키 불필요)

### 4. 메시지 내용
- 민감한 정보는 제외 (급여액 이외)
- HTTPS 전송 강제

---

## 📊 데이터베이스 스키마

### message_logs 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | 기본키 |
| payroll_record_id | INT FK | 정산 결과 참조 |
| employee_id | INT FK | 직원 참조 |
| message_type | VARCHAR(50) | payroll_notification, settlement_approved |
| channel | VARCHAR(50) | whatsapp, kakao, sms |
| recipient_phone | VARCHAR(20) | 수신자 전화번호 |
| recipient_kakao_id | VARCHAR(255) | 카카오 User ID (선택) |
| subject | VARCHAR(255) | 메시지 제목 (선택) |
| body | VARCHAR(2000) | 메시지 본문 |
| status | VARCHAR(50) | pending, sent, failed, bounced |
| message_sid | VARCHAR(255) | Twilio/Kakao 메시지 ID |
| error_message | VARCHAR(1000) | 발송 실패 시 에러 |
| amount | NUMERIC(10,2) | 발송 대상 금액 |
| payment_date | DATE | 지급일 |
| sent_at | TIMESTAMP | 발송 완료 시간 |
| created_at | TIMESTAMP | 생성 시간 |
| updated_at | TIMESTAMP | 수정 시간 |

### 제약 조건

- `UNIQUE (payroll_record_id, channel)`: 정산 결과당 채널별 1회만 발송
- `FK payroll_record_id` ON DELETE CASCADE
- `FK employee_id` ON DELETE CASCADE

### 인덱스

- `idx_message_payroll_record` (payroll_record_id)
- `idx_message_employee` (employee_id)
- `idx_message_status` (status)
- `idx_message_channel` (channel)
- `idx_message_created_at` (created_at)

---

## 🔄 워크플로우

### 1. 정산 완료 → 메시지 발송

```
PayrollPeriod (draft)
    ↓
calculate_payroll() [계산 엔진]
    ↓
PayrollRecord (draft) 생성
    ↓
approve_payroll_period() [승인]
    ↓
PayrollRecord (approved)
    ↓
send_payroll_notifications() [메시징]
    ↓
MessageLog (pending → sent/failed)
    ↓
직원에게 WhatsApp/카카오톡 도착
```

### 2. 실패 처리

```
send_payroll_notification()
    ↓
Twilio API 호출 실패
    ↓
MessageLog.status = "failed"
MessageLog.error_message = "API 연결 타임아웃"
    ↓
관리자 대시보드에서 확인 및 재시도
```

---

## 🚦 상태 코드

| 상태 | 설명 |
|------|------|
| pending | 발송 대기 중 |
| sent | 정상 발송 완료 |
| failed | 발송 실패 |
| bounced | 배달 실패 (수신 불가) |

---

## 🎯 다음 단계 (Wave 3-3 ~ 3-4)

### Phase 8-5: 메시지 큐 시스템
- [ ] Celery + Redis 기반 비동기 발송
- [ ] 메시지 재시도 정책 (exponential backoff)
- [ ] 우선순위 큐

### Phase 8-6: 채널 확장
- [ ] SMS 지원 추가
- [ ] Email 지원 추가
- [ ] Push 알림 (FCM)

### Phase 8-7: 고급 기능
- [ ] 메시지 템플릿 커스터마이제이션
- [ ] 다국어 자동 번역
- [ ] A/B 테스트
- [ ] 지연 발송 스케줄링

### Phase 8-8: 모니터링
- [ ] Webhook 기반 배달 확인
- [ ] SMS/WhatsApp 반응 추적
- [ ] 발송 실패 알림
- [ ] 대시보드 통계

---

## 📚 참고 자료

- [Twilio Documentation](https://www.twilio.com/docs)
- [Kakao Business Message API](https://developers.kakao.com)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

---

## 🎓 학습 포인트

### 1. 메시징 서비스 아키텍처
- 다양한 채널 통합
- 공통 인터페이스 (PayrollNotificationPayload)
- 확장 가능한 설계 (새 채널 추가 용이)

### 2. 에러 처리
- API 실패에 대한 우아한 처리
- 상세한 에러 로깅
- Mock 모드를 통한 테스트 환경

### 3. 데이터베이스 설계
- 감사(Audit) 로깅
- 제약 조건으로 데이터 무결성 보장
- 인덱스를 통한 성능 최적화

### 4. API 엔드포인트 설계
- RESTful 원칙
- 필터 및 페이지네이션
- Dry-Run 패턴 (실제 실행 전 검증)

---

**최종 상태:** ✅ Phase 8-4 완료  
**다음 단계:** Phase 8-5 (메시지 큐 시스템)
