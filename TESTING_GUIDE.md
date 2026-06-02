# Excel Import Test Suite 가이드

> ElSpa 엑셀 임포트 기능의 포괄적인 테스트 스위트 문서

---

## 📋 목차

1. [개요](#개요)
2. [백엔드 테스트](#백엔드-테스트)
3. [프론트엔드 테스트](#프론트엔드-테스트)
4. [샘플 데이터](#샘플-데이터)
5. [실행 방법](#실행-방법)
6. [커버리지 보고서](#커버리지-보고서)

---

## 개요

### 테스트 전략

ElSpa의 엑셀 임포트 시스템은 3개 계층의 테스트로 구성됩니다:

```
┌─────────────────────────────────────────┐
│        UI Tests (React Testing Lib)     │ ← 사용자 상호작용
├─────────────────────────────────────────┤
│        Integration Tests (E2E)          │ ← API 호출
├─────────────────────────────────────────┤
│   Unit Tests (Backend + Frontend)       │ ← 함수/컴포넌트
└─────────────────────────────────────────┘
```

### 커버리지 목표

| 계층 | 목표 | 주요 테스트 |
|------|------|-----------|
| **백엔드** | 80% | 파싱, 검증, 트랜잭션 |
| **프론트엔드** | 75% | 컬럼 매핑, 진행률, 에러 |
| **E2E** | 100% | 완전한 임포트 흐름 |

---

## 백엔드 테스트

### 📁 파일 위치

```
tests/
├── test_excel_import_backend.py          # 메인 테스트 파일
├── generate_sample_excel_files.py        # 샘플 데이터 생성
└── sample_excel_files/
    ├── bookings.xlsx                     # 예약 데이터 (유효 + 에러)
    ├── employees.xlsx                    # 직원 데이터 (중복)
    ├── expenses.xlsx                     # 지출 데이터 (혼합 타입)
    ├── therapists.xlsx                   # 테라피스트 (정상)
    └── large_dataset.xlsx                # 대용량 (1000행)
```

### 🧪 테스트 클래스

#### 1. **TestExcelParsing** - Excel 파일 파싱
```python
def test_parse_valid_excel()
    → 유효한 엑셀 파일 파싱 검증

def test_parse_excel_with_errors()
    → 에러가 있는 엑셀 파일 처리

def test_parse_empty_excel()
    → 빈 엑셀 파일 처리

def test_parse_large_excel()
    → 대용량 파일 성능 테스트 (1000행)
```

#### 2. **TestFieldValidation** - 필드 값 검증
```python
def test_validate_string_field()
    → 문자열 필드 검증

def test_validate_decimal_field()
    → 소수 필드 검증

def test_validate_enum_field()
    → enum 타입 검증

def test_validate_boolean_field()
    → boolean 타입 검증 (yes/no/true/false 등)

def test_validate_required_field_missing()
    → 필수 필드 누락 감지
```

#### 3. **TestValueNormalization** - 값 정규화(타입 변환)
```python
def test_normalize_string()
    → 문자열 정규화 (공백 제거)

def test_normalize_integer()
    → 정수 변환

def test_normalize_decimal()
    → 소수 변환

def test_normalize_boolean()
    → boolean 변환
```

#### 4. **TestRowValidation** - 행 전체 검증
```python
def test_validate_valid_row()
    → 유효한 행 검증

def test_validate_row_with_missing_field()
    → 필드 누락 감지

def test_validate_row_with_invalid_enum()
    → enum 값 검증

def test_validate_entire_row_mapping()
    → 행의 필드 매핑 및 검증
```

#### 5. **TestTransactionHandling** - DB 트랜잭션
```python
def test_transaction_commit()
    → 트랜잭션 커밋

def test_transaction_rollback_on_error()
    → 에러 발생 시 롤백

def test_partial_import_with_rollback()
    → 부분 임포트 롤백

def test_atomic_chunk_processing()
    → 청크 단위 원자성
```

#### 6. **TestForeignKeyValidation** - 외래키 검증
```python
def test_valid_foreign_key_reference()
    → 유효한 외래키 참조

def test_invalid_foreign_key_reference()
    → 유효하지 않은 외래키

def test_multiple_foreign_keys()
    → 여러 외래키 검증

def test_cascade_delete_foreign_key()
    → CASCADE DELETE 검증
```

#### 7. **TestImportE2E** - 엔드-투-엔드 임포트
```python
def test_complete_import_flow()
    → 완전한 임포트 흐름

def test_import_with_error_handling()
    → 에러 처리를 포함한 임포트

def test_import_with_skip_errors_flag()
    → skip_errors 플래그 테스트
```

### 실행 방법

```bash
# 모든 백엔드 테스트 실행
pytest tests/test_excel_import_backend.py -v

# 특정 테스트 클래스만 실행
pytest tests/test_excel_import_backend.py::TestExcelParsing -v

# 특정 테스트만 실행
pytest tests/test_excel_import_backend.py::TestExcelParsing::test_parse_valid_excel -v

# 커버리지 함께 실행
pytest tests/test_excel_import_backend.py --cov=app/routers/excel_import_router --cov-report=html
```

### ✅ 주요 검증 항목

| 항목 | 검증 내용 | 에러 메시지 |
|------|---------|-----------|
| **파일 형식** | .xlsx, .xls 확인 | 지원하지 않는 파일 형식 |
| **파일 크기** | 10MB 이하 | 파일 크기 초과 |
| **헤더 존재** | 첫 행에 헤더 있는지 | 엑셀 파일에 헤더가 없습니다 |
| **필수 필드** | 필수 필드 값 존재 | 필수 필드입니다 |
| **필드 타입** | 타입 변환 가능 | 값 변환 실패 |
| **문자열 길이** | max_length 초과 | 문자열 길이 초과 |
| **enum 값** | 허용된 값 확인 | 허용되지 않는 값 |
| **외래키** | 참조되는 데이터 존재 | 외래키를 찾을 수 없습니다 |

---

## 프론트엔드 테스트

### 📁 파일 위치

```
frontend/__tests__/
├── excel-import.test.ts                  # 메인 테스트 파일
└── __fixtures__/
    └── sample-data.ts                    # 테스트 데이터
```

### 🧪 테스트 스위트

#### 1. **ExcelImport - File Upload Validation** - 파일 검증
```typescript
test('should accept .xlsx files')
test('should accept .xls files')
test('should reject .csv files')
test('should reject .pdf files')
test('should accept files under 10MB')
test('should reject files over 10MB')
```

#### 2. **ExcelImport - Column Mapping** - 컬럼 매핑
```typescript
test('should suggest mapping for similar column names')
test('should handle partial mapping suggestions')
test('should validate manual mapping')
test('should reject invalid manual mapping')
test('should detect duplicate field mapping')
```

#### 3. **ExcelImport - Progress Tracking** - 진행률 추적
```typescript
test('should calculate progress percentage')
test('should update progress as rows are processed')
test('should track different row statuses')
test('should handle streaming progress events')
```

#### 4. **ExcelImport - Error Display** - 에러 표시
```typescript
test('should display validation errors')
test('should format error messages properly')
test('should display warning messages')
test('should handle multiple errors in a single row')
test('should handle foreign key errors')
test('should handle duplicate data errors')
```

#### 5. **ExcelImport - Integration** - 통합 테스트
```typescript
test('should complete full import process')
test('should cancel import process')
test('should generate import summary')
test('should generate error report')
```

#### 6. **ExcelImport - Utilities** - 유틸리티 함수
```typescript
test('should format file size correctly')
test('should format progress percentage')
test('should format execution time')
```

#### 7. **ExcelImport - API Client Tests** - API 클라이언트
```typescript
test('should parse API response correctly')
test('should handle API error responses')
test('should parse streaming progress events')
```

### 실행 방법

```bash
# 모든 프론트엔드 테스트 실행
npm test

# 특정 파일만 테스트
npm test excel-import.test.ts

# Watch 모드 (파일 변경 감지)
npm test -- --watch

# 커버리지 보고서 생성
npm test -- --coverage

# Jest UI로 테스트 실행
npm test -- --showUI
```

### ✅ 주요 검증 항목

| 항목 | 검증 내용 | 통과 조건 |
|------|---------|---------|
| **파일 타입** | xlsx/xls 확인 | 허용 확장자만 통과 |
| **파일 크기** | 10MB 이하 | 크기 제한 내 통과 |
| **매핑** | 컬럼 매핑 유효성 | 모든 필드가 DB에 존재 |
| **중복 매핑** | 같은 필드 중복 | 감지되면 실패 |
| **진행률** | 0~100% 범위 | 올바른 계산 |
| **에러 메시지** | 형식 및 내용 | 명확한 메시지 |
| **API 응답** | JSON 파싱 | 유효한 데이터 구조 |

---

## 샘플 데이터

### 📊 bookings.xlsx (예약 데이터)

**유효한 데이터 (5행)**
```
Booking ID | Customer Name | Therapist Name | Service Type       | Date       | Time  | Duration | Price  | Status
1          | 김재준        | 이순신        | Full Body Massage  | 2025-06-01 | 10:00 | 60       | 80,000 | Completed
2          | 박지현        | 강감찬        | Foot Massage       | 2025-06-02 | 14:30 | 30       | 40,000 | Completed
```

**에러 데이터 (5행)**
- Row 8: 예약 ID 없음 (필수 필드)
- Row 9: 고객명 없음 (필수 필드)
- Row 10: 가격이 음수 (범위 에러)
- Row 11: 시간 형식 잘못됨 (포맷 에러)
- Row 12: 기간이 0 (범위 에러)

### 📊 employees.xlsx (직원 데이터)

**정상 데이터 (3행)** + **중복 데이터 (5행)**
```
Employee ID | Name   | Phone          | Employee Type | Pay Group | Base Salary | Hire Date
1           | 김철수 | 010-1234-5678 | therapist     | weekly    | 2,500,000   | 2024-01-15
2           | 이영미 | 010-2345-6789 | nail          | biweekly  | 1,800,000   | 2024-02-20
4           | 김철수 | 010-1234-5678 | therapist     | weekly    | 2,500,000   | 2024-01-15  <- 중복
```

### 📊 expenses.xlsx (지출 데이터)

**혼합 데이터 타입**
- Row 2: 문자열로 된 숫자
- Row 3: 혼합 boolean 표현 (yes, true, 1, False)
- Row 4: 다양한 날짜 형식
- Row 5: 소수점 수량
- Row 7: 음수 값 (환불)

### 📊 therapists.xlsx (정상 데이터)

**모두 유효한 데이터 (10행)**
```
Therapist ID | Name     | Phone          | Specialization        | Hourly Rate | License   | Hire Date
1            | 이순신   | 010-1111-1111 | Full Body Massage      | 50,000      | LIC-001   | 2023-01-10
2            | 강감찬   | 010-2222-2222 | Foot Massage           | 40,000      | LIC-002   | 2023-02-15
```

### 📊 large_dataset.xlsx (대용량)

**1000행의 정상 데이터** (성능 테스트용)

---

## 실행 방법

### 🔧 세부 설정

#### 1. 샘플 데이터 생성

```bash
# 백엔드 - Python venv 활성화
source venv/bin/activate

# 샘플 파일 생성
python3 tests/generate_sample_excel_files.py

# 결과
# ✅ 생성: tests/sample_excel_files/bookings.xlsx
# ✅ 생성: tests/sample_excel_files/employees.xlsx
# ✅ 생성: tests/sample_excel_files/expenses.xlsx
# ✅ 생성: tests/sample_excel_files/therapists.xlsx
# ✅ 생성: tests/sample_excel_files/large_dataset.xlsx
```

#### 2. 백엔드 테스트 설정

```bash
# 필요한 패키지 설치
pip install pytest openpyxl sqlalchemy

# 테스트 실행
pytest tests/test_excel_import_backend.py -v --tb=short
```

#### 3. 프론트엔드 테스트 설정

```bash
# npm 의존성 설치
cd frontend
npm install --save-dev jest ts-jest @testing-library/react @testing-library/jest-dom

# 테스트 실행
npm test
```

### 📊 실행 결과 예시

```
# 백엔드 테스트 결과
tests/test_excel_import_backend.py::TestExcelParsing::test_parse_valid_excel PASSED
tests/test_excel_import_backend.py::TestFieldValidation::test_validate_string_field PASSED
tests/test_excel_import_backend.py::TestRowValidation::test_validate_valid_row PASSED
tests/test_excel_import_backend.py::TestImportE2E::test_complete_import_flow PASSED

================ 25 passed in 2.34s ================
```

---

## 커버리지 보고서

### 생성 방법

```bash
# 백엔드 커버리지
pytest tests/test_excel_import_backend.py \
  --cov=app/routers/excel_import_router \
  --cov=app/services/excel_import_service \
  --cov-report=html \
  --cov-report=term-missing

# 프론트엔드 커버리지
npm test -- --coverage --watchAll=false
```

### 예상 커버리지

```
Backend (excel_import_router.py)
  Lines:   85%
  Branches: 78%
  Functions: 90%

Frontend (excel-import utilities)
  Lines:   75%
  Branches: 70%
  Functions: 85%
```

### 커버리지 보고서 위치

```
# HTML 보고서 생성
tests/htmlcov/index.html          # 백엔드
frontend/coverage/index.html      # 프론트엔드
```

---

## 🚀 CI/CD 통합

### GitHub Actions 예시

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
      - run: pip install -r requirements.txt
      - run: pytest tests/test_excel_import_backend.py -v

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test -- --coverage
```

---

## 📝 테스트 작성 가이드

### 새 테스트 추가하기

#### 백엔드 (pytest)

```python
def test_my_feature():
    """테스트 설명"""
    # Arrange (준비)
    factory = ExcelTestDataFactory()
    file_content = factory.create_valid_employees_excel()
    
    # Act (실행)
    result = parse_excel(file_content)
    
    # Assert (검증)
    assert result is not None
    assert len(result) == 5
```

#### 프론트엔드 (Jest)

```typescript
describe('MyFeature', () => {
  it('should do something', () => {
    // Arrange
    const input = { ... };
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

---

## 🐛 일반적인 문제 및 해결

### 문제 1: pytest 모듈을 찾을 수 없음

```bash
# 해결
pip install pytest
```

### 문제 2: openpyxl 버전 충돌

```bash
# 해결
pip install --upgrade openpyxl
```

### 문제 3: Jest 모듈 찾을 수 없음

```bash
# 해결
npm install --save-dev jest ts-jest @types/jest
```

---

## 📞 문제 보고

테스트 실패 시:

1. **로그 확인**: `-v` 플래그로 상세 로그 보기
2. **샘플 데이터 확인**: `tests/sample_excel_files/` 파일 존재 확인
3. **의존성 확인**: `pip list`, `npm list` 확인
4. **캐시 삭제**: `pytest --cache-clear`, `npm cache clean --force`

---

**마지막 업데이트:** 2026-06-02  
**작성자:** ElSpa Development Team
