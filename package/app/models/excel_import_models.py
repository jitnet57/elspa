"""
🔄 Excel Import 데이터 모델 (SQLAlchemy + Pydantic)

기능:
  1. ColumnMapping: Excel 열 매핑 설정 (테이블별 메타데이터)
  2. ImportResult: 임포트 결과 (성공/실패/경고 로깅)
  3. ImportLog: 감시 추적 (누가, 언제, 뭘, 결과)
  4. ImportErrorDetail: 행별 에러 기록
  5. ImportWarningDetail: 행별 경고 기록

특징:
  - Enum 지원 (결제방법 등)
  - JSON 필드 (결제 데이터, 검증 결과)
  - 타임스탐프 자동 관리
  - 감시 추적(audit trail)
"""

from sqlalchemy import (
    Column, BigInteger, String, Integer, Text, DateTime,
    Boolean, JSON, Numeric, ForeignKey, func, Enum as SQLEnum,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import json

from app.database import Base


# ============================================================
# 📌 Enum 정의 (공통 타입)
# ============================================================

class DataType(str, Enum):
    """데이터 타입"""
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    DATETIME = "datetime"
    BOOLEAN = "boolean"
    JSON = "json"
    ENUM = "enum"


class ImportStatus(str, Enum):
    """임포트 상태"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    PARTIAL = "partial"  # 일부 실패
    FAILED = "failed"


class ErrorSeverity(str, Enum):
    """에러 심각도"""
    ERROR = "error"        # 행 전체 실패
    WARNING = "warning"    # 경고 (진행 가능)
    INFO = "info"          # 정보성


# ============================================================
# 📋 SQLAlchemy 모델
# ============================================================

class ColumnMapping(Base):
    """
    📌 Excel 열 매핑 설정

    각 테이블마다 Excel 파일의 어떤 열이 어느 DB 필드로 매핑되는지 정의

    예시:
      excel_column="A" (Employee 이름)
      -> db_field="name" (therapists.name)
      -> data_type=STRING, is_required=True
    """
    __tablename__ = "excel_column_mappings"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 매핑 설정
    table_name = Column(String(255), nullable=False, index=True)  # 'therapists', 'customers', etc
    excel_column = Column(String(10), nullable=False)  # 'A', 'B', 'C', 또는 'Name', 'Email'
    db_field = Column(String(255), nullable=False)  # 'name', 'email', 'phone'
    data_type = Column(SQLEnum(DataType), nullable=False, default=DataType.STRING)

    # 검증 규칙
    is_required = Column(Boolean, default=False)
    allow_duplicates = Column(Boolean, default=True)
    max_length = Column(Integer)  # STRING 타입일 때 최대 길이
    min_value = Column(Numeric(20, 2))  # INTEGER/FLOAT 타입일 때 최소값
    max_value = Column(Numeric(20, 2))  # INTEGER/FLOAT 타입일 때 최대값

    # Enum 매핑 (payment_method='card' -> 'credit_card' 같은 변환)
    enum_mapping = Column(JSON)  # { "현금": "cash", "카드": "card" }

    # 기본값
    default_value = Column(String(255))

    # 메타데이터
    description = Column(Text)  # 열 설명
    is_active = Column(Boolean, default=True)

    # 타임스탐프
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # 제약조건: 테이블+열 조합은 고유
    __table_args__ = (
        UniqueConstraint('table_name', 'db_field', name='uq_table_field'),
    )

    def __repr__(self):
        return f"<ColumnMapping({self.table_name}.{self.db_field} <- Excel:{self.excel_column})>"


class ImportLog(Base):
    """
    📌 임포트 감시 추적 (누가, 언제, 뭘, 결과)

    예시:
      user_id=5
      table_name='therapists'
      file_name='therapists_2025-06-01.xlsx'
      status=ImportStatus.SUCCESS
      total_rows=100, success_rows=100, failed_rows=0
    """
    __tablename__ = "import_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 누가
    user_id = Column(BigInteger, nullable=False, index=True)  # 임포트한 사용자

    # 뭘
    table_name = Column(String(255), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(BigInteger)  # 파일 크기

    # 상태
    status = Column(SQLEnum(ImportStatus), nullable=False, default=ImportStatus.PENDING, index=True)

    # 결과 통계
    total_rows = Column(Integer, default=0)
    success_rows = Column(Integer, default=0)
    failed_rows = Column(Integer, default=0)
    warning_rows = Column(Integer, default=0)

    # 성능
    duration_seconds = Column(Numeric(10, 2))  # 실행 시간

    # 결과 요약 (JSON)
    result_summary = Column(JSON)  # { "created": 50, "updated": 30, "skipped": 20 }
    error_summary = Column(Text)  # 주요 에러 요약

    # 관계
    error_details = relationship("ImportErrorDetail", back_populates="import_log", cascade="all, delete-orphan")
    warning_details = relationship("ImportWarningDetail", back_populates="import_log", cascade="all, delete-orphan")

    # 타임스탐프
    created_at = Column(DateTime, default=func.now(), index=True)
    completed_at = Column(DateTime)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ImportLog(user={self.user_id}, table={self.table_name}, status={self.status})>"


class ImportErrorDetail(Base):
    """
    📌 행별 에러 기록

    ImportLog와 1:N 관계
    각 실패한 행마다 구체적인 에러 메시지 저장

    예시:
      row_number=5
      field_name='email'
      error_message='Invalid email format: abc@'
      error_value='abc@'
    """
    __tablename__ = "import_error_details"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 관계
    import_log_id = Column(BigInteger, ForeignKey("import_logs.id"), nullable=False, index=True)
    import_log = relationship("ImportLog", back_populates="error_details")

    # 에러 정보
    row_number = Column(Integer, nullable=False)
    field_name = Column(String(255))  # 어느 필드에서 에러 났는지
    severity = Column(SQLEnum(ErrorSeverity), nullable=False, default=ErrorSeverity.ERROR)
    error_message = Column(Text, nullable=False)  # 상세 에러 메시지
    error_value = Column(Text)  # 에러를 일으킨 값

    # 제안
    suggested_fix = Column(Text)  # 수정 제안

    # 타임스탐프
    created_at = Column(DateTime, default=func.now())

    def __repr__(self):
        return f"<ImportErrorDetail(row={self.row_number}, field={self.field_name}, {self.error_message})>"


class ImportWarningDetail(Base):
    """
    📌 행별 경고 기록

    ImportLog와 1:N 관계
    에러는 아니지만 주의할 사항 기록

    예시:
      row_number=10
      warning_message='Duplicate phone number detected: 010-1234-5678'
      affected_fields='phone'
    """
    __tablename__ = "import_warning_details"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 관계
    import_log_id = Column(BigInteger, ForeignKey("import_logs.id"), nullable=False, index=True)
    import_log = relationship("ImportLog", back_populates="warning_details")

    # 경고 정보
    row_number = Column(Integer, nullable=False)
    warning_type = Column(String(100))  # 'duplicate', 'deprecated_format', 'missing_optional'
    warning_message = Column(Text, nullable=False)
    affected_fields = Column(String(500))  # 영향받는 필드들 (쉼표 구분)

    # 타임스탐프
    created_at = Column(DateTime, default=func.now())

    def __repr__(self):
        return f"<ImportWarningDetail(row={self.row_number}, type={self.warning_type})>"


# ============================================================
# 📊 Pydantic 스키마 (요청/응답)
# ============================================================

class ColumnMappingSchema(BaseModel):
    """✅ ColumnMapping 조회/생성"""
    id: Optional[int] = None
    table_name: str = Field(..., description="대상 테이블명: therapists, customers, etc")
    excel_column: str = Field(..., description="Excel 열: A, B, C 또는 Name, Email")
    db_field: str = Field(..., description="DB 필드명")
    data_type: DataType = Field(default=DataType.STRING)
    is_required: bool = Field(default=False)
    allow_duplicates: bool = Field(default=True)
    max_length: Optional[int] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    enum_mapping: Optional[Dict[str, str]] = None
    default_value: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = Field(default=True)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ImportErrorDetailSchema(BaseModel):
    """✅ ImportErrorDetail 조회"""
    id: Optional[int] = None
    import_log_id: int
    row_number: int
    field_name: Optional[str] = None
    severity: ErrorSeverity = ErrorSeverity.ERROR
    error_message: str
    error_value: Optional[str] = None
    suggested_fix: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ImportWarningDetailSchema(BaseModel):
    """✅ ImportWarningDetail 조회"""
    id: Optional[int] = None
    import_log_id: int
    row_number: int
    warning_type: Optional[str] = None
    warning_message: str
    affected_fields: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ImportLogCreateSchema(BaseModel):
    """✅ 임포트 시작 (로그 생성)"""
    user_id: int
    table_name: str
    file_name: str
    file_size_bytes: Optional[int] = None

    @validator('table_name')
    def validate_table_name(cls, v):
        allowed_tables = ['therapists', 'customers', 'bookings', 'transactions', 'staff']
        if v not in allowed_tables:
            raise ValueError(f"table_name must be one of {allowed_tables}")
        return v


class ImportLogUpdateSchema(BaseModel):
    """✅ 임포트 진행 중 (진행률/상태 업데이트)"""
    status: ImportStatus
    success_rows: int = 0
    failed_rows: int = 0
    warning_rows: int = 0
    duration_seconds: Optional[float] = None
    result_summary: Optional[Dict[str, Any]] = None
    error_summary: Optional[str] = None


class ImportLogSchema(BaseModel):
    """✅ 임포트 로그 전체 조회"""
    id: Optional[int] = None
    user_id: int
    table_name: str
    file_name: str
    file_size_bytes: Optional[int] = None
    status: ImportStatus
    total_rows: int = 0
    success_rows: int = 0
    failed_rows: int = 0
    warning_rows: int = 0
    duration_seconds: Optional[float] = None
    result_summary: Optional[Dict[str, Any]] = None
    error_summary: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_details: List[ImportErrorDetailSchema] = Field(default_factory=list)
    warning_details: List[ImportWarningDetailSchema] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ImportResultSchema(BaseModel):
    """✅ 임포트 최종 결과 (응답)"""
    import_log_id: int
    status: ImportStatus
    total_rows: int
    success_rows: int
    failed_rows: int
    warning_rows: int
    duration_seconds: float

    # 상세 정보
    success_count: int = 0
    created_count: int = 0
    updated_count: int = 0
    skipped_count: int = 0

    # 에러/경고
    errors: List[ImportErrorDetailSchema] = Field(default_factory=list)
    warnings: List[ImportWarningDetailSchema] = Field(default_factory=list)

    # 요약
    error_summary: Optional[str] = None
    result_summary: Optional[Dict[str, Any]] = None

    # 메시지
    message: str = Field(default="Import completed")

    @validator('message', always=True)
    def generate_message(cls, v, values):
        """상태에 따라 자동으로 메시지 생성"""
        status = values.get('status')
        success = values.get('success_rows', 0)
        failed = values.get('failed_rows', 0)

        if status == ImportStatus.SUCCESS:
            return f"✅ 임포트 성공: {success}개 행 처리됨"
        elif status == ImportStatus.PARTIAL:
            return f"⚠️ 부분 성공: {success}개 성공, {failed}개 실패"
        elif status == ImportStatus.FAILED:
            return f"❌ 임포트 실패: {failed}개 행 에러"
        else:
            return v


class ImportBatchSchema(BaseModel):
    """✅ 배치 임포트 요청"""
    table_name: str
    file_path: str  # 또는 file_content (base64)
    file_name: str
    user_id: int
    skip_validation: bool = Field(default=False, description="검증 건너뛰기 (위험함)")
    auto_create_missing_columns: bool = Field(default=False, description="누락된 매핑 자동 생성")


class DataValidationSchema(BaseModel):
    """✅ 데이터 검증 결과"""
    field_name: str
    is_valid: bool
    error_message: Optional[str] = None
    warning_message: Optional[str] = None
    suggested_value: Optional[str] = None
    validation_rules_applied: List[str] = Field(default_factory=list)


class RowValidationSchema(BaseModel):
    """✅ 행 검증 결과"""
    row_number: int
    is_valid: bool
    field_validations: List[DataValidationSchema] = Field(default_factory=list)
    row_errors: List[str] = Field(default_factory=list)
    row_warnings: List[str] = Field(default_factory=list)
