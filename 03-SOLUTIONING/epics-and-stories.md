# 마사지/스파 통합 플랫폼 - Epic & User Stories
**Phase 3: Development Tasks | Date: 2026-05-05**

---

## 0. Overview

**Total Stories: 48**  
**Total Story Points: 280**  
**Recommended Velocity: 70 points/week → 4주 소요**

### 우선순위 분류
```
🔴 MUST (Critical MVP):  24 stories, 140 points (Week 1-2)
🟡 SHOULD (Core):       16 stories, 100 points (Week 3)
🟢 COULD (Polish):       8 stories, 40 points  (Week 4)
```

---

## EPIC 1: 인증 & 권한관리 (Auth & RBAC)
**점수: 35pt | 우선순위: 🔴 MUST**

### 1.1 Story: 사용자 등록 및 로그인
**점수: 8pt | 예상시간: 2일**

```
사용자로서 나는
이메일/비밀번호로 계정을 생성하고 로그인하고 싶다.

수락기준:
- [ ] 이메일 중복 검사
- [ ] 비밀번호 검증 (최소 8자, 대문자 포함)
- [ ] JWT 토큰 발급 (15분 만료)
- [ ] Refresh token 발급 (7일)
- [ ] 로그인 실패 시 3회 후 계정 잠금 (15분)
- [ ] 로그인 로그 기록

Task:
- [ ] Backend: POST /api/auth/register, POST /api/auth/login
- [ ] Frontend: 로그인 폼, 에러 메시지
- [ ] Tests: 회원가입 성공/실패, 로그인 성공/실패
```

### 1.2 Story: 역할 기반 접근 제어 (RBAC)
**점수: 12pt | 예상시간: 3일**

```
관리자로서 나는
직원들의 역할(Owner, Manager, Therapist, Receptionist, Driver)에 따라
접근 가능한 기능을 제한하고 싶다.

수락기준:
- [ ] 5개 역할 정의 (권한 매트릭스)
- [ ] API 미들웨어에서 권한 검증
- [ ] 프론트엔드에서 권한별 메뉴 표시/숨김
- [ ] 권한 없는 접근 시 403 응답
- [ ] 권한 변경 시 기존 토큰 무효화

Task:
- [ ] Backend: 권한 미들웨어, role enum
- [ ] Frontend: 역할별 라우팅, 메뉴 조건부 렌더링
- [ ] Database: user.role field
```

### 1.3 Story: 소셜 로그인 (Google, Kakao) [v1.5+]
**점수: 8pt | 우선순위: 🟡 SHOULD**

```
사용자로서 나는
Google/Kakao로 빠르게 로그인하고 싶다.

수락기준:
- [ ] Google OAuth 2.0 통합
- [ ] Kakao OAuth 통합
- [ ] 소셜 로그인 시 자동 프로필 생성
- [ ] 소셜 계정 기존 이메일과 연결

Task:
- [ ] Backend: OAuth 콜백 처리
- [ ] Frontend: Google/Kakao 로그인 버튼
```

### 1.4 Story: 2FA (Two-Factor Authentication) [v2.0+]
**점수: 7pt | 우선순위: 🟢 COULD**

---

## EPIC 2: 채널 통합 & 상담 관리
**점수: 60pt | 우선순위: 🔴 MUST**

### 2.1 Story: Messenger API 통합 (메시지 수신)
**점수: 10pt | 예상시간: 2.5일**

```
상담담당자로서 나는
Facebook Messenger를 통해 받은 고객 문의를 
시스템에 자동으로 수집하고 싶다.

수락기준:
- [ ] Messenger Webhook 구성 (verify token)
- [ ] 메시지 수신 및 DB 저장
- [ ] 고객 정보 자동 추출 (이름, 번호 있으면)
- [ ] 메시지 파싱 (이모지, URL 처리)
- [ ] 웹훅 전달 실패 시 재시도 (3회)
- [ ] 수신 메시지 로깅

Task:
- [ ] Backend: POST /api/webhooks/messenger, message model
- [ ] Integration: Facebook Graph API 문서 검토
- [ ] Tests: 웹훅 서명 검증, 메시지 파싱
```

### 2.2 Story: Kakao Talk API 통합
**점수: 10pt | 예상시간: 2.5일**

