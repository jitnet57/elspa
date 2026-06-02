# 월간 정산 자동화 스크립트 사용 가이드

## 📋 개요

월간 정산을 자동으로 처리하고 보고서를 생성하는 Python 스크립트입니다.

### 🎯 주요 기능

1. **비회원(Guest) 정산 처리**
   - 조건: `settlement_period_year` + `settlement_period_month` + `status='pending'/'draft'`
   - 동작: `mark_settled()` 호출 → 상태를 'settled'로 변경
   - 지급방법: 은행송금 (bank_transfer)
   - 지급일: 자동화 실행일

2. **외상(Credit) 정산 처리**
   - 조건: `recovery_rate=100%` (완전 회수) + `status='pending'/'draft'`
   - 동작: `mark_settled()` 호출 → 상태를 'settled'로 변경
   - 지급방법: 은행송금 (bank_transfer)

3. **정산 요약 생성**
   - 매출액 집계 (비회원 + 외상 + 제외)
   - 수수료 계산
   - 업체별 상세 데이터

4. **보고서 생성**
   - **Excel 보고서** (.xlsx)
     - 요약 정보
     - 업체별 상세 테이블
     - 숫자 포맷팅 (천단위 쉼표)
   - **PDF 보고서** (.pdf)
     - 요약 테이블
     - 업체별 상세 테이블
     - 전문가 포맷팅

5. **자동 스케줄링**
   - APScheduler 사용
   - 매월 5일 오전 9시 자동 실행
   - 백그라운드 프로세스

---

## 🚀 설치 및 설정

### 1단계: 의존성 설치

```bash
pip install sqlalchemy python-dotenv apscheduler openpyxl reportlab
```

### 2단계: 환경 변수 설정

`.env` 파일에 데이터베이스 URL 확인:

```bash
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost/elspa

# 또는 SQLite (개발용)
DATABASE_URL=sqlite:///./elspa.db
```

### 3단계: 로그 디렉토리 생성

```bash
mkdir -p logs reports/settlements
```

---

## 💻 사용 방법

### 방법 1: 수동 실행 (현재 월)

```bash
python scripts/monthly_settlement_automation.py --manual
```

**출력 예:**
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

### 방법 2: 특정 월 실행

```bash
python scripts/monthly_settlement_automation.py --manual --year 2026 --month 5
```

### 방법 3: 테스트 모드 (보고서 생성 안 함)

```bash
python scripts/monthly_settlement_automation.py --test --year 2026 --month 5
```

### 방법 4: 스케줄러 시작 (자동 실행)

```bash
python scripts/monthly_settlement_automation.py --schedule
```

**출력 예:**
```
🚀 Starting settlement automation scheduler...
✓ Scheduler is running. Press Ctrl+C to stop.
```

이 명령은 백그라운드에서 계속 실행되며, 매월 5일 오전 9시에 자동으로 정산을 처리합니다.

**중지:**
```bash
Ctrl+C
```

---

## 📊 출력 파일

### Excel 보고서 (`settlement_YYYYMM.xlsx`)

| 칼럼 | 설명 | 예시 |
|------|------|------|
| 업체ID | 업체 식별자 | 1 |
| 정산ID | 정산 기록 ID | 42 |
| 총매출 | 모든 수입 합계 | ₱100,000.00 |
| 비회원 | 비회원 고객 매출 | ₱60,000.00 |
| 외상 | 신용 고객 매출 | ₱40,000.00 |
| 제외 | 정산 제외 매출 | ₱0.00 |
| 회수율(%) | 신용 회수율 | 100.00 |
| 수수료액 | 플랫폼 수수료 | ₱25,000.00 |
| 차감액 | 환불/분쟁/기타 | ₱1,250.00 |
| 순정산액 | 최종 지급액 | ₱73,750.00 |
| 상태 | 정산 상태 | settled |
| 지급일 | 지급 완료일 | 2026-06-02 |
| 거래건수 | 포함된 거래 수 | 15 |

### PDF 보고서 (`settlement_YYYYMM.pdf`)

가로(Landscape) 형식으로 인쇄 최적화:
- 페이지 상단: 제목, 생성일
- 상단부: 요약 정보 (회사 수, 총매출, 수수료, 정산액)
- 하단부: 업체별 상세 테이블

### 로그 파일

- `logs/settlement_automation.log` - 상세 로그
- `logs/settlement_automation_results.json` - 실행 결과 JSON

---

## 🔍 로직 상세

### 프로세스 흐름

