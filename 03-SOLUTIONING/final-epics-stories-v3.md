# ElSpa Final Epics & Stories (v3)
**Phase 3: Implementation Roadmap with Tailwind CSS + PWA + QR | Date: 2026-05-05**

---

## 📊 전체 요약

```
구성: 12개 Epic, 95개 Story, 420 Story Points
기간: 8주 (Week 1-8)

Phase A (MVP + Responsive): Week 1-4 = 300pt
├─ W1: Auth + Chat (Messenger/Kakao) + Tailwind = 90pt
├─ W2: Booking + User Site = 70pt
├─ W3: Finance + Employee + Backup = 90pt
└─ W4: Staff Site + PWA 기초 = 50pt

Phase B (고도화 + 오프라인): Week 5-8 = 420pt
├─ W5: Caldotcom + Google Calendar + ElevenLabs = 60pt
├─ W6: PWA + Offline + 동기화 = 70pt
├─ W7: QR 코드 배포 시스템 = 50pt
├─ W8: Microservices 리팩토링 = 80pt
└─ 추가: Security + Monitoring + Bug fixes = 100pt

기술 스택:
- Frontend: Next.js 14, React 18, Tailwind CSS, TypeScript
- PWA: Service Worker, IndexedDB, qrcode.react
- Backend: Node.js, Express, PostgreSQL
- 외부: ElevenLabs, Caldotcom, Google APIs, Firebase
- 배포: Docker, Kubernetes, Vercel
```

---

## PHASE A: MVP + 반응형 디자인 (Week 1-4)

### Epic 1: 인증 & 사용자 관리 (Auth Service)
**Points: 90 | Duration: W1-W2 | Status: Core**

#### Stories:

**S1.1: 기본 JWT 인증 구현**
- Points: 13
- Acceptance Criteria:
  - [x] JWT 토큰 생성/검증 (Node.js + Express)
  - [x] 토큰 만료 시간: 24시간
  - [x] 리프레시 토큰: 7일
  - [x] /api/auth/register, /api/auth/login 엔드포인트
- Dev Tasks:
  - JWT 라이브러리 설치 (jsonwebtoken)
  - PostgreSQL users 테이블 생성
  - 비밀번호 해싱 (bcrypt)
  - 토큰 검증 미들웨어
- QA:
  - 정상 로그인 테스트
  - 토큰 만료 시 재발급 확인
  - 잘못된 비밀번호 거부

**S1.2: OAuth 2.0 (Google, Kakao) 통합**
- Points: 20
- Dependencies: S1.1
- Acceptance Criteria:
  - [x] Google OAuth 로그인
  - [x] Kakao OAuth 로그인
  - [x] 기존 계정 자동 연결
  - [x] 소셜 로그인 시 프로필 자동 저장
- Dev Tasks:
  - Google OAuth 설정 (Client ID, Secret)
  - Kakao OAuth 설정
  - /api/auth/oauth/google, /api/auth/oauth/kakao
  - 사용자 프로필 매핑
- QA:
  - Google 로그인 → 첫 로그인, 재로그인
  - Kakao 로그인 → 프로필 동기화

**S1.3: 역할 기반 접근 제어 (RBAC) - 3개 사이트용**
- Points: 18
- Dependencies: S1.1
- Acceptance Criteria:
  - [x] 역할 3가지: Owner, Manager, Staff, Customer, Driver
  - [x] 권한 매트릭스 (각 API별 권한 정의)
  - [x] Middleware: checkRole('owner', 'manager')
  - [x] Admin Site: Owner/Manager 구분
  - [x] User Site: Customer 전용
  - [x] Staff Site: Therapist/Driver 구분
- Dev Tasks:
  - roles, permissions 테이블 생성
  - 권한 검증 미들웨어
  - 3개 사이트별 권한 맵 정의
  - API 라우트별 권한 추가
- QA:
  - Owner만 설정 변경 가능
  - Customer는 자신의 예약만 조회
  - Driver는 픽드랍만 관리

**S1.4: 관리자 계정 & 초대 시스템**
- Points: 15
- Dependencies: S1.1, S1.3
- Acceptance Criteria:
  - [x] Admin이 직원/매니저 초대 가능
  - [x] 초대 링크 (72시간 유효)
  - [x] 이메일 발송 (SendGrid)
  - [x] 일회용 QR 코드 생성 가능
  - [x] 권한 자동 할당 (초대 시)
- Dev Tasks:
  - invitations 테이블 생성
  - 초대 이메일 템플릿 (Tailwind 이메일)
  - QR 토큰 생성 로직
  - /api/admin/staff/invite 엔드포인트
- QA:
  - 초대 이메일 수신 확인
  - 링크 클릭 → 자동 로그인

**S1.5: 사용자 세션 관리**
- Points: 12
- Dependencies: S1.1
- Acceptance Criteria:
  - [x] 동시 세션 제한: 최대 3개
  - [x] 기기별 로그아웃 가능
  - [x] 비정상 로그인 감지 (새 IP)
  - [x] 세션 타임아웃: 30분 (마지막 활동)
- Dev Tasks:
  - sessions 테이블 생성
  - 세션 관리 로직
  - 활동 추적 미들웨어
  - 알림 이메일 (의심 로그인)
- QA:
  - 4번째 기기 로그인 → 1번째 자동 로그아웃
  - 비정상 위치 로그인 감지

**S1.6: 2단계 인증 (2FA) - Optional**
- Points: 16
- Dependencies: S1.1
- Acceptance Criteria:
  - [x] TOTP (Time-based OTP) 지원
  - [x] SMS 인증 (Twilio)
  - [x] Admin 강제 활성화 가능
- Dev Tasks:
  - 2FA 토글
  - TOTP 라이브러리 (speakeasy)
  - SMS 발송 (Twilio)
