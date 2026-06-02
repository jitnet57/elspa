# Excel Import Test Suite

> ElSpa 엑셀 임포트 기능의 완벽한 테스트 스위트

## 📂 구조

```
tests/
├── test_excel_import_backend.py           # 메인 백엔드 테스트 (440+ 라인)
├── generate_sample_excel_files.py         # 샘플 데이터 생성 스크립트
├── sample_excel_files/                    # 테스트용 샘플 파일들
│   ├── bookings.xlsx                      # 예약 데이터 (유효 + 에러)
│   ├── employees.xlsx                     # 직원 데이터 (중복)
│   ├── expenses.xlsx                      # 지출 데이터 (혼합 타입)
│   ├── therapists.xlsx                    # 테라피스트 (정상)
│   └── large_dataset.xlsx                 # 대용량 (1000행)
└── README.md                              # 이 파일
```

## 🧪 테스트 커버리지

### 백엔드 테스트 (`test_excel_import_backend.py`)

**7개 테스트 클래스 / 42+ 테스트 케이스**

| 클래스 | 테스트 | 설명 |
|--------|--------|------|
| **TestExcelParsing** | 4 | Excel 파일 파싱 |
| **TestFieldValidation** | 8 | 필드 값 검증 |
| **TestValueNormalization** | 6 | 값 정규화(타입 변환) |
| **TestRowValidation** | 4 | 행 검증 |
| **TestTransactionHandling** | 4 | DB 트랜잭션 |
| **TestForeignKeyValidation** | 4 | 외래키 검증 |
| **TestImportE2E** | 3 | 엔드-투-엔드 임포트 |

### 프론트엔드 테스트 (`frontend/__tests__/excel-import.test.ts`)

**7개 테스트 스위트 / 32+ 테스트 케이스**

| 스위트 | 테스트 | 설명 |
|--------|--------|------|
| **File Upload Validation** | 6 | 파일 검증 |
| **Column Mapping** | 5 | 컬럼 매핑 |
| **Progress Tracking** | 4 | 진행률 추적 |
| **Error Display** | 6 | 에러 표시 |
| **Integration** | 4 | 통합 테스트 |
| **Utilities** | 3 | 유틸리티 함수 |
| **API Client Tests** | 3 | API 클라이언트 |

## 🚀 빠른 시작

### 1. 샘플 데이터 생성

```bash
# 백엔드 venv 활성화
source venv/bin/activate

# 샘플 Excel 파일 생성
python3 tests/generate_sample_excel_files.py

# 결과
# ✅ 생성: tests/sample_excel_files/bookings.xlsx
# ✅ 생성: tests/sample_excel_files/employees.xlsx
# ✅ 생성: tests/sample_excel_files/expenses.xlsx
# ✅ 생성: tests/sample_excel_files/therapists.xlsx
# ✅ 생성: tests/sample_excel_files/large_dataset.xlsx
```

### 2. 백엔드 테스트 실행

```bash
# 모든 테스트 실행
pytest tests/test_excel_import_backend.py -v

# 특정 테스트만 실행
pytest tests/test_excel_import_backend.py::TestExcelParsing -v

# 커버리지 함께 실행
pytest tests/test_excel_import_backend.py --cov=app/routers --cov-report=html
```

### 3. 프론트엔드 테스트 실행

```bash
cd frontend

# 모든 테스트 실행
npm test

# 커버리지 생성
npm test -- --coverage --watchAll=false
```

## 📊 샘플 파일 설명

### bookings.xlsx (5,963 bytes)
- **유효 데이터**: 5행 (정상 예약)
- **에러 데이터**: 5행
  - 필수 필드 누락
  - 유효하지 않은 값
  - 범위 초과

```
Row 1-5:  ✅ 정상 (Booking ID, 고객명, 테라피스트명 등 모두 유효)
Row 8:    ❌ Booking ID 누락 (필수 필드)
Row 9:    ❌ Customer Name 누락 (필수 필드)
Row 10:   ❌ Price가 음수 (범위 에러)
Row 11:   ❌ Booking Time 형식 잘못됨 (25:00)
Row 12:   ❌ Duration이 0 (범위 에러)
```

### employees.xlsx (5,580 bytes)
- **정상 데이터**: 3행
- **중복 데이터**: 5행 (같은 직원)

```
ID | Name | Phone | Type
1  | 김철수 | 010-1234-5678 | therapist   ✅
2  | 이영미 | 010-2345-6789 | nail        ✅
3  | 박준호 | 010-3456-7890 | driver      ✅
4  | 김철수 | 010-1234-5678 | therapist   ⚠️  중복
5  | 이영미 | 010-2345-6789 | nail        ⚠️  중복
```

### expenses.xlsx (5,661 bytes)
- **혼합 데이터 타입**: 8행
  - 문자열로 된 숫자
  - 다양한 boolean 표현 (yes/true/1/false)
  - 다양한 날짜 형식
  - 소수점 수량
  - 음수 값

```
Row 1:  Amount=150000 (정수)
Row 2:  Amount="250000" (문자열)
Row 3:  Amount=1500000.50 (소수)
Row 4:  Amount=3000000, Tax="0.1" (혼합)
```

