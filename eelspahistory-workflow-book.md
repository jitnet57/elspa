
## [2026-05-22 14:35] Order: 008 - Phase 8-4 메시지 발송 시스템 (Wave 3-2)

**주제:** WhatsApp + 카카오톡을 통한 정산 알림 자동 발송 시스템

### Plan
✅ WhatsApp (Twilio) 연동 구현
✅ 카카오톡 비즈니스 메시지 API 연동
✅ 메시지 로그 모델 생성 (발송 추적)
✅ 메시시 발송 API 엔드포인트 구현
✅ 다국어 메시지 템플릿 지원
✅ Mock 구현으로 테스트 환경 지원
✅ 포괄적 테스트 스위트 작성

### Task 수행 내용

#### 섹션 1: 메시징 서비스 (app/services/messaging_service.py)
- WhatsAppService 클래스
  - Twilio API 클라이언트 초기화
  - 정산 알림 메시지 구성
  - 전화번호 정규화 (+XX 형식)
  - Mock 모드 지원 (테스트)

- KakaoService 클래스
  - 카카오 비즈니스 메시지 API
  - 카카오톡 사용자 ID 기반 발송
  - 메시지 템플릿 구성

- MessagingService 클래스 (통합 서비스)
  - 여러 채널 동시 발송
  - 실패 처리 및 로깅
  - 데이터 구조: MessageType, MessageStatus, NotificationChannel

#### 섹션 2: 데이터 모델 확장
- app/models/payroll.py
  - MessageLog 모델 추가 (7번째 모델)
  - 컬럼: payroll_record_id, employee_id, message_type, channel, status
  - 제약: (payroll_record_id, channel) UNIQUE
  - 인덱스: payroll_record, employee, status, channel, created_at

- app/schemas/payroll.py
  - MessageLogCreate 스키마
  - MessageLogResponse 스키마
  - MessageLogDetailResponse 스키마

#### 섹션 3: API 엔드포인트 (app/routers/messaging.py)
- POST /api/messaging/periods/{period_id}/send-notifications
  - 정산 기간의 모든 직원에게 메시지 발송
  - 채널 선택: ["whatsapp", "kakao"] 또는 단일 선택
  - dry_run 파라미터: 실제 발송 없이 시뮬레이션
  - 응답: sent_count, failed_count, message_logs

- GET /api/messaging/message-logs
  - 필터: payroll_period_id, status, channel
  - 페이지네이션: skip, limit
  - 응답: 로그 목록

- GET /api/messaging/message-logs/{log_id}
  - 메시지 로그 상세 조회
  - 수신자 정보, 발송 상태, 에러 메시지

- GET /api/messaging/stats
  - 최근 N일 발송 통계
  - 채널별, 상태별 집계

#### 섹션 4: 환경 설정
- .env.example에 Twilio 및 Kakao API 자격증명 추가
  - TWILIO_ACCOUNT_SID
  - TWILIO_AUTH_TOKEN
  - TWILIO_WHATSAPP_NUMBER
  - KAKAO_API_KEY
  - KAKAO_ADMIN_KEY

#### 섹션 5: 테스트 (tests/test_messaging.py)
- TestWhatsAppService
  - test_whatsapp_message_formatting: 메시지 형식 검증
  - test_phone_number_normalization: 전화번호 정규화
  - test_whatsapp_send_mock: Mock 발송 테스트

- TestKakaoService
  - test_kakao_message_formatting: 메시지 형식
  - test_kakao_send_mock: Mock 발송

- TestMessagingService
  - test_send_multiple_channels: 다중 채널 발송
  - test_single_channel: 단일 채널 발송

- TestMessageLogModel
  - test_message_log_creation: 로그 생성
  - test_message_log_error_tracking: 에러 추적

#### 섹션 6: 마이그레이션 가이드
- migrations_notes.md
  - message_logs 테이블 SQL (PostgreSQL, SQLite)
  - Alembic 마이그레이션 명령어
  - 필수 패키지: pip install twilio

