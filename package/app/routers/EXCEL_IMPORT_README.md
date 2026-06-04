# Excel Import Router 구현 가이드

## 📋 파일 구조

```
elspa/
├── app/
│   ├── routers/
│   │   └── excel_import_router.py          ← 메인 라우터 (4개 엔드포인트)
│   ├── schemas/
│   │   └── excel_import.py                 ← Pydantic 스키마
│   ├── models/
│   │   ├── payroll.py                      (Employee, PayGroup 등)
│   │   ├── therapist.py                    (Therapist)
│   │   ├── customer.py                     (Customer)
│   │   ├── financial.py                    (ExpenseCategory)
│   │   └── bed.py                          (Bed)
│   ├── auth/
│   │   ├── dependencies.py                 (get_current_user)
│   │   └── jwt.py                          (token 관리)
│   └── database.py                         (get_db, SessionLocal)
│
├── frontend/
│   └── src/
│       ├── lib/
│       │   └── api/
│       │       └── excel-import-client.ts  ← TypeScript 클라이언트
│       └── app/
│           └── admin/
│               └── components/
│                   └── ExcelImportDialog.tsx ← React 컴포넌트
│
├── main.py                                 (FastAPI 앱)
├── EXCEL_IMPORT_GUIDE.md                   (통합 가이드)
└── EXCEL_IMPORT_README.md                  (이 파일)
```

---

## 🚀 빠른 시작

### 1단계: 백엔드 설정

#### 1-1. 필수 패키지 설치

```bash
pip install openpyxl
pip install fastapi
pip install sqlalchemy
```

#### 1-2. main.py에 라우터 등록

```python
from fastapi import FastAPI
from app.routers.excel_import_router import router as excel_import_router

app = FastAPI()

# 라우터 등록
app.include_router(excel_import_router)

# 다른 라우터들...
app.include_router(other_router)
```

#### 1-3. 모델 확인

필요한 모델들이 다음과 같이 정의되어 있는지 확인:

```python
# app/models/payroll.py
class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    employee_type = Column(String(50), nullable=False)
    pay_group = Column(String(50), nullable=False)
    base_salary = Column(Numeric(10, 2))
    commission_rate = Column(Numeric(5, 2))
    is_active = Column(Boolean, default=True)

# app/models/therapist.py
class Therapist(Base):
    __tablename__ = "therapists"
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    specialization = Column(String(255))
    hourly_rate = Column(Numeric(10, 2))
    is_active = Column(Boolean, default=True)
```

### 2단계: 프론트엔드 설정

#### 2-1. 클라이언트 import

```typescript
import excelImportClient from '@/lib/api/excel-import-client';
```

#### 2-2. 컴포넌트 사용

```typescript
import { ExcelImportDialog } from '@/app/admin/components/ExcelImportDialog';

export function AdminPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button onClick={() => setDialogOpen(true)}>
        Excel 임포트
      </button>
      <ExcelImportDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={(stats) => {
          console.log('임포트 성공:', stats);
          // 데이터 새로고침 등
        }}
      />
    </>
  );
}
```

---

## 📌 API 스펙

### Endpoint 1: GET /api/import/tables

**목적**: 지원하는 모든 테이블과 필드 정보 조회

**요청**:
```http
GET /api/import/tables
Authorization: Bearer {token}
```

**응답 (200)**:
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
        ...
      }
    }
  ],
  "total_count": 5
}
```

---

### Endpoint 2: POST /api/import/parse-excel

**목적**: 엑셀 파일 파싱 및 자동 매핑 제안

**요청**:
```http
POST /api/import/parse-excel
Authorization: Bearer {token}
Content-Type: multipart/form-data

file=@data.xlsx
table_name=employees
```

**응답 (200)**:
```json
{
  "headers": ["Name", "Phone", "Type"],
  "sample_data": [
    {"Name": "John", "Phone": "010-1234-5678", "Type": "therapist"}
  ],
  "total_rows": 50,
  "suggested_mapping": {
    "Name": "name",
    "Phone": "phone",
    "Type": "employee_type"
  }
}
```

---

### Endpoint 3: POST /api/import/validate-mapping

**목적**: 매핑 검증 및 데이터 미리보기

**요청**:
```http
POST /api/import/validate-mapping
Authorization: Bearer {token}
Content-Type: multipart/form-data

file=@data.xlsx
table_name=employees
mapping={"Name":"name","Phone":"phone","Type":"employee_type"}
```

**응답 (200)**:
```json
{
  "is_valid": true,
  "errors": [],
  "warnings": [],
  "preview_data": [
    {"name": "John", "phone": "010-1234-5678", "employee_type": "therapist"}
  ],
  "total_rows": 50
}
```

---

### Endpoint 4: POST /api/import/execute (SSE)

**목적**: 실제 데이터 저장 (스트리밍 진행 상황)

**요청**:
```http
POST /api/import/execute
Authorization: Bearer {token}
Content-Type: multipart/form-data

