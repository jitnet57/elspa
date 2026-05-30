# ElSpa Manager - User Stories & Implementation Tasks
## BMAD Phase 3: Solutioning (SM) & Phase 4: Implementation Plan

**문서 작성일:** 2026-05-30  
**담당자:** Scrum Master (Bob) / Architect (Winston)  
**상태:** ✅ 완료

---

## 1. Epics (대규모 작업 단위)

### Epic 1: Authentication & Authorization
**범위:** 사용자 인증, 권한 관리  
**예상 기간:** 5일 (2026-06-06 ~ 06-10)

- US-1.1: 사용자 로그인 기능
- US-1.2: JWT 토큰 발급 및 검증
- US-1.3: 역할별 권한 관리 (Admin, Therapist, Customer)

---

### Epic 2: Booking System
**범위:** 예약 생성, 수정, 삭제  
**예상 기간:** 8일 (2026-06-07 ~ 06-14)

- US-2.1: 고객 예약 신청
- US-2.2: 테라피스트 예약 조회
- US-2.3: 관리자 예약 관리
- US-2.4: 예약 취소 및 환불

---

### Epic 3: Google Sheets Integration
**범위:** 테라피스트 예약정보 실시간 동기화  
**예상 기간:** 6일 (2026-06-08 ~ 06-13)

- US-3.1: Google Sheets API 연동
- US-3.2: 예약 정보 자동 동기화
- US-3.3: 동기화 오류 처리 및 재시도
- US-3.4: 동기화 로그 및 모니터링

---

### Epic 4: Payroll System
**범위:** 급여 정산 자동화  
**예상 기간:** 10일 (2026-06-10 ~ 06-19)

- US-4.1: 월별 급여 자동 계산
- US-4.2: 초과근무 수당 적용
- US-4.3: 13개월 보너스 관리
- US-4.4: 급여 정산 승인 워크플로우
- US-4.5: 정산 내역 CSV 내보내기

---

### Epic 5: Real-time Monitoring
**범위:** 실시간 대시보드 및 모니터링  
**예상 기간:** 7일 (2026-06-10 ~ 06-16)

- US-5.1: WebSocket 연결 구축
- US-5.2: 침대 상태 실시간 업데이트
- US-5.3: 예약 진행률 표시
- US-5.4: 테라피스트 체크인/체크아웃

---

## 2. User Stories 상세

### US-1.1: 사용자 로그인 기능

**제목:** 사용자가 이메일과 비밀번호로 로그인할 수 있다

**설명:**
```
As a User (Admin/Therapist/Customer)
I want to log in using email and password
So that I can access the system securely
```

**수락 조건:**
- [ ] 이메일과 비밀번호 입력 폼 구현
- [ ] 잘못된 자격증명 시 에러 메시지 표시
- [ ] 로그인 성공 시 JWT 토큰 발급
- [ ] 토큰은 localStorage에 저장됨
- [ ] 토큰 만료 시간: 24시간
- [ ] 자동 로그아웃 (24시간 후)

**기술:**
- Frontend: Next.js Form + Zustand authStore
- Backend: FastAPI /api/auth/login + JWT

**예상 소요시간:** 3일  
**우선순위:** 높음 (P0)  
**담당자:** Dev (Amelia) - Frontend & Backend

---

### US-2.1: 고객 예약 신청

**제목:** 고객이 테라피스트와 서비스를 선택하여 예약을 신청할 수 있다

**설명:**
```
As a Customer
I want to select a therapist, service, and time
So that I can book a massage appointment
```

**수락 조건:**
- [ ] 테라피스트 목록 조회 (이름, 평점, 전문분야)
- [ ] 서비스 선택 (종류, 시간, 가격)
- [ ] 날짜/시간 선택 (캘린더)
- [ ] 예약 신청 버튼 클릭
- [ ] 예약 생성 성공 메시지
- [ ] 예약 확인 이메일 발송

**API 엔드포인트:**
```
POST /api/bookings
Body: {
  therapist_id: number,
  service_id: number,
  start_time: datetime,
  end_time: datetime,
  notes?: string
}
Response: {
  id: number,
  status: "pending",
  created_at: datetime
}
```

**UI:**
- 3단계 폼 (Therapist → Service → DateTime)
- 유효성 검사 (시간 중복, 최소/최대 시간)

**예상 소요시간:** 4일  
**우선순위:** 높음 (P0)  
**담당자:** Frontend Dev + Backend Dev

---

### US-3.2: 예약 정보 자동 동기화

**제목:** 예약이 생성/수정되면 자동으로 Google Sheet에 동기화된다

**설명:**
```
As a Therapist
I want my booking information automatically synced to Google Sheets
So that I can see my appointments in a familiar format
```