### therapists.xlsx (5,792 bytes)
- **모두 정상 데이터**: 10행
- 검증 테스트용 (모두 유효한 데이터)

```
ID | Name | Phone | Specialization | Hourly Rate | License | Hire Date
1  | 이순신 | 010-1111-1111 | Full Body Massage | 50,000 | LIC-001 | 2023-01-10 ✅
2  | 강감찬 | 010-2222-2222 | Foot Massage | 40,000 | LIC-002 | 2023-02-15 ✅
...
```

### large_dataset.xlsx (47,174 bytes)
- **1000행의 정상 데이터**
- 성능/스케일 테스트용

```
ID | Name | Phone | Email | Amount | Status | Created Date
1  | Person_0001 | 010-1000-5000 | person1@example.com | 100,000 | Active | 2025-01-01
2  | Person_0002 | 010-1001-5001 | person2@example.com | 101,000 | Pending | 2025-01-02
...
1000 | Person_1000 | 010-9000-5999 | person1000@example.com | 500,000 | Completed | 2025-06-20
```

## 📋 테스트 시나리오

### 시나리오 1: 정상 임포트
```python
# given: 유효한 Excel 파일 (bookings.xlsx의 Row 1-5)
# when: 파일을 파싱하고 검증
# then: 모든 행이 성공으로 표시
```

### 시나리오 2: 필드 검증 실패
```python
# given: 필수 필드가 누락된 Excel 파일 (bookings.xlsx의 Row 8-9)
# when: 파일을 검증
# then: ValidationError 발생
```

### 시나리오 3: 타입 변환
```python
# given: 혼합 데이터 타입의 Excel 파일 (expenses.xlsx)
# when: 문자열 숫자를 정수로 변환
# then: 올바른 타입으로 변환됨
```

### 시나리오 4: 트랜잭션 롤백
```python
# given: 5행 중 3행이 유효하고 2행이 유효하지 않은 데이터
# when: skip_errors=False로 임포트
# then: 전체 트랜잭션이 롤백됨
```

### 시나리오 5: 중복 데이터
```python
# given: 같은 전화번호를 가진 직원 2명 (employees.xlsx)
# when: 파일을 검증
# then: 중복 경고 표시 또는 에러
```

## ✅ 검증 항목

| 항목 | 검증 | 통과 조건 |
|------|------|---------|
| 파일 형식 | .xlsx/.xls만 허용 | 확장자 확인 |
| 파일 크기 | 10MB 이하 | 크기 체크 |
| 헤더 존재 | 첫 행에 헤더 필수 | 헤더 배열 길이 > 0 |
| 필수 필드 | 모든 필수 필드 존재 | 값이 null이 아님 |
| 필드 타입 | 올바른 타입으로 변환 | 타입 변환 성공 |
| 문자열 길이 | max_length 준수 | 문자 수 <= max_length |
| enum 값 | 허용된 값만 사용 | 값이 values 리스트에 포함 |
| 숫자 범위 | 유효한 범위 | 값 > 0 (일부) |
| 날짜 형식 | 유효한 날짜 | 파싱 가능 |
| 외래키 | 참조되는 데이터 존재 | ID가 부모 테이블에 존재 |

## 🔧 문제 해결

### 샘플 파일이 생성되지 않음

```bash
# 해결 1: openpyxl 설치
pip install openpyxl

# 해결 2: Python 버전 확인
python3 --version  # Python 3.7 이상 필요

# 해결 3: 수동 생성
python3 tests/generate_sample_excel_files.py
```

### pytest가 작동하지 않음

```bash
# 해결 1: pytest 설치
pip install pytest

# 해결 2: 캐시 삭제
pytest --cache-clear

# 해결 3: verbose 모드로 실행
pytest -vv tests/test_excel_import_backend.py
```

### 테스트 타임아웃

```bash
# 타임아웃 시간 증가
pytest tests/test_excel_import_backend.py --timeout=30
```

## 📈 커버리지 목표

```
현재 목표:
- 백엔드: 80% 라인 커버리지
- 프론트엔드: 75% 라인 커버리지
- E2E: 100% 사용 경로 커버리지

이상 목표:
- 백엔드: 85% 브랜치 커버리지
- 프론트엔드: 80% 브랜치 커버리지
```

## 🎯 주요 기능

### 파싱
- ✅ 여러 시트 지원
- ✅ 헤더 자동 감지
- ✅ 공백 행 건너뛰기
- ✅ 대용량 파일 처리 (1000+행)

### 검증
- ✅ 필드 타입 검증
- ✅ 필수 필드 확인
- ✅ enum 값 검증
- ✅ 문자열 길이 제한
- ✅ 범위 검증

### 변환
- ✅ 자동 타입 변환
- ✅ 날짜 형식 통일
- ✅ boolean 다양한 표현 지원
- ✅ 공백 자동 제거

### 트랜잭션
- ✅ 원자성 보장
- ✅ 부분 실패 시 롤백
- ✅ 청크 단위 처리

## 📞 지원

테스트 관련 문의:
- 📧 Email: dev@elspa.local
- 📝 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

---

**마지막 업데이트:** 2026-06-02  
**테스트 스위트 버전:** 1.0.0