file=@data.xlsx
table_name=employees
mapping={"Name":"name","Phone":"phone","Type":"employee_type"}
skip_errors=false
```

**응답 (200, Server-Sent Events)**:
```
event: progress
data: {"row_number": 2, "status": "success", "message": "저장 성공"}

event: progress
data: {"row_number": 3, "status": "success", "message": "저장 성공"}

event: progress
data: {"row_number": 4, "status": "failed", "message": "검증 실패", "errors": {"phone": "필수 필드"}}

event: complete
data: {"total_rows": 100, "success_count": 98, "failed_count": 2, "skipped_count": 0, "execution_time_seconds": 5.23, "errors": [...]}
```

---

## 🔧 커스터마이징

### 새로운 테이블 추가

1. **라우터의 SUPPORTED_TABLES에 추가**:

```python
SUPPORTED_TABLES = {
    # ... 기존 테이블
    "new_table": {
        "display_name": "새 테이블 (New Table)",
        "fields": {
            "field1": {"type": "string", "required": True, "max_length": 255},
            "field2": {"type": "decimal", "required": False},
            # ...
        },
        "primary_key": "id",
        "description": "새 테이블 설명"
    }
}
```

2. **모델 확인**:

```python
# app/models/new_table.py
class NewTable(Base):
    __tablename__ = "new_table"
    id = Column(Integer, primary_key=True)
    field1 = Column(String(255))
    field2 = Column(Numeric(10, 2))
```

### 검증 규칙 커스터마이징

`validate_field_value()` 함수를 수정하여 커스텀 검증 로직 추가:

```python
def validate_field_value(
    value: Any,
    field_name: str,
    field_config: Dict[str, Any],
    row_number: int
) -> tuple[Optional[Any], Optional[str], Optional[str]]:
    """필드 값 검증"""
    # 기존 검증...
    
    # 커스텀 검증
    if field_name == "phone":
        # 전화번호 형식 검증
        if not re.match(r"^\d{3}-\d{3,4}-\d{4}$", str(value)):
            return None, "유효하지 않은 전화번호 형식", None
    
    return normalized, None, None
```

### DB 저장 로직 커스터마이징

`execute_import()의 stream_import()`에서 실제 DB 저장 로직 추가:

```python
async def stream_import() -> AsyncGenerator[str, None]:
    # ... 검증 로직
    
    if not has_error:
        # DB 저장
        try:
            if table_name == "employees":
                employee = Employee(**converted_row)
                db.add(employee)
                db.commit()
            elif table_name == "therapists":
                therapist = Therapist(**converted_row)
                db.add(therapist)
                db.commit()
            # ...
            
            success_count += 1
        except Exception as e:
            db.rollback()
            failed_count += 1
            error_details.append({...})
```

---

## ⚠️ 주의사항

### 1. 파일 크기 제한

기본값: 10MB (변경 가능)

```python
MAX_FILE_SIZE = 10 * 1024 * 1024  # 바이트
```

### 2. 지원되는 파일 형식

```python
ALLOWED_EXTENSIONS = {".xlsx", ".xls"}
```

### 3. 대용량 파일 처리

청크 단위로 처리되므로 메모리 효율적:

```python
CHUNK_SIZE = 100  # 한 번에 처리할 행 수
```

### 4. 인증 필수

모든 엔드포인트는 JWT 토큰 필요:

```python
@router.get("/tables")
async def get_tables(
    current_user: TokenUser = Depends(get_current_user)
):
    pass
```

### 5. 트랜잭션 관리

DB 저장 시 적절한 롤백 처리 필요:

```python
try:
    db.add(instance)
    db.commit()
except Exception as e:
    db.rollback()
    # 에러 처리
```

---

## 🧪 테스트

### 백엔드 테스트

```python
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
    assert len(data["tables"]) > 0

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
    assert "total_rows" in data

# ... 더 많은 테스트
```

### 프론트엔드 테스트

```typescript
import { describe, it, expect, vi } from 'vitest';
import excelImportClient from '@/lib/api/excel-import-client';

describe('ExcelImportClient', () => {
  it('should validate excel file', () => {
    const file = new File([], 'test.xlsx');
    const result = validateExcelFile(file);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid file format', () => {
    const file = new File([], 'test.pdf');
    const result = validateExcelFile(file);
    expect(result.valid).toBe(false);
  });
});
```

---

## 📊 Example: 직원 데이터 임포트

### Step 1: Excel 파일 준비

```
| Name      | Phone        | Employee Type | Base Salary | Commission Rate |
|-----------|--------------|---------------|-------------|-----------------|
| 홍길동    | 010-1234-567 | therapist     | 2000000     | 10              |
| 김영희    | 010-2345-678 | nail          | 1800000     | 8               |
| 이순신    | 010-3456-789 | driver        | 2500000     |                 |
```

### Step 2: 파일 파싱

```python
# GET /api/import/tables
# → "employees" 테이블 확인

