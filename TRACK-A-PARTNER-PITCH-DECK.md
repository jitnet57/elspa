# 🔵 Track A: B2B 파트너십 — 피치덱 & 실행자료

**대상**: 어썸팀, 타임온, 더존, 크몽, Shopify  
**목표**: POC 계약 체결 (Week 1)  
**담당**: CEO + 개발팀

---

## 📊 파트너 초기 이메일 (발송용)

### **Template 1: HR SaaS (어썸팀, 타임온, 타임온)**

```
Subject: 급여정산 기능 추가로 고객 만족도 40% 증가 — ElSpa 파트너 제안

안녕하세요, [이름]님

저희는 한국 회계규정 100% 준수하는 자동 급여정산 플랫폼 ElSpa를 개발했습니다.

[회사명]의 상황:
- HR SaaS는 근태/휴가 관리는 완벽하지만, 급여정산은 고객이 Excel로 진행
- 고객 이탈 이유: "급여까지 자동으로 되면 좋을 텐데..."
- 기회: 한 기능만 추가해도 고객 만족도 ↑, 이탈률 ↓

ElSpa 솔루션:
✓ REST API (FastAPI 기반, 40+ 엔드포인트)
✓ 급여 자동계산 (공휴일, OT, 지각 포함)
✓ 한국 세금 자동 처리 (13개월 보너스, 보험료 등)
✓ 개발비용 최소 (API만 사용하면 됨)

파트너 모델:
1. 거래당 수수료 (5%) — 제일 간단
2. 구독료 공유 (30%) — 장기 안정성
3. 화이트라벨 — 완전히 당신의 서비스로

다음주 15분 미팅에서:
- 기술 설명 (API 데모)
- 통합 방법 (3가지 옵션)
- 계약 조건 협의

이번 주 가능하신 시간이 있을까요?

감사합니다,
[CEO 이름]
ElSpa
```

---

### **Template 2: 회계소프트웨어 (더존)**

```
Subject: 회계 장부까지 자동 연계 — 더존 회계고객용 급여정산

안녕하세요, [이름]님

더존 ezAccounting 고객들의 가장 큰 고통점:
"급여 계산 후 → 수기로 장부 작성"

저희 ElSpa:
✓ 급여 자동계산
✓ → CSV 자동 생성
✓ → 더존에 자동 연계 (또는 고객이 임포트)

비즈니스 기회:
- 더존 고객: "우와, 급여-회계 완전 자동화!"
- 더존: "우리 플랫폼 생태계 강화"
- ElSpa: "회계 고객층 확보"

파트너십:
- 더존 앱스토어 또는 공식 파트너 (추천)
- 수익: 구독료 공유 (30%)
- 기대 고객: 더존 고객 중 급여 관리 어려움

다음주 30분 미팅에서:
- 기술 설명 & 통합 데모
- 더존 고객 수요 조사 결과
- 장기 파트너십 계획

가능하신 시간이 있을까요?

감사합니다,
[CEO 이름]
```

---

### **Template 3: 전자상거래 (Shopify, Naver SmartStore)**

```
Subject: 한국 판매자를 위한 급여정산 솔루션 — Shopify App Store 파트너

안녕하세요, [이름]님

현황:
- Shopify 한국 판매자: 50,000+
- 평균 직원: 5-10명
- 현재 급여: 수기로 계산 (엑셀)
- 문제: 오류 많음, 시간 오래 걸림

솔루션:
ElSpa를 Shopify App으로 제공하면:
✓ 매출 데이터 자동 연계
✓ → 직원별 수수료 자동 계산
✓ → 월급 자동 정산
✓ 결과: 월급날에 클릭 하나로 완료

기대 효과:
- 시간 절감: 8시간 → 30분
- 고객 만족도: "완벽한 솔루션!"
- Shopify: 앱 생태계 강화

파트너 모델:
- App 마진: 30% (Shopify 표준)
- 또는 API 거래 기반: 거래당 수수료 5-10%

다음주 20분 데모:
- Shopify App 통합 사례
- 한국 판매자 피드백
- 수익화 모델

시간 되실까요?

감사합니다,
[CEO 이름]
```