```
상담담당자로서 나는
카카오톡 채널에서 받은 고객 문의를
시스템에 자동으로 수집하고 싶다.

수락기준:
- [ ] Kakao Talk API 연동 (카카오 비즈니스 채널)
- [ ] 메시지 수신 (폴링 또는 웹훅)
- [ ] 고객 정보 추출 및 저장
- [ ] 메시지 인코딩 처리 (한글)
- [ ] 수신 로그 기록

Task:
- [ ] Backend: Kakao API 클라이언트, 웹훅 처리
- [ ] Database: Channel model (messenger, kakao, email 등)
```

### 2.3 Story: 통합 상담함 (Inbox)
**점수: 15pt | 예상시간: 3.5일**

```
상담담당자로서 나는
모든 채널(메신저, 카톡, 이메일)의 고객 문의를
하나의 대시보드에서 관리하고 싶다.

수락기준:
- [ ] 채널별 필터 (메신저, 카톡, 이메일)
- [ ] 상태별 필터 (미처리, 처리중, 완료)
- [ ] 메시지 검색 (고객명, 내용)
- [ ] 메시지 정렬 (최신순, 우선순위)
- [ ] 각 메시지에 예약 생성/연결 옵션
- [ ] 실시간 새 메시지 알림 (WebSocket)

Task:
- [ ] Backend: GET /api/chats (필터/정렬/검색)
- [ ] Frontend: 상담함 UI, 채널 필터, 검색
- [ ] WebSocket: 새 메시지 푸시
```

### 2.4 Story: AI 자동상담 (LangGraph)
**점수: 25pt | 예상시간: 4일**

```
고객으로서 나는
새벽에 채널에 문의해도
AI가 즉시 답변해주고 예약을 제시해주고 싶다.

수락기준:
- [ ] Claude 모델로 상담 응답 생성 (한국어)
- [ ] 메시지에서 서비스/시간 자동 추출
- [ ] 가능한 시간대 조회 및 제시
- [ ] 고객 확인 후 예약 자동 생성
- [ ] AI 예약은 "pending" 상태 (담당자 확인 필요)
- [ ] 에러 시 휴먼 에스컬레이션 ("담당자가 곧 응답드립니다")
- [ ] 상담 로그 저장 (개선 학습용)

Task:
- [ ] LangGraph: ConsultationAgent 구성 (상담 → 예약)
- [ ] Backend: /api/agents/consultation 엔드포인트
- [ ] Prompt: 한국어 상담 프롬프트, few-shot examples
- [ ] Tests: 다양한 고객 시나리오 테스트
```

---

## EPIC 3: 예약 & 스케줄 관리
**점수: 85pt | 우선순위: 🔴 MUST**

### 3.1 Story: 예약 생성 (자동 & 수동)
**점수: 12pt | 예상시간: 3일**

```
상담담당자/AI로서 나는
고객 정보로 예약을 생성하고
중복/충돌을 자동으로 방지하고 싶다.

수락기준:
- [ ] 고객명, 서비스, 시간, 테라피스트, 룸 입력받음
- [ ] 동일 시간대 중복 예약 방지 (룸 & 테라피스트)
- [ ] 예약 생성 시 테라피스트/룸 자동 배정 (가능하면)
- [ ] 예약 상태 (pending → confirmed → completed)
- [ ] 예약 생성 시 고객에게 채널로 확인 메시지 발송
- [ ] 예약 생성 로그 (누가 언제 생성했는지)

Task:
- [ ] Backend: POST /api/bookings (검증, 중복체크)
- [ ] Database: booking model, unique constraints
- [ ] Frontend: 예약 생성 폼, 에러 메시지
- [ ] Tests: 중복 예약 방지, 충돌 감지
```

### 3.2 Story: 예약 확정 (고객 동의)
**점수: 8pt | 예상시간: 2일**

```
고객으로서 나는
채널에서 바로 예약을 확정하거나 거절할 수 있고 싶다.

수락기준:
- [ ] 예약 대기 중 고객에게 확인 메시지 발송
- [ ] 고객이 [예] [아니오] 버튼으로 응답
- [ ] [예] 선택 시 status = confirmed
- [ ] [아니오] 선택 시 예약 취소 + 대안 제시
- [ ] 타임아웃 (24시간): 자동 취소

Task:
- [ ] Backend: 고객 피드백 처리 (상담함 → 예약)
- [ ] Frontend: 채널 메시지에서 버튼 렌더링
- [ ] Notification: 예약 확정/취소 알림
```

