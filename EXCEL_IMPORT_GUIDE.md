# Excel Import API 통합 가이드

## 📋 목차

1. [개요](#개요)
2. [아키텍처](#아키텍처)
3. [API 엔드포인트](#api-엔드포인트)
4. [백엔드 통합](#백엔드-통합)
5. [프론트엔드 통합](#프론트엔드-통합)
6. [사용 예시](#사용-예시)
7. [에러 처리](#에러-처리)
8. [테스트](#테스트)

---

## 개요

Excel Import API는 ElSpa 관리 시스템에서 엑셀 파일을 통해 데이터를 대량으로 임포트할 수 있는 기능을 제공합니다.

### 주요 기능

- **파일 파싱**: 엑셀 파일의 헤더와 데이터 추출
- **매핑 제안**: 엑셀 컬럼과 DB 필드의 자동 매핑
- **검증**: 데이터 타입, 필수 필드, 유효성 검사
- **프리뷰**: 변환된 데이터 미리보기
- **스트리밍 임포트**: 진행 상황을 실시간으로 반환
- **에러 처리**: 부분 실패 지원 및 상세 에러 보고

### 지원 테이블

| 테이블명 | 설명 |
|---------|------|
| `employees` | 직원 (급여, 커미션 등) |
| `therapists` | 테라피스트 |
| `customers` | 고객 |
| `expense_categories` | 지출 카테고리 |
| `beds` | 침대/베드 |

---

## 아키텍처

### 시스템 흐름도

```
┌─────────────────────────────────────────────────────┐
│ 프론트엔드 (React/Next.js)                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 1. 파일 선택 & 검증                                │
│    ↓                                                │
│ 2. GET /api/import/tables                          │
│    (지원 테이블 목록 조회)                          │
│    ↓                                                │
│ 3. POST /api/import/parse-excel                    │
│    (헤더, 샘플, 자동 매핑)                         │
│    ↓                                                │
│ 4. POST /api/import/validate-mapping               │
│    (데이터 검증, 미리보기)                         │
│    ↓                                                │
│ 5. POST /api/import/execute (SSE)                  │
│    (스트리밍 진행 상황)                            │
│                                                     │
└─────────────────────────────────────────────────────┘
         │
         │ HTTP/REST
         ↓
┌─────────────────────────────────────────────────────┐
│ 백엔드 (FastAPI)                                    │
├─────────────────────────────────────────────────────┤
│ app/routers/excel_import_router.py                  │
│ ├─ GET /api/import/tables                          │
│ ├─ POST /api/import/parse-excel                    │
│ ├─ POST /api/import/validate-mapping               │
│ └─ POST /api/import/execute (SSE)                  │
│                                                     │
│ 각 엔드포인트는:                                    │
│ • 파일 유효성 검사                                  │
│ • 엑셀 파싱 (openpyxl)                             │
│ • 데이터 검증 및 타입 변환                         │
│ • DB 저장 및 결과 반환                             │
│                                                     │
└─────────────────────────────────────────────────────┘
         │
         │ SQLAlchemy ORM
         ↓
┌─────────────────────────────────────────────────────┐
│ PostgreSQL Database                                 │
├─────────────────────────────────────────────────────┤
│ employees, therapists, customers, ...               │
└─────────────────────────────────────────────────────┘
```

---

## API 엔드포인트

### 1. GET /api/import/tables

지원하는 모든 테이블 목록 및 필드 정보를 반환합니다.

#### 요청

```http
GET /api/import/tables
Authorization: Bearer {access_token}
```

#### 응답 (200 OK)

```json
{
  "tables": [
    {
      "name": "employees",
      "display_name": "직원 (Employees)",
      "description": "직원 마스터 데이터",
      "primary_key": "id",
      "fields": {
        "name": {
          "name": "name",
          "type": "string",
          "required": true,
          "max_length": 255
        },
        "phone": {
          "name": "phone",
          "type": "string",
          "required": true,
          "max_length": 20
        },
        "employee_type": {
          "name": "employee_type",
          "type": "enum",
          "required": true,
          "values": ["therapist", "nail", "driver", "maintenance", "hollys", "manager"]
        },
        "base_salary": {
          "name": "base_salary",
          "type": "decimal",
          "required": false
        }
      }
    }
  ],
  "total_count": 5
}
```

---

### 2. POST /api/import/parse-excel

엑셀 파일을 파싱하고 헤더, 샘플 데이터, 자동 매핑 제안을 반환합니다.

#### 요청

```http
POST /api/import/parse-excel
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file=@employees.xlsx
table_name=employees
```

#### 요청 매개변수

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `file` | File | ✓ | Excel 파일 (.xlsx, .xls) |
| `table_name` | string | ✓ | 대상 테이블명 |

#### 응답 (200 OK)

```json
{
  "headers": ["Name", "Phone", "Employee Type", "Base Salary"],
  "sample_data": [
    {
      "Name": "John Doe",
      "Phone": "010-1234-5678",
      "Employee Type": "therapist",
      "Base Salary": 2000000
    },
    {
      "Name": "Jane Smith",
      "Phone": "010-2345-6789",
      "Employee Type": "nail",
      "Base Salary": 1800000
    }
  ],
  "total_rows": 50,
  "suggested_mapping": {
    "Name": "name",
    "Phone": "phone",
    "Employee Type": "employee_type",
    "Base Salary": "base_salary"
  }
}
```

#### 에러 응답

```json
{
  "detail": "지원하지 않는 파일 형식: test.pdf. 허용 형식: {'.xlsx', '.xls'}"
}
```

---

### 3. POST /api/import/validate-mapping

제공된 매핑으로 데이터를 검증하고 변환된 데이터를 미리보기로 반환합니다.

#### 요청

```http
POST /api/import/validate-mapping
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file=@employees.xlsx
table_name=employees
mapping={"Name":"name","Phone":"phone","Employee Type":"employee_type"}
```

#### 요청 매개변수

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `file` | File | ✓ | Excel 파일 |
| `table_name` | string | ✓ | 대상 테이블명 |
| `mapping` | string (JSON) | ✓ | 엑셀 컬럼 → DB 필드 매핑 |

#### 응답 (200 OK)

```json
{
  "is_valid": true,
  "errors": [],
  "warnings": [
    {
      "row_number": 3,
      "column": "Phone",
      "warning_message": "유효하지 않은 전화번호 형식",
      "value": "123"
    }
  ],
  "preview_data": [
    {
      "name": "John Doe",
      "phone": "010-1234-5678",
      "employee_type": "therapist",
      "base_salary": 2000000
    }
  ],
  "total_rows": 50
}
```

#### 검증 규칙

- **필수 필드**: `required: true`인 필드에 값이 없으면 에러
- **타입 검증**: 필드 타입에 맞지 않으면 에러
- **Enum 검증**: enum 필드는 허용값 목록에 있어야 함
- **길이 제한**: string 필드는 max_length를 초과하면 에러
- **범위 검증**: numeric 필드는 양수만 허용

---

### 4. POST /api/import/execute

실제 데이터를 DB에 저장합니다. Server-Sent Events(SSE)로 진행 상황을 스트리밍합니다.

#### 요청

```http
POST /api/import/execute
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file=@employees.xlsx
table_name=employees
mapping={"Name":"name","Phone":"phone","Employee Type":"employee_type"}
skip_errors=false
```

#### 요청 매개변수

| 매개변수 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `file` | File | ✓ | - | Excel 파일 |
| `table_name` | string | ✓ | - | 대상 테이블명 |
| `mapping` | string (JSON) | ✓ | - | 매핑 정보 |
| `skip_errors` | boolean | ✗ | false | 에러 행 건너뛰기 |

#### 응답 (200 OK, SSE)

```
event: progress
data: {"row_number": 2, "status": "success", "message": "저장 성공"}

event: progress
data: {"row_number": 3, "status": "success", "message": "저장 성공"}

event: progress
data: {"row_number": 4, "status": "failed", "message": "검증 실패", "errors": {"phone": "필수 필드입니다"}}

event: complete
data: {"total_rows": 100, "success_count": 98, "failed_count": 2, "skipped_count": 0, "execution_time_seconds": 5.23, "errors": [...]}
```

---

## 백엔드 통합

### 1. 라우터 등록

`main.py`에 라우터를 등록합니다.

```python
from fastapi import FastAPI
from app.routers.excel_import_router import router as excel_import_router

app = FastAPI()

# 라우터 등록
app.include_router(excel_import_router)
```

### 2. 모델 확인

지원되는 테이블에 대한 SQLAlchemy 모델이 필요합니다.

```python
# app/models/payroll.py
class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    employee_type = Column(String(50), nullable=False)
    # ...

# app/models/therapist.py
class Therapist(Base):
    __tablename__ = "therapists"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    # ...
```

### 3. 데이터베이스 세션

라우터는 `get_db` dependency를 사용합니다. `app/database.py`에서 세션을 제공해야 합니다.

```python
from app.database import get_db

# 라우터에서 사용
@router.post("/execute")
async def execute_import(
    # ...
    db: Session = Depends(get_db)
):
    # db를 사용하여 모델에 저장
    pass
```

### 4. 인증 확인

모든 엔드포인트는 `get_current_user` dependency를 사용합니다.

```python
from app.auth.dependencies import get_current_user, TokenUser

@router.get("/tables")
async def get_tables(
    current_user: TokenUser = Depends(get_current_user)
):
    # current_user.user_id, current_user.role 등 사용 가능
    pass
```

### 5. 로깅

각 엔드포인트는 로깅을 포함합니다.

```python
logger.info(f"[PARSE_EXCEL] table={table_name}, headers={len(headers)}, rows={total_rows}, user={current_user.user_id}")
```

---

## 프론트엔드 통합

### 1. 클라이언트 초기화

```typescript
import excelImportClient from '@/lib/api/excel-import-client';

// 클라이언트 자동 생성됨 (싱글톤)
// 또는 수동으로 생성
const client = new ExcelImportClient();
```

### 2. 테이블 목록 조회

```typescript
const response = await excelImportClient.getTables();
console.log(response.tables);
```

### 3. 파일 파싱

```typescript
const file = new File([...], 'employees.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

const parseResult = await excelImportClient.parseExcel(file, 'employees');
console.log(parseResult.headers);
console.log(parseResult.suggested_mapping);
```

### 4. 매핑 검증

```typescript
const mapping = {
  'Name': 'name',
  'Phone': 'phone',
  'Employee Type': 'employee_type'
};

const validateResult = await excelImportClient.validateMapping(file, 'employees', mapping);

if (validateResult.is_valid) {
  console.log('검증 통과');
  console.log(validateResult.preview_data);
} else {
  console.log('검증 실패:', validateResult.errors);
}
```

### 5. 임포트 실행 (스트리밍)

```typescript
try {
  const stats = await excelImportClient.executeImport(
    file,
    'employees',
    mapping,
    {
      skipErrors: false,
      onProgress: (event) => {
        console.log(`행 ${event.row_number}: ${event.status}`);
        // UI 업데이트 (프로그레스 바 등)
      },
      onComplete: (stats) => {
        console.log(`완료: ${stats.success_count}/${stats.total_rows} 성공`);
      },
      onError: (error) => {
        console.error('임포트 실패:', error);
      }
    }
  );
} catch (error) {
  console.error('임포트 에러:', error);
}
```

---

## 사용 예시

### 예시 1: React 컴포넌트에서 파일 임포트

```typescript
import React, { useState } from 'react';
import excelImportClient, { ExcelImportClient } from '@/lib/api/excel-import-client';

export function ExcelImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState('employees');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setProgress([]);

    try {
      // 1. 파일 파싱
      const parseResult = await excelImportClient.parseExcel(file, tableName as any);
      setProgress(prev => [...prev, `파일 파싱 완료: ${parseResult.total_rows}행`]);

      // 2. 매핑 검증
      const mapping = parseResult.suggested_mapping;
      const validateResult = await excelImportClient.validateMapping(file, tableName as any, mapping);
      
      if (!validateResult.is_valid) {
        setProgress(prev => [...prev, `검증 실패: ${validateResult.errors.length}개 에러`]);
        return;
      }

      setProgress(prev => [...prev, `검증 통과, 임포트 시작...`]);

      // 3. 임포트 실행
      const stats = await excelImportClient.executeImport(
        file,
        tableName as any,
        mapping,
        {
          skipErrors: true,
          onProgress: (event) => {
            if (event.status === 'success') {
              setProgress(prev => [...prev, `✓ 행 ${event.row_number} 저장`]);
            }
          },
          onComplete: (stats) => {
            setProgress(prev => [...prev, `완료: ${stats.success_count}/${stats.total_rows} 성공`]);
          }
        }
      );

    } catch (error) {
      setProgress(prev => [...prev, `에러: ${(error as Error).message}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept=".xlsx,.xls" />
      <select value={tableName} onChange={(e) => setTableName(e.target.value)}>
        <option value="employees">직원</option>
        <option value="therapists">테라피스트</option>
        <option value="customers">고객</option>
      </select>
      <button onClick={handleImport} disabled={loading || !file}>
        {loading ? '임포트 중...' : '임포트'}
      </button>
      
      <div>
        {progress.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div>
    </div>
  );
}
```

### 예시 2: 자동 매핑 및 미리보기

```typescript
async function previewImport(file: File, tableName: string) {
  // 1. 파일 파싱으로 자동 매핑 제안 받기
  const parseResult = await excelImportClient.parseExcel(file, tableName as any);
  
  // 2. 제안된 매핑 검증
  const validateResult = await excelImportClient.validateMapping(
    file,
    tableName as any,
    parseResult.suggested_mapping
  );

  return {
    headers: parseResult.headers,
    suggested_mapping: parseResult.suggested_mapping,
    preview_data: validateResult.preview_data,
    is_valid: validateResult.is_valid,
    errors: validateResult.errors,
    warnings: validateResult.warnings
  };
}
```

---

## 에러 처리

### 파일 검증 에러

```typescript
import { validateExcelFile } from '@/lib/api/excel-import-client';

const file = inputElement.files?.[0];
if (file) {
  const result = validateExcelFile(file);
  if (!result.valid) {
    console.error(result.error); // "지원하지 않는 파일 형식입니다..."
  }
}
```

### API 에러 처리

```typescript
try {
  const result = await excelImportClient.parseExcel(file, 'employees');
} catch (error) {
  if (error instanceof Error) {
    console.error('파싱 실패:', error.message);
  }
}
```

### 검증 에러

```typescript
const result = await excelImportClient.validateMapping(file, 'employees', mapping);

if (!result.is_valid) {
  result.errors.forEach(error => {
    console.error(`행 ${error.row_number}, 컬럼 "${error.column}": ${error.error_message}`);
  });
}
```

---

## 테스트

### 백엔드 테스트

```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_tables():
    response = client.get(
        "/api/import/tables",
        headers={"Authorization": "Bearer test_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "tables" in data
    assert data["total_count"] > 0

def test_parse_excel():
    with open("test_data.xlsx", "rb") as f:
        response = client.post(
            "/api/import/parse-excel",
            files={"file": f},
            params={"table_name": "employees"},
            headers={"Authorization": "Bearer test_token"}
        )
    assert response.status_code == 200
    data = response.json()
    assert "headers" in data
    assert "sample_data" in data
```

### 프론트엔드 테스트

```typescript
import { describe, it, expect, vi } from 'vitest';
import excelImportClient from '@/lib/api/excel-import-client';

describe('ExcelImportClient', () => {
  it('should get tables', async () => {
    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tables: [], total_count: 0 })
      })
    );

    const result = await excelImportClient.getTables();
    expect(result.tables).toBeDefined();
  });
});
```

---

## 주의사항

1. **파일 크기 제한**: 최대 10MB
2. **지원 형식**: .xlsx, .xls만 가능
3. **헤더 필수**: 첫 번째 행은 헤더여야 함
4. **빈 행 무시**: 모든 셀이 비어있는 행은 처리하지 않음
5. **청크 처리**: 대용량 파일은 100행 단위로 처리됨
6. **인증 필수**: 모든 엔드포인트는 JWT 토큰 필요

---

## 마이그레이션 체크리스트

- [ ] `main.py`에 라우터 등록
- [ ] 필요한 모델 확인 및 생성
- [ ] `openpyxl` 패키지 설치: `pip install openpyxl`
- [ ] 프론트엔드 클라이언트 임포트
- [ ] 임포트 폼/UI 컴포넌트 생성
- [ ] 에러 처리 구현
- [ ] 통합 테스트 작성
- [ ] 문서화 및 배포

---

**최종 업데이트**: 2026-06-02  
**작성자**: jitnet57 (kang jichul)  
**버전**: 1.0
