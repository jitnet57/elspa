# ElSpa Excel 임포트 시스템

> 관리자가 설정에서 Excel 파일을 업로드하여 데이터베이스에 일괄 저장

---

## 1️⃣ **기능 개요**

### A. 지원 테이블

```
✅ Bookings (예약 데이터)
✅ Employees (직원 정보)
✅ Expenses (비용 기록)
✅ Attendance Logs (출결 기록)
✅ Companies (업체 정보)
✅ Guides (가이드 정보)
```

### B. 사용 흐름

```
1. 설정 페이지 접근
   └─ /admin/settings/import

2. 테이블 선택
   └─ Dropdown: [Bookings / Employees / Expenses / ...]

3. Excel 파일 업로드
   └─ File input: *.xlsx 또는 *.csv

4. 컬럼 매핑 (자동/수동)
   ├─ 자동: 첫 행을 헤더로 인식
   └─ 수동: Excel 컬럼 ↔ DB 필드 매핑

5. 미리보기 & 검증
   ├─ 샘플 5행 표시
   ├─ 필수 필드 체크
   └─ 중복 검사

6. 임포트 실행
   ├─ 진행 상황 표시 (Progress bar)
   ├─ 성공/실패 행 표시
   └─ 트랜잭션 처리 (모두 성공 또는 모두 실패)

7. 결과 리포트
   ├─ 총 행 수
   ├─ 성공 행
   ├─ 실패 행 (에러 메시지)
   └─ 다운로드 (실패 로그)
```

---

## 2️⃣ **기술 스택**

### Frontend

```typescript
// 라이브러리
- xlsx: Excel 파싱
- react-dropzone: 파일 드래그&드롭
- react-table: 미리보기 테이블

// 컴포넌트
- ExcelImportPage.tsx          (메인 페이지)
- ExcelFileUpload.tsx          (파일 업로드)
- ColumnMappingUI.tsx          (컬럼 매핑)
- ImportPreview.tsx            (미리보기)
- ImportProgressBar.tsx        (진행 상황)
- ImportResultReport.tsx       (결과 리포트)
```

### Backend

```python
# 라이브러리
- openpyxl: Excel 파싱 (Python)
- pandas: 데이터 처리
- sqlalchemy: ORM

# 엔드포인트
- POST /api/import/parse-excel        (파일 파싱)
- POST /api/import/validate-mapping    (매핑 검증)
- POST /api/import/execute             (데이터 저장)
- GET /api/import/tables               (지원 테이블 목록)
```

---

## 3️⃣ **데이터 모델**

### Excel 파일 구조

```
Excel (bookings.xlsx)
┌──────────────────────────────────────────────────────┐
│ Header Row (자동 인식)                               │
├──────────────────────────────────────────────────────┤
│ booking_date | therapist_name | treatment | ...     │
├──────────────────────────────────────────────────────┤
│ 2026-06-02   | Anna          | Swedish   | ...     │
│ 2026-06-02   | Fatima        | Thai      | ...     │
│ 2026-06-03   | Julia         | Oil       | ...     │
└──────────────────────────────────────────────────────┘
```

### 컬럼 매핑 모델

```typescript
interface ColumnMapping {
  tableName: string;              // 'bookings', 'employees', ...
  mappings: {
    excelColumn: string;          // 'A', 'B', 'C'
    excelHeader: string;          // 'booking_date', 'therapist_name'
    dbField: string;              // 'booking_date', 'therapist_name'
    dataType: 'string' | 'number' | 'date' | 'boolean';
    isRequired: boolean;
    transformer?: (value: any) => any;  // 값 변환 함수
  }[];
}

// 예
{
  "tableName": "bookings",
  "mappings": [
    {
      "excelColumn": "A",
      "excelHeader": "booking_date",
      "dbField": "booking_date",
      "dataType": "date",
      "isRequired": true,
      "transformer": (val) => new Date(val).toISOString()
    },
    {
      "excelColumn": "B",
      "excelHeader": "therapist_name",
      "dbField": "therapist_name",
      "dataType": "string",
      "isRequired": true
    }
  ]
}
```

### 임포트 결과 모델

```typescript
interface ImportResult {
  totalRows: number;
  successRows: number;
  failedRows: number;
  startTime: Date;
  endTime: Date;
  errors: {
    rowNumber: number;
    values: Record<string, any>;
    errorMessage: string;
  }[];
  warnings: string[];
}

// 예
{
  "totalRows": 100,
  "successRows": 98,
  "failedRows": 2,
  "startTime": "2026-06-02T10:00:00Z",
  "endTime": "2026-06-02T10:02:30Z",
  "errors": [
    {
      "rowNumber": 5,
      "values": { "booking_date": "2026-06-99" },  // 잘못된 날짜
      "errorMessage": "Invalid date format"
    },
    {
      "rowNumber": 42,
      "values": { "therapist_name": "" },
      "errorMessage": "Required field is empty"
    }
  ],
  "warnings": [
    "Row 12: therapist_name 'John' not found in employees table"
  ]
}
```