### 3.3 Story: 실시간 스케줄 뷰 (통합 캘린더)
**점수: 20pt | 예상시간: 4.5일**

```
매니저로서 나는
일/주/월 뷰로 모든 룸과 테라피스트의 
예약 상황을 한눈에 보고 싶다.

수락기준:
- [ ] 룸별 캘린더 (이름, 시간대, 예약자, 서비스)
- [ ] 테라피스트별 캘린더 (시간대, 상태)
- [ ] 일/주/월 뷰 전환
- [ ] 날짜 선택 (오늘, 내일, 특정 날짜)
- [ ] 다음/이전 버튼 네비게이션
- [ ] 모바일 반응형 (하나의 룸만 보기)
- [ ] 실시간 업데이트 (예약 생성/수정 시 자동 갱신)

Task:
- [ ] Backend: GET /api/schedule (필터: date, room, staff)
- [ ] Frontend: react-big-calendar 또는 custom
- [ ] WebSocket: schedule:updated 이벤트
- [ ] Tests: 다양한 뷰 + 응답성 테스트
```

### 3.4 Story: 예약 수정/취소 (드래그앤드롭)
**점수: 15pt | 예상시간: 3.5일**

```
매니저로서 나는
예약을 다른 시간/테라피스트로 드래그하여
쉽게 재스케줄링하고 싶다.

수락기준:
- [ ] 드래그앤드롭 인터페이스
- [ ] 새 시간대 가용성 실시간 검증
- [ ] 테라피스트 가용성 검증
- [ ] 룸 가용성 검증
- [ ] 충돌 시 에러 메시지 + 취소
- [ ] 성공 시 고객에게 변경 알림 (원채널)
- [ ] 변경 이력 로깅

Task:
- [ ] Frontend: 드래그 라이브러리 (react-dnd 또는 react-beautiful-dnd)
- [ ] Backend: PUT /api/bookings/:id (검증)
- [ ] Notification: 고객 알림
```

### 3.5 Story: 예약 취소
**점수: 10pt | 예상시간: 2.5일**

```
사용자로서 나는
예약을 취소할 수 있고
취소 사유를 기록하고 싶다.

수락기준:
- [ ] 예약 취소 (이유 선택: 고객 요청, 스태프 부재 등)
- [ ] 스케줄에서 제거
- [ ] 고객에게 취소 알림 (원채널)
- [ ] 취소 시간 (당일: 환불 가능 또는 정책)
- [ ] 취소 로그 기록

Task:
- [ ] Backend: DELETE /api/bookings/:id
- [ ] Frontend: 예약 상세 → 취소 버튼
- [ ] Notification: 취소 알림
```

### 3.6 Story: 테라피스트 가용성 관리
**점수: 10pt | 예상시간: 2.5일**

```
테라피스트로서 나는
내 휴식 시간, OFF, 공식휴가를
미리 등록하고 싶다.

수락기준:
- [ ] 휴식 등록 (예: 12:00~13:00)
- [ ] OFF 신청 (예: 내일 전체)
- [ ] 공식휴가 등록 (예: 5/10~5/12)
- [ ] 매니저가 승인/거절
- [ ] 스케줄에 반영 (가용성 제외)
- [ ] 이미 예약된 시간과 충돌하면 경고

Task:
- [ ] Backend: Availability/Unavailability model
- [ ] Frontend: 테라피스트용 가용성 폼
- [ ] Business Logic: 스케줄 조회 시 가용성 반영
```

---

## EPIC 4: 결제 & 정산
**점수: 70pt | 우선순위: 🔴 MUST**

### 4.1 Story: 거래 기록 & 수금 관리
**점수: 12pt | 예상시간: 3일**

```
상담담당자로서 나는
서비스 완료 후 고객이 지급한 금액을 기록하고
수금 현황을 추적하고 싶다.

수락기준:
- [ ] 거래 기록 (예약 ID, 금액, 결제방법, 시간)
- [ ] 결제방법 선택 (현금, 카드, 계좌이체)
- [ ] 미수금 추적 (결제 예정 vs 실제 결제)
- [ ] 일일 수금 현황 조회
- [ ] 거래 수정 (오입력 수정)
- [ ] 거래 로그 (감사)

Task:
- [ ] Backend: POST /api/finance/transactions
- [ ] Frontend: 거래 기록 폼
- [ ] Database: transaction model
```

