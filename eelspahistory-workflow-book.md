
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

---

## [2026-05-29 15:30] Order: 049 - Agent B: Three.js 드래그 회전 기능

**주제:** 3D 네트워크 컴포넌트에 마우스 드래그 회전, 마우스 휠 줌, 더블클릭 리셋 기능 추가

### Plan
✅ 마우스 드래그로 3D 씬 회전 (X축: Y이동, Y축: X이동, easing 적용)
✅ 마우스 휠 줌 인/아웃 (범위: 15~100, 부드러운 감속)
✅ 더블 클릭으로 카메라 위치/회전 초기화
✅ 드래그 중 자동 회전 비활성화, 중지 후 재개
✅ 기존 검색 기능 유지 + 성능 최적화 (requestAnimationFrame)
✅ TypeScript 타입 검증 및 한국어 주석 포함

### Task 수행 내용

#### 섹션 1: 신규 컴포넌트 개발
1. frontend/src/components/20250529-1530-knowledge-network-interactive.tsx
   - KnowledgeNetworkInteractive 컴포넌트 (기존 KnowledgeNetwork3D 업그레이드)
   - Three.js Scene, PerspectiveCamera, WebGLRenderer 설정
   - 마우스 인터랙션 상태 관리 (isDragging, deltaX/Y, rotationX/Y)
   - 초기 카메라 위치 저장 (리셋용)

#### 섹션 2: 마우스 드래그 회전 구현
1. handleMouseDown: 드래그 시작 (isDrawing = true)
2. handleMouseMove: 마우스 이동 거리 계산 + 회전값 누적
   - 감도 조정: deltaX/Y * 0.01
   - 회전 제한: 상하 ±90도 범위 (너무 뒤로 돌지 않도록)
3. handleMouseUp: 드래그 종료 (isDragging = false)

#### 섹션 3: 마우스 휠 줌 구현
1. handleMouseWheel: wheel 이벤트 처리
   - 스크롤 업 (deltaY < 0): 카메라 가까워짐 (-2)
   - 스크롤 다운 (deltaY > 0): 카메라 멀어짐 (+2)
   - 범위 제한: Math.max(15, Math.min(100, targetZoom))
   - preventDefault() 호출로 페이지 스크롤 방지

#### 섹션 4: 더블 클릭 리셋 구현
1. handleDoubleClick: 300ms 이내 두 번 클릭 감지
2. resetCamera: 회전값 및 카메라 위치 초기화
   - rotationRef.current = {x: 0, y: 0}
   - targetZoom = 40
   - scene.rotation 초기화

#### 섹션 5: 애니메이션 루프 개선
1. 자동 회전 조건부 적용
   - isDragging === false일 때만 자동 회전
   - isDragging === true일 때 사용자 드래그값만 적용
2. 부드러운 전환 (lerp 사용)
   - scene.rotation: 현재값 → 목표값으로 0.1 속도로 접근
   - camera.position.z: 현재 줌 → 목표 줌으로 0.1 속도로 접근
   - 노드 스케일: 검색 상태에 따라 1 → 1.3 부드럽게

#### 섹션 6: 이벤트 리스너 등록
1. mousedown, mousemove, mouseup: 드래그 추적
2. wheel: 마우스 휠 (passive: false로 설정)
3. dblclick: 더블클릭 리셋
4. click: 노드 클릭 선택 (기존 유지)
5. resize: 윈도우 크기 변경 대응

#### 섹션 7: UI 개선
1. 조작 가이드 텍스트 업데이트
   - 🖱️ 드래그: 3D 회전
   - 🔍 휠: 줌 인/아웃 (15~100)
   - 📌 더블클릭: 카메라 리셋
2. 리셋 버튼 추가 (우하단)
   - RotateCcw 아이콘
   - 호버 시 색상 변경 (bg-blue-600 → bg-blue-700)

#### 섹션 8: 테스트 페이지 생성
1. frontend/src/app/test-network-interactive/page.tsx
   - 12개 샘플 노드 데이터 (다양한 카테고리/색상)
   - handleNodeClick 콜백 (선택 노드 정보 표시)
   - 접속 URL: /test-network-interactive

### Result
✅ **2개 파일 생성 완료 (컴포넌트 + 테스트 페이지)**

**주요 기능:**
- ✓ 마우스 드래그 회전 (X/Y축, easing 0.1)
- ✓ 마우스 휠 줌 (15~100 범위, 감속 0.1)
- ✓ 더블클릭 리셋 (카메라 + 회전)
- ✓ 드래그 중 자동 회전 일시 중지
- ✓ 기존 검색 기능 유지 + 노드 클릭
- ✓ TypeScript 타입 안전성
- ✓ 한국어 주석 및 UI 가이드

**성능:**
- requestAnimationFrame 사용 (60fps 목표)
- 부드러운 애니메이션 (lerp 적용)
- 이벤트 리스너 정리 (메모리 누수 방지)

**다음 단계:**
- Agent C: 터치 제스처 (모바일) - Order 050
- Agent D: 모바일 터치 핸들러 - Order 051
- 프로덕션 배포 검증

**주요 파일:**
1. e:\elspa\frontend\src\components\20250529-1530-knowledge-network-interactive.tsx (540줄)
2. e:\elspa\frontend\src\app\test-network-interactive\page.tsx (70줄)

---
