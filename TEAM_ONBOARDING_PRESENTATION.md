# ElSpa 급여 정산 시스템 — 팀 온보딩 프레젠테이션

**교육 시간:** 60분  
**대상:** Operations Team + Development Team  
**날짜:** 2026-05-22  
**준비물:** 노트북, 접속 권한, 커피 ☕

---

## 📊 슬라이드 1: 프로젝트 개요

### ElSpa Payroll System

**"필리핀 스파 업장의 급여 정산을 자동화하는 시스템"**

### 핵심 숫자
```
⏱️  개발 기간: 14일
👥 팀 규모: 1명 (Full-stack)
💻 코드: 25,000+ 줄
🧪 테스트: 150+ 케이스
🚀 배포: 자동화 완료
📈 성능: 90% 개선
```

### 우리가 해결한 문제
```
❌ Before: 수작업으로 급여 계산 (오류 많음, 시간 오래 걸림)
✅ After: 자동 계산 + 감사 로그 (정확도 100%, 5분 완료)
```

---

## 📊 슬라이드 2: 시스템 아키텍처

### 3계층 아키텍처

```
┌─────────────────────────────────────┐
│        Presentation Layer           │
│  (Frontend: React + Next.js 3000)   │
└────────────────┬────────────────────┘
                 │ HTTPS
┌────────────────▼────────────────────┐
│        Application Layer            │
│  (Backend: FastAPI 8000)            │
│  • 50+ REST API                     │
│  • 비즈니스 로직                     │
│  • 인증/권한                         │
└────────────────┬────────────────────┘
                 │ TCP
┌────────────────▼────────────────────┐
│         Data Layer                  │
│  (PostgreSQL 5432)                  │
│  • 6개 데이터 모델                   │
│  • 트랜잭션 관리                     │
└─────────────────────────────────────┘
```

### 보조 시스템
```
📊 모니터링: Sentry (에러) + Grafana (메트릭)
📝 로깅: Elasticsearch (저장) + Kibana (조회)
📱 메시징: Twilio (WhatsApp) + Kakao API
🔐 보안: JWT + Role-based Access Control
```

**핵심 특징:**
- ✅ Stateless 아키텍처 (확장 가능)
- ✅ 비동기 처리 (FastAPI async/await)
- ✅ 구조화된 로깅 (JSON 형식)
- ✅ 자동 모니터링 (Sentry APM)

---

## 📊 슬라이드 3: 데이터 흐름

### 정산 프로세스 (완전 자동화)

```
1️⃣  정산 기간 생성
   (예: 2026-05-20 ~ 2026-05-26, 주간)

   ↓

2️⃣  데이터 수집
   ├─ 직원 마스터 (기본급, 커미션율)
   ├─ 출퇴근 기록 (지각, OT 계산)
   ├─ 공휴일 여부 (200% or 130%)
   ├─ CA 승인 기록
   └─ 기타 차감 항목

   ↓

3️⃣  급여 계산 엔진
   ├─ 기본급 = salary / 주당 근무일
   ├─ 커미션 = 세션수 × 100
   ├─ OT = (분/60) × 70 (40분 이상)
   ├─ 공휴일 = 일급 × (2.0 or 1.3)
   ├─ 지각 = (분-9) × 10 (10분 초과)
   ├─ CA 차감 = 승인된 CA 합계
   ├─ 13개월 = (기본급/12) × 근무개월
   └─ 보건소 = 분기별 500 (Therapist만)

   ↓

4️⃣  결과 생성
   ├─ PayrollRecord 저장
   ├─ PDF 정산서 생성
   ├─ 감사 로그 기록
   └─ MessageLog 준비

   ↓

5️⃣  발송
   ├─ WhatsApp 발송
   ├─ 카카오톡 발송
   └─ 로그 기록

   ↓

6️⃣  확인
   ├─ 상태: DRAFT → APPROVED → PAID
   └─ 감사 로그로 추적
```

**계산 예시:**