```
1. 데이터베이스 연결
   ↓
2. 비회원(Guest) 정산 조회
   - year, month, status='pending'/'draft' 필터
   ↓
3. 비회원 정산 완료 처리
   - mark_settled() 호출
   - payment_date = 오늘
   - status = 'settled'
   ↓
4. 외상(Credit) 정산 조회
   - year, month, recovery_rate=100%, status='pending'/'draft' 필터
   ↓
5. 외상 정산 완료 처리
   - mark_settled() 호출
   - 위와 동일
   ↓
6. 정산 요약 생성
   - 업체별 집계
   - 합계 계산
   ↓
7. Excel 보고서 생성 (openpyxl)
   ↓
8. PDF 보고서 생성 (reportlab)
   ↓
9. 데이터베이스 커밋 및 종료
```

### 정산 금액 계산

```
net_settlement = (guest_revenue + recovered_amount) 
               - platform_fee 
               - total_deductions

여기서:
  guest_revenue = 비회원 매출
  recovered_amount = credit_revenue × recovery_rate / 100
  platform_fee = (total_revenue - waived_revenue) × platform_fee_rate / 100
  total_deductions = refund + dispute + other
```

### 에러 처리

- **net_settlement ≤ 0**: 정산 건너뜀, 로그 기록
- **마크 실패**: 상태 변경 실패 시 자세한 에러 로깅
- **데이터베이스 오류**: 자동으로 롤백 및 예외 발생

---

## 🔄 자동 스케줄링 (Cron)

### APScheduler 설정

**파일:** `monthly_settlement_automation.py`

**함수:** `setup_scheduler(automation)`

**Cron 표현식:**
```
day=5, hour=9, minute=0
→ 매월 5일 오전 9시 (AM 09:00)
```

### Linux/macOS에서 시스템 cron으로 실행

`crontab -e`로 다음을 추가:

```bash
# 매월 5일 오전 9시에 실행 (APScheduler 버전 사용 권장)
0 9 5 * * cd /path/to/elspa && python scripts/monthly_settlement_automation.py --schedule >> logs/cron.log 2>&1

# 또는 수동 버전 (시스템 cron 선호)
0 9 5 * * cd /path/to/elspa && python scripts/monthly_settlement_automation.py --manual >> logs/cron.log 2>&1
```

### Windows에서 Task Scheduler 설정

1. **작업 스케줄러 열기**
   - Windows + R → `taskschd.msc`

2. **기본 작업 만들기**
   - 작업 이름: `ElSpa Settlement Automation`
   - 설명: `Monthly settlement automation for ElSpa`

3. **트리거 설정**
   - 반복: 월간
   - 매월 5일, 09:00 AM

4. **동작 설정**
   - 프로그램: `python.exe`
   - 인수: `scripts/monthly_settlement_automation.py --manual`
   - 시작 위치: `C:\path\to\elspa`

5. **조건 설정**
   - 컴퓨터가 AC 전원 연결 → 필수
   - 유휴 컴퓨터에서만 실행 → 선택

---

## 📈 모니터링 및 디버깅

### 로그 확인

```bash
# 최근 50줄 보기
tail -50 logs/settlement_automation.log

# 특정 검색어로 필터
grep "error\|ERROR" logs/settlement_automation.log

# 실시간 모니터링
tail -f logs/settlement_automation.log
```

### 실행 결과 확인

```bash
# JSON 형식 결과
cat logs/settlement_automation_results.json | jq '.'

# 또는 Python으로 파싱
python3 << 'EOF'
import json
with open('logs/settlement_automation_results.json') as f:
    for line in f:
        if line.strip() and not line.startswith('='):
            result = json.loads(line)
            print(f"Period: {result['period']}, Success: {result['success']}, "
                  f"Guest: {result['guest_settlements']['processed']}, "
                  f"Credit: {result['credit_settlements']['processed']}")
EOF
```

### 데이터베이스 검증

```sql
-- 월간 정산 상태 확인
SELECT 
    settlement_period_year,
    settlement_period_month,
    status,
    COUNT(*) as count,
    SUM(net_settlement) as total_amount
FROM company_settlements
WHERE settlement_period_year = 2026 AND settlement_period_month = 6
GROUP BY settlement_period_year, settlement_period_month, status;

-- 특정 업체의 정산 이력
SELECT 
    id,
    settlement_period_month,
    status,
    net_settlement,
    payment_date,
    updated_at
FROM company_settlements
WHERE company_id = 1
ORDER BY settlement_period_year DESC, settlement_period_month DESC;
```

---

## ⚙️ 커스터마이제이션

### 1. 지급 방법 변경

```python
# monthly_settlement_automation.py 수정

# 기본값 변경 (라인 ~445)
result["guest_settlements"]["processed"] = guest_count
result["guest_settlements"]["details"] = guest_results
```

코드에서:
```python
guest_count, guest_results = self.mark_settlements_as_settled(
    guest_settlements,
    payment_method="gcash",  # ← 변경: bank_transfer → gcash
    paid_by="system_automation"
)
```

지원하는 방법:
- `bank_transfer` - 은행 송금
- `gcash` - GCash (필리핀)
- `cash` - 현금
- `check` - 수표
- `manual` - 수기 기록

