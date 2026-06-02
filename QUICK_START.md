# 월간 정산 자동화 - 빠른 시작 가이드

**5분 안에 시작하기**

---

## 1️⃣ 설정 (1분)

```bash
cd /path/to/elspa
bash scripts/setup_settlement_automation.sh
```

**체크:**
- ✅ `logs/` 디렉토리 생성됨
- ✅ `reports/settlements/` 디렉토리 생성됨
- ✅ Python 패키지 설치됨
- ✅ 데이터베이스 연결 성공

---

## 2️⃣ 테스트 실행 (2분)

```bash
python scripts/monthly_settlement_automation.py --test --year 2026 --month 6
```

**확인 사항:**
- ✅ 정산 데이터 조회됨
- ✅ 요약이 생성됨
- ✅ 에러 없음

---

## 3️⃣ 실제 실행 (1분)

```bash
python scripts/monthly_settlement_automation.py --manual --year 2026 --month 6
```

**출력:**
```
✓ 정산 완료
  비회원: 8건 처리
  외상: 3건 처리
  Excel: reports/settlements/settlement_202606.xlsx
  PDF: reports/settlements/settlement_202606.pdf
```

**파일 확인:**
```bash
ls -la reports/settlements/
ls -la logs/settlement_automation.log
```

---

## 4️⃣ 자동화 설정 (선택)

### 방법 A: APScheduler (권장)

```bash
# 백그라운드 실행 (Ctrl+C로 중지)
python scripts/monthly_settlement_automation.py --schedule
```

### 방법 B: Linux Cron

```bash
crontab -e

# 다음 추가 (매월 5일 오전 9시)
0 9 5 * * cd /path/to/elspa && python scripts/monthly_settlement_automation.py --manual >> logs/cron.log 2>&1
```

### 방법 C: Windows Task Scheduler

1. `taskschd.msc` 열기
2. "기본 작업 만들기"
3. 이름: `ElSpa Settlement`
4. 트리거: 월간, 5일, 09:00
5. 동작: `python.exe` + `scripts/monthly_settlement_automation.py --manual`

---

## 📋 명령어 치트시트

| 목표 | 명령어 |
|------|--------|
| 현재 월 처리 | `python scripts/monthly_settlement_automation.py --manual` |
| 특정 월 처리 | `python scripts/monthly_settlement_automation.py --manual --year 2026 --month 5` |
| 테스트만 | `python scripts/monthly_settlement_automation.py --test` |
| 스케줄러 시작 | `python scripts/monthly_settlement_automation.py --schedule` |
| 도움말 | `python scripts/monthly_settlement_automation.py --help` |
| 예제 보기 | `python scripts/settlement_automation_example.py` |
| 설정 | `bash scripts/setup_settlement_automation.sh` |

---

## 📊 생성되는 파일

### Excel 보고서
```
📄 reports/settlements/settlement_202606.xlsx
   ├─ 요약 정보
   └─ 업체별 상세 (13개 칼럼)
```

### PDF 보고서
```
📄 reports/settlements/settlement_202606.pdf
   ├─ 요약 테이블
   └─ 업체별 상세
```

### 로그
```
📄 logs/settlement_automation.log (상세 로그)
📄 logs/settlement_automation_results.json (결과)
```

---

## 🔍 결과 확인

```bash
# 로그 확인
tail logs/settlement_automation.log

# 보고서 확인
ls reports/settlements/

# JSON 결과 확인
cat logs/settlement_automation_results.json | jq '.'
```

---

## 📊 정산 금액 계산 공식

```
순정산액 = (비회원 + 회수액) - 수수료 - 차감액

여기서:
  회수액 = 외상 × 회수율(%) / 100
  수수료 = (총매출 - 제외) × 수수료율(%) / 100
  차감액 = 환불 + 분쟁 + 기타
```

---

## 🎯 정산 상태 변화

```
처리 전:
  status = 'draft' 또는 'pending'
  payment_date = NULL

처리 후:
  status = 'settled'
  payment_date = 오늘
  payment_method = 'bank_transfer'
```

---

## 🆘 문제 해결

### Q: "Database connection failed"
**A:** `.env` 확인
```bash
grep DATABASE_URL .env
```

### Q: "No module named 'openpyxl'"
**A:** 설치
```bash
pip install openpyxl reportlab
```

### Q: "No settlements found"
**A:** 데이터 확인
```sql
SELECT COUNT(*) FROM company_settlements 
WHERE status IN ('draft', 'pending');
```

---

## 📚 자세한 정보

- **상세 가이드:** `scripts/SETTLEMENT_AUTOMATION_GUIDE.md`
- **전체 요약:** `SETTLEMENT_AUTOMATION_SUMMARY.md`
- **스크립트 README:** `scripts/README.md`
- **예제 코드:** `scripts/settlement_automation_example.py`

---

## ✅ 체크리스트

월간 정산 자동화 준비 완료 확인:

- [ ] `setup_settlement_automation.sh` 실행 완료
- [ ] 데이터베이스 연결 성공
- [ ] 테스트 실행 완료 (`--test`)
- [ ] 실제 실행 완료 (`--manual`)
- [ ] 보고서 파일 확인됨
- [ ] 로그 파일 확인됨
- [ ] 자동화 설정 완료 (선택)

---

## 🚀 다음 단계

### 월간 루틴

1. **매월 5일**
   - 자동으로 정산 처리됨 (스케줄러 설정 시)
   - 또는 수동 실행: `python scripts/monthly_settlement_automation.py --manual`

2. **보고서 확인**
   - `reports/settlements/settlement_YYYYMM.xlsx`
   - `reports/settlements/settlement_YYYYMM.pdf`

3. **결과 검증**
   - 업체별 정산액 확인
   - 이상 거래 확인

4. **지급 처리**
   - 정산액 은행 송금
   - 결과 아카이빙

### 커스터마이제이션

- **지급 방법 변경:** `payment_method` 수정
- **스케줄 시간 변경:** Cron 표현식 수정
- **필터 추가:** 쿼리 커스터마이제이션
- **보고서 포맷:** Excel/PDF 템플릿 수정

---

## 💡 팁

```bash
# 최근 로그 실시간 보기
tail -f logs/settlement_automation.log

# JSON 결과 이쁘게 보기
cat logs/settlement_automation_results.json | jq '.'

# 특정 월 재실행
python scripts/monthly_settlement_automation.py --manual --year 2026 --month 3

# 테스트 후 본실행
python scripts/monthly_settlement_automation.py --test --year 2026 --month 6 && \
python scripts/monthly_settlement_automation.py --manual --year 2026 --month 6
```

---

**🎉 완료! 이제 월간 정산이 자동화되었습니다.**

---

**작성일:** 2026-06-02  
**버전:** 1.0
