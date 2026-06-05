# Phase 4: Google Sheets → Supabase 마이그레이션

## 📋 준비 사항

### 1단계: Python 라이브러리 설치
```bash
pip install gspread google-auth-oauthlib
```

또는 (특정 Python 버전):
```bash
python3 -m pip install gspread google-auth-oauthlib
```

### 2단계: Google Sheets 공유 설정

현재 설정된 Google Sheet:
```
ID: 1-WRjYvp33RQ3vJBSJ7RIW1g6P5pZjKqy_vPeVtA7mf8
```

**필수**: Google Sheets → 공유 → "누구나 보기 가능" 또는 특정 이메일로 공유

---

## 🚀 마이그레이션 실행

### 옵션 1: 공개 Google Sheet (권장)
```bash
cd /Users/kwangseobpark/elspa
python3 scripts/20250605-migrate-from-google-sheets.py
```

### 옵션 2: Service Account 인증 (프로덕션)
```bash
# Google Cloud 프로젝트에서 Service Account JSON 다운로드
# 경로: ~/.config/gspread/service_account.json

# 또는 환경변수로 설정:
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
python3 scripts/20250605-migrate-from-google-sheets.py
```

---

## 📊 마이그레이션할 Sheet 형식

### 1. "예약" (또는 "SHEET_SCHEDULE") Sheet
| 날짜 | 순번 | 마사지종류 | 시작시간 | 종료시간 | 방번호 | 고객명 | 테라피스트 | 비용 | 팁 |
|------|------|----------|---------|---------|-------|-------|-----------|------|-----|
| 2026-06-05 | 1 | 스웨디시 | 09:00 | 10:00 | 1 | John | SUL AMOR | 800 | 100 |

**지원 컬럼** (영문/한글 혼합 가능):
- 날짜 / Date
- 순번 / No
- 마사지종류 / Treatment
- 시작시간 / Start Time
- 종료시간 / End Time
- 방번호 / Room
- 고객명 / Guest
- 테라피스트 / Therapist
- 비용 / Pay
- 팁 / Tip

### 2. "마사지예약" Sheet
| 날짜 | 고객명 | 테라피스트 | 마사지종류 | 가격 | 시작시간 | 종료시간 |
|------|-------|----------|----------|------|---------|---------|
| 2026-06-05 | John | SUL AMOR | 스웨디시 | 800 | 09:00 | 10:00 |

### 3. "지출" (또는 "Expenses") Sheet
| 날짜 | 업체 | 금액 | 카테고리 | 설명 |
|------|------|------|---------|------|
| 2026-06-05 | 편의점 | 1500 | food | 점심 도시락 |

**카테고리 옵션**:
- food (식비)
- transport (교통비)
- supplies (소모품)
- utilities (공과금)
- entertainment (접대비)
- medical (의료비)
- other (기타)

---

## ✅ 마이그레이션 확인

### Supabase Dashboard에서 확인
1. https://app.supabase.com
2. 프로젝트 "elspa" 선택
3. **Table Editor** → 각 테이블 선택
4. 데이터 행 수 확인

**예상 결과:**
- `bookings`: N행
- `massage_bookings`: M행
- `expenses`: K행

---

## 🔧 문제 해결

### "gspread not found" 오류
```bash
python3 -m pip install gspread google-auth-oauthlib
```

### "Google Sheets 접근 실패" 오류
1. **공유 설정 확인**: Sheet → 공유 → "링크를 알고 있는 사용자"
2. **ID 확인**: .env의 GOOGLE_SHEET_ID가 맞는지 확인
3. **Service Account 사용**: JSON 파일로 인증 (더 안정적)

### "Column not found" 오류
- Google Sheet의 컬럼명 확인
- 스크립트의 컬럼명 매핑 수정 (코드 내 row.get())

---

## 📈 완료 후 단계

### 1. 데이터 검증
```bash
# Supabase SQL 에디터에서 실행
SELECT COUNT(*) FROM bookings;
SELECT COUNT(*) FROM expenses;
SELECT COUNT(*) FROM massage_bookings;
```

### 2. 배포
```bash
cd /Users/kwangseobpark/elspa
npm run build && npm run deploy
```

### 3. 프로덕션 확인
- https://elspa.pages.dev (또는 배포된 URL)
- 대시보드에서 데이터 표시 확인

---

## 📝 마이그레이션 로그

**실행 일시**: 2026-06-05
**상태**: 준비 완료 ✅
**예상 레코드**:
- bookings: ?
- massage_bookings: ?
- expenses: ?

---

## 🎯 다음 단계

1. ✅ Python 라이브러리 설치
2. ✅ Google Sheets 공유 설정
3. ⏳ 마이그레이션 스크립트 실행
4. ⏳ 데이터 검증
5. ⏳ 프로덕션 배포

**준비되셨으면 다음 명령어로 마이그레이션 시작:**
```bash
python3 /Users/kwangseobpark/elspa/scripts/20250605-migrate-from-google-sheets.py
```