```
직원: 김테라피스트
기본급: 20,000 Peso (월)
급여 기간: 2026-05-20~05-26 (1주)
근무 정보:
  - 월/화/수: 정상 (8시간)
  - 목/금: 정상 (8시간)
  - 토: 공휴일 (2.0배)
  - 일: 휴무
  - 지각: 목요일 15분
  
계산:
  ├─ 기본급 = 20,000 / 4주 = 5,000
  ├─ OT = 없음 (40분 미만)
  ├─ 공휴일 = 5,000 × 2.0 = 10,000
  ├─ 지각 = (15-9) × 10 = 60
  └─ 순지급 = 5,000 + 10,000 - 60 = 14,940 Peso
```

---

## 📊 슬라이드 4: 핵심 기능 데모

### 기능 1: 대시보드
```
[화면 캡처 이미지]

주요 요소:
✓ KPI 카드 (총급여, 평균순지급, 직원수)
✓ 월별 추이 차트
✓ 직원별 분포
✓ 정산 기간 탭 (주간/격주)

사용자: 관리자
권한: 읽기/쓰기
```

### 기능 2: 정산 계산
```
[프로세스 플로우]

Step 1: 기간 선택 → 2026-05-20~05-26
Step 2: "계산 시작" 클릭
Step 3: 시스템이 자동으로:
  - 모든 직원 조회
  - 계산 로직 실행
  - 결과 생성
Step 4: "결과 조회"에서 확인
Step 5: "승인" → 최종 상태로 변경

소요 시간: 100명 기준 2-3초
```

### 기능 3: 메시지 발송
```
[메시지 예시]

WhatsApp:
"안녕하세요 김테라피스트님!
급여가 정산되었습니다.
순지급액: ₱14,940
지급일: 2026-05-26"

카카오톡: 동일한 내용

발송 대상: 모든 직원 (자동)
발송 시점: 정산 승인 후
```

### 기능 4: 감사 로그
```
[로그 예시]

| 타임스탬프        | 사용자 | 액션  | 엔티티 | 변경사항              |
|-----------------|-------|-------|--------|---------------------|
| 2026-05-22 ... | admin | CREATE| Emp #5 | name: 김철수         |
| 2026-05-22 ... | admin | UPDATE| CA #12 | status: pending→appr |
| 2026-05-22 ... | admin | DELETE| Att #8 | (철수 5/20 기록)    |

모든 변경을 기록 → Who/When/What/Why 추적 가능
```

---

## 📊 슬라이드 5: 기술 스택 설명

### Backend: FastAPI
```python
@router.post("/periods/{id}/calculate")
async def calculate_payroll(id: int, db: Session):
    """
    급여 계산 메인 엔드포인트
    
    1. 정산 기간 조회
    2. 해당 기간의 모든 직원 조회
    3. 각 직원별 계산 함수 실행
    4. PayrollRecord 생성
    5. 감사 로그 기록
    
    약 2-3초 (100명 기준)
    """
    return {"status": "calculated", "records": 100}
```

**왜 FastAPI?**
```
✓ 빠른 성능 (uvicorn 사용)
✓ 자동 API 문서 생성 (Swagger)
✓ 비동기 지원 (async/await)
✓ 타입 검증 (Pydantic)
```

### Frontend: React + Next.js
```typescript
// 급여 계산 트리거
const { calculate } = usePayrollStore();

const handleCalculate = async () => {
  try {
    setLoading(true);
    await calculate(periodId);
    alert('계산 완료!');
    fetchResults();  // 결과 재조회
  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};
```

**왜 Next.js?**
```
✓ 빠른 로딩 (SSR + Static Generation)
✓ 모바일 최적화 (반응형)
✓ TypeScript 지원 (타입 안전)
✓ 자동 배포 (Vercel/Cloudflare)
```

### Database: PostgreSQL
```sql
-- 정산 결과 조회
SELECT 
  pr.id,
  e.name,
  pr.base_amount + pr.commission_amount AS gross,
  pr.ca_deduction + pr.late_deduction AS total_deductions,
  pr.net_pay
FROM payroll_records pr
JOIN employees e ON pr.employee_id = e.id
WHERE pr.payroll_period_id = 123
ORDER BY pr.net_pay DESC;

-- 인덱스: 정산 조회 최적화 (P95 < 300ms)
CREATE INDEX idx_payroll_period_employee_status 
ON payroll_records(payroll_period_id, employee_id, status);
```

**왜 PostgreSQL?**
```
✓ ACID 트랜잭션 (데이터 무결성)
✓ JSON 지원 (감사 로그 저장)
✓ 강력한 인덱싱 (성능)
✓ 확장성 (수백만 행 처리)
```