**수락 조건:**
- [ ] 예약 생성 시 Google Sheet에 행 추가 (< 10초)
- [ ] 예약 수정 시 해당 행 업데이트
- [ ] 예약 취소 시 해당 행 삭제
- [ ] 동기화 실패 시 재시도 (최대 3회)
- [ ] 동기화 상태 로그 기록

**Sheet 형식:**
```
컬럼: A (테라피스트) | B (고객) | C (서비스) | D (시간) | E (날짜) | F (상태)
```

**기술:**
- Google Sheets API v4
- Background Task (APScheduler)
- Error Handling + Retry Logic

**예상 소요시간:** 3일  
**우선순위:** 높음 (P0)  
**담당자:** Backend Dev (Google Sheets Service)

---

### US-4.1: 월별 급여 자동 계산

**제목:** 관리자가 월별 급여를 자동으로 계산할 수 있다

**설명:**
```
As an Admin
I want to automatically calculate monthly salaries
So that I can save time and reduce errors
```

**수락 조건:**
- [ ] 월별 급여 계산 API 구현
- [ ] 근무시간 조회 (Bookings 기반)
- [ ] 기본급 계산 (시간급 × 근무시간)
- [ ] 초과근무 수당 (160시간 초과 시 1.5배)
- [ ] 주휴수당 계산
- [ ] 세금/보험 공제
- [ ] 13개월 보너스 (연 1회, 중복 방지)
- [ ] 결과 저장 (Payroll 테이블)

**API:**
```
POST /api/payroll/generate
Body: { month: "2026-05" }
Response: {
  payrolls: [
    {
      therapist_id: 1,
      period: "2026-05",
      gross_salary: 1500000,
      deductions: 200000,
      net_salary: 1300000
    },
    ...
  ]
}
```

**계산 공식:**
```
기본급 = 시간급(9,375) × 근무시간
초과급 = (근무시간 - 160) × 시간급 × 1.5 (if > 160)
주휴수당 = 8시간 × 시간급 × 휴일일수
총급여 = 기본급 + 초과급 + 주휴수당
공제 = 4대보험(150,000) + 소득세(총급여 × 10%)
순급여 = 총급여 - 공제
```

**예상 소요시간:** 5일  
**우선순위:** 높음 (P0)  
**담당자:** Backend Dev (Payroll Service)

---

### US-5.1: WebSocket 연결 구축

**제목:** 클라이언트가 WebSocket을 통해 실시간 업데이트를 수신한다

**설명:**
```
As a Monitor/Admin
I want to receive real-time updates via WebSocket
So that I can see live changes without refreshing
```

**수락 조건:**
- [ ] WebSocket 엔드포인트: /ws/monitor
- [ ] 연결 성공 메시지 전송
- [ ] 자동 재연결 (최대 5회, exponential backoff)
- [ ] Heartbeat/Ping-Pong (30초)
- [ ] 메시지 타입: bed_status_changed, booking_added, therapist_checkin, therapist_checkout
- [ ] 클라이언트 메모리 누수 방지 (cleanup)

**메시지 형식:**
```json
{
  "type": "bed_status_changed",
  "data": {
    "bedId": 1,
    "status": "occupied",
    "therapist": "김철수",
    "customer": "고객 A"
  },
  "timestamp": "2026-05-30T10:30:00Z"
}
```

**예상 소요시간:** 3일  
**우선순위:** 중 (P1)  
**담당자:** Backend Dev + Frontend Dev

---

## 3. Implementation 우선순위 (MoSCoW)

### Must Have (P0 - 필수)
1. US-1.1: 사용자 로그인 ✅
2. US-2.1: 고객 예약 신청 ✅
3. US-3.2: Google Sheets 동기화 ✅
4. US-4.1: 월별 급여 계산 ✅
5. US-5.1: WebSocket 연결 ✅

### Should Have (P1 - 권장)
1. US-2.2: 테라피스트 예약 조회
2. US-4.2: 초과근무 수당
3. US-5.2: 침대 상태 실시간 업데이트

### Could Have (P2 - 선택)
1. US-2.3: 관리자 예약 관리
2. US-3.3: 동기화 오류 처리
3. 고급 분석 기능

### Won't Have (P3 - 제외)
1. 모바일 앱
2. 다국어 지원
3. 결제 게이트웨이

---

## 4. 구현 로드맵

### 주차 1: 2026-06-06 ~ 06-10 (5일)
```
Mon 06: 프로젝트 셋업
  - Vercel Backend 배포
  - Supabase DB 초기화
  - Frontend/Backend 통합 테스트

Tue 07: Authentication (US-1.1)
  - JWT 토큰 발급 로직
  - 로그인 폼 UI
  - 토큰 검증 미들웨어

Wed 08: Booking API (US-2.1) - Part 1
  - /api/bookings POST 구현
  - 유효성 검사
  - 데이터 저장

Thu 09: Booking API (US-2.1) - Part 2
  - /api/bookings GET 구현
  - 고객 예약 폼 UI
  - 통합 테스트

Fri 10: Google Sheets (US-3.2) - Part 1
  - Google Sheets API 설정
  - 동기화 로직 구현
  - 에러 처리
```