- QA:
  - 구글 인증자 앱과 동기화
  - SMS 인증 코드 입력

---

### Epic 2: 채팅 통합 & AI 상담 (Chat Service)
**Points: 100 | Duration: W1-W2 | Status: MVP**

#### Stories:

**S2.1: Messenger 웹훅 통합**
- Points: 18
- Acceptance Criteria:
  - [x] Facebook Messenger API 연동
  - [x] 메시지 수신 웹훅 (POST /webhooks/messenger)
  - [x] 메시지 저장 (DB)
  - [x] Admin에 알림
- Dev Tasks:
  - Facebook App 설정
  - 웹훅 URL 검증
  - 메시지 파싱 및 저장
  - 암호화 (메시지 내용)
- QA:
  - Messenger에서 메시지 전송 → 수신 확인
  - Webhook 재시도 (실패 시)

**S2.2: Kakao 톡 통합**
- Points: 16
- Acceptance Criteria:
  - [x] Kakao Channel API 연동
  - [x] 메시지 수신/발송
  - [x] Admin에 알림
- Dev Tasks:
  - Kakao 채널 설정
  - API 연동
  - 메시지 저장
- QA:
  - 카톡 메시지 수신 확인
  - Admin 대시보드에 표시

**S2.3: 통합 채팅 대시보드 (Tailwind UI)**
- Points: 25
- Dependencies: S2.1, S2.2
- Acceptance Criteria:
  - [x] Admin Site에서 모든 채팅 조회
  - [x] 채팅 채널별 필터 (Messenger/Kakao/Phone)
  - [x] 메시지 검색 (고객명, 시간)
  - [x] 반응형 디자인 (Tailwind)
  - [x] 모바일/태블릿/데스크톱 모두 지원
  - [x] Dark mode 지원
- Dev Tasks:
  - Chat 컴포넌트 (Tailwind)
  - 필터 UI (TanStack Query)
  - 검색 기능
  - Tailwind responsive: sm, md, lg, xl
- QA:
  - 모바일에서 터치 조작 확인
  - 데스크톱 전체 기능 확인

**S2.4: AI 상담 기초 (LangChain)**
- Points: 22
- Dependencies: S2.1, S2.2
- Acceptance Criteria:
  - [x] LangChain Agent 기본 설정
  - [x] 고객 메시지 → AI 자동 분석
  - [x] 예약 인텐트 감지 ("예약하고 싶어요")
  - [x] Admin이 AI 응답 승인/거부 가능
  - [x] AI 성공률 추적 (대시보드)
- Dev Tasks:
  - LangChain + Claude API 설정
  - Agent 프롬프트 작성
  - 인텐트 분류 로직
  - /api/chat/:id/ai-response 엔드포인트
- QA:
  - "예약하고 싶어요" → 예약 인텐트 감지
  - AI 응답 정확성 테스트

**S2.5: AI → 자동 예약 전환**
- Points: 19
- Dependencies: S2.4, Booking Service
- Acceptance Criteria:
  - [x] AI가 예약 정보 추출
  - [x] 자동으로 Booking Service 호출
  - [x] 고객에게 확인 메시지 발송
  - [x] 예약 성공/실패 로그
- Dev Tasks:
  - 예약 추출 로직 (날짜, 시간, 서비스)
  - 가용성 확인
  - 예약 생성 API 호출
  - Fallback: Admin 수동 승인
- QA:
  - "내일 10시 스웨디시" → 자동 예약
  - 중복 예약 방지

**S2.6: 채팅 히스토리 & 내보내기**
- Points: 20
- Dependencies: S2.1, S2.2
- Acceptance Criteria:
  - [x] 고객별 채팅 히스토리 조회
  - [x] PDF/CSV 내보내기
  - [x] 검색 (날짜, 키워드)
  - [x] 만료 정책 (1년 후 자동 삭제)
- Dev Tasks:
  - 채팅 저장소 (PostgreSQL)
  - 검색 인덱스 (Full-text search)
  - PDF 생성 (pdfkit)
  - 정기 삭제 job (Cron)
- QA:
  - 1년 이상된 채팅 자동 삭제 확인
  - PDF 생성 확인

---

### Epic 3: 예약 관리 (Booking Service)
**Points: 70 | Duration: W2-W3 | Status: MVP**

#### Stories:

**S3.1: 예약 CRUD & 충돌 감지**
- Points: 25
- Acceptance Criteria:
  - [x] POST /bookings (예약 생성)
  - [x] GET /bookings/:id (조회)
  - [x] PUT /bookings/:id (수정)
  - [x] DELETE /bookings/:id (취소)
  - [x] 중복 예약 방지 (같은 테라피스트, 시간)
  - [x] 실시간 가용성 확인 (Schedule Service 호출)
- Dev Tasks:
  - Booking 모델 생성 (PostgreSQL)
  - 예약 상태 (pending, confirmed, cancelled)
  - 충돌 감지 로직
  - 트랜잭션 처리
- QA:
  - 예약 생성 시 중복 거부
  - 예약 수정 → 새 시간 유효성 확인

**S3.2: 예약 상태 관리 & 워크플로우**
- Points: 18
- Dependencies: S3.1
- Acceptance Criteria:
  - [x] 상태: pending → confirmed → completed → cancelled
  - [x] 상태 변경 시 알림 (고객, Staff)
  - [x] Admin이 수동 상태 변경 가능
- Dev Tasks:
  - 상태 머신 구현
  - 알림 트리거 (Notification Service)
  - 감사 로그 (audit_log)
- QA:
  - 상태 전환 테스트
  - 알림 이메일 수신 확인

**S3.3: 예약 검증 & 비즈니스 규칙**
- Points: 16
- Dependencies: S3.1
- Acceptance Criteria:
  - [x] 최소 예약: 24시간 전 (또는 설정 가능)
  - [x] 예약 취소: 6시간 전 (수수료 없음)
  - [x] 고객당 최대 5개 예약 제한
  - [x] 예약 재확인: 24시간 전 SMS
