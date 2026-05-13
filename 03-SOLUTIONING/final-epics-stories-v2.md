# ElSpa 최종 Epic & Stories (V2: 3가지 사이트 + 통합)
**Phase 3: Final Development Plan | Date: 2026-05-05**

---

## 0. 개요

**총 72개 Stories | 320점 | 8주 일정**

### 프로젝트 구조
```
Phase A: MVP - 모놀리식 (Week 1-4, 주 70점)
- 3가지 웹앱 기본 기능 완성
- 채널 통합 & AI 상담 (텍스트만)
- 자동 정산
- 우선순위: 채널통합 > 예약 > 정산 > 직원관리

Phase B: 고도화 - 마이크로서비스 리팩토링 + 통합 (Week 5-8, 주 75점)
- 외부 API 통합 (칼닷컴, 구글캘린더, ElevenLabs)
- 마이크로서비스로 분리
- 성능 최적화 & 보안
```

---

## EPIC 1: 공통 인프라 (Auth, API Gateway)
**점수: 40pt | 우선순위: 🔴 MUST**

### 1.1 Story: 프로젝트 구조 & 개발환경
**점수: 8pt | 예상: 1.5일**

```
Task:
- [ ] Monorepo 구조 (admin-web, user-web, staff-app, backend)
- [ ] Docker Compose (PostgreSQL, Redis, Node.js)
- [ ] 개발 문서 (setup guide)
- [ ] TypeScript 설정 (tsconfig)
- [ ] Linting (ESLint, Prettier)

Definition of Done:
npm install → docker-compose up → 앱 실행 가능
```

### 1.2 Story: 사용자 인증 (JWT + OAuth)
**점수: 12pt | 예상: 3일**

```
요구사항:
사용자로서 나는
이메일/비밀번호 또는 Google/Kakao로 로그인하고
권한에 따라 Admin/User/Staff 사이트로 이동하고 싶다.

수락기준:
- [ ] 회원가입 (이메일 검증)
- [ ] 로그인 (JWT 발급, refresh token)
- [ ] Google OAuth 2.0
- [ ] Kakao OAuth
- [ ] 역할별 라우팅 (Owner/Manager/User/Therapist/Driver)
- [ ] 토큰 갱신 엔드포인트

Task:
- [ ] Backend: POST /auth/register, POST /auth/login, POST /auth/refresh
- [ ] Frontend: 로그인 폼 (3가지 앱에서 공유)
- [ ] Tests: 회원가입 성공/실패, 로그인, 권한 검증
- [ ] Security: bcrypt 해싱, rate limiting
```

### 1.3 Story: RBAC (역할 기반 접근제어)
**점수: 12pt | 예상: 3일**

```
요구사항:
관리자로서 나는
사용자의 역할(Owner, Manager, User, Therapist, Driver)에 따라
접근 가능한 기능을 명확히 제한하고 싶다.

수락기준:
- [ ] 5개 역할 정의 (권한 매트릭스)
- [ ] API 미들웨어: @RequireRole("admin")
- [ ] Frontend: 권한별 메뉴 표시/숨김
- [ ] 권한 없는 접근 → 403 응답
- [ ] 감사 로그: 권한 변경 기록

Task:
- [ ] Backend: auth middleware, role enum
- [ ] Frontend: ProtectedRoute 컴포넌트
- [ ] Tests: 권한별 접근 제어 테스트
```

### 1.4 Story: API Gateway & 로깅
**점수: 8pt | 예상: 2일**

```
요구사항:
개발자로서 나는
모든 API 요청을 로깅하고
에러를 표준화하여 디버깅을 쉽게 하고 싶다.

수락기준:
- [ ] Winston 로깅 (request/response)
- [ ] 에러 핸들링 미들웨어 (400, 401, 403, 500)
- [ ] 요청 ID (correlation ID)
- [ ] 응답 시간 측정

Task:
- [ ] Backend: error handler, logging middleware
- [ ] 에러 응답 표준화
```

---

## EPIC 2: Admin Site - 채널통합 & 상담 (Week 1)
**점수: 50pt | 우선순위: 🔴 MUST**

### 2.1 Story: Messenger API 통합 (Webhook)
**점수: 10pt | 예상: 2.5일**