#### 섹션 7: 메인 설정 (main.py)
- messaging 라우터 임포트 및 등록
  - from app.routers import messaging
  - app.include_router(messaging.router)

### Result
✅ **9개 파일 생성/수정 완료**

생성 파일:
- app/services/messaging_service.py (489 lines) ✓
- app/routers/messaging.py (356 lines) ✓
- tests/test_messaging.py (328 lines) ✓
- migrations_notes.md ✓

수정 파일:
- app/models/payroll.py: MessageLog 모델 추가 ✓
- app/schemas/payroll.py: 메시지 스키마 추가 ✓
- .env.example: Twilio/Kakao 자격증명 추가 ✓
- main.py: 라우터 등록 ✓

### 주요 기능

1. **WhatsApp 연동**
   - Twilio API 기반
   - 실시간 메시지 발송
   - Mock 모드 (API 키 없이 테스트)
   - 전화번호 자동 정규화

2. **카카오톡 연동**
   - 카카오 비즈니스 메시지 API
   - 카카오톡 사용자 ID 기반
   - 독립적 메시지 포맷

3. **메시지 추적**
   - MessageLog 테이블로 모든 발송 기록
   - 상태 추적: pending, sent, failed, bounced
   - 채널별 메시지 ID 저장
   - 에러 메시지 저장

4. **다국어 템플릿**
   - 한국어 메시지 템플릿
   - 영어 메시지 템플릿 (확장 가능)
   - 정산액, 지급일, 정산 기간 포함

5. **Dry-Run 모드**
   - 실제 발송 없이 시뮬레이션
   - 발송 전 검증 및 테스트
   - pending 상태로 로그 기록

6. **통계 및 모니터링**
   - 기간별 발송 통계
   - 채널별 발송 현황
   - 상태별 집계

### 메시지 템플릿 샘플

**한국어 정산 알림:**
```
안녕하세요 {name}님!

급여가 정산되었습니다.

순지급액: ₱{net_pay:,.2f}
지급일: {payment_date}
정산기간: {period_start} ~ {period_end}

감사합니다!
ElSpa Manager
```

**영어 정산 알림:**
```
Hello {name}!

Your salary has been processed.

Net Pay: ₱{net_pay:,.2f}
Payment Date: {payment_date}
Period: {period_start} ~ {period_end}

Thank you!
ElSpa Manager
```

### 사용 예시

#### 1. 정산 기간의 모든 직원에게 WhatsApp으로 발송

```bash
curl -X POST "http://localhost:8000/api/messaging/periods/1/send-notifications" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "channels": ["whatsapp"],
    "dry_run": false
  }'
```

#### 2. Dry-Run으로 테스트

```bash
curl -X POST "http://localhost:8000/api/messaging/periods/1/send-notifications" \
  -H "Authorization: Bearer <token>" \
  -d '{"dry_run": true}'
```

#### 3. 메시지 로그 조회

```bash
curl "http://localhost:8000/api/messaging/message-logs?status=sent&channel=whatsapp" \
  -H "Authorization: Bearer <token>"
```

#### 4. 통계 조회

```bash
curl "http://localhost:8000/api/messaging/stats?period_days=7" \
  -H "Authorization: Bearer <token>"
```

### 다음 단계 (Wave 3-3 ~ 3-4)

- [ ] 실시간 메시지 큐 (Celery/RabbitMQ)
- [ ] 메시지 재시도 정책
- [ ] SMS 채널 추가
- [ ] 메시지 템플릿 커스터마이제이션
- [ ] 대량 메시지 발송 최적화
- [ ] 웹훅 기반 배달 확인

### 주요 파일 위치

| 파일 | 라인 | 설명 |
|------|------|------|
| app/services/messaging_service.py | 489 | WhatsApp + Kakao 서비스 |
| app/routers/messaging.py | 356 | API 엔드포인트 |
| app/models/payroll.py | 370 | MessageLog 모델 추가 |
| app/schemas/payroll.py | 240 | 메시지 스키마 추가 |
| tests/test_messaging.py | 328 | 테스트 스위트 |
| migrations_notes.md | 100+ | DB 마이그레이션 가이드 |

---