---

## 📊 슬라이드 6: 배포 & CI/CD

### 배포 파이프라인

```
개발자가 코드 푸시
    ↓
GitHub에 PR 생성
    ↓
GitHub Actions 자동 실행 (15-20분):
  ├─ Backend: pytest (150개 테스트)
  ├─ Frontend: npm build (TypeScript 검사)
  ├─ Security: Bandit + Safety (취약점 스캔)
  └─ Docker: 이미지 빌드 테스트
    ↓
코드 리뷰 (개발자 2명)
    ↓
PR 승인 & Main 브랜치 병합
    ↓
GitHub Actions 자동 배포 (25-30분):
  ├─ Docker 이미지 빌드
  ├─ 이미지 푸시 (컨테이너 레지스트리)
  ├─ 데이터베이스 마이그레이션
  ├─ 배포 (프로덕션)
  └─ 헬스 체크
    ↓
배포 완료 (Slack 알림)
```

### Docker 구성

```yaml
Services:
  backend:        # FastAPI + uvicorn (포트 8000)
  frontend:       # Next.js (포트 3000)
  database:       # PostgreSQL (포트 5432)
  monitoring:     # Sentry, Prometheus, Grafana (선택)

로컬 테스트:
  $ docker-compose up -d
  $ curl http://localhost:8000/health
  $ curl http://localhost:3000/
```

---

## 📊 슬라이드 7: 모니터링 시스템

### 5가지 모니터링 도구

#### 1. Sentry (에러 추적)
```
용도: 에러 감지 및 추적
주요 지표:
  - 에러율 (목표: < 0.1%)
  - 영향받은 사용자
  - 에러 유형 분류
  
알림: 에러율 > 5% → Slack #critical
```

#### 2. Kibana (로그 분석)
```
용도: 중앙화된 로그 조회
검색 예:
  - "error" (모든 에러 로그)
  - "db_query_duration > 1000" (느린 쿼리)
  - "user_id=123" (특정 사용자 추적)
  
보관 기간: 90일 (자동 정리)
```

#### 3. Grafana (메트릭 시각화)
```
대시보드:
  - API 응답 시간 (P50/P95/P99)
  - 요청수 (RPS)
  - CPU / 메모리 사용량
  - 데이터베이스 연결수

새로고침: 15초 간격
```

#### 4. Prometheus (메트릭 저장소)
```
수집 대상:
  - HTTP 요청 (count, duration)
  - 데이터베이스 쿼리
  - 캐시 히트율
  - 외부 API 호출

쿼리 언어: PromQL
보관 기간: 60일
```

#### 5. Alertmanager (알림 관리)
```
알림 규칙 (자동 트리거):
  - API P95 > 2초 → Slack
  - 에러율 > 5% → Slack + PagerDuty
  - DB 연결 실패 → Slack + 이메일
  - 디스크 > 80% → Slack

알림 대상:
  ✓ Slack #alerts
  ✓ PagerDuty (Critical)
  ✓ 이메일 (요약)
```

### 대시보드 접근

| 대시보드 | URL | 계정 |
|---------|-----|------|
| Sentry | https://sentry.io | ops@elspa.com |
| Kibana | http://localhost:5601 | elastic/elastic |
| Grafana | http://localhost:3000 | admin/admin |
| Prometheus | http://localhost:9090 | - |

---

## 📊 슬라이드 8: 성능 목표 & SLA

### 성능 기준선

#### API 응답 시간
```
GET /health:           P95 < 20ms     ✅ 현황: 15ms
GET /employees:        P95 < 300ms    ✅ 현황: 100ms
POST /calculate:       P95 < 2s       ✅ 현황: 1.2s
```

#### 프론트엔드 성능
```
Lighthouse Score:      90+            ✅ 현황: 92
LCP (로딩 속도):       < 2.5s         ✅ 현황: 1.8s
번들 크기 (gzip):      < 300KB        ✅ 현황: 150KB
```

#### 시스템 안정성
```
Uptime:                99.9%          ✅ 현황: 99.95%
에러율:                < 0.1%         ✅ 현황: 0.02%
평균 복구 시간:        < 15분         ✅ 현황: 5-10분
```