### 4.2 Story: 자동 정산 (매일 새벽)
**점수: 20pt | 예상시간: 4.5일**

```
오너로서 나는
매일 새벽 1시에 자동으로 정산이 되고
구글시트에 기록되길 원한다.

수락기준:
- [ ] 배치 잡 (매일 새벽 1:00 KST)
- [ ] 전일(어제) 거래 합계 계산
- [ ] 비용 차감 (인건비, 재료비 등)
- [ ] 순이익 계산
- [ ] 구글시트 API로 결과 업로드
- [ ] 정산 결과 이메일 발송
- [ ] 정산 로그 저장 (검증용)
- [ ] 수동 재정산 기능 (관리자용)

Task:
- [ ] Backend: Bull job queue, settlement service
- [ ] Integration: Google Sheets API
- [ ] Tests: 정산 계산 검증
- [ ] Notification: 정산 완료 이메일
```

### 4.3 Story: 정산 현황 대시보드 (Owner)
**점수: 15pt | 예상시간: 3.5일**

```
오너로서 나는
일일/주간/월간 매출, 비용, 순이익을
그래프와 테이블로 보고 싶다.

수락기준:
- [ ] 일자별 요약 (매출, 비용, 순이익)
- [ ] 주간 트렌드 (라인 차트)
- [ ] 월간 트렌드 (막대 차트)
- [ ] 테라피스트별 매출 TOP 5
- [ ] 서비스별 매출 분포
- [ ] 미수금 현황 (alert 표시)
- [ ] 거래 상세 테이블 (필터, 정렬, 검색)
- [ ] 엑셀 다운로드

Task:
- [ ] Backend: GET /api/finance/reports (필터: date range, group by)
- [ ] Frontend: 대시보드 페이지 (Recharts)
- [ ] Tests: 다양한 날짜 범위, 필터 조합 테스트
```

### 4.4 Story: 비용 관리 (정기 지불)
**점수: 12pt | 예상시간: 3일**

```
오너로서 나는
정기적인 비용(급여, 임차료 등)을 등록하고
지급 예정일에 알람을 받고 싶다.

수락기준:
- [ ] 정기 비용 등록 (항목, 금액, 주기)
- [ ] 비용 카테고리 (인건비, 재료비, 임차료, 기타)
- [ ] 지급 예정일 알람 (매월 1일, 15일 등)
- [ ] 지급 상태 추적 (대기, 완료)
- [ ] 월간 비용 합계
- [ ] 비용 편집/삭제

Task:
- [ ] Backend: RecurringExpense model, 알람 로직
- [ ] Frontend: 비용 관리 페이지
- [ ] Notification: 이메일/push 알람
```

### 4.5 Story: 결제 게이트웨이 통합 [v1.5+]
**점수: 11pt | 우선순위: 🟡 SHOULD**

```
고객으로서 나는
앱에서 직접 신용카드로 결제하고 싶다.

수락기준:
- [ ] Stripe 또는 Toss 통합
- [ ] 결제 폼 (카드 정보, 양식)
- [ ] 결제 결과 처리 (성공/실패)
- [ ] 영수증 발급
- [ ] 환불 처리

Task:
- [ ] Backend: Stripe/Toss API 클라이언트
- [ ] Frontend: 결제 모달
```

---

## EPIC 5: 직원 관리
**점수: 40pt | 우선순위: 🔴 MUST**

### 5.1 Story: 직원 프로필 관리
**점수: 10pt | 예상시간: 2.5일**

```
오너/매니저로서 나는
직원의 신상(이름, 연락처, 급여, 스킬)을
체계적으로 관리하고 싶다.

수락기준:
- [ ] 직원 생성 (기본정보 입력)
- [ ] 직원 프로필 조회 (모든 정보 표시)
- [ ] 직원 정보 수정
- [ ] 직원 스킬 등록 (스웨디시, 핫스톤, 타이 등)
- [ ] 급여 등록 (월급, 시급 등)
- [ ] 직원 삭제 (비활성화)
- [ ] 직원 목록 (검색, 정렬, 필터)

Task:
- [ ] Backend: Staff CRUD, skill enum
- [ ] Frontend: 직원 목록, 상세, 폼
- [ ] Database: staff, skill relationship
```

