# 월간 정산 자동화 시스템 - 완성 요약

**작성일:** 2026-06-02  
**버전:** 1.0  
**담당자:** jitnet57 (kang jichul)

---

## 📦 제공 파일

| 파일 | 위치 | 설명 |
|------|------|------|
| **메인 스크립트** | `scripts/monthly_settlement_automation.py` | 월간 정산 자동화 엔진 (1,100+ 줄) |
| **사용 가이드** | `scripts/SETTLEMENT_AUTOMATION_GUIDE.md` | 상세 사용 설명서 |
| **예제 코드** | `scripts/settlement_automation_example.py` | 7가지 사용 예제 |
| **설정 스크립트** | `scripts/setup_settlement_automation.sh` | 자동 설치 및 설정 |

---

## 🎯 핵심 기능

### 1. 정산 데이터 조회 ✅

```python
# 비회원(Guest) 정산 조회
guests = automation.get_pending_guest_settlements(
    year=2026, month=6
)

# 외상(Credit) 회수 완료 조회
credits = automation.get_collected_credit_settlements(
    year=2026, month=6
)
```

**조건:**
- `settlement_period_year` = 대상 연도
- `settlement_period_month` = 대상 월
- `status` IN ('draft', 'pending')
- Credit의 경우: `recovery_rate = 100%`

### 2. 정산 완료 처리 ✅

```python
count, results = automation.mark_settlements_as_settled(
    settlements,
    payment_method="bank_transfer",
    paid_by="system_automation"
)
```

**동작:**
- 각 `CompanySettlement.mark_settled()` 호출
- `status` → 'settled'
- `payment_date` = 오늘
- 자동 커밋

### 3. 정산 요약 생성 ✅

```python
summary = automation.generate_settlement_summary(
    settlements, year=2026, month=6
)
```

**반환 데이터:**
- 총 매출액, 비회원, 외상, 제외 매출
- 플랫폼 수수료, 차감액, 순정산액
- 업체별 상세 정보 (12개 필드)

### 4. PDF/Excel 보고서 생성 ✅

```python
excel_file = automation.generate_excel_report(summary)
pdf_file = automation.generate_pdf_report(summary)
```

**Excel 보고서:**
- 요약 정보 (5행)
- 업체별 상세 (13개 칼럼)
- 숫자 포맷팅, 색상, 테두리

**PDF 보고서:**
- Landscape 페이지 (가로)
- 요약 테이블
- 업체별 상세 테이블
- 인쇄 최적화

### 5. 자동 스케줄링 ✅

```python
setup_scheduler(automation)
# → 매월 5일 오전 9시 자동 실행
```

---

## 💻 사용 방법

### 빠른 시작 (Quick Start)

```bash
# 1. 설정
bash scripts/setup_settlement_automation.sh

# 2. 수동 실행 (현재 월)
python scripts/monthly_settlement_automation.py --manual

# 3. 스케줄러 시작 (자동 실행)
python scripts/monthly_settlement_automation.py --schedule

# 4. 예제 보기
python scripts/settlement_automation_example.py
```

### 명령어

```bash
# 현재 월 정산 처리 + 보고서 생성
python scripts/monthly_settlement_automation.py --manual

# 특정 월 처리
python scripts/monthly_settlement_automation.py --manual --year 2026 --month 5

# 테스트 모드 (보고서 생성 안 함)
python scripts/monthly_settlement_automation.py --test --year 2026 --month 5

# 스케줄러 시작 (Ctrl+C로 중지)
python scripts/monthly_settlement_automation.py --schedule

# 도움말
python scripts/monthly_settlement_automation.py --help
```

---

## 📊 출력 예시

### 명령줄 출력

```
🔧 Running settlement automation for 2026-06...
============================================================
Period: 2026-06
Success: True
Guest Settlements: 8 processed
Credit Settlements: 3 processed

Summary:
  Total Companies: 10
  Total Revenue: ₱1,234,567.89
  Platform Fee: ₱308,641.97
  Net Settlement: ₱925,925.92

Excel Report: reports/settlements/settlement_202606.xlsx
PDF Report: reports/settlements/settlement_202606.pdf
============================================================
```