# POST /api/import/parse-excel?table_name=employees
# 응답:
# {
#   "headers": ["Name", "Phone", "Employee Type", "Base Salary", "Commission Rate"],
#   "sample_data": [...],
#   "total_rows": 3,
#   "suggested_mapping": {
#     "Name": "name",
#     "Phone": "phone",
#     "Employee Type": "employee_type",
#     "Base Salary": "base_salary",
#     "Commission Rate": "commission_rate"
#   }
# }
```

### Step 3: 매핑 검증

```python
# POST /api/import/validate-mapping
# {
#   "table_name": "employees",
#   "mapping": {
#     "Name": "name",
#     "Phone": "phone",
#     "Employee Type": "employee_type",
#     "Base Salary": "base_salary",
#     "Commission Rate": "commission_rate"
#   }
# }
#
# 응답:
# {
#   "is_valid": false,
#   "errors": [
#     {
#       "row_number": 2,
#       "column": "Phone",
#       "error_message": "유효하지 않은 전화번호 형식",
#       "value": "010-1234-567"
#     }
#   ],
#   "warnings": [...],
#   "preview_data": [...]
# }
```

### Step 4: 데이터 수정 후 재검증

파일을 수정하여 다시 검증:

```
| Name      | Phone        | Employee Type | Base Salary |
|-----------|--------------|---------------|-------------|
| 홍길동    | 010-1234-5678| therapist     | 2000000     |
| 김영희    | 010-2345-6789| nail          | 1800000     |
| 이순신    | 010-3456-7890| driver        | 2500000     |
```

### Step 5: 임포트 실행

```python
# POST /api/import/execute
# SSE로 진행 상황 스트리밍

# 응답:
# event: progress
# data: {"row_number": 2, "status": "success", "message": "저장 성공"}
#
# event: progress
# data: {"row_number": 3, "status": "success", "message": "저장 성공"}
#
# event: progress
# data: {"row_number": 4, "status": "success", "message": "저장 성공"}
#
# event: complete
# data: {
#   "total_rows": 3,
#   "success_count": 3,
#   "failed_count": 0,
#   "skipped_count": 0,
#   "execution_time_seconds": 2.45,
#   "errors": []
# }
```

---

## 🐛 트러블슈팅

### 문제 1: "지원하지 않는 테이블"

**원인**: SUPPORTED_TABLES에 테이블이 없음

**해결**:
```python
# SUPPORTED_TABLES에 테이블 추가
SUPPORTED_TABLES = {
    "new_table": {...}
}
```

### 문제 2: "필수 필드입니다" 에러

**원인**: 필드가 `required: True`이지만 Excel에서 값이 없음

**해결**:
- Excel 파일의 해당 셀에 값 입력
- 또는 라우터의 필드 정의에서 `required: False`로 변경

### 문제 3: SSE 연결이 끊김

**원인**: 네트워크 문제 또는 타임아웃

**해결**:
- 파일 크기 확인 (10MB 이하)
- 행 수 확인 (너무 많으면 청크 크기 조정)
- 네트워크 연결 확인

### 문제 4: "파일 파싱 실패"

**원인**: Excel 파일 형식 오류

**해결**:
- 파일을 xlsx로 변환 후 다시 시도
- Excel에서 파일 열기 → 저장하기로 복구
- `openpyxl` 버전 확인: `pip install --upgrade openpyxl`

---

## 📚 참고 자료

- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [openpyxl 공식 문서](https://openpyxl.readthedocs.io/)
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Pydantic 공식 문서](https://docs.pydantic.dev/)

---

## 🎯 체크리스트

구현 시 다음을 확인하세요:

- [ ] 백엔드
  - [ ] `openpyxl` 패키지 설치
  - [ ] `excel_import_router.py` 생성
  - [ ] `excel_import.py` 스키마 생성
  - [ ] `main.py`에 라우터 등록
  - [ ] 필요한 모델 확인
  - [ ] 인증 dependency 확인
  - [ ] 로깅 설정
  - [ ] 테스트 작성

- [ ] 프론트엔드
  - [ ] `excel-import-client.ts` 생성
  - [ ] `ExcelImportDialog.tsx` 컴포넌트 생성
  - [ ] API 클라이언트 import
  - [ ] 컴포넌트 통합
  - [ ] 에러 처리 구현
  - [ ] 테스트 작성

- [ ] 배포
  - [ ] 환경 변수 설정 (필요 시)
  - [ ] CORS 설정 확인
  - [ ] 파일 크기 제한 조정 (필요 시)
  - [ ] 로깅 설정
  - [ ] 모니터링 설정

---

**최종 업데이트**: 2026-06-02  
**버전**: 1.0  
**작성자**: jitnet57 (kang jichul)
