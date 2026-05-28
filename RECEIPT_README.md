# 📋 영수증 자동 정리 시스템

> PDF, JPG, PNG 등의 영수증을 자동으로 Google Sheets에 정리하고 계산합니다.

## ✨ 기능

- 📁 **자동 파일 감지**: receipts 폴더의 모든 이미지/PDF 파일 스캔
- 📅 **날짜 자동 인식**: 파일명(YYYY-MM-DD) 또는 수정 시간 기반 날짜 추출
- 📊 **Google Sheets 자동 연동**: 클릭 한 번으로 Google Sheets 생성 및 업로드
- 📈 **자동 계산**: 파일 수, 크기, 형식별 분류 자동 계산
- 🔒 **안전한 API**: Google Cloud 서비스 계정 기반 인증

## 🚀 빠른 시작

### 1단계: 파일 추가

```
E:\elspa\receipts\
  ├── 2026-05-20-receipt.pdf
  ├── 2026-05-21-invoice.jpg
  └── 2026-05-22-payment.png
```

### 2단계: 스캔 실행

```bash
cd E:\elspa
python scripts/receipt_to_gsheet.py
```

**결과:**
```
📋 발견된 파일: 3개
✅ 저장됨: receipts_data.json

📈 통계
총 파일 수: 3
형식별 분류:
  .pdf: 1개
  .jpg: 1개
  .png: 1개
```

### 3단계: Google Sheets에 업로드 (선택)

Google Sheets API 설정 후:

```bash
python scripts/upload_to_gsheet.py
```

## 📋 시스템 구조

```
scripts/
├── receipt_to_gsheet.py      # 파일 스캔 및 JSON 생성
└── upload_to_gsheet.py       # Google Sheets 업로드

receipts/                      # 영수증 폴더
├── 2026-05-20-salary-report.pdf
├── 2026-05-21-invoice.jpg
└── 2026-05-22-payment.png

docs/
└── RECEIPT_SETUP_GUIDE.md    # 상세 설정 가이드

receipts_data.json            # 스캔 결과 (자동 생성)
credentials.json              # Google API 키 (수동 저장)
```

## 🔑 Google Sheets API 설정

### 완전한 설정 가이드

👉 **[RECEIPT_SETUP_GUIDE.md](docs/RECEIPT_SETUP_GUIDE.md)** 참조

간단 요약:
1. Google Cloud Console에서 프로젝트 생성
2. Google Sheets API 활성화
3. 서비스 계정 생성 및 JSON 키 다운로드
4. `E:\elspa\credentials.json` 에 저장
5. `python scripts/upload_to_gsheet.py` 실행

## 📊 Google Sheets 자동 생성 콘텐츠

### 영수증 탭

| 번호 | 날짜 | 파일명 | 형식 | 크기(KB) | 비고 |
|------|------|--------|------|----------|------|
| 1 | 2026-05-20 | salary-report.pdf | .pdf | 245.3 | - |
| 2 | 2026-05-21 | invoice.jpg | .jpg | 512.4 | - |

### 통계 탭 (자동 계산)

- **총 파일 수**: `=COUNTA(영수증!A2:A)`
- **PDF 파일**: `=COUNTIF(영수증!D:D,"pdf")`
- **이미지 파일**: `=COUNTIF(영수증!D:D,"jpg")+COUNTIF(영수증!D:D,"png")`
- **전체 크기(MB)**: `=SUM(영수증!E2:E)/1024`

## 💡 사용 팁

### 파일명 형식 (권장)

```
YYYY-MM-DD-설명.확장자

예시:
  2026-05-20-salary-report.pdf
  2026-05-21-monthly-invoice.jpg
  2026-05-22-payment-receipt.png
```

### 자동 반복 실행

#### Windows 작업 스케줄러

```batch
@echo off
cd E:\elspa
python scripts/receipt_to_gsheet.py
python scripts/upload_to_gsheet.py
```

1. 위 코드를 `scan_receipts.bat` 로 저장
2. 작업 스케줄러에서 매주 실행 설정

#### Linux/Mac Cron

```bash
0 9 * * 1 cd /path/to/elspa && python scripts/receipt_to_gsheet.py && python scripts/upload_to_gsheet.py
```

## 🔐 보안

### credentials.json 보호

```bash
# .gitignore에 추가
echo "credentials.json" >> .gitignore
```

⚠️ **중요**: 이 파일은 절대 GitHub에 올리지 마세요!

## 🛠️ 문제 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| "credentials.json 파일을 찾을 수 없습니다" | API 설정 미완료 | [설정 가이드](docs/RECEIPT_SETUP_GUIDE.md) 참조 |
| 파일이 인식되지 않음 | 폴더 또는 형식 오류 | `receipts/` 폴더 확인, PDF/JPG/PNG 형식만 지원 |
| "권한 오류" | Google Sheet 공유 미설정 | 서비스 계정 이메일을 편집자로 추가 |

## 📈 향후 추가 기능

- [ ] OCR로 영수증에서 텍스트 자동 추출
- [ ] AI로 금액/카테고리 자동 인식
- [ ] 실시간 폴더 모니터링
- [ ] Slack 알림 연동
- [ ] 월별/카테고리별 통계 대시보드

## 📝 사용 예시

```bash
# 1. 영수증 폴더에 파일 추가
# E:\elspa\receipts\2026-05-29-may-expenses.pdf

# 2. 스캔 실행
python scripts/receipt_to_gsheet.py

# 3. 결과 확인
# receipts_data.json 생성됨

# 4. Google Sheets에 업로드
python scripts/upload_to_gsheet.py

# 5. 브라우저에서 Google Sheet 확인
# https://docs.google.com/spreadsheets/d/{ID}/edit
```

## 📞 지원

- 기본 가이드: [RECEIPT_SETUP_GUIDE.md](docs/RECEIPT_SETUP_GUIDE.md)
- 문제 발생 시: GitHub Issues 생성
- 기능 제안: GitHub Discussions

---

**버전**: 1.0  
**최종 업데이트**: 2026-05-29  
**상태**: 🟢 Ready for Use