### 5.2 Story: 직원 기록 (경고, 상벌, 교육)
**점수: 12pt | 예상시간: 3일**

```
오너로서 나는
직원의 경고, 상벌, 교육 이력을
기록하고 조회하고 싶다.

수락기준:
- [ ] 기록 타입 선택 (경고, 상벌, 교육)
- [ ] 사유 텍스트 입력
- [ ] 증거/첨부파일 업로드 (선택)
- [ ] 기록 날짜 지정
- [ ] 기록 목록 조회 (시간순, 타입별 필터)
- [ ] 기록 편집/삭제 (감사로그)
- [ ] 직원 프로필에서 기록 요약 표시

Task:
- [ ] Backend: DisciplineRecord model
- [ ] Frontend: 기록 추가 폼, 목록 조회
- [ ] File storage: 첨부파일 S3 저장
```

### 5.3 Story: 직원 성과 추적
**점수: 10pt | 예상시간: 2.5일**

```
오너/매니저로서 나는
직원의 매출, 고객만족도, 결근율을
월별로 추적하고 싶다.

수락기준:
- [ ] 월별 매출 집계 (테라피스트별)
- [ ] 고객 리뷰/만족도 평균
- [ ] 결근율 & 정시도
- [ ] 개인별 KPI 대시보드
- [ ] 성과 비교 (전사 평균 vs 개인)

Task:
- [ ] Backend: Performance aggregation query
- [ ] Frontend: 성과 대시보드
- [ ] Tests: 매출 계산 검증
```

### 5.4 Story: 직원 스케줄 관리 (가용성)
**점수: 8pt | 예상시간: 2일**

```
테라피스트로서 나는
내 근무 일정(정규근무, OFF, 공식휴가)을
미리 등록하고 싶다.

수락기준:
- [ ] 일주일 근무시간 설정 (월~일)
- [ ] 특정 날짜 OFF 신청
- [ ] 공식휴가 등록
- [ ] 매니저 승인 워크플로우
- [ ] 캘린더 뷰에 반영

Task:
- [ ] Backend: Schedule, Availability model
- [ ] Frontend: 테라피스트용 스케줄 폼
```

---

## EPIC 6: 픽드랍 & 드라이버 연동
**점수: 45pt | 우선순위: 🔴 MUST (w/ Phase 4)**

### 6.1 Story: 픽드랍 요청 자동 생성
**점수: 10pt | 예상시간: 2.5일**

```
고객으로서 나는
예약 확정 후 픽드랍이 필요하면
채널에서 "픽드랍 필요" 한마디로
자동으로 배정받고 싶다.

수락기준:
- [ ] 고객 채널 메시지에서 픽드랍 요청 감지
- [ ] 시스템이 자동으로 픽업 위치 파악
- [ ] 도착지 (ElSpa) 자동 설정
- [ ] Pickup record 생성
- [ ] 적절한 드라이버 자동 배정 시작

Task:
- [ ] Backend: Pickup model, 자동 배정 로직
- [ ] NLP: 메시지에서 "픽드랍" 감지 (키워드 또는 AI)
```

### 6.2 Story: 드라이버 위치 추적 & 최적 배정
**점수: 15pt | 예상시간: 3.5일**

```
시스템으로서 나는
현재 드라이버들의 위치를 파악하고
거리/예상시간이 최단인 드라이버를 자동으로 배정하고 싶다.

수락기준:
- [ ] 드라이버 GPS 위치 실시간 수집 (앱)
- [ ] Google Maps Distance Matrix API로 거리 계산
- [ ] 알고리즘: 거리 + 가용성 (현재 배정 건수) 기반 선택
- [ ] 최고 우선순위 드라이버에 먼저 요청
- [ ] 타임아웃 (30초): 미응답 시 다음 드라이버에 요청
- [ ] 배정 성공 시 기타 드라이버에 취소
- [ ] 배정 이력 로깅

Task:
- [ ] Backend: Driver location update endpoint, assignment algorithm
- [ ] Driver App: GPS 전송 (백그라운드)
- [ ] Tests: 배정 알고리즘 다양한 시나리오
```