---

## 4️⃣ **테이블별 스키마 매핑**

### Bookings

```
Excel Column        → DB Field          Type      Required
─────────────────────────────────────────────────────────
booking_date        → booking_date      date      ✓
therapist_name      → therapist_name    string    ✓
treatment           → treatment         string    ✓
start_time          → start_time        time      ✓
end_time            → end_time          time      ✓
guest_name          → guest_name        string    ✓
room_number         → room_number       string    ✓
pay                 → pay               decimal   ✗
tip                 → tip               decimal   ✗
status              → status            enum      ✗
```

### Employees

```
Excel Column        → DB Field          Type      Required
─────────────────────────────────────────────────────────
name                → name              string    ✓
employee_type       → employee_type     string    ✓
phone               → phone             string    ✗
email               → email             email     ✗
is_active           → is_active         boolean   ✗
hire_date           → hire_date         date      ✗
```

### Expenses

```
Excel Column        → DB Field          Type      Required
─────────────────────────────────────────────────────────
date                → date              date      ✓
category            → category          string    ✓
amount              → amount            decimal   ✓
vendor              → vendor            string    ✗
description         → description       string    ✗
```

### Attendance

```
Excel Column        → DB Field          Type      Required
─────────────────────────────────────────────────────────
work_date           → work_date         date      ✓
employee_name       → employee_id       FK        ✓
clock_in            → clock_in          time      ✗
clock_out           → clock_out         time      ✗
is_absent           → is_absent         boolean   ✗
```

---

## 5️⃣ **백엔드 API**

### 1. 지원 테이블 조회

```
GET /api/import/tables

Response:
{
  "tables": [
    {
      "name": "bookings",
      "label": "예약 (Bookings)",
      "fields": [
        { "name": "booking_date", "type": "date", "required": true },
        { "name": "therapist_name", "type": "string", "required": true },
        ...
      ]
    },
    ...
  ]
}
```

### 2. Excel 파싱

```
POST /api/import/parse-excel

Request:
- multipart/form-data
- file: File (*.xlsx)
- tableName: string

Response:
{
  "headers": ["booking_date", "therapist_name", "treatment", ...],
  "sampleData": [
    { "booking_date": "2026-06-02", "therapist_name": "Anna", ... },
    { "booking_date": "2026-06-02", "therapist_name": "Fatima", ... },
    { "booking_date": "2026-06-03", "therapist_name": "Julia", ... }
  ],
  "totalRows": 150,
  "suggestedMapping": {
    "A": { "header": "booking_date", "dbField": "booking_date" },
    ...
  }
}
```

### 3. 매핑 검증

```
POST /api/import/validate-mapping

Request:
{
  "tableName": "bookings",
  "file": File,
  "mapping": ColumnMapping
}

Response:
{
  "isValid": true,
  "warnings": [
    "Row 5: booking_date format invalid",
    "Row 12: therapist_name not found"
  ],
  "previewData": [
    { "booking_date": "2026-06-02", "therapist_name": "Anna", ... },
    ...
  ]
}
```

### 4. 임포트 실행

```
POST /api/import/execute

Request:
{
  "tableName": "bookings",
  "file": File,
  "mapping": ColumnMapping,
  "mode": "replace" | "append" | "update"  // default: append
}

Response (Stream with progress):
{
  "progress": 45,  // 0-100
  "processedRows": 45,
  "totalRows": 100,
  "currentStatus": "Importing row 45/100...",
  "errors": [
    { "row": 5, "message": "Invalid date" }
  ]
}

Final Response:
{
  "success": true,
  "result": ImportResult
}
```

---

## 6️⃣ **Frontend UI**

### ExcelImportPage.tsx

```
┌─────────────────────────────────────────────────────┐
│ Settings > Import Data                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Step 1: Select Table                              │
│ ┌──────────────────────────────────────────────┐  │
│ │ [Bookings ▼]                                 │  │
│ │ [Employees]  [Expenses]  [Attendance]        │  │
│ │ [Companies]  [Guides]                        │  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
│ Step 2: Upload File                               │
│ ┌──────────────────────────────────────────────┐  │
│ │ 📁 Drag & Drop Excel file here               │  │
│ │    or [Browse]                               │  │
│ │                                              │  │
│ │ Supported: .xlsx, .xls, .csv                │  │
│ │ Max size: 10MB                              │  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
│ Step 3: Column Mapping                           │
│ ┌──────────────────────────────────────────────┐  │
│ │ Excel Column      →  Database Field         │  │
│ │ [A: booking_date]  → [booking_date ▼]       │  │
│ │ [B: therapist]     → [therapist_name ▼]     │  │
│ │ [C: treatment]     → [treatment ▼]          │  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
│ Step 4: Preview & Validate                        │
│ ┌──────────────────────────────────────────────┐  │
│ │ Sample Data (5 rows):                        │  │
│ │ booking_date | therapist | treatment | ...  │  │
│ │ 2026-06-02   | Anna      | Swedish   | ...  │  │
│ │ 2026-06-02   | Fatima    | Thai      | ...  │  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
│ ⚠️ Warnings:                                       │
│ - Row 5: Invalid date format                      │
│ - Row 12: Required field empty                    │
│                                                     │
│ [Cancel]  [Previous]  [Next]  [Import]           │
└─────────────────────────────────────────────────────┘
```