- Dev Tasks:
  - 비즈니스 규칙 엔진 (custom logic)
  - 타이머 설정 (24시간 전 알림)
  - 제한 규칙 (고객당 최대)
- QA:
  - 23시간 전 예약 거부 확인
  - SMS 재확인 테스트

**S3.4: 고객 예약 앱 (User Site - Tailwind)**
- Points: 20
- Acceptance Criteria:
  - [x] 4단계 예약 플로우 (서비스선택 → 시간선택 → 예약자정보 → 결제)
  - [x] Tailwind 반응형 디자인
  - [x] 모바일 최적화
  - [x] 캘린더 피커 (가용 시간만 표시)
  - [x] Dark mode
- Dev Tasks:
  - 서비스 선택 페이지 (카드 UI, Tailwind)
  - 캘린더 피커 (react-calendar + Tailwind)
  - 예약자 정보 폼
  - 결제 페이지 (통합 예정)
- QA:
  - 모바일 (375px) 에서 터치 가능성
  - 태블릿 (768px) 2열 레이아웃
  - 데스크톱 (1024px) 전체 기능
  - Dark mode 색상 대비 확인

**S3.5: 예약 확인 및 알림**
- Points: 11
- Dependencies: S3.2
- Acceptance Criteria:
  - [x] 예약 확인 이메일/SMS
  - [x] 예약 상기 (24시간 전)
  - [x] 예약 완료 후 리뷰 요청
- Dev Tasks:
  - 이메일 템플릿 (Tailwind 이메일)
  - SMS 템플릿
  - 발송 스케줄 (Cron job)
- QA:
  - 예약 후 이메일 수신
  - SMS 상기 테스트

---

### Epic 4: 재정 관리 & 자동 정산 (Finance Service)
**Points: 80 | Duration: W3 | Status: MVP**

#### Stories:

**S4.1: 거래 기록 시스템**
- Points: 16
- Acceptance Criteria:
  - [x] 거래 생성 (예약 → 결제)
  - [x] 거래 상태: pending, completed, refunded
  - [x] 결제 방법: 신용카드, 계좌이체, 현금
  - [x] 거래 조회 (필터: 날짜, 결제방법, 상태)
- Dev Tasks:
  - transactions 테이블 (금액, 상태, 메타데이터)
  - 거래 저장 로직
  - 결제 상태 동기화 (결제 게이트웨이)
- QA:
  - 예약 → 거래 자동 생성
  - 결제 실패 시 상태 업데이트

**S4.2: 자동 정산 (Bull Queue)**
- Points: 28
- Dependencies: S4.1
- Acceptance Criteria:
  - [x] 매일 1:00 AM 정산 배치 실행
  - [x] 어제 거래 → 정산 계산 (commission, cost)
  - [x] 정산 기록 생성 (settlements 테이블)
  - [x] 실패 시 재시도 (최대 3회)
  - [x] 정산 히스토리 조회
- Dev Tasks:
  - Bull Queue 설정 (Redis)
  - 정산 계산 로직
  - settlements 테이블 생성
  - 정산 실패 알림
- QA:
  - 매일 1:00 정산 실행 확인
  - 정산 계산 정확도 (수작업 검증)

**S4.3: Google Sheets 연동 (자동 기록)**
- Points: 22
- Dependencies: S4.2
- Acceptance Criteria:
  - [x] 정산 완료 → Google Sheets 자동 기록
  - [x] 시트 구조: 날짜, 총매출, commission, cost, 순익
  - [x] 월별 탭 자동 생성
  - [x] Admin이 Google Drive에서 직접 확인 가능
- Dev Tasks:
  - Google Sheets API 인증 (OAuth)
  - 정산 데이터 → Sheets 포매팅
  - Sheets 행 추가 로직
  - 월별 탭 관리
- QA:
  - 정산 → Sheets 자동 기록
  - 데이터 정합성 확인

**S4.4: Finance Dashboard (Admin - Tailwind)**
- Points: 20
- Acceptance Criteria:
  - [x] KPI: 일일/주간/월간 매출
  - [x] 차트: 매출 추이, 결제방법별 분포
  - [x] 거래 목록 (필터, 정렬)
  - [x] 정산 히스토리
  - [x] Tailwind 반응형
  - [x] Dark mode
- Dev Tasks:
  - KPI 계산 (쿼리)
  - 차트 라이브러리 (recharts)
  - 필터 UI (TanStack Query)
  - 반응형 그리드 (Tailwind)
- QA:
  - 모바일/태블릿/데스크톱 레이아웃
  - 차트 데이터 정확성

**S4.5: 비용 관리 & 보고서**
- Points: 14
- Dependencies: S4.1
- Acceptance Criteria:
  - [x] 비용 기록 (용품, 유지비, 인건비)
  - [x] 비용 분류
  - [x] 월간 비용 리포트 (자동 생성)
  - [x] 순익 = 매출 - 정산 - 비용
- Dev Tasks:
  - expenses 테이블
  - 비용 저장 로직
  - 월간 리포트 쿼리
- QA:
  - 비용 기록 확인
  - 리포트 계산 검증

---

### Epic 5: 직원 관리 (Employee Service)
**Points: 65 | Duration: W3-W4 | Status: MVP**

#### Stories:

**S5.1: 직원 신상 관리**
- Points: 18
- Acceptance Criteria:
  - [x] 직원 정보: 이름, 이메일, 연락처, 직급, 입사일
  - [x] 직원 사진 업로드 (프로필)
  - [x] 역할: 테라피스트, 드라이버, 매니저, 오너
  - [x] 활성화/비활성화 (연금 처리)
- Dev Tasks:
  - staff 테이블 (프로필 이미지 URL)
  - 파일 업로드 (AWS S3 또는 로컬)
  - 역할 매핑