### 2. 스케줄 시간 변경

```python
# 매월 10일 오후 3시로 변경
scheduler.add_job(
    job_callback,
    CronTrigger(day=10, hour=15, minute=0),  # ← 변경
    id='monthly_settlement',
    name='Monthly Settlement Automation',
    replace_existing=True
)
```

### 3. 보고서 포맷 변경

```python
# PDF 페이지 크기 변경
from reportlab.lib.pagesizes import A4

doc = SimpleDocTemplate(
    str(filepath),
    pagesize=A4,  # ← 변경: landscape(letter) → A4
    ...
)
```

### 4. 추가 필터 조건

예: 특정 회사만 처리

```python
# get_pending_guest_settlements() 수정
settlements = db.query(CompanySettlement).filter(
    CompanySettlement.settlement_period_year == year,
    CompanySettlement.settlement_period_month == month,
    CompanySettlement.status.in_(["draft", "pending"]),
    CompanySettlement.company_id.in_([1, 2, 3]),  # ← 추가
).all()
```

---

## 🐛 문제 해결

### 에러: `openpyxl not installed`

```bash
pip install openpyxl
```

### 에러: `reportlab not installed`

```bash
pip install reportlab
```

### 에러: `DATABASE_URL not set`

`.env` 파일 확인:
```bash
cat .env | grep DATABASE_URL
```

만약 없으면 추가:
```bash
echo 'DATABASE_URL=postgresql://user:password@localhost/elspa' >> .env
```

### 에러: `No pending settlements found`

1. 데이터베이스에 정산 기록이 있는지 확인:
   ```sql
   SELECT COUNT(*) FROM company_settlements 
   WHERE settlement_period_year = 2026 
   AND settlement_period_month = 6 
   AND status IN ('draft', 'pending');
   ```

2. 상태 값 확인:
   ```sql
   SELECT DISTINCT status FROM company_settlements;
   ```

### 에러: `Database connection failed`

1. PostgreSQL 서버 실행 확인
2. 연결 문자열 확인: `psql -d DATABASE_URL`
3. 방화벽 규칙 확인

---

## 📝 API 참고

### SettlementAutomation 클래스

#### 주요 메서드

```python
# 비회원 정산 조회
settlements = automation.get_pending_guest_settlements(
    year=2026,
    month=6
)

# 외상 정산 조회
settlements = automation.get_collected_credit_settlements(
    year=2026,
    month=6
)

# 정산 완료 처리
count, results = automation.mark_settlements_as_settled(
    settlements,
    payment_method="bank_transfer",
    paid_by="admin_user"
)

# 정산 요약 생성
summary = automation.generate_settlement_summary(
    settlements,
    year=2026,
    month=6
)

# Excel 보고서 생성
filepath = automation.generate_excel_report(summary)

# PDF 보고서 생성
filepath = automation.generate_pdf_report(summary)

# 전체 파이프라인 실행
result = automation.run_monthly_settlement(
    year=2026,
    month=6,
    generate_reports=True
)
```

#### 반환값 구조

```python
{
    "success": True,
    "timestamp": "2026-06-02T15:30:45.123456",
    "period": "2026-06",
    "guest_settlements": {
        "processed": 8,
        "details": [
            {
                "settlement_id": 1,
                "company_id": 100,
                "status": "settled",
                "net_settlement": 75000.00,
                "payment_date": "2026-06-02",
                "payment_method": "bank_transfer"
            },
            ...
        ]
    },
    "credit_settlements": {
        "processed": 3,
        "details": [...]
    },
    "summary": {
        "period": "2026-06",
        "generated_at": "2026-06-02T15:30:45.123456",
        "total_companies": 10,
        "total_revenue": 1234567.89,
        "total_platform_fee": 308641.97,
        "total_net_settlement": 925925.92,
        "companies": [...]
    },
    "reports": {
        "excel": "reports/settlements/settlement_202606.xlsx",
        "pdf": "reports/settlements/settlement_202606.pdf"
    }
}
```

---

## 📞 지원 및 문의

스크립트 문제 발생 시:

1. **로그 확인**
   ```bash
   tail -100 logs/settlement_automation.log
   ```

2. **테스트 모드 실행**
   ```bash
   python scripts/monthly_settlement_automation.py --test --year 2026 --month 5
   ```

3. **데이터베이스 확인**
   ```bash
   python3 << 'EOF'
   from app.database import SessionLocal_sync
   from app.models.company_settlement import CompanySettlement
   
   db = SessionLocal_sync()
   count = db.query(CompanySettlement).count()
   print(f"Total settlements in DB: {count}")
   db.close()
   EOF
   ```

---

**문서 버전:** 1.0  
**작성일:** 2026-06-02  
**마지막 업데이트:** 2026-06-02