### 6.3 Story: 드라이버 앱 (수신 & 네비게이션)
**점수: 15pt | 예상시간: 3.5일**

```
드라이버로서 나는
픽드랍 요청을 받으면
고객 정보와 경로를 바로 확인하고
네비게이션을 시작하고 싶다.

수락기준:
- [ ] 새 픽드랍 요청 알림 (푸시)
- [ ] 빠른 수락/거절 버튼
- [ ] 고객명, 픽업 주소, 전화번호 표시
- [ ] 예상 소요시간
- [ ] 구글맵 네비게이션 자동 시작
- [ ] 실시간 GPS 업로드 (1분 간격)
- [ ] 도착 시 "도착 확인" 버튼
- [ ] 픽업 완료 기록

Task:
- [ ] Driver App: 픽드랍 화면, 네비게이션 통합
- [ ] Backend: Real-time location update, status change
- [ ] Push notification: Firebase Cloud Messaging
```

### 6.4 Story: 고객 픽드랍 추적 뷰
**점수: 5pt | 예상시간: 1.5일**

```
고객으로서 나는
픽드랍 요청 후 드라이버가 어디쯤 왔는지
실시간으로 추적하고 싶다.

수락기준:
- [ ] 구글맵 위에 드라이버 위치 표시
- [ ] 예상 도착 시간 표시
- [ ] 드라이버 연락처 빠른 통화
- [ ] "드라이버가 도착했습니다" 알림

Task:
- [ ] Frontend: 추적 지도, 실시간 위치 업데이트
- [ ] WebSocket: driver location push
```

---

## EPIC 7: 알림 & 통지 시스템
**점수: 25pt | 우선순위: 🟡 SHOULD**

### 7.1 Story: 푸시 알림 (앱)
**점수: 8pt | 예상시간: 2일**

```
사용자로서 나는
중요한 알림(새 예약, 정산완료, 픽드랍)을
모바일 푸시로 받고 싶다.

수락기준:
- [ ] FCM (Firebase Cloud Messaging) 통합
- [ ] 알림 타입별 구분 (예약, 정산, 픽드랍 등)
- [ ] 알림 타입별 권한 설정 (수신 동의)
- [ ] 알림 클릭 시 해당 화면으로 딥링크
- [ ] 배치 알림 (하루에 1회 요약)

Task:
- [ ] Backend: FCM 토큰 관리, 알림 발송
- [ ] Frontend/App: FCM 토큰 수집, 리스너
```

### 7.2 Story: 이메일 알림
**점수: 8pt | 예상시간: 2일**

```
오너로서 나는
정산 완료, 미수금 발생, 스태프 OFF 신청 등을
이메일로 받고 싶다.

수락기준:
- [ ] SendGrid 통합
- [ ] 이메일 템플릿 (정산, 미수금, OFF 신청 등)
- [ ] 수신자 설정 (Owner, Manager)
- [ ] 이메일 발송 로그

Task:
- [ ] Backend: Email service, 템플릿
- [ ] Tests: 이메일 발송 검증
```

### 7.3 Story: SMS 알림 [v1.5+]
**점수: 9pt | 우선순위: 🟡 SHOULD**

```
고객으로서 나는
예약 확정, 취소, 30분 전 알림 등을
SMS로 받고 싶다.

수락기준:
- [ ] Twilio 통합
- [ ] SMS 템플릿
- [ ] 예약 30분 전 자동 발송
- [ ] 고객 폰번호 검증

Task:
- [ ] Backend: SMS service, scheduled jobs
```

---

## EPIC 8: 보안 & 감시
**점수: 20pt | 우선순위: 🟡 SHOULD**

### 8.1 Story: 감사 로그 (Audit Logging)
**점수: 10pt | 예상시간: 2.5일**

```
관리자로서 나는
모든 주요 작업(예약 수정, 급여 변경, 정산)을
타임스탬프와 함께 기록되길 원한다.

수락기준:
- [ ] AuditLog 테이블 (action, user, resource, timestamp)
- [ ] 감시 대상: 예약 변경, 거래 수정, 직원 정보 변경, 정산
- [ ] 로그 조회 (필터, 검색, 정렬)
- [ ] 로그 내보내기 (CSV)

Task:
- [ ] Backend: AuditLog model, middleware
- [ ] Database: audit log table, indexes
```