- QA:
  - 직원 정보 저장/수정 확인
  - 이미지 업로드 크기 제한 (5MB)

**S5.2: 근무 기록 (경고, 상벌)**
- Points: 20
- Dependencies: S5.1
- Acceptance Criteria:
  - [x] 기록 유형: 칭찬, 주의, 경고, 징계
  - [x] 기록자: Admin/Manager만 가능
  - [x] 내용 & 날짜 저장
  - [x] 직원별 기록 히스토리
  - [x] 이메일 알림 (기록 작성 시)
- Dev Tasks:
  - discipline_records 테이블
  - 접근 제어 (Admin/Manager만)
  - 기록 조회 및 필터
  - 알림 이메일
- QA:
  - 직원만 기록 조회 가능 (자신 것만)
  - Admin 전체 조회 가능

**S5.3: 성과 평가 & 추적**
- Points: 17
- Dependencies: S5.1
- Acceptance Criteria:
  - [x] 월간 성과: 서비스 건수, 평점, 인센티브
  - [x] 평점 계산: (고객 리뷰 + 예약 취소율 + 지각)
  - [x] 상위 직원 표시
  - [x] 인센티브 자동 계산
- Dev Tasks:
  - performance 테이블
  - 성과 점수 계산 로직
  - 월간 리포트
- QA:
  - 성과 점수 정확성
  - 인센티브 계산 검증

**S5.4: 직원 관리 대시보드 (Admin - Tailwind)**
- Points: 20
- Acceptance Criteria:
  - [x] 직원 목록 (검색, 필터)
  - [x] 직원 상세 (신상, 기록, 성과)
  - [x] 일괄 작업 (권한 변경, 비활성화)
  - [x] Tailwind 반응형
  - [x] 모달: 직원 추가/수정
  - [x] Dark mode
- Dev Tasks:
  - 직원 목록 테이블 (TanStack Table)
  - 필터 UI (역할, 상태)
  - 모달 폼 (Tailwind)
  - 반응형 디자인
- QA:
  - 모바일 테이블 스크롤
  - 필터 기능 테스트
  - 모달 폼 저장/취소

---

### Epic 6: 데이터베이스 백업 & 복원 (Admin)
**Points: 40 | Duration: W3-W4 | Status: MVP**

#### Stories:

**S6.1: 자동 백업 설정**
- Points: 15
- Acceptance Criteria:
  - [x] 백업 주기: 6시간마다
  - [x] 백업 시작 시간: 02:00 KST (설정 가능)
  - [x] 백업 타입: 전체 DB, 파일 저장소
  - [x] 보존 기간: 30일 (자동 삭제)
  - [x] 백업 전 데이터 검증 (integrity check)
- Dev Tasks:
  - PostgreSQL pg_dump (스크립트)
  - Cron job (6시간마다)
  - 백업 저장소 (로컬 디렉토리 또는 S3)
  - 만료 데이터 자동 삭제
- QA:
  - 백업 자동 실행 확인
  - 백업 파일 무결성 테스트

**S6.2: 백업 히스토리 & 모니터링**
- Points: 12
- Dependencies: S6.1
- Acceptance Criteria:
  - [x] 백업 목록 (상태: 성공/진행/실패)
  - [x] 파일 크기, 생성 시간 표시
  - [x] 실패 시 Admin 이메일 알림
  - [x] 디스크 공간 모니터링
- Dev Tasks:
  - backup_logs 테이블
  - 백업 상태 추적
  - 알림 로직
  - 디스크 사용량 계산
- QA:
  - 백업 실패 알림 테스트
  - 디스크 경고 (20% 이상 사용 시)

**S6.3: 복원 기능 (Dry-Run & 롤백)**
- Points: 18
- Dependencies: S6.2
- Acceptance Criteria:
  - [x] 복원할 날짜/시간 선택
  - [x] Dry-Run: 복원 시뮬레이션 (데이터 손실 예상)
  - [x] 자동 롤백 백업 생성 (복원 전)
  - [x] 선택적 복원 (특정 테이블만)
  - [x] 진행 상황 표시 (예상 시간: ~18분)
  - [x] 복원 완료 후 검증
- Dev Tasks:
  - 복원 스크립트 (pg_restore)
  - Dry-Run 시뮬레이션 로직
  - 선택 테이블 필터링
  - 진행 상황 추적
- QA:
  - Dry-Run 정확성 (실제 손실 데이터 예측)
  - 실제 복원 테스트 (테스트 DB)
  - 롤백 성공 확인

---

### Epic 7: Staff 사이트 (Therapist + Driver)
**Points: 50 | Duration: W4 | Status: MVP**

#### Stories:

**S7.1: Staff 사이트 기초 (Tailwind)**
- Points: 15
- Acceptance Criteria:
  - [x] React + Next.js 프로젝트 생성
  - [x] Tailwind CSS 설정 (반응형, Dark mode)
  - [x] 인증: OAuth (Google, Kakao) + JWT
  - [x] 역할별 페이지 (테라피스트 vs 드라이버)
  - [x] 모바일 최적화 (React Native처럼 느낌)
- Dev Tasks:
  - Next.js 프로젝트 초기화
  - Tailwind 설정 (tailwind.config.ts)
  - OAuth 통합
  - 레이아웃 구성 (헤더, 사이드바, 메인)
- QA:
  - 모바일 (375px) 완전 기능
  - 태블릿 (768px) 멀티컬럼 레이아웃
  - 로그인 플로우

**S7.2: 테라피스트 스케줄 & 서비스 타이머**
- Points: 18
- Dependencies: S7.1
- Acceptance Criteria:
  - [x] 오늘의 예약 리스트
  - [x] 서비스 타이머 (시작/멈춤/완료)
  - [x] 완료 버튼 → 예약 상태 업데이트
  - [x] 고객 정보 표시 (프로필, 전화, 특이사항)
  - [x] 실시간 알림 (다음 예약 5분 전)
  - [x] Tailwind 카드 UI, Dark mode
