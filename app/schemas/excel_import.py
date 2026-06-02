"""
============================================================
📌 Excel Import Schemas
📋 목적: Excel 임포트 관련 Pydantic 스키마 정의
🔧 경로: app/schemas/excel_import.py
📅 작성일: 2026-06-02
============================================================
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================================
# Enums
# ============================================================

class ImportTableName(str, Enum):
    """지원하는 테이블명"""
    EMPLOYEES = "employees"
    THERAPISTS = "therapists"
    CUSTOMERS = "customers"
    EXPENSE_CATEGORIES = "expense_categories"
    BEDS = "beds"


class FieldType(str, Enum):
    """필드 타입"""
    STRING = "string"
    INTEGER = "integer"
    DECIMAL = "decimal"
    BOOLEAN = "boolean"
    ENUM = "enum"
    DATE = "date"
    DATETIME = "datetime"


class ImportStatus(str, Enum):
    """임포트 상태"""
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"


# ============================================================
# Field Definition Schemas
# ============================================================

class FieldDefinition(BaseModel):
    """필드 정의"""
    name: str = Field(..., description="필드명")
    type: FieldType = Field(..., description="필드 타입")
    required: bool = Field(False, description="필수 여부")
    description: Optional[str] = Field(None, description="필드 설명")
    values: Optional[List[str]] = Field(None, description="허용값 (enum인 경우)")
    max_length: Optional[int] = Field(None, description="최대 길이 (string인 경우)")
    default_value: Optional[Any] = Field(None, description="기본값")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "name",
                "type": "string",
                "required": True,
                "description": "직원명",
                "max_length": 255
            }
        }


class TableDefinition(BaseModel):
    """테이블 정의"""
    name: ImportTableName = Field(..., description="테이블명")
    display_name: str = Field(..., description="표시명")
    description: str = Field(..., description="설명")
    fields: List[FieldDefinition] = Field(..., description="필드 목록")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "employees",
                "display_name": "직원 (Employees)",
                "description": "직원 마스터 데이터",
                "fields": [
                    {
                        "name": "name",
                        "type": "string",
                        "required": True,
                        "max_length": 255
                    }
                ]
            }
        }


# ============================================================
# Request Schemas
# ============================================================

class GetTablesRequest(BaseModel):
    """테이블 목록 조회 요청"""
    pass


class ParseExcelRequest(BaseModel):
    """엑셀 파일 파싱 요청"""
    table_name: ImportTableName = Field(..., description="대상 테이블명")

    class Config:
        json_schema_extra = {
            "example": {
                "table_name": "employees"
            }
        }


class ValidateMappingRequest(BaseModel):
    """매핑 검증 요청"""
    table_name: ImportTableName = Field(..., description="대상 테이블명")
    mapping: Dict[str, str] = Field(..., description="엑셀 컬럼 -> DB 필드 매핑")
    preview_rows: int = Field(5, ge=1, le=20, description="미리보기 행 수")

    class Config:
        json_schema_extra = {
            "example": {
                "table_name": "employees",
                "mapping": {
                    "Name": "name",
                    "Phone": "phone",
                    "Type": "employee_type"
                },
                "preview_rows": 5
            }
        }


class ExecuteImportRequest(BaseModel):
    """임포트 실행 요청"""
    table_name: ImportTableName = Field(..., description="대상 테이블명")
    mapping: Dict[str, str] = Field(..., description="엑셀 컬럼 -> DB 필드 매핑")
    skip_errors: bool = Field(False, description="에러 행 건너뛰기 여부")

    class Config:
        json_schema_extra = {
            "example": {
                "table_name": "employees",
                "mapping": {
                    "Name": "name",
                    "Phone": "phone",
                    "Type": "employee_type"
                },
                "skip_errors": False
            }
        }


# ============================================================
# Response Schemas
# ============================================================

class GetTablesResponse(BaseModel):
    """테이블 목록 조회 응답"""
    tables: List[TableDefinition] = Field(..., description="테이블 목록")
    total_count: int = Field(..., description="총 개수")

    class Config:
        json_schema_extra = {
            "example": {
                "tables": [
                    {
                        "name": "employees",
                        "display_name": "직원 (Employees)",
                        "description": "직원 마스터 데이터",
                        "fields": []
                    }
                ],
                "total_count": 1
            }
        }


class ExcelHeader(BaseModel):
    """엑셀 헤더 정보"""
    index: int = Field(..., description="컬럼 인덱스")
    name: str = Field(..., description="헤더명")


class ParseExcelResponse(BaseModel):
    """엑셀 파일 파싱 응답"""
    headers: List[str] = Field(..., description="엑셀 헤더 목록")
    sample_data: List[Dict[str, Any]] = Field(..., description="샘플 데이터 (처음 5행)")
    total_rows: int = Field(..., description="총 행 수 (헤더 제외)")
    suggested_mapping: Dict[str, str] = Field(..., description="자동 매핑 제안")

    class Config:
        json_schema_extra = {
            "example": {
                "headers": ["Name", "Phone", "Employee Type"],
                "sample_data": [
                    {"Name": "John", "Phone": "010-1234-5678", "Employee Type": "therapist"}
                ],
                "total_rows": 50,
                "suggested_mapping": {
                    "Name": "name",
                    "Phone": "phone",
                    "Employee Type": "employee_type"
                }
            }
        }


class ValidationError(BaseModel):
    """검증 에러"""
    row_number: int = Field(..., description="행 번호")
    column: str = Field(..., description="컬럼명")
    error_message: str = Field(..., description="에러 메시지")
    value: Optional[Any] = Field(None, description="원본 값")

    class Config:
        json_schema_extra = {
            "example": {
                "row_number": 2,
                "column": "phone",
                "error_message": "필수 필드입니다",
                "value": None
            }
        }


class ValidationWarning(BaseModel):
    """검증 경고"""
    row_number: int = Field(..., description="행 번호")
    column: str = Field(..., description="컬럼명")
    warning_message: str = Field(..., description="경고 메시지")
    value: Optional[Any] = Field(None, description="원본 값")

    class Config:
        json_schema_extra = {
            "example": {
                "row_number": 2,
                "column": "base_salary",
                "warning_message": "금액이 0 이하입니다",
                "value": -100
            }
        }


class ValidateMappingResponse(BaseModel):
    """매핑 검증 응답"""
    is_valid: bool = Field(..., description="전체 검증 통과 여부")
    errors: List[ValidationError] = Field(default_factory=list, description="에러 목록")
    warnings: List[ValidationWarning] = Field(default_factory=list, description="경고 목록")
    preview_data: List[Dict[str, Any]] = Field(..., description="변환된 미리보기 데이터")
    total_rows: int = Field(..., description="총 행 수")

    class Config:
        json_schema_extra = {
            "example": {
                "is_valid": True,
                "errors": [],
                "warnings": [],
                "preview_data": [
                    {"name": "John", "phone": "010-1234-5678", "employee_type": "therapist"}
                ],
                "total_rows": 50
            }
        }


class ImportProgressEvent(BaseModel):
    """임포트 진행 이벤트"""
    row_number: int = Field(..., description="행 번호")
    status: ImportStatus = Field(..., description="상태")
    message: Optional[str] = Field(None, description="메시지")
    errors: Optional[Dict[str, str]] = Field(None, description="에러 상세")

    class Config:
        json_schema_extra = {
            "example": {
                "row_number": 2,
                "status": "success",
                "message": "저장 성공"
            }
        }


class ImportStatistics(BaseModel):
    """임포트 통계"""
    total_rows: int = Field(..., description="총 행 수")
    success_count: int = Field(..., description="성공한 행 수")
    failed_count: int = Field(..., description="실패한 행 수")
    skipped_count: int = Field(..., description="건너뛴 행 수")
    execution_time_seconds: float = Field(..., description="실행 시간 (초)")
    errors: List[Dict[str, Any]] = Field(default_factory=list, description="에러 상세")

    class Config:
        json_schema_extra = {
            "example": {
                "total_rows": 100,
                "success_count": 95,
                "failed_count": 5,
                "skipped_count": 0,
                "execution_time_seconds": 3.45,
                "errors": []
            }
        }


# ============================================================
# Mapping Schemas
# ============================================================

class FieldMapping(BaseModel):
    """필드 매핑"""
    excel_column: str = Field(..., description="엑셀 컬럼명")
    db_field: str = Field(..., description="DB 필드명")
    field_type: str = Field(..., description="필드 타입")
    is_required: bool = Field(False, description="필수 여부")

    class Config:
        json_schema_extra = {
            "example": {
                "excel_column": "Name",
                "db_field": "name",
                "field_type": "string",
                "is_required": True
            }
        }


class MappingPreview(BaseModel):
    """매핑 미리보기"""
    excel_headers: List[str] = Field(..., description="엑셀 헤더")
    mappings: List[FieldMapping] = Field(..., description="매핑 목록")
    unmapped_headers: List[str] = Field(default_factory=list, description="매핑되지 않은 헤더")

    class Config:
        json_schema_extra = {
            "example": {
                "excel_headers": ["Name", "Phone", "Unknown"],
                "mappings": [
                    {
                        "excel_column": "Name",
                        "db_field": "name",
                        "field_type": "string",
                        "is_required": True
                    }
                ],
                "unmapped_headers": ["Unknown"]
            }
        }


# ============================================================
# Batch Import Schemas
# ============================================================

class BatchImportRequest(BaseModel):
    """배치 임포트 요청"""
    imports: List[ExecuteImportRequest] = Field(..., description="임포트 요청 목록")

    class Config:
        json_schema_extra = {
            "example": {
                "imports": [
                    {
                        "table_name": "employees",
                        "mapping": {"Name": "name"},
                        "skip_errors": False
                    }
                ]
            }
        }


class BatchImportResult(BaseModel):
    """배치 임포트 결과"""
    import_id: str = Field(..., description="임포트 ID")
    table_name: ImportTableName = Field(..., description="테이블명")
    status: ImportStatus = Field(..., description="상태")
    statistics: ImportStatistics = Field(..., description="통계")

    class Config:
        json_schema_extra = {
            "example": {
                "import_id": "imp_123456",
                "table_name": "employees",
                "status": "success",
                "statistics": {
                    "total_rows": 100,
                    "success_count": 100,
                    "failed_count": 0,
                    "skipped_count": 0,
                    "execution_time_seconds": 5.0,
                    "errors": []
                }
            }
        }


# ============================================================
# History & Audit Schemas
# ============================================================

class ImportHistory(BaseModel):
    """임포트 히스토리"""
    import_id: str = Field(..., description="임포트 ID")
    table_name: ImportTableName = Field(..., description="테이블명")
    file_name: str = Field(..., description="파일명")
    file_size: int = Field(..., description="파일 크기")
    created_by: str = Field(..., description="생성자")
    created_at: datetime = Field(..., description="생성 시간")
    statistics: ImportStatistics = Field(..., description="통계")

    class Config:
        json_schema_extra = {
            "example": {
                "import_id": "imp_123456",
                "table_name": "employees",
                "file_name": "employees.xlsx",
                "file_size": 15000,
                "created_by": "admin@elspa.com",
                "created_at": "2026-06-02T10:30:00Z",
                "statistics": {
                    "total_rows": 100,
                    "success_count": 100,
                    "failed_count": 0,
                    "skipped_count": 0,
                    "execution_time_seconds": 5.0,
                    "errors": []
                }
            }
        }


class ImportHistoryResponse(BaseModel):
    """임포트 히스토리 응답"""
    history: List[ImportHistory] = Field(..., description="히스토리 목록")
    total_count: int = Field(..., description="총 개수")
    page: int = Field(..., description="페이지 번호")
    page_size: int = Field(..., description="페이지 크기")

    class Config:
        json_schema_extra = {
            "example": {
                "history": [],
                "total_count": 10,
                "page": 1,
                "page_size": 10
            }
        }