### 8.2 Story: 데이터 암호화
**점수: 10pt | 예상시간: 2.5일**

```
보안 담당으로서 나는
고객 핸드폰 번호, 직원 주민등록번호 등
민감한 정보를 암호화하여 저장하고 싶다.

수락기준:
- [ ] AES-256 암호화 구현
- [ ] 암호화 대상: phone, ssn, bank account 등
- [ ] 복호화는 필요한 곳에서만 (예: SMS 발송 시)
- [ ] 암호화 키 관리 (환경변수)

Task:
- [ ] Backend: encryption utility, 기존 데이터 마이그레이션
- [ ] Tests: 암호화/복호화 검증
```

---

## EPIC 9: 테스트 & QA
**점수: 30pt | 우선순위: 🟡 SHOULD**

### 9.1 Story: 단위 테스트 (Unit Tests)
**점수: 10pt | 예상시간: 2.5일**

```
개발자로서 나는
핵심 비즈니스 로직(예약 검증, 정산 계산)의
정확성을 보장하고 싶다.

수락기준:
- [ ] Jest 설정
- [ ] 테스트 커버리지 70% 이상 (핵심 로직)
- [ ] 주요 scenarios 커버

Task:
- [ ] Tests: auth, booking, finance 로직
```

### 9.2 Story: 통합 테스트 (Integration Tests)
**점수: 10pt | 예상시간: 2.5일**

```
개발자로서 나는
전체 플로우(상담 → 예약 → 정산)가
올바르게 작동하는지 검증하고 싶다.

수락기준:
- [ ] 주요 사용자 시나리오 (Happy Path + Error Cases)
- [ ] 데이터베이스 트랜잭션 검증

Task:
- [ ] Integration tests: consultation → booking → settlement
```

### 9.3 Story: E2E 테스트 (End-to-End Tests)
**점수: 10pt | 예상시간: 2.5일**

```
QA로서 나는
실제 사용자처럼 전체 시스템을
자동으로 테스트하고 싶다.

수락기준:
- [ ] Cypress 설정
- [ ] 주요 사용자 흐름 자동화
- [ ] CI/CD 파이프라인에 통합

Task:
- [ ] E2E tests: login → consultation → booking → settlement
```

---

## EPIC 10: 배포 & DevOps
**점수: 20pt | 우선순위: 🟡 SHOULD**

### 10.1 Story: Docker & 로컬 개발환경
**점수: 8pt | 예상시간: 2일**

```
개발자로서 나는
Docker Compose로 로컬에서
PostgreSQL, Redis, Node.js 서버를
한 번에 실행하고 싶다.

수락기준:
- [ ] docker-compose.yml 작성
- [ ] PostgreSQL 서비스
- [ ] Redis 서비스
- [ ] Node.js dev 서버
- [ ] 초기 데이터 시딩

Task:
- [ ] docker-compose.yml, .dockerignore
- [ ] README with setup instructions
```

### 10.2 Story: CI/CD 파이프라인 (GitHub Actions)
**점수: 12pt | 예상시간: 3일**

```
DevOps로서 나는
PR 제출 시 자동으로 린팅, 테스트, 빌드를 검증하고
메인 브랜치 머지 시 자동으로 배포하고 싶다.

수락기준:
- [ ] GitHub Actions workflow
- [ ] Lint 검사 (ESLint)
- [ ] 단위 테스트 실행
- [ ] 빌드 성공 검증
- [ ] Docker 이미지 푸시 (ECR/Docker Hub)
- [ ] Staging 자동 배포
- [ ] Production 수동 배포 (승인 필요)

Task:
- [ ] .github/workflows/ci-cd.yml
- [ ] Docker build & push
- [ ] Deployment scripts
```

---

## EPIC 11: 모니터링 & 성능
**점수: 20pt | 우선순위: 🟢 COULD**

### 11.1 Story: 로깅 & 에러 추적
**점수: 10pt | 예상시간: 2.5일**

```
개발자로서 나는
프로덕션 에러를 실시간으로 감지하고
원인을 빠르게 파악하고 싶다.

수락기준:
- [ ] Winston 로깅
- [ ] Sentry 통합
- [ ] 에러 모니터링 대시보드

Task:
- [ ] Winston configuration
- [ ] Sentry setup
```