- Dev Tasks:
  - 타이머 컴포넌트 (useTimer hook)
  - 예약 상태 업데이트 API
  - 알림 로직 (WebSocket)
  - 고객 정보 페칭
- QA:
  - 타이머 정확성
  - 예약 상태 실시간 동기화
  - 알림 푸시 테스트

**S7.3: 드라이버 픽드랍 관리**
- Points: 17
- Dependencies: S7.1
- Acceptance Criteria:
  - [x] 픽드랍 요청 리스트 (위치, 고객, 예약번호)
  - [x] 픽드랍 수락/거부 버튼
  - [x] 픽드랍 진행 중: GPS 업데이트
  - [x] 고객에게 실시간 위치 전송
  - [x] 픽드랍 완료 (도착 시)
  - [x] Google Maps 통합 (경로)
  - [x] 모바일 최적화
- Dev Tasks:
  - 픽드랍 상태 머신 (pending → accepted → in_progress → completed)
  - GPS 위치 업데이트 (WebSocket)
  - Google Maps API 호출
  - 실시간 알림
- QA:
  - GPS 갱신 빈도 (3초마다)
  - 고객이 실시간 위치 확인
  - 도착 감지 (위도/경도 범위)

**S7.4: Staff 성과 대시보드**
- Points: 10
- Dependencies: S7.1
- Acceptance Criteria:
  - [x] 월간 통계: 서비스 건수, 평점, 인센티브
  - [x] 주간 차트 (서비스 수)
  - [x] 상위 서비스 (가장 인기있는 것)
  - [x] 고객 리뷰 (최근 5개)
- Dev Tasks:
  - 통계 쿼리
  - 차트 컴포넌트 (recharts)
  - 리뷰 피드
- QA:
  - 통계 정확성
  - 차트 데이터 로드

**S7.5: Staff 사이트 배포 & 설치**
- Points: 10
- Dependencies: S7.1-S7.4
- Acceptance Criteria:
  - [x] Vercel에 배포
  - [x] manifest.json 설정
  - [x] Service Worker 기초 (캐싱만)
  - [x] "설치" 버튼 표시
  - [x] QR 코드로 접근 가능
- Dev Tasks:
  - Vercel 배포 설정
  - manifest.json 작성 (앱 이름, 아이콘, 설명)
  - Service Worker 생성 (자산 캐싱)
  - QR 코드 생성
- QA:
  - Vercel 배포 확인
  - manifest.json 유효성
  - 설치 프롬프트 표시

---

## PHASE B: 고도화 + 오프라인 기능 (Week 5-8)

### Epic 8: ElevenLabs + Caldotcom + Google Calendar 통합
**Points: 60 | Duration: W5 | Status: 고도화**

#### Stories:

**S8.1: ElevenLabs STT/TTS 통합**
- Points: 20
- Acceptance Criteria:
  - [x] 전화 녹음 → 텍스트 변환 (STT)
  - [x] AI 응답 → 음성 출력 (TTS)
  - [x] 실시간 처리 (<100ms 지연)
  - [x] 음성 감정 분석 (긍정/부정/중립)
- Dev Tasks:
  - ElevenLabs API 연동
  - 음성 스트리밍 (WebSocket)
  - 감정 분석 모델
  - 오류 처리 (음성 품질 낮음)
- QA:
  - STT 정확도 (한국어)
  - TTS 음성 자연스러움
  - 실시간 지연 측정

**S8.2: Caldotcom 양방향 동기화**
- Points: 20
- Acceptance Criteria:
  - [x] Caldotcom 예약 → ElSpa 자동 수입
  - [x] ElSpa 예약 → Caldotcom 자동 내보내기
  - [x] 중복 예약 방지 (deduplication)
  - [x] 충돌 해결 (최신 버전 우선)
  - [x] 동기화 상태 대시보드
- Dev Tasks:
  - Caldotcom API 인증
  - Webhook 설정 (예약 변경 시)
  - 동기화 로직 (병합 알고리즘)
  - 충돌 감지 및 해결
- QA:
  - Caldotcom에서 예약 → ElSpa 자동 수입
  - 양쪽 데이터 일관성
  - 충돌 시나리오 테스트 (동시 예약)

**S8.3: Google Calendar 양방향 동기화**
- Points: 20
- Acceptance Criteria:
  - [x] 테라피스트 Google Calendar ← 자동 동기화
  - [x] ElSpa 일정 → Google Calendar 자동 추가
  - [x] 시간대 처리 (UTC → KST)
  - [x] 색상 분류 (서비스별 색상)
  - [x] 충돌 감지 (개인 일정 vs 업무)
- Dev Tasks:
  - Google Calendar API (OAuth 2.0)
  - 이벤트 생성/수정/삭제
  - 시간대 변환 로직
  - 색상 매핑 (서비스 → 색상)
- QA:
  - Google Calendar에 자동 추가 확인
  - 시간대 변환 정확도
  - 충돌 감지 테스트

---

### Epic 9: PWA + 오프라인 기능 (완전 구현)
**Points: 70 | Duration: W6 | Status: 고도화**

#### Stories:

**S9.1: Service Worker & 캐싱 전략**
- Points: 18
- Acceptance Criteria:
  - [x] Service Worker 등록 (자동)
  - [x] 정적 리소스 캐싱 (HTML, CSS, JS)
  - [x] API 응답 캐싱 (Network First)
  - [x] 오프라인 fallback 페이지
  - [x] 캐시 버전 관리 (v1, v2, ...)
- Dev Tasks:
  - Service Worker 작성 (TS)
  - CacheStorage API 활용
  - 캐시 전략별 이벤트 리스너
  - 캐시 무효화 로직