### 주차 2: 2026-06-11 ~ 06-15 (5일)
```
Mon 11: Google Sheets (US-3.2) - Part 2
  - 동기화 로그 저장
  - 모니터링 대시보드
  - 테스트

Tue 12: Payroll 계산 (US-4.1) - Part 1
  - 근무시간 조회
  - 급여 공식 구현
  - 단위 테스트

Wed 13: Payroll 계산 (US-4.1) - Part 2
  - 초과근무 수당
  - 세금 공제
  - 관리자 UI

Thu 14: WebSocket (US-5.1) - Part 1
  - FastAPI WebSocket 구현
  - 클라이언트 훅 (useRealtimeSync)
  - 연결 테스트

Fri 15: WebSocket (US-5.1) - Part 2
  - 메시지 처리
  - 자동 재연결
  - Monitor Dashboard UI
```

### 주차 3: 2026-06-16 ~ 06-20 (5일)
```
Mon 16: 통합 테스트
  - End-to-End 테스트
  - 성능 테스트
  - 버그 수정

Tue 17: 배포 준비
  - CI/CD 파이프라인
  - 환경 변수 설정
  - 보안 검토

Wed 18: QA 테스트
  - 기능 테스트
  - 사용성 테스트
  - 문서화

Thu 19: 배포 (Staging)
  - Staging 환경 배포
  - 최종 검증
  - 버그 수정

Fri 20: 배포 (Production)
  - 프로덕션 배포
  - 모니터링
  - 지원
```

---

## 5. 개발 환경 & 명령어

### Frontend 개발
```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
npm run build      # 프로덕션 빌드
npm run lint       # 코드 검사
```

### Backend 개발
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

pip install -r requirements.txt
python main.py            # http://localhost:8000
pytest tests/             # 테스트 실행
```

### 배포
```bash
# Frontend → Cloudflare Pages
git push origin main
# Cloudflare 대시보드에서 자동 배포

# Backend → Vercel
vercel deploy --prod
```

---

## 6. 테스트 전략

### Unit Tests (개발 중)
```python
# tests/test_payroll_service.py
def test_calculate_salary():
    therapist = Therapist(hourly_rate=9375)
    result = PayrollService.calculate_salary(therapist, "2026-05")
    
    assert result['gross_salary'] == 1500000  # 160시간 × 9375
    assert result['deductions'] == 200000
    assert result['net_salary'] == 1300000

# tests/test_booking_api.py
def test_create_booking():
    payload = {
        "therapist_id": 1,
        "service_id": 1,
        "start_time": "2026-06-01T10:00:00",
        "end_time": "2026-06-01T11:00:00"
    }
    response = client.post("/api/bookings", json=payload)
    assert response.status_code == 201
    assert response.json()["status"] == "pending"
```

### Integration Tests (배포 전)
```bash
# Postman / Insomnia 컬렉션
- Login → Get Token
- Create Booking → Verify Google Sheets Sync
- Generate Payroll → Download CSV
- WebSocket Connection → Receive Updates
```

### E2E Tests (배포 후)
```bash
# Cypress / Playwright
- Customer: 예약 신청 → 확인 → 취소
- Therapist: 예약 조회 → Google Sheets 동기화 확인
- Admin: 급여 계산 → 승인 → 다운로드
- Monitor: 실시간 모니터링 → 업데이트 확인
```

---

## 7. 위험 & 완화 전략

| 위험 | 가능성 | 완화 전략 |
|------|--------|---------|
| Google Sheets API 한도 초과 | 중 | 배치 처리, 캐싱, 재시도 로직 |
| Vercel Function 시간 초과 | 낮음 | 비동기 작업, 큐 (Celery) |
| Supabase 성능 | 낮음 | 인덱스, 쿼리 최적화, 모니터링 |
| 동기화 데이터 불일치 | 중 | 트랜잭션, 동기화 로그, 감사 |
| WebSocket 연결 끊김 | 중 | 자동 재연결, Heartbeat, 로깅 |

---

## 8. 승인 게이트

**이 User Stories & Implementation Plan을 승인하시겠습니까?**
- [ ] 승인 (Phase 4 진행)
- [ ] 수정 요청 (명시)

---

## 문서 정보

**버전:** v1.0  
**작성자:** Scrum Master (Bob)  
**검토자:** (대기 중)  
**승인자:** (대기 중)  
**마지막 수정:** 2026-05-30 00:00 KST