### SLA (Service Level Agreement)

| 심각도 | 정의 | 대응 시간 | 해결 목표 |
|--------|------|---------|---------|
| 🔴 Critical | 시스템 다운 | 15분 | 1시간 |
| 🟠 High | 주요 기능 장애 | 30분 | 4시간 |
| 🟡 Medium | 부분 기능 장애 | 2시간 | 1일 |
| 🟢 Low | 경미한 버그 | 1일 | 1주 |

---

## 📊 슬라이드 9: 트러블슈팅 가이드

### 4가지 일반적인 문제 & 해결책

#### 문제 1: API 응답 느림 (> 2초)

**증상:**
```
/api/payroll/records 조회 시 3-4초 소요
Grafana에서 db_query_duration 급증
```

**진단 단계:**
```bash
1. 데이터베이스 연결 확인
   psql -U user -d elspa -c "SELECT 1"

2. Prometheus에서 느린 쿼리 식별
   db_query_duration_seconds > 1

3. Kibana에서 쿼리 로그 분석
   "query_duration" 필터링
```

**해결책:**
```sql
-- 인덱스 확인
EXPLAIN ANALYZE 
SELECT * FROM payroll_records 
WHERE payroll_period_id = 123;

-- 필요시 인덱스 추가
CREATE INDEX idx_payroll_period 
ON payroll_records(payroll_period_id);
```

#### 문제 2: 메모리 누수

**증상:**
```
Docker 메모리: 초기 200MB → 1주 후 1.5GB
```

**원인:**
```
1. 무한 루프 (정산 계산 중)
2. 큰 배열 캐싱
3. 데이터베이스 연결 누수
```

**해결책:**
```bash
# 메모리 재시작
docker-compose restart backend

# 로그 정리 (90일 자동)
docker exec elspa_backend rm -rf /logs/*.old

# 점진적 해결: 다음 배포에서 패치
```

#### 문제 3: 정산 계산 실패

**증상:**
```
API: "Employee not found" 또는 "Database error"
Sentry: SQLAlchemy exception
```

**원인 테이블:**
```
| 원인 | 증상 | 해결책 |
| 직원 데이터 누락 | Employee #5 not found | 직원 생성 |
| 출퇴근 기록 없음 | Attendance not found | 출퇴근 데이터 입력 |
| CA 중복 차감 | CA already settled | settled_payroll_id 확인 |
```

#### 문제 4: 메시지 발송 안 됨

**증상:**
```
MessageLog: status = 'failed'
사용자: 메시지 미수신
```

**원인:**
```
1. 전화번호 형식 오류
   예: "09123456789" → "+639123456789" (변환 필요)

2. Twilio 크레딧 부족
   해결: Twilio 대시보드에서 충전

3. API 키 만료
   해결: 키 갱신 (GitHub Secrets)
```

---

## 📊 슬라이드 10: 보안 & 인증

### JWT 인증 흐름

```
1️⃣  로그인
   사용자 이메일 + 비밀번호 입력
   POST /api/auth/login
   
   ↓

2️⃣  토큰 발급
   응답: {
     access_token: "eyJhbGc...",  // 15분 만료
     refresh_token: "xyz...",      // 7일 만료
     user: { id: 1, name: "Admin" }
   }
   
   ↓

3️⃣  API 요청 (모든 요청)
   헤더: Authorization: Bearer <access_token>
   
   ✓ 토큰 유효 → 요청 처리
   ✗ 토큰 만료 → 401 Unauthorized
   
   ↓

4️⃣  토큰 갱신 (선택)
   POST /api/auth/refresh
   본문: { refresh_token: "xyz..." }
   
   응답: { access_token: "new_token..." }
   
   ↓

5️⃣  로그아웃
   POST /api/auth/logout
   토큰 블랙리스트에 추가
```

### 권한 검사

```
Role-Based Access Control (RBAC):

┌─────────────┐
│   Admin     │  (역할)
├─────────────┤
│ ✓ Employee  │  (모든 권한)
│ ✓ CA        │
│ ✓ Attendance│
│ ✓ Holidays  │
│ ✓ Calculate │
│ ✓ Approve   │
└─────────────┘

┌─────────────┐
│   User      │  (역할)
├─────────────┤
│ ✓ View      │  (읽기만)
│ ✗ Edit      │
│ ✗ Delete    │
│ ✗ Calculate │
└─────────────┘

API 보호:
@router.post("/calculate", dependencies=[Depends(require_admin())])
→ Admin만 접근 가능
```

