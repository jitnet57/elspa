# Scripts Directory - 월간 정산 자동화

ElSpa 월간 정산 자동화 시스템의 메인 스크립트들이 위치합니다.

## 📁 파일 목록

### 1. `monthly_settlement_automation.py` (메인 스크립트)

**목적:** 월간 정산 자동화 엔진

**주요 클래스:**
- `SettlementAutomation` - 정산 처리 로직

**주요 기능:**
1. 비회원(Guest) 정산 조회 및 처리
2. 외상(Credit) 정산 조회 및 처리
3. 정산 요약 생성
4. Excel/PDF 보고서 생성
5. APScheduler 기반 자동 스케줄링

**라인 수:** 1,100+

**사용법:**
```bash
# 현재 월 수동 실행
python scripts/monthly_settlement_automation.py --manual

# 특정 월 실행
python scripts/monthly_settlement_automation.py --manual --year 2026 --month 5

# 스케줄러 시작 (매월 5일 오전 9시)
python scripts/monthly_settlement_automation.py --schedule

# 테스트 모드
python scripts/monthly_settlement_automation.py --test

# 도움말
python scripts/monthly_settlement_automation.py --help
```

---

### 2. `SETTLEMENT_AUTOMATION_GUIDE.md` (상세 가이드)

**목적:** 사용 방법 및 설정 가이드

**포함 내용:**
- 설치 및 설정 단계
- 사용 방법 (4가지)
- 출력 파일 설명
- 자동 스케줄링 설정
- 모니터링 및 디버깅
- 커스터마이제이션
- 문제 해결
- API 참고

**읽기 시간:** 10-15분

---

### 3. `settlement_automation_example.py` (사용 예제)

**목적:** 7가지 실용적인 사용 예제

**예제 목록:**
1. 기본 사용법 - `run_monthly_settlement()`
2. 특정 월 정산 처리
3. 정산 요약 분석
4. 커스텀 자동화 (필터링)
5. 보고서만 생성
6. 에러 처리
7. 배치 처리 (여러 달)

**실행 방법:**
```bash
# 모든 예제 실행
python scripts/settlement_automation_example.py

# 특정 예제만 실행
python scripts/settlement_automation_example.py 1
python scripts/settlement_automation_example.py 2
# ...
```

---

### 4. `setup_settlement_automation.sh` (설정 스크립트)

**목적:** 자동 설정 및 의존성 설치

**수행 작업:**
1. 필요한 디렉토리 생성
   - `logs/`
   - `reports/settlements/`
2. Python 패키지 설치
   - sqlalchemy
   - python-dotenv
   - apscheduler
   - openpyxl
   - reportlab
3. .env 파일 확인
4. 데이터베이스 연결 테스트
5. 스크립트 파일 검증
6. 파일 권한 설정

**실행 방법:**
```bash
bash scripts/setup_settlement_automation.sh
```

---

## 🚀 빠른 시작

### 1단계: 설정

```bash
bash scripts/setup_settlement_automation.sh
```

### 2단계: 수동 실행 (테스트)

```bash
python scripts/monthly_settlement_automation.py --manual
```

### 3단계: 확인

- Excel 보고서: `reports/settlements/settlement_YYYYMM.xlsx`
- PDF 보고서: `reports/settlements/settlement_YYYYMM.pdf`
- 로그: `logs/settlement_automation.log`

### 4단계: 자동화 (선택)

```bash
# APScheduler 시작
python scripts/monthly_settlement_automation.py --schedule
```

---

## 📊 출력 파일

### Excel 보고서 (`.xlsx`)

**위치:** `reports/settlements/settlement_YYYYMM.xlsx`

**포함 내용:**
- 요약 정보 (5개 행)
- 업체별 상세 테이블 (13개 칼럼)
- 포맷팅: 천단위 쉼표, 색상, 테두리

### PDF 보고서 (`.pdf`)

**위치:** `reports/settlements/settlement_YYYYMM.pdf`

**포함 내용:**
- 요약 테이블
- 업체별 상세 테이블
- 인쇄 최적화 (Landscape)

### 로그 파일

**상세 로그:** `logs/settlement_automation.log`
```
[2026-06-02 15:30:45] INFO - Settlement automation initialized
[2026-06-02 15:30:46] INFO - Found 8 pending guest settlements
[2026-06-02 15:30:47] INFO - Settlement 1 marked as settled
...
```