```
요구사항:
상담담당자로서 나는
Facebook Messenger를 통한 고객 문의를
시스템에 자동으로 수집하고 싶다.

수락기준:
- [ ] Webhook 설정 (verify token)
- [ ] 메시지 수신 & 검증
- [ ] 고객 정보 추출 (이름, 전화)
- [ ] DB에 저장
- [ ] 웹훅 실패 시 재시도

Task:
- [ ] Backend: POST /webhooks/messenger
- [ ] Facebook Graph API 설정
- [ ] Tests: Webhook 서명 검증
```

### 2.2 Story: Kakao API 통합
**점수: 10pt | 예상: 2.5일**

```
요구사항: Messenger와 동일 (카톡용)
```

### 2.3 Story: 통합 상담함 (Admin UI)
**점수: 15pt | 예상: 3.5일**

```
요구사항:
상담담당자로서 나는
메신저, 카톡의 모든 고객 문의를
하나의 상담함에서 관리하고 싶다.

수락기준:
- [ ] 채널별 필터 (메신저, 카톡)
- [ ] 상태별 필터 (미처리, 처리중, 완료)
- [ ] 메시지 검색
- [ ] 각 메시지에 예약 생성 버튼
- [ ] 실시간 알림 (WebSocket)

Task:
- [ ] Backend: GET /admin/chats (CRUD)
- [ ] Frontend: 상담함 UI (테이블 + 필터)
- [ ] WebSocket: 새 메시지 푸시
```

### 2.4 Story: AI 자동상담 (LangGraph)
**점수: 15pt | 예상: 4일**

```
요구사항:
고객으로서 나는
메신저/카톡에 문의해도
AI가 즉시 응답해주고 예약을 제안해주고 싶다.

수락기준:
- [ ] Claude API 기반 상담 에이전트
- [ ] 메시지에서 서비스/시간 자동 추출
- [ ] 가능한 시간대 조회 & 제시
- [ ] 고객 확인 후 예약 자동 생성 (pending)
- [ ] 에러 시 휴먼 에스컬레이션
- [ ] 상담 로그 저장

Task:
- [ ] LangGraph: ConsultationAgent 구성
- [ ] Backend: /api/agents/consultation
- [ ] Prompt: 한국어 상담 프롬프트
- [ ] Tests: 다양한 고객 시나리오
```

---

## EPIC 3: Booking & User Site (Week 2)
**점수: 60pt | 우선순위: 🔴 MUST**

### 3.1 Story: 예약 생성 (자동 + 수동)
**점수: 12pt | 예상: 3일**

```
요구사항:
사용자로서 나는
4단계(서비스선택 → 날짜시간 → 테라피스트 → 확인)로
쉽게 예약하고 싶다.

수락기준:
- [ ] 중복 예약 방지 (룸 & 테라피스트)
- [ ] 가능한 시간대만 표시
- [ ] 자동 배정 또는 선택
- [ ] 예약 생성 로그

Task:
- [ ] Backend: POST /api/bookings (검증)
- [ ] Frontend: Step-by-Step 예약 폼
- [ ] Tests: 중복 방지, 시간대 검증
```

### 3.2 Story: 예약 확정 (고객 동의)
**점수: 8pt | 예상: 2일**

```
요구사항:
고객으로서 나는
제안된 예약을 메시지로 [예]/[아니오] 선택하고 싶다.

수락기준:
- [ ] 메시지 버튼 렌더링 (메신저/카톡)
- [ ] 고객 응답 처리
- [ ] status: pending → confirmed
- [ ] 타임아웃 (24시간 자동 취소)

Task:
- [ ] Backend: 피드백 수신 & 처리
- [ ] Notification: 확정/취소 알림
```

### 3.3 Story: User Site - 예약 & 추적
**점수: 20pt | 예상: 4.5일**

```
요구사항:
고객으로서 나는
앱에서 직접 예약하고
픽드랍 추적, 이력 조회, 리뷰 작성을 하고 싶다.

수락기준:
- [ ] 예약 생성 (Step-by-Step)
- [ ] 내 예약 목록 & 상세
- [ ] 픽드랍 추적 (실시간 지도)
- [ ] 방문 이력 & 리뷰 작성
- [ ] 선호 테라피스트 저장

Task:
- [ ] Frontend: User Site (app.elspa.com)
- [ ] Pages: 예약, 내예약, 이력, 리뷰
- [ ] Google Maps API (픽드랍 추적)
```

### 3.4 Story: 스케줄 뷰 (Admin)
**점수: 20pt | 예상: 4.5일**