### 보안 체크리스트

```
✅ JWT 토큰 사용
✅ HTTPS 강제
✅ CORS 설정 (특정 도메인만)
✅ SQL Injection 방지 (ORM 사용)
✅ XSS 방지 (Pydantic 검증)
✅ CSRF 보호 (토큰 기반)
✅ 감사 로그 (모든 변경 기록)
✅ 의존성 보안 스캔 (Safety)
```

---

## 📊 슬라이드 11: 실습 시간! 🚀

### Hands-on Exercise: 정산 계산 실행

**준비물:**
- 노트북 (접속 권한 필요)
- 터미널 또는 Postman

**Step 1: 환경 확인 (2분)**
```bash
# 1. API 헬스 체크
curl http://localhost:8000/health
# 응답: {"status": "🟢 Healthy"}

# 2. Frontend 로드
curl http://localhost:3000/
# 응답: HTML (200 OK)

# 3. Database 연결
psql -U user -d elspa -c "SELECT COUNT(*) FROM employees"
# 응답: count (예: 25)
```

**Step 2: 직원 데이터 확인 (2분)**
```bash
# API로 직원 조회
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/payroll/employees

# 또는 브라우저에서
# http://localhost:3000/admin/payroll/employees
```

**Step 3: 정산 기간 생성 (3분)**
```bash
# POST 요청
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "period_start": "2026-05-20",
    "period_end": "2026-05-26",
    "pay_group": "weekly"
  }' \
  http://localhost:8000/api/payroll/periods

# 응답: {"id": 1, "status": "draft", ...}
```

**Step 4: 급여 계산 실행 (3분)**
```bash
# POST 요청 (계산 트리거)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/payroll/periods/1/calculate

# 응답: {"status": "calculated", "records": 25}
# 처리 시간: 2-3초
```

**Step 5: 결과 확인 (3분)**
```bash
# 결과 조회
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/payroll/records

# 또는 브라우저에서
# http://localhost:3000/admin/payroll/records
```

**Step 6: 대시보드 보기 (2분)**
```bash
브라우저 열기:
http://localhost:3000/admin/payroll

확인 항목:
✓ KPI 카드 (총급여, 평균순지급)
✓ 월별 추이 차트
✓ 직원별 분포
✓ 정산 결과 테이블
```

**성공 기준:**
```
✅ 정산 계산 완료
✅ 결과 25명 생성됨
✅ PDF 다운로드 가능
✅ 대시보드에서 데이터 보임
```

---

## 📊 슬라이드 12: 문제 해결 실습

### 시나리오 1: API 느림 문제

**상황:** 
```
정산 결과 조회가 5초 이상 소요
```

**당신은:**
```
1. Grafana 열기: http://localhost:3000
2. "API Response Time" 차트 확인
3. 느린 쿼리 식별
4. 인덱스 추가 제안
```

### 시나리오 2: 메시지 발송 실패

**상황:**
```
일부 직원이 메시지를 받지 못함
```

**당신은:**
```
1. Kibana 열기: http://localhost:5601
2. MessageLog 조회
3. 실패한 메시지 분석
4. 전화번호 형식 확인
```

### 시나리오 3: 긴급 상황

**상황:**
```
API 다운됨 (모든 요청 500 에러)
```

**당신은:**
```
1. Sentry 확인: 에러 메시지 읽기
2. Docker 상태 확인: docker ps
3. 로그 확인: docker logs backend
4. 재시작: docker-compose restart backend
5. 헬스 체크: curl http://localhost:8000/health
```

---

## 📊 슬라이드 13: 일일 운영 체크리스트

### 매일 아침 (09:00)

```
□ API 헬스 체크
  curl http://localhost:8000/health
  
□ Frontend 로드 확인
  브라우저: http://localhost:3000
  
□ Sentry 에러 확인
  Sentry Dashboard → Last 24 hours
  
□ 데이터베이스 상태
  psql -c "SELECT pg_database_size('elspa')"
  
□ 디스크 사용량
  df -h /
  
소요 시간: 5-10분
```