**결과 JSON:** `logs/settlement_automation_results.json`
```json
{
    "success": true,
    "timestamp": "2026-06-02T15:30:45.123456",
    "period": "2026-06",
    "guest_settlements": {
        "processed": 8,
        "details": [...]
    },
    ...
}
```

---

## 🔄 자동 스케줄링

### 기본 설정

- **일정:** 매월 5일 오전 9:00 AM
- **방식:** APScheduler Cron 트리거
- **실행 명령:** `python scripts/monthly_settlement_automation.py --schedule`

### Linux/macOS Cron

```bash
# crontab 편집
crontab -e

# 추가 라인
0 9 5 * * cd /path/to/elspa && python scripts/monthly_settlement_automation.py --manual >> logs/cron.log 2>&1
```

### Windows Task Scheduler

1. 작업 스케줄러 열기
2. 기본 작업 만들기
3. 매월 5일 09:00 AM
4. 프로그램: `python.exe`
5. 인수: `scripts/monthly_settlement_automation.py --manual`

---

## 🛠️ 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| sqlalchemy | 최신 | 데이터베이스 ORM |
| python-dotenv | 최신 | 환경 변수 읽기 |
| apscheduler | 최신 | 스케줄링 |
| openpyxl | 최신 | Excel 파일 생성 |
| reportlab | 최신 | PDF 파일 생성 |

**설치:**
```bash
pip install sqlalchemy python-dotenv apscheduler openpyxl reportlab
```

---

## 📝 로그 확인

```bash
# 최근 50줄
tail -50 logs/settlement_automation.log

# 에러만 필터
grep ERROR logs/settlement_automation.log

# 실시간 모니터링
tail -f logs/settlement_automation.log

# 결과 JSON 파싱
cat logs/settlement_automation_results.json | jq '.success, .period'
```

---

## 🧪 테스트

```bash
# 테스트 모드 (보고서 생성 안 함)
python scripts/monthly_settlement_automation.py --test --year 2026 --month 5

# 특정 월 전체 실행
python scripts/monthly_settlement_automation.py --manual --year 2026 --month 5

# 예제 코드 실행
python scripts/settlement_automation_example.py
```

---

## 📚 추가 자료

- **상세 가이드:** `SETTLEMENT_AUTOMATION_GUIDE.md`
- **프로젝트 요약:** `../SETTLEMENT_AUTOMATION_SUMMARY.md`
- **프로젝트 지침:** `../CLAUDE.md`

---

## ⚙️ 커스터마이제이션

### 지급 방법 변경

```python
# monthly_settlement_automation.py
mark_settlements_as_settled(
    settlements,
    payment_method="gcash",  # 변경: bank_transfer → gcash
    paid_by="system_automation"
)
```

### 스케줄 시간 변경

```python
# monthly_settlement_automation.py
scheduler.add_job(
    job_callback,
    CronTrigger(day=10, hour=15, minute=0),  # 10일 오후 3시
    ...
)
```

### 추가 필터 조건

```python
# 1000 이상만 처리
settlements = db.query(CompanySettlement).filter(
    CompanySettlement.net_settlement >= 1000
).all()
```

---

## 🐛 문제 해결

| 문제 | 해결방법 |
|------|--------|
| `openpyxl not installed` | `pip install openpyxl` |
| `reportlab not installed` | `pip install reportlab` |
| `DATABASE_URL not set` | `.env`에 `DATABASE_URL` 추가 |
| Database 연결 실패 | PostgreSQL 서버 실행 확인 |
| 정산 데이터 없음 | DB에서 `status='draft'/'pending'` 레코드 확인 |

---

## 📞 지원

문제 발생 시:

1. **로그 확인**
   ```bash
   tail -100 logs/settlement_automation.log
   ```

2. **테스트 모드 실행**
   ```bash
   python scripts/monthly_settlement_automation.py --test
   ```

3. **DB 검증**
   ```sql
   SELECT COUNT(*) FROM company_settlements 
   WHERE status IN ('draft', 'pending');
   ```

---

**마지막 업데이트:** 2026-06-02  
**버전:** 1.0