### 파일 위치

```
📁 reports/settlements/
├── settlement_202606.xlsx          ← Excel 보고서
└── settlement_202606.pdf           ← PDF 보고서

📁 logs/
├── settlement_automation.log       ← 상세 로그
└── settlement_automation_results.json  ← JSON 결과
```

---

## 🏗️ 아키텍처

### 클래스 구조

```
SettlementAutomation
├── __init__(db_url)
├── get_pending_guest_settlements()      → List[CompanySettlement]
├── get_collected_credit_settlements()   → List[CompanySettlement]
├── mark_settlements_as_settled()        → (count, results)
├── generate_settlement_summary()        → Dict
├── generate_excel_report()              → filepath
├── generate_pdf_report()                → filepath
└── run_monthly_settlement()             → Dict (전체 파이프라인)
```

### 데이터 흐름

```
┌─────────────────────────────────────┐
│   데이터베이스                      │
│  (company_settlements)              │
└──────────────┬──────────────────────┘
               │
               ├─ 비회원 조회 (Guest)
               │     ↓
               ├─ 외상 조회 (Credit)
               │     ↓
               ├─ 정산 완료 처리 (mark_settled)
               │     ↓
               ├─ 요약 생성 (summary)
               │     ↓
               ├─ Excel 보고서 (openpyxl)
               │     ↓
               ├─ PDF 보고서 (reportlab)
               │     ↓
               └─ 결과 반환 (JSON)
```

### 정산 금액 공식

```
순정산액 = (비회원 + 회수액) - 수수료 - 차감액

여기서:
  회수액 = 외상 × 회수율 / 100
  수수료 = (총매출 - 제외) × 수수료율 / 100
  차감액 = 환불 + 분쟁 + 기타

결과: ₱ 형식 (필리핀 페소)
```

---

## 🔄 자동 스케줄링

### APScheduler 설정

**트리거:** Cron 표현식  
**일정:** 매월 5일 오전 9:00  
**명령:** `python scripts/monthly_settlement_automation.py --schedule`

### Linux/macOS 시스템 Cron 설정

```bash
# crontab 편집
crontab -e

# 다음 라인 추가
0 9 5 * * cd /path/to/elspa && python scripts/monthly_settlement_automation.py --manual >> logs/cron.log 2>&1
```

### Windows Task Scheduler

1. 작업 스케줄러 열기 (`taskschd.msc`)
2. 기본 작업 만들기
3. 트리거: 월간, 5일, 09:00
4. 동작: `python scripts/monthly_settlement_automation.py --manual`

---

## 📋 데이터베이스 스키마 (참고)

### CompanySettlement 테이블

```sql
-- 정산 기본 정보
id                          : Integer (PK)
company_id                  : BigInteger
settlement_period_year      : Integer
settlement_period_month     : Integer

-- 매출 분류
total_revenue               : Decimal(12,2)
guest_revenue               : Decimal(12,2)   -- 비회원
credit_revenue              : Decimal(12,2)   -- 외상
waived_revenue              : Decimal(12,2)   -- 제외

-- 외상 회수
recovery_rate               : Decimal(5,2)    -- %
recovered_amount            : Decimal(12,2)

-- 수수료
platform_fee_rate           : Decimal(5,2)    -- %
platform_fee                : Decimal(12,2)

-- 차감
refund_amount               : Decimal(12,2)
dispute_deduction           : Decimal(12,2)
other_deduction             : Decimal(12,2)
total_deductions            : Decimal(12,2)

-- 결과
net_settlement              : Decimal(12,2)

-- 상태
status                      : String (draft/pending/settled/confirmed)
settlement_date             : Date
payment_method              : String
payment_date                : Date

-- 타임스탬프
created_at                  : DateTime
updated_at                  : DateTime
```

---

## 🧪 테스트 방법

### 1. 기본 테스트

```bash
python scripts/monthly_settlement_automation.py --test --year 2026 --month 5
```

**확인 사항:**
- 데이터베이스 연결 성공
- 정산 데이터 조회 (0 이상)
- 요약 생성 완료