```
요구사항:
매니저로서 나는
일/주/월 뷰로 룸과 테라피스트 예약을
한눈에 보고 드래그해서 재스케줄링하고 싶다.

수락기준:
- [ ] 룸별 캘린더 (예약자, 서비스, 시간)
- [ ] 테라피스트별 캘린더 (상태)
- [ ] 일/주/월 뷰
- [ ] 드래그앤드롭 재스케줄링
- [ ] 충돌 자동 감지
- [ ] 실시간 업데이트 (WebSocket)

Task:
- [ ] Backend: GET /api/admin/schedule
- [ ] Frontend: react-big-calendar
- [ ] WebSocket: schedule:updated
```

---

## EPIC 4: Finance & Settlement (Week 3)
**점수: 50pt | 우선순위: 🔴 MUST**

### 4.1 Story: 거래 기록
**점수: 10pt | 예상: 2.5일**

```
요구사항:
상담담당자로서 나는
서비스 완료 후 고객이 지급한 금액을 기록하고
미수금을 추적하고 싶다.

수락기준:
- [ ] 거래 기록 (예약 ID, 금액, 결제방법)
- [ ] 결제방법 선택 (현금, 카드, 계좌)
- [ ] 미수금 추적
- [ ] 거래 수정 기능

Task:
- [ ] Backend: POST /api/finance/transactions
- [ ] Frontend: Admin에서 거래 기록 폼
```

### 4.2 Story: 자동 정산 (배치 + Google Sheets)
**점수: 20pt | 예상: 4.5일**

```
요구사항:
오너로서 나는
매일 새벽 1시에 자동으로 정산이 되고
구글시트에 업로드되길 원한다.

수락기준:
- [ ] Bull 배치 (매일 1:00 KST)
- [ ] 거래 합계 + 비용 차감 + 순이익 계산
- [ ] Google Sheets API로 업로드
- [ ] 이메일 알림 (오너)
- [ ] 수동 재정산 기능

Task:
- [ ] Backend: Bull 큐, Settlement 로직
- [ ] Google Sheets API 연동
- [ ] Tests: 정산 계산 검증
```

### 4.3 Story: 정산 대시보드 & 분석
**점수: 20pt | 예상: 4.5일**

```
요구사항:
오너로서 나는
일/주/월간 매출, 비용, 이익을
차트와 테이블로 보고 싶다.

수락기준:
- [ ] 일자별 요약 (매출, 비용, 이익)
- [ ] 주간/월간 트렌드 (차트)
- [ ] 테라피스트별 매출 TOP 5
- [ ] 미수금 현황
- [ ] 엑셀 다운로드

Task:
- [ ] Backend: GET /api/admin/finance/reports
- [ ] Frontend: 대시보드 (Recharts)
```

---

## EPIC 5: 직원관리 (Week 3)
**점수: 30pt | 우선순위: 🔴 MUST**

### 5.1 Story: 직원 신상 관리
**점수: 10pt | 예상: 2.5일**

```
요구사항:
오너로서 나는
직원의 신상정보(이름, 연락처, 급여, 스킬)를
관리하고 싶다.

수락기준:
- [ ] 직원 CRUD
- [ ] 스킬 등록 (스웨디시, 핫스톤, 타이 등)
- [ ] 급여 등록
- [ ] 직원 목록 (검색, 정렬, 필터)

Task:
- [ ] Backend: Staff CRUD
- [ ] Frontend: 직원 관리 페이지
```

### 5.2 Story: 직원 기록 (경고, 상벌, 교육)
**점수: 10pt | 예상: 2.5일**

```
요구사항:
오너로서 나는
직원의 경고, 상벌, 교육 이력을
기록하고 조회하고 싶다.

수락기준:
- [ ] 기록 타입 선택
- [ ] 사유 텍스트 + 증거 파일
- [ ] 기록 목록 조회 (시간순)
- [ ] 직원 프로필에서 요약 표시

Task:
- [ ] Backend: DisciplineRecord model
- [ ] File storage: S3 파일 저장
- [ ] Frontend: 기록 추가/조회
```

### 5.3 Story: 직원 성과 추적
**점수: 10pt | 예상: 2.5일**

```
요구사항:
오너/매니저로서 나는
직원의 매출, 고객만족도, 결근율을
월별로 추적하고 싶다.

수락기준:
- [ ] 월별 매출 집계
- [ ] 고객 리뷰/만족도 평균
- [ ] 결근율 & 정시도
- [ ] KPI 대시보드

Task:
- [ ] Backend: Performance aggregation
- [ ] Frontend: 성과 차트
```

---

## EPIC 6: Staff Site (Week 3-4)
**점수: 40pt | 우선순위: 🔴 MUST**