- QA:
  - 온라인/오프라인 전환 테스트
  - 캐시 만료 확인
  - 업데이트 프롬프트 표시

**S9.2: IndexedDB 로컬 데이터 저장**
- Points: 16
- Dependencies: S9.1
- Acceptance Criteria:
  - [x] 예약, 채팅, 일정 로컬 저장
  - [x] 암호화 저장 (민감한 데이터)
  - [x] 자동 백업 (IndexedDB 스냅샷)
  - [x] 저장 공간 모니터링 (quota)
  - [x] 동기화 큐 (오프라인 변경사항)
- Dev Tasks:
  - IndexedDB 스키마 설계
  - 데이터 암호화 (crypto-js)
  - 저장소 용량 체크
  - sync_queue 구현
- QA:
  - 오프라인 중 데이터 저장 확인
  - 암호화 검증
  - 저장 공간 경고

**S9.3: 오프라인 동기화 엔진**
- Points: 22
- Dependencies: S9.2
- Acceptance Criteria:
  - [x] 오프라인 → 온라인: 자동 동기화
  - [x] Sync Queue 순차 처리
  - [x] 충돌 해결 (규칙 기반)
  - [x] 실패 시 재시도 (최대 3회)
  - [x] 동기화 진행률 표시
  - [x] 동기화 로그 (감사)
- Dev Tasks:
  - sync_queue 처리 엔진
  - 충돌 규칙 (예약, 채팅, 스케줄)
  - 재시도 로직 (exponential backoff)
  - UI 진행률 표시
- QA:
  - 오프라인 중 예약 생성 → 온라인 복귀 → 자동 동기화
  - 충돌 시나리오 (로컬 + 서버 동시 변경)
  - 재시도 정확성

**S9.4: 오프라인 기능 권한 관리**
- Points: 14
- Dependencies: S9.2, S9.3
- Acceptance Criteria:
  - [x] Admin PWA: 읽기만 오프라인 (Dashboard, 히스토리)
  - [x] User PWA: 전체 기능 오프라인 (예약, 메시지)
  - [x] Staff PWA: 일부만 (스케줄, 타이머, 위치)
  - [x] 오프라인 기능 제한 UI 표시
- Dev Tasks:
  - 기능별 오프라인 권한 맵
  - 쓰기 비활성화 (Admin 쓰기)
  - UI 안내 (읽기 전용 표시)
- QA:
  - Admin이 오프라인에서 쓰기 시도 → 거부 (안내)
  - User가 오프라인에서 예약 생성 → 큐 저장

**S9.5: 오프라인 상태 UX & 알림**
- Points: 12
- Dependencies: S9.1-S9.4
- Acceptance Criteria:
  - [x] 헤더 상태 표시 (온라인/오프라인/동기화 중)
  - [x] 동기화 큐 모달 (세부 정보)
  - [x] 오프라인 모드 수동 활성화
  - [x] 배터리 세이버 모드 (주기적 동기화 최소화)
  - [x] Dark mode 지원
- Dev Tasks:
  - 상태 표시 컴포넌트 (Tailwind)
  - 모달 (큐 목록, 진행률)
  - 네트워크 상태 감지
  - 배터리 상태 API
- QA:
  - 상태 표시 정확성
  - 모달 UI 반응성
  - Dark mode 색상

**S9.6: 오프라인 데이터 마이그레이션 & 복구**
- Points: 8
- Dependencies: S9.2
- Acceptance Criteria:
  - [x] 기기 초기화 후 복구 옵션
  - [x] 로컬 데이터 내보내기 (JSON)
  - [x] 다른 기기에서 복원
  - [x] 자동 클라우드 백업 (선택사항)
- Dev Tasks:
  - IndexedDB 스냅샷 생성
  - JSON 내보내기
  - 복원 로직
- QA:
  - 다중 기기 동기화
  - 내보내기/복원 정확도

---

### Epic 10: QR 코드 배포 시스템
**Points: 50 | Duration: W7 | Status: 고도화**

#### Stories:

**S10.1: QR 코드 생성 및 관리 (Admin)**
- Points: 15
- Acceptance Criteria:
  - [x] 고정 QR: Admin, Staff, User 각각 생성
  - [x] 일회용 QR: 직원별 생성 (토큰 기반)
  - [x] 추천 QR: 고객이 친구에게 공유
  - [x] QR 다운로드 (PNG)
  - [x] QR 스캔 분석 (히스토리)
- Dev Tasks:
  - QR 생성 API (qrcode.js)
  - 토큰 생성 (JWT)
  - 스캔 로그 저장
  - 분석 대시보드
- QA:
  - QR 생성 및 다운로드
  - QR 스캔 후 올바른 페이지로 이동
  - 일회용 QR 만료 확인

**S10.2: QR 스캔 플로우 (3가지)**
- Points: 18
- Acceptance Criteria:
  - [x] Admin QR 스캔 → 역할 선택 페이지
  - [x] Staff 고정 QR 스캔 → 역할 선택 페이지
  - [x] Staff 일회용 QR 스캔 → 자동 로그인
  - [x] User QR 스캔 → 웰컴 페이지
  - [x] 모바일 카메라 권한 요청
  - [x] URL 수동 입력 옵션
- Dev Tasks:
  - QR 스캔 감지 (라이브러리)
  - 플로우별 리다이렉트
  - 오류 처리 (QR 실패)
- QA:
  - 각 QR 타입별 스캔 테스트
  - 모바일 카메라 권한 요청
  - 수동 URL 입력

**S10.3: QR 기반 로그인 (일회용 토큰)**
- Points: 17
- Dependencies: S10.2
- Acceptance Criteria:
  - [x] QR 토큰 검증 (JWT 서명)
  - [x] 토큰 만료 확인 (72시간)
  - [x] 스캔 횟수 제한 (1회)
  - [x] 재사용 방지 (nonce)
  - [x] 2단계 인증 (SMS)
  - [x] 자동 권한 할당