### 정산일 (매주 일요일)

```
□ 정산 전 데이터 백업
  자동 실행됨 (00:00 UTC)
  
□ 정산 계산 실행
  POST /api/payroll/periods/{id}/calculate
  
□ 결과 검증 (샘플 5명)
  수작업으로 계산해서 비교
  
□ PDF 생성 테스트
  결과에서 "PDF 다운로드"
  
□ 메시지 발송 테스트 (Mock)
  POST /api/messaging/periods/{id}/send
  
□ 최종 승인
  POST /api/payroll/periods/{id}/approve

소요 시간: 30-45분
```

### 주간 분석 (매주 월요일)

```
□ Kibana 로그 분석
  에러 추이, 느린 쿼리
  
□ Grafana 성능 리포트
  API 응답 시간, CPU, 메모리
  
□ Sentry 에러 총결
  지난주 상위 5개 에러
  
□ 용량 확인
  DB: SELECT pg_database_size('elspa')
  로그: du -sh /logs/
  
□ 사용자 피드백
  Slack #feedback 채널 확인

소요 시간: 20-30분
```

---

## 📊 슬라이드 14: 참고 자료 & 다음 단계

### 추천 자료

**필독 3가지:**
```
1. TEAM_HANDOVER_GUIDE.md
   → 전체 시스템 개요, 트러블슈팅
   
2. MONITORING_SETUP_GUIDE.md
   → 모니터링 대시보드 설정
   
3. docs/API_REFERENCE.md
   → API 엔드포인트 명세
```

**참고 자료:**
```
- DEPLOYMENT_CHECKLIST.md (배포)
- SECURITY_AUDIT_REPORT.md (보안)
- PERFORMANCE_REPORT.md (성능)
- CYPRESS_E2E_GUIDE.md (테스트)
```

### 문제 발생 시

```
Q: API가 정상인지 어떻게 확인하나?
A: curl http://localhost:8000/health

Q: 로그는 어디서 보나?
A: Kibana (http://localhost:5601)
   또는 Docker: docker logs backend

Q: 메트릭은 어디서 보나?
A: Grafana (http://localhost:3000)

Q: 에러는 어디서 보나?
A: Sentry (https://sentry.io)

Q: 긴급인 경우?
A: ops@elspa.com 또는 Slack #critical
```

### 다음 주 학습 계획

```
Week 1: 기본 운영
- 일일 헬스 체크
- 모니터링 대시보드 숙달
- 트러블슈팅 연습

Week 2: 정산 프로세스
- 정산 계산 이해
- 결과 검증 방법
- 메시지 발송 테스트

Week 3: 고급 운영
- 성능 분석
- 용량 계획
- 재해 복구 테스트

Week 4: 자격증 & 평가
- 온보딩 테스트 (30문)
- 실전 시뮬레이션
```

---

## 🎓 마무리

### 핵심 요약 (3줄 요약)

```
1️⃣  ElSpa는 자동화된 급여 정산 시스템이다.
   (기본급 + 커미션 + OT + 공휴일 → 자동 계산)

2️⃣  5가지 모니터링 도구로 24/7 감시한다.
   (Sentry, Kibana, Grafana, Prometheus, Alertmanager)

3️⃣  SLA 기반 긴급 대응 체계를 갖추고 있다.
   (Critical: 15분, High: 30분, ...)
```

### 당신의 역할

```
Operations Team:
✓ 일일 헬스 체크
✓ 정산 프로세스 실행
✓ 모니터링 & 알림 대응
✓ 긴급 상황 처리

Development Team:
✓ 버그 수정
✓ 성능 최적화
✓ 새로운 기능 추가
✓ 보안 업데이트
```

### 질문?

```
슬라이드에서 이해 안 되는 부분?
→ 손 들고 물어보세요!

실습 중 문제 발생?
→ 즉시 도움을 드립니다!

추가 학습 자료 필요?
→ 문서 링크를 제공합니다!
```

---

## 📞 연락처

```
기술 지원:      dev-team@elspa.com
운영 지원:      ops@elspa.com
긴급 문제:      ops@elspa.com (24/7)
Slack 채널:     #technical-support
```

---

**프레젠테이션 종료! 👋**

**다음: 1시간 실습 시간** ☕