### 6.1 Story: 테라피스트 스케줄 & 가용성
**점수: 15pt | 예상: 3.5일**

```
요구사항:
테라피스트로서 나는
오늘/주간 예약을 확인하고
휴식, OFF, 구글캘린더와 동기하고 싶다.

수락기준:
- [ ] 오늘/주간 스케줄 뷰
- [ ] 휴식 등록 (시간대)
- [ ] OFF 신청 (매니저 승인)
- [ ] 구글캘린더 자동 동기
- [ ] 개인 일정 충돌 감지

Task:
- [ ] Frontend: Staff Site (staff.elspa.com)
- [ ] Google Calendar API (양방향)
- [ ] WebSocket: 실시간 스케줄 업데이트
```

### 6.2 Story: 예약 처리 (시작, 완료, 평가)
**점수: 12pt | 예상: 3일**

```
요구사항:
테라피스트로서 나는
예약을 시작하고 완료할 때
경과시간을 보고 싶으며
고객 평가를 받고 싶다.

수락기준:
- [ ] 예약 상세 & 고객 특별요청
- [ ] [시작] 버튼 → 경과시간 표시
- [ ] [완료] 버튼 → 서비스 종료
- [ ] 실시간 고객 알림 (남은 시간)
- [ ] 평가 수신

Task:
- [ ] Backend: bookings state update
- [ ] Frontend: 타이머 UI
- [ ] WebSocket: 실시간 상태 동기
```

### 6.3 Story: 드라이버 픽드랍
**점수: 13pt | 예상: 3일**

```
요구사항:
드라이버로서 나는
새 픽드랍 요청을 받으면
수락하고 네비게이션으로 가서
고객 평가를 받고 싶다.

수락기준:
- [ ] 픽드랍 요청 알림 (푸시)
- [ ] 고객정보 & 주소 표시
- [ ] [수락] 시 네비게이션 시작
- [ ] 실시간 GPS 위치 전송
- [ ] 도착 확인 & 평가

Task:
- [ ] Frontend: Staff App (React Native)
- [ ] Google Maps 네비게이션
- [ ] Firebase Cloud Messaging (푸시)
- [ ] WebSocket: 실시간 위치
```

---

## EPIC 7: 외부 API 통합 (Week 5-6)
**점수: 50pt | 우선순위: 🟡 SHOULD**

### 7.1 Story: Caldotcom 양방향 동기화
**점수: 20pt | 예상: 4.5일**

```
요구사항:
관리자로서 나는
칼닷컴의 예약을 자동으로 ElSpa에 반영하고
역으로 ElSpa 예약도 칼닷컴에 동기하고 싶다.

수락기준:
- [ ] Caldotcom Webhook 수신
- [ ] 중복 예약 감지 & 자동 취소
- [ ] 양방향 동기화
- [ ] 네트워크 오류 재시도

Task:
- [ ] Backend: Caldotcom API 클라이언트
- [ ] Webhook 처리
- [ ] 데이터 일관성 테스트
```

### 7.2 Story: Google Calendar 양방향 동기화
**점수: 15pt | 예상: 3.5일**

```
요구사항:
테라피스트로서 나는
개인 구글캘린더에 추가한 일정이
ElSpa에 자동으로 OFF로 처리되길 원한다.

수락기준:
- [ ] OAuth 2.0 인증 (테라피스트별)
- [ ] ElSpa 예약 → Google Calendar 추가
- [ ] Google Calendar → ElSpa OFF 감지
- [ ] Timezone 처리

Task:
- [ ] Backend: Google Calendar API 클라이언트
- [ ] 동기화 배치 (매 1시간)
- [ ] 권한 관리
```

### 7.3 Story: ElevenLabs 음성 상담 (선택)
**점수: 15pt | 예상: 3.5일**

```
요구사항:
고객으로서 나는
전화로 상담하면
AI가 음성으로 응답해주고
예약까지 완료해주고 싶다.

수락기준:
- [ ] Twilio Voice API (전화 수신)
- [ ] ElevenLabs STT (음성→텍스트)
- [ ] 상담 에이전트 처리
- [ ] TTS (텍스트→음성) 응답
- [ ] 예약 생성

Task:
- [ ] Backend: Twilio + ElevenLabs 통합
- [ ] IVR 로직
- [ ] 통화 녹음 저장
```

---

## EPIC 8: 마이크로서비스 리팩토링 (Week 6-8)
**점수: 60pt | 우선순위: 🟡 SHOULD**