### 11.2 Story: 성능 모니터링
**점수: 10pt | 예상시간: 2.5일**

```
DevOps로서 나는
API 응답시간, DB 쿼리 성능, 메모리 사용량을
모니터링하고 싶다.

수락기준:
- [ ] Prometheus 메트릭 수집
- [ ] Grafana 대시보드
- [ ] 응답시간 히스토그램
- [ ] DB 느린 쿼리 로그

Task:
- [ ] Prometheus integration
- [ ] Grafana dashboards
```

---

## Week-by-Week Breakdown (4주)

### Week 1: 기초 구축 (Auth + Channel Integration)
**70pt**

```
Monday-Tuesday (16pt):
- 1.1: 사용자 등록/로그인 (8pt)
- 1.2: RBAC (12pt)

Wednesday-Thursday (20pt):
- 2.1: Messenger API 통합 (10pt)
- 2.2: Kakao API 통합 (10pt)

Friday (14pt):
- 2.3: 통합 상담함 (15pt) ← 수요일부터 시작
- 8.1: Audit Logging (10pt) ← 병렬 진행
```

### Week 2: 예약 & AI 상담
**70pt**

```
Monday-Tuesday (12pt):
- 3.1: 예약 생성 (12pt)

Wednesday-Thursday (25pt):
- 2.4: AI 자동상담 (25pt)

Friday (18pt):
- 3.2: 예약 확정 (8pt)
- 3.3: 스케줄 뷰 시작 (20pt)
```

### Week 3: 스케줄 + 정산 + 직원관리
**70pt**

```
Monday-Tuesday (15pt):
- 3.3: 스케줄 뷰 완료 (20pt) ← W2에서 시작
- 3.4: 예약 수정/취소 (15pt)

Wednesday-Thursday (20pt):
- 4.1: 거래 기록 (12pt)
- 4.2: 자동 정산 (20pt)

Friday (15pt):
- 5.1: 직원 프로필 (10pt)
- 5.2: 직원 기록 (12pt)
```

### Week 4: 픽드랍 + 정산 완성 + 배포
**70pt**

```
Monday-Tuesday (20pt):
- 4.3: 정산 대시보드 (15pt)
- 6.1: 픽드랍 자동 생성 (10pt)

Wednesday-Thursday (20pt):
- 6.2: 드라이버 위치 추적 (15pt)
- 10.1: Docker & 개발환경 (8pt)

Friday (30pt):
- 6.3: 드라이버 앱 (15pt)
- 10.2: CI/CD 파이프라인 (12pt)
- 통합 테스트, 버그 수정
```

---

## 의존성 정렬 (Dependency Graph)

```
Phase 2 (Complete)
    ↓
Auth (1.1, 1.2) ← 모든 기능의 기초
    ↓
    ├─ Chat Integration (2.1, 2.2)
    │   └─ Unified Inbox (2.3)
    │       └─ AI Consultation (2.4)
    │           └─ Booking Creation (3.1)
    │               └─ Booking Confirmation (3.2)
    │                   └─ Schedule View (3.3)
    │                       ├─ Booking Modify (3.4)
    │                       └─ Transaction Recording (4.1)
    │                           └─ Settlement (4.2)
    │
    ├─ Staff Management (5.1, 5.2)
    │   └─ Staff Schedule (5.4)
    │       └─ Schedule View (3.3)
    │
    └─ Driver Integration (6.1, 6.2, 6.3)
        └─ Pickup Tracking (6.4)
```

---

## 성공 기준

| 지표 | 목표 | 측정 |
|------|------|------|
| **Code Coverage** | 70% | Jest + Codecov |
| **Test Pass Rate** | 100% | CI/CD 파이프라인 |
| **API 응답시간** | P95 < 2s | Prometheus |
| **가동률** | 99.5% | Uptime monitoring |
| **버그 발생율** | < 5 critical/month | Sentry |

---

## 다음 단계

1. **개발 시작** (Phase 4) - Week 1 부터
2. **주간 스탠드업**: 월/수/금 10:00
3. **백로그 리파인먼트**: 매주 금요일
4. **데모 & 리뷰**: 매 주말 (사용자 피드백)