### Progress (During Import)

```
┌─────────────────────────────────────────────────────┐
│ Importing: Bookings                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Progress: 45/100 rows (45%)                       │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│                                                     │
│ Status: Processing row 45...                      │
│ Time elapsed: 1m 23s                              │
│ Estimated time: 3m remaining                      │
│                                                     │
│ ✅ Success: 42 rows                               │
│ ❌ Failed: 3 rows                                 │
│ ⚠️  Warning: 2 rows                               │
│                                                     │
│ [Cancel]                                           │
└─────────────────────────────────────────────────────┘
```

### Result Report

```
┌─────────────────────────────────────────────────────┐
│ Import Complete! ✅                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Summary:                                           │
│ Total rows: 100                                   │
│ Successful: 98 ✅                                 │
│ Failed: 2 ❌                                      │
│ Duration: 2m 30s                                  │
│                                                     │
│ Failed Rows:                                       │
│ ┌─────────────────────────────────────────────┐  │
│ │ Row # | Error Message                       │  │
│ ├─────────────────────────────────────────────┤  │
│ │ 5    | Invalid date format: 2026-99-99      │  │
│ │ 42   | Required field empty: therapist_name │  │
│ └─────────────────────────────────────────────┘  │
│                                                     │
│ [📥 Download Error Log]  [New Import]  [Done]    │
└─────────────────────────────────────────────────────┘
```

---

## 7️⃣ **에러 처리**

### 검증 규칙

```python
def validate_row(row, mapping, db_session):
    errors = []
    
    # 1. 필수 필드 체크
    for field in mapping.required_fields:
        if not row.get(field):
            errors.append(f"Required field '{field}' is empty")
    
    # 2. 데이터 타입 검증
    for field, data_type in mapping.types.items():
        if data_type == 'date':
            try:
                datetime.strptime(row[field], '%Y-%m-%d')
            except:
                errors.append(f"Invalid date format: {row[field]}")
        elif data_type == 'number':
            try:
                float(row[field])
            except:
                errors.append(f"Invalid number: {row[field]}")
    
    # 3. 외래 키 검증 (FK 필드)
    if 'therapist_name' in row:
        therapist = db_session.query(Therapist).filter_by(
            name=row['therapist_name']
        ).first()
        if not therapist:
            errors.append(f"Therapist '{row['therapist_name']}' not found")
    
    # 4. 중복 체크 (unique 필드)
    if mapping.has_unique_check:
        existing = db_session.query(Booking).filter_by(
            booking_date=row['booking_date'],
            therapist_name=row['therapist_name']
        ).first()
        if existing:
            errors.append("Duplicate booking already exists")
    
    return errors
```

### 에러 응답

```json
{
  "success": false,
  "errors": [
    {
      "rowNumber": 5,
      "message": "Invalid date format: 2026-99-99",
      "severity": "error"
    },
    {
      "rowNumber": 12,
      "message": "Required field 'therapist_name' is empty",
      "severity": "error"
    },
    {
      "rowNumber": 20,
      "message": "Therapist 'Unknown' not found in database",
      "severity": "warning"
    }
  ],
  "processedRows": 4,
  "failedAt": "Row 5"
}
```

---

## 8️⃣ **구현 체크리스트**

### Frontend (5개 파일)
- [ ] ExcelImportPage.tsx (메인 페이지, 4 Step UI)
- [ ] ExcelFileUpload.tsx (파일 업로드, 드래그&드롭)
- [ ] ColumnMappingUI.tsx (컬럼 매핑)
- [ ] ImportPreview.tsx (미리보기 & 검증)
- [ ] ImportProgressBar.tsx (진행 상황 및 결과)

### Backend (3개 파일)
- [ ] excel_import_service.py (파싱, 검증, 저장 로직)
- [ ] excel_import_router.py (API 엔드포인트)
- [ ] excel_import_models.py (데이터 모델)

### Database
- [ ] 마이그레이션: 임포트 로그 테이블 (선택사항)

### Tests
- [ ] 단위 테스트: 데이터 검증
- [ ] 통합 테스트: 엔드투엔드 임포트
- [ ] 샘플 Excel 파일 생성

---

## 9️⃣ **타임라인**

```
Frontend Components    : 1-2시간
Backend API           : 1-2시간
Integration & Tests   : 30분-1시간
──────────────────────────────
Total                 : 2.5-5시간
```

---

**설계 완료!** 구현을 시작할까요? 🚀
