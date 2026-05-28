# 📋 영수증 → Google Sheets 자동 정리 가이드

## 개요

- **목표**: 영수증 폴더의 PDF/이미지 파일을 자동으로 Google Sheets에 정리
- **지원 형식**: PDF, JPG, PNG 등
- **자동 기능**: 날짜 인식, 파일 크기 계산, 통계 생성

---

## 🚀 빠른 시작 (3단계)

### 1단계: 영수증 폴더에 파일 추가

```
E:\elspa\receipts\
  ├── 2026-05-20-receipt.pdf
  ├── 2026-05-21-invoice.jpg
  └── 2026-05-22-payment.png
```

**파일명 형식 (권장)**:
```
YYYY-MM-DD-description.pdf
예: 2026-05-29-salary-report.pdf
```

파일명이 없어도 됩니다. 수정 시간으로 자동 인식됩니다.

### 2단계: 스캔 및 JSON 생성

```bash
cd E:\elspa
python scripts/receipt_to_gsheet.py
```

**출력**:
```
📋 발견된 파일: 5개
  • 2026-05-20-receipt.pdf
  • 2026-05-21-invoice.jpg
  ...
✅ 저장됨: receipts_data.json
```

### 3단계: Google Sheets에 업로드 (선택)

```bash
python scripts/upload_to_gsheet.py
```

---

## 🔑 Google Sheets API 설정

### 시작하기 전에

Google Cloud Console에서 다음을 설정해야 합니다:

### Step 1: Google Cloud 프로젝트 생성

1. https://console.cloud.google.com 접속
2. 상단 "프로젝트 선택" 클릭
3. **새 프로젝트** 클릭
   - 프로젝트명: `ElSpa Receipt Manager`
   - 만들기 클릭

### Step 2: Google Sheets API 활성화

1. 좌측 메뉴 → **API 및 서비스** → **라이브러리**
2. "Google Sheets API" 검색
3. **활성화** 클릭

### Step 3: 서비스 계정 생성

1. 좌측 메뉴 → **API 및 서비스** → **사용자 인증 정보**
2. **사용자 인증 정보 만들기** → **서비스 계정**
3. 서비스 계정 세부 정보:
   - 이름: `receipt-bot`
   - 기타 필드는 선택사항
4. **계속** 클릭

### Step 4: 키 생성

1. "키 만들기" 클릭
2. 키 유형: **JSON** 선택
3. **만들기** 클릭
4. JSON 파일이 자동으로 다운로드됨

### Step 5: 파일 저장

다운로드된 JSON 파일을:
```
E:\elspa\credentials.json
```
에 저장

### Step 6: 확인

```bash
python scripts/upload_to_gsheet.py
```

성공 메시지가 나타나면 설정 완료! 🎉

---

## 📊 자동 생성되는 내용

### 영수증 탭

| 번호 | 날짜 | 파일명 | 형식 | 크기(KB) | 비고 |
|------|------|--------|------|----------|------|
| 1 | 2026-05-20 | salary-report.pdf | .pdf | 245.3 | |
| 2 | 2026-05-21 | invoice.jpg | .jpg | 512.4 | |

### 통계 탭

**자동 계산 항목:**
- 총 파일 수: `=COUNTA(영수증!A2:A)`
- PDF 파일: `=COUNTIF(영수증!D:D,"pdf")`
- 이미지 파일: `=COUNTIF(영수증!D:D,"jpg")+...`
- 전체 크기(MB): `=SUM(영수증!E2:E)/1024`

---

## 🔄 반복 실행하기

### 수동 실행

```bash
# 1. 파일 스캔
python scripts/receipt_to_gsheet.py

# 2. Google Sheets 업로드 (설정 후)
python scripts/upload_to_gsheet.py
```

### 자동 실행 (매주 월요일)

#### Windows - 작업 스케줄러

```batch
:: C:\scripts\scan_receipts.bat

@echo off
cd E:\elspa
python scripts/receipt_to_gsheet.py
python scripts/upload_to_gsheet.py
pause
```

그 다음:
1. 작업 스케줄러 열기
2. "작업 만들기"
3. 스크립트: `C:\scripts\scan_receipts.bat`
4. 실행 일정: 매주 월요일 09:00

#### Linux/Mac - Cron

```bash
# crontab -e

# 매주 월요일 09:00 실행
0 9 * * 1 cd /path/to/elspa && python scripts/receipt_to_gsheet.py && python scripts/upload_to_gsheet.py
```

---

## 🛠️ 문제 해결

### 1. "credentials.json 파일을 찾을 수 없습니다"

**해결:**
1. Google Sheets API 설정 (위 참고)
2. 다운로드한 JSON을 `E:\elspa\credentials.json` 에 저장

### 2. "receipts_data.json 파일을 찾을 수 없습니다"

**해결:**
```bash
python scripts/receipt_to_gsheet.py
```
먼저 실행 후 업로드

### 3. 파일이 인식되지 않음

**확인:**
- 폴더: `E:\elspa\receipts\`
- 형식: PDF, JPG, PNG
- 파일명 예: `2026-05-29-receipt.pdf`

### 4. "권한 오류" 발생

**해결:**
1. Google Cloud Console에서 서비스 계정 이메일 확인
2. 생성한 Google Sheet 공유 설정
3. 서비스 계정 이메일을 편집자로 추가

---

## 📋 디렉토리 구조

```
elspa/
├── receipts/                      # 영수증 폴더
│   ├── 2026-05-20-receipt.pdf
│   ├── 2026-05-21-invoice.jpg
│   └── ...
├── scripts/
│   ├── receipt_to_gsheet.py       # 파일 스캔 및 JSON 생성
│   └── upload_to_gsheet.py        # Google Sheets 업로드
├── docs/
│   └── RECEIPT_SETUP_GUIDE.md     # 이 파일
├── credentials.json               # Google API 키 (비보안)
└── receipts_data.json            # 스캔 결과
```

---

## 🔐 보안 주의

### credentials.json 보호

```bash
# .gitignore에 추가
echo "credentials.json" >> .gitignore
```

**중요**: credentials.json은 절대 GitHub에 올리지 마세요!

---

## 📝 다음 단계

### 추가 기능 (향후)

1. **OCR 기능**: PDF/이미지에서 텍스트 자동 추출
2. **금액 인식**: 영수증의 금액을 자동 파싱
3. **카테고리 분류**: AI로 자동 카테고리 분류
4. **실시간 동기화**: 폴더 변경 자동 감지

---

## 📞 문의

- 문제 발생 시: GitHub Issues
- 기능 요청: GitHub Discussions

---

**최종 업데이트**: 2026-05-29