---

## 🎤 15분 미팅 Agenda

```
시간: 15분
대상: 파트너 CTO/개발리드 + CEO/영업

0-1분: 자기소개
  "저희는 한국 회계규정 100% 준수하는 급여정산 플랫폼입니다"

1-3분: 파트너의 상황 파악
  "현재 [서비스명]을 사용 중인 고객들의 가장 큰 불만이 뭘까요?"
  "급여 정산 관련해서 고객 요청이 많나요?"

3-7분: ElSpa 솔루션 설명 (4분)
  1. 기술 스택 (FastAPI + PostgreSQL)
  2. 통합 방식 (REST API vs 배치)
  3. 구현 속도 (2-3주)
  4. 비용 (개발비용 최소, 우리가 담당)

7-12분: 파트너십 모델 (5분)
  옵션 1: 거래당 수수료 (5%)
  옵션 2: 구독료 공유 (30%)
  옵션 3: 화이트라벨 (완전 당신의 서비스)
  
  "어느 모델이 당신의 비즈니스에 맞을까요?"

12-15분: 다음 스텝 (3분)
  "POC를 6월 3주에 시작하면 되을까요?"
  "기술 담당자 연결 가능할까요?"
  "계약 담당자는 누구인가요?"
```

---

## 📋 API 스펙시트 (개발팀용)

```yaml
API Overview:
  Framework: FastAPI + SQLAlchemy
  Database: PostgreSQL
  Authentication: JWT
  Response Format: JSON

Core Endpoints:

1. 직원 관리
  POST /api/employees
    Input: {name, salary, position, department}
    Output: {id, created_at}
  
  GET /api/employees
    Output: [{id, name, salary, position, department}]
  
  PUT /api/employees/{id}
    Input: {name, salary, position, department}
    Output: {id, updated_at}

2. 급여 계산 (핵심)
  POST /api/calculate-salary
    Input: {
      employee_id,
      year,
      month,
      work_days,
      ot_hours,
      notes
    }
    Output: {
      employee_id,
      gross_salary,
      deductions: {
        health_insurance,
        pension,
        employment_insurance,
        income_tax
      },
      net_salary,
      month_end_bonus (if applicable),
      calculated_at
    }

3. 리포트 생성
  GET /api/salary-report/{year}/{month}
    Output: [{
      employee_id,
      name,
      gross_salary,
      net_salary,
      details: {...}
    }]
  
  GET /api/export-csv/{year}/{month}
    Output: CSV file (직원별 급여 내역)

SLA:
  - Uptime: 99.9%
  - Response Time: <200ms (95th percentile)
  - Support: Mon-Fri 09:00-18:00
  
Security:
  - All endpoints require JWT
  - Rate limiting: 1000 req/min per API key
  - Data encryption at rest & in transit
  - PII 분리 저장
```

---

## 💼 1주차 Milestone

```
Week 1 Target: POC 계약 체결 + 기술 검증

Monday:
  ☑️ 초기 이메일 5곳 발송
  ☑️ 파트너 1-2곳 관심 표현

Tuesday-Wednesday:
  ☑️ 초기 미팅 2곳 진행
  ☑️ 데모 준비 (API 실행)
  ☑️ 계약서 초안 검토

Thursday:
  ☑️ 기술 담당자 회의
  ☑️ POC 계약 체결 (1곳)
  ☑️ 시작일 확정 (6월 3주)

Friday:
  ☑️ Week 1 성과: POC 1곳 + 리드 2-3곳
  ☑️ 다음주 개발 계획 수립
```

---

## 📊 성공 기준

```
✅ Week 1:
  - 파트너 미팅: 2곳 이상
  - POC 계약: 1곳 이상
  - API 준비: 100% 완료

✅ Month 1:
  - 파트너 Live: 1곳
  - MRR: $1-2K
  - 신규 리드: 2-3곳

✅ Month 3:
  - 파트너 Live: 3-4곳
  - MRR: $3-5K
  - 신규 리드: 5곳 이상
```

---

**🎯 Track A 시작: 내일 10:00부터 초기 이메일 5곳 발송**