- Dev Tasks:
  - QR 토큰 검증 로직
  - 만료/스캔 제한 확인
  - SMS 인증 (Twilio)
  - 권한 자동 설정
- QA:
  - QR 스캔 → 자동 로그인
  - 만료된 QR 거부
  - SMS 인증 코드 확인
  - 재사용 방지 (같은 QR 2회 스캔 거부)

---

### Epic 11: Microservices 리팩토링
**Points: 80 | Duration: W7-W8 | Status: 고도화**

#### Stories:

**S11.1: 마이크로서비스 코드 분리**
- Points: 25
- Acceptance Criteria:
  - [x] 7개 서비스 분리 (각 폴더)
  - [x] 각 서비스 독립 package.json
  - [x] API Gateway (Express)
  - [x] 라우팅 규칙 (서비스별 경로)
  - [x] 각 서비스 독립 배포 준비
- Dev Tasks:
  - 폴더 구조 재구성
  - API Gateway 구현
  - 서비스 간 통신 (REST)
  - 환경 변수 설정
- QA:
  - API Gateway를 통한 요청 라우팅
  - 각 서비스 독립 실행 테스트

**S11.2: 서비스 간 통신 (Sync + Async)**
- Points: 20
- Dependencies: S11.1
- Acceptance Criteria:
  - [x] 동기식: Booking → Schedule (REST)
  - [x] 비동기식: Finance → Notification (Redis Pub/Sub)
  - [x] 메시지 큐 (Bull/Redis)
  - [x] 이벤트 기반 아키텍처
- Dev Tasks:
  - REST 클라이언트 (각 서비스)
  - Redis Pub/Sub 설정
  - Bull Queue 설정
  - 이벤트 타입 정의
- QA:
  - 동기식 호출 지연 테스트
  - 비동기 이벤트 전달 확인
  - 메시지 순서 보장

**S11.3: 분산 트랜잭션 (Saga 패턴)**
- Points: 20
- Dependencies: S11.2
- Acceptance Criteria:
  - [x] Saga 오케스트레이터 구현
  - [x] Booking 생성 시: Booking → Schedule → Notification
  - [x] 각 단계 실패 시: 롤백
  - [x] 재시도 로직 (최대 3회)
  - [x] 감사 로그 (saga_log)
- Dev Tasks:
  - Saga 상태 머신
  - 롤백 로직
  - 재시도 로직
  - 감사 로그 저장
- QA:
  - Saga 성공 플로우
  - 부분 실패 → 롤백 확인
  - 재시도 정확성

**S11.4: 데이터베이스 분리 (각 서비스)**
- Points: 20
- Dependencies: S11.1
- Acceptance Criteria:
  - [x] 각 서비스마다 독립 PostgreSQL DB
  - [x] DB 마이그레이션 스크립트
  - [x] 데이터 일관성 유지 (Saga)
  - [x] 백업 정책 (모든 DB)
- Dev Tasks:
  - 각 서비스 DB 생성
  - 마이그레이션 스크립트 (Flyway)
  - 데이터 복제 (기존 모놀리식 → 마이크로서비스)
  - 모니터링
- QA:
  - 각 서비스 DB 독립성 확인
  - 데이터 마이그레이션 정확도

---

### Epic 12: 마케팅 분석 & 모니터링
**Points: 100 | Duration: W5-W8 | Status: 고도화**

#### Stories:

**S12.1: 마케팅 분석 데이터 수집**
- Points: 18
- Acceptance Criteria:
  - [x] ElevenLabs 데이터: 통화수, 성공률, 감정 분석
  - [x] Caldotcom 데이터: 예약수, 서비스 인기도
  - [x] 내부 데이터: 매출, 고객 만족도
  - [x] 일일 수집 (Cron)
  - [x] 분석 테이블 저장
- Dev Tasks:
  - ElevenLabs API 데이터 풀링
  - Caldotcom API 데이터 풀링
  - 데이터 정규화
  - analytics_daily 테이블
- QA:
  - 데이터 수집 정확성
  - 누락 데이터 처리

**S12.2: 마케팅 리포트 자동 생성 (일간/주간/월간/분기/연간)**
- Points: 22
- Dependencies: S12.1
- Acceptance Criteria:
  - [x] 일일 리포트 (매일 09:00)
  - [x] 주간 리포트 (매주 월요일)
  - [x] 월간 리포트 (매월 1일)
  - [x] 분기 리포트 (4회)
  - [x] 연간 리포트 (1월 1일)
  - [x] 자동 이메일 발송 (PDF/Excel)
  - [x] 대시보드 데이터 업데이트
- Dev Tasks:
  - 리포트 생성 엔진 (동적 쿼리)
  - PDF/Excel 생성 (pdfkit, xlsx)
  - 이메일 템플릿 (Tailwind)
  - Cron 스케줄 설정
- QA:
  - 리포트 데이터 정확성
  - 이메일 발송 시간 확인
  - PDF/Excel 형식

**S12.3: 마케팅 분석 대시보드 (Admin - Tailwind)**
- Points: 24
- Dependencies: S12.1
- Acceptance Criteria:
  - [x] 기간 선택: 일/주/월/분기/연간
  - [x] KPI: 통화수, 예약수, 매출, 고객만족도
  - [x] 차트: 매출 추이, 채널별 분포, 서비스 인기도
  - [x] 분석 탭: ElevenLabs, Caldotcom, 고객 분석
  - [x] 비교: vs 목표, vs 이전 기간, vs 업계
  - [x] 예측: AI 기반 매출 예측
  - [x] Tailwind 반응형, Dark mode