### 2. 실행 테스트

```bash
python scripts/monthly_settlement_automation.py --manual --year 2026 --month 5
```

**확인 사항:**
- `status`가 'settled'로 변경
- `payment_date` 갱신
- 보고서 파일 생성

### 3. 데이터베이스 검증

```sql
-- 월간 정산 상태 확인
SELECT status, COUNT(*) 
FROM company_settlements 
WHERE settlement_period_year = 2026 AND settlement_period_month = 6
GROUP BY status;

-- 순정산액 합계
SELECT SUM(net_settlement) 
FROM company_settlements 
WHERE settlement_period_year = 2026 AND settlement_period_month = 6 
AND status = 'settled';
```

---

## 📝 로그 및 디버깅

### 로그 파일

```bash
# 최근 로그 확인
tail -100 logs/settlement_automation.log

# 에러만 필터
grep ERROR logs/settlement_automation.log

# 실시간 모니터링
tail -f logs/settlement_automation.log
```

### 결과 JSON

```bash
# 모든 결과 조회
cat logs/settlement_automation_results.json | jq '.'

# 특정 필드 조회
jq '.success, .period, .guest_settlements' logs/settlement_automation_results.json
```

---

## 🔐 보안 고려사항

1. **데이터베이스 연결**
   - `.env` 파일에 저장 (git 제외)
   - 환경 변수로 읽기

2. **로그 파일**
   - 민감한 정보 마스킹
   - 자동 로테이션 권장

3. **보고서 파일**
   - `reports/settlements/` 디렉토리 보호
   - 접근 권한 제한

4. **오토메이션**
   - 스케줄러는 별도 사용자 계정으로 실행
   - 감사 로그 유지

---

## 📞 문제 해결

### 에러: `openpyxl not installed`

```bash
pip install openpyxl
```

### 에러: `reportlab not installed`

```bash
pip install reportlab
```

### 에러: `Database connection failed`

```bash
# .env 확인
grep DATABASE_URL .env

# PostgreSQL 연결 테스트
psql $DATABASE_URL -c "SELECT 1;"
```

### 에러: `No pending settlements found`

1. 데이터 확인
   ```sql
   SELECT COUNT(*) FROM company_settlements 
   WHERE status IN ('draft', 'pending');
   ```

2. 상태 확인
   ```sql
   SELECT DISTINCT status FROM company_settlements;
   ```

---

## 🚀 다음 단계

### 추천 사항

1. **모니터링 추가**
   - Sentry/Datadog 통합
   - 실패 알림 메일

2. **결과 통지**
   - Slack 알림
   - Email 보고서 전송

3. **데이터 검증**
   - 계산 검증 로직
   - 이상값 감지

4. **통계 수집**
   - 월간 정산액 추이
   - 업체별 성과 대시보드

5. **문서화**
   - 승인자 매뉴얼
   - 분쟁 처리 프로세스

---

## 📚 참고 자료

- **FastAPI 문서**: https://fastapi.tiangolo.com/
- **SQLAlchemy ORM**: https://docs.sqlalchemy.org/
- **APScheduler**: https://apscheduler.readthedocs.io/
- **openpyxl**: https://openpyxl.readthedocs.io/
- **reportlab**: https://www.reportlab.com/docs/

---

## ✅ 체크리스트

월간 정산 자동화 설정 완료 확인:

- [ ] `scripts/monthly_settlement_automation.py` 파일 확인
- [ ] `setup_settlement_automation.sh` 실행
- [ ] Python 의존성 설치 완료
- [ ] `.env` 파일 DATABASE_URL 확인
- [ ] 데이터베이스 연결 테스트 성공
- [ ] 수동 실행 테스트 완료
- [ ] 보고서 파일 생성 확인
- [ ] 스케줄러 시작 테스트 (선택)
- [ ] 로그 파일 확인
- [ ] cron/Task Scheduler 설정 (선택)

---

**🎉 설정 완료! 월간 정산 자동화 시스템이 준비되었습니다.**

추가 질문이나 수정 사항은 CLAUDE.md를 참고하세요.