### 8.1 Story: Chat Service 분리
**점수: 15pt | 예상: 3.5일**

```
요구사항:
아키텍처로서 나는
Chat 서비스를 독립 마이크로서비스로 분리하여
독립 스케일링 & 배포가 가능하게 하고 싶다.

수락기준:
- [ ] Chat Service (Node.js)
- [ ] 독립 DB (PostgreSQL)
- [ ] API Gateway에서 라우팅
- [ ] 내부 통신 (REST)

Task:
- [ ] 코드 분리 (monorepo → services/chat)
- [ ] 독립 Dockerfile
- [ ] 독립 CI/CD
```

### 8.2 Story: Schedule Service 분리
**점수: 15pt | 예상: 3.5일**

```
요구사항: Chat Service와 동일
```

### 8.3 Story: Finance Service 분리 + Bull 큐
**점수: 15pt | 예상: 3.5일**

```
요구사항: Chat Service와 동일
특징: 배치 처리 (Bull 큐)
```

### 8.4 Story: 서비스 간 통신 (Event-Driven)
**점수: 15pt | 예상: 3.5일**

```
요구사항:
아키텍트로서 나는
마이크로서비스 간 이벤트 기반 통신으로
데이터 일관성을 보장하고 싶다.

수락기준:
- [ ] Redis Pub/Sub (비동기)
- [ ] Saga 패턴 (분산 트랜잭션)
- [ ] 데이터 일관성 테스트

Task:
- [ ] 이벤트 기반 아키텍처 구현
- [ ] 상담 → 예약 생성 시 이벤트 체인
```

---

## EPIC 9: 보안 & 모니터링 (Week 7-8)
**점수: 40pt | 우선순위: 🟡 SHOULD**

### 9.1 Story: 감사 로그
**점수: 10pt | 예상: 2.5일**

```
모든 중요 작업 로깅:
- 예약 변경, 급여 조정, 정산 수정
- 직원 정보 변경, OFF 승인
```

### 9.2 Story: 데이터 암호화
**점수: 10pt | 예상: 2.5일**

```
민감한 데이터 암호화:
- 전화번호, 주민등록번호, 계좌번호
- AES-256
```

### 9.3 Story: 로깅 & 모니터링
**점수: 10pt | 예상: 2.5일**

```
Winston, Sentry, Prometheus 통합:
- 에러 추적, 성능 모니터링
```

### 9.4 Story: 성능 최적화
**점수: 10pt | 예상: 2.5일**

```
- 데이터베이스 인덱싱
- Redis 캐싱
- API 응답 시간 최적화
```

---

## 개발 일정 (8주)

### Phase A: MVP (Week 1-4)
```
W1: Auth (40pt) + Chat (50pt) = 90pt
    - 로그인, RBAC
    - Messenger/Kakao 통합
    - 상담함, AI 상담

W2: Booking (60pt) = 60pt
    - 예약 생성/확정
    - User Site 기본
    - 스케줄 뷰

W3: Finance (50pt) + Employee (30pt) = 80pt
    - 거래 기록, 자동 정산
    - 직원 관리, 기록, 성과

W4: Staff Site (40pt) = 40pt
    - 테라피스트 스케줄
    - 드라이버 픽드랍

총 270pt (주 67.5pt 평균)
```

### Phase B: 고도화 (Week 5-8)
```
W5: 외부 API (50pt) = 50pt
    - Caldotcom, 구글캘린더, ElevenLabs

W6: 마이크로서비스 분리 (60pt) = 60pt
    - Chat, Schedule, Finance 서비스화

W7-8: 보안 & 모니터링 (40pt) + 버그 수정 = 80pt

총 190pt
```

---

## 성공 기준

| 지표 | 목표 |
|------|------|
| 상담 누락률 | < 1% |
| 중복예약 | 0건/월 |
| 정산 자동화율 | 100% |
| AI 상담 성공률 | > 85% |
| 시스템 가용성 | > 99.5% |
| 테스트 커버리지 | > 75% |

---

## 다음 단계

1. **팀 리뷰 & 최종 승인**
   - 기술 스택 확정
   - 일정 협의
   - 리소스 할당

2. **개발 환경 세팅**
   - Docker Compose
   - Git 저장소
   - CI/CD 파이프라인 기초

3. **Phase 4: Implementation 시작**
   - W1 Monday부터 개발
   - 주간 스탠드업 (월/수/금)
   - 주말 데모 & 리뷰