- Dev Tasks:
  - 기간별 쿼리 최적화
  - 차트 컴포넌트 (recharts)
  - 필터 UI (TanStack Query)
  - AI 예측 (LangGraph)
  - 반응형 그리드
- QA:
  - 각 기간별 데이터 정확성
  - 차트 로드 성능
  - Dark mode 가독성

**S12.4: Forecast & AI 분석 (LangGraph)**
- Points: 18
- Dependencies: S12.1
- Acceptance Criteria:
  - [x] 매출 예측 (다음 주/월/분기)
  - [x] 이상 감지 (비정상 매출/예약)
  - [x] 추천사항 (마케팅 전략 제안)
  - [x] AI 신뢰도 점수 표시
  - [x] 예측 히스토리 (정확도 추적)
- Dev Tasks:
  - LangGraph Agent (분석)
  - 시계열 분석 (Prophet)
  - 이상 감지 알고리즘
  - UI 시각화
- QA:
  - 예측 정확도 테스트 (과거 데이터)
  - 이상 감지 민감도 조정

**S12.5: 마케팅 리포트 UI (Admin - Tailwind)**
- Points: 18
- Dependencies: S12.2, S12.3
- Acceptance Criteria:
  - [x] 실시간 리포트 디스플레이
  - [x] 경고: 매출 저하, 예약 취소 증가
  - [x] 액션 아이템: 추천 마케팅 활동
  - [x] 내보내기: PDF, Excel, 이메일
  - [x] Tailwind 반응형, Dark mode
  - [x] 알림: 새 리포트 생성 시
- Dev Tasks:
  - 리포트 렌더링 컴포넌트 (Tailwind)
  - 알림 시스템
  - 내보내기 기능
- QA:
  - 리포트 UI 반응성
  - 알림 푸시 확인
  - 내보내기 파일 검증

---

## 📋 Story Points 분배

### Phase A (Week 1-4): MVP + 반응형 디자인
| Epic | W1 | W2 | W3 | W4 | Total |
|------|----|----|----|----|-------|
| Auth | 35 | 25 | - | - | 60 |
| Chat | 55 | 45 | - | - | 100 |
| Booking | - | 50 | 20 | - | 70 |
| Finance | - | - | 55 | 25 | 80 |
| Employee | - | - | 40 | 25 | 65 |
| Backup | - | - | 25 | 15 | 40 |
| Staff Site | - | - | - | 50 | 50 |
| **Total** | **90** | **120** | **140** | **115** | **465** |
| **Cumulative** | 90 | 210 | 350 | 465 | |

### Phase B (Week 5-8): 고도화 + 오프라인
| Epic | W5 | W6 | W7 | W8 | Total |
|------|----|----|----|----|-------|
| ElevenLabs+Cal+GCal | 60 | - | - | - | 60 |
| PWA + Offline | - | 70 | - | - | 70 |
| QR Deployment | - | - | 50 | - | 50 |
| Microservices | - | - | - | 80 | 80 |
| Marketing Analytics | 20 | - | - | 80 | 100 |
| **Total** | **80** | **70** | **50** | **160** | **360** |
| **Grand Total** | | | | | **825** |

---

## 기술 스택 (최종)

```
Frontend (3개 웹앱):
├─ Framework: Next.js 14, React 18, TypeScript
├─ Styling: Tailwind CSS (반응형, Dark mode)
├─ State: Zustand, TanStack Query
├─ UI: shadcn/ui (Tailwind 기반)
├─ Charts: recharts
├─ Forms: react-hook-form + Zod
└─ PWA: Service Worker, IndexedDB, qrcode.react

Backend (Microservices):
├─ Runtime: Node.js 18+
├─ Framework: Express.js + TypeScript
├─ API Gateway: Express
├─ Database: PostgreSQL (각 서비스)
├─ Cache: Redis (세션, 캐시, Pub/Sub)
├─ Queue: Bull (배치 작업)
├─ ORM: Prisma
└─ Testing: Jest, Supertest

외부 서비스:
├─ ElevenLabs (STT/TTS)
├─ Caldotcom API (예약 동기)
├─ Google APIs (OAuth, Calendar, Sheets, Maps)
├─ SendGrid (이메일)
├─ Twilio (SMS)
├─ Firebase (푸시 알림)
└─ AWS S3 (파일 저장소)

배포:
├─ Frontend: Vercel (Next.js)
├─ Backend: Docker + Kubernetes/ECS
├─ Database: AWS RDS (PostgreSQL)
├─ Cache: AWS ElastiCache (Redis)
└─ CDN: CloudFront

모니터링:
├─ Logging: ELK Stack (Elasticsearch, Logstash, Kibana)
├─ Tracing: Jaeger
├─ Metrics: Prometheus + Grafana
└─ Alerts: PagerDuty
```

---

## 🎯 성공 기준

### Phase A 완료 기준 (Week 4 말)
- ✅ 3개 웹앱 배포 (Admin, User, Staff)
- ✅ Tailwind CSS 반응형 100% 적용
- ✅ 기본 기능 (Auth, Chat, Booking, Finance, Employee) 동작
- ✅ 모바일 최적화 완료
- ✅ 400+ Story Points 완료

### Phase B 완료 기준 (Week 8 말)
- ✅ PWA 오프라인 기능 완전 구현
- ✅ QR 코드 배포 시스템 가동
- ✅ Microservices 리팩토링 완료
- ✅ 마케팅 분석 대시보드 라이브
- ✅ 825+ Story Points 완료

---

## 다음 단계

1. **Tailwind CSS 디자인 시스템** 상세 정의
2. **UI 컴포넌트 라이브러리** 구축 (shadcn/ui 활용)
3. **개발팀 규모**: Phase A (3명) → Phase B (5명)
4. **QA & 테스트**: 각 Epic마다 QA 스토리 병렬 진행
5. **배포 자동화**: GitHub Actions CI/CD 파이프라인
