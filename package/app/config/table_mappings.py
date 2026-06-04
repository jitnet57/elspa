"""
============================================================
📌 모듈: Table Mappings & Schema Definitions
📋 목적: ElSpa 데이터베이스의 모든 테이블 스키마 정의
       필드, 타입, 검증, 변환 로직 중앙 집중식 관리
📅 작성일: 2026-06-02
============================================================

## 용도
- ETL 파이프라인에서 데이터 검증 & 변환
- Excel/CSV 임포트시 필드 매핑
- API 요청 검증
- 데이터 정제 & 정규화

## 구조
각 테이블마다 TableSchema 객체로 정의:
  - fields: 필드별 타입, 필수 여부, 변환 함수
  - validators: 비즈니스 로직 검증
  - unique_constraints: 중복 체크
  - foreign_keys: 관계 검증
"""

from typing import Dict, List, Optional, Any, Callable, Tuple
from dataclasses import dataclass
from datetime import datetime, date, time
from decimal import Decimal
import re
from enum import Enum


# ============================================================
# 📌 데이터 타입 정의
# ============================================================

class FieldType(str, Enum):
    """필드 데이터 타입"""
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    DECIMAL = "decimal"
    DATE = "date"
    TIME = "time"
    DATETIME = "datetime"
    BOOLEAN = "boolean"
    JSON = "json"
    TEXT = "text"


# ============================================================
# 📌 검증 함수 라이브러리
# ============================================================

class Validators:
    """공통 검증 함수 모음"""

    @staticmethod
    def validate_date_range(
        value: str,
        min_date: Optional[date] = None,
        max_date: Optional[date] = None,
        format: str = "%Y-%m-%d"
    ) -> Tuple[bool, Optional[str]]:
        """
        📋 날짜 범위 검증

        Args:
            value: "2026-06-02" 형식의 문자열
            min_date: 최소 날짜 (이전 날짜 불허)
            max_date: 최대 날짜 (미래 날짜 불허)
            format: 날짜 형식 (기본값: "%Y-%m-%d")

        Returns:
            (True, None) | (False, 에러메시지)
        """
        try:
            parsed_date = datetime.strptime(value, format).date()
        except (ValueError, TypeError) as e:
            return False, f"Invalid date format: {value} (expected {format})"

        if min_date and parsed_date < min_date:
            return False, f"Date {value} is before minimum {min_date}"

        if max_date and parsed_date > max_date:
            return False, f"Date {value} is after maximum {max_date}"

        return True, None

    @staticmethod
    def validate_numeric_range(
        value: float,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        field_name: str = "value"
    ) -> Tuple[bool, Optional[str]]:
        """
        📋 숫자 범위 검증 (양수/음수 체크)

        Args:
            value: 검증할 숫자
            min_value: 최소값 (포함)
            max_value: 최대값 (포함)
            field_name: 필드명 (에러 메시지용)

        Returns:
            (True, None) | (False, 에러메시지)
        """
        try:
            num = float(value)
        except (ValueError, TypeError):
            return False, f"{field_name} must be a number"

        if min_value is not None and num < min_value:
            return False, f"{field_name} must be >= {min_value}"

        if max_value is not None and num > max_value:
            return False, f"{field_name} must be <= {max_value}"

        return True, None

    @staticmethod
    def validate_phone(phone: str) -> Tuple[bool, Optional[str]]:
        """
        📋 전화번호 검증 (필리핀 형식)

        Format: +639171234567 또는 09171234567 또는 (02) 1234-5678
        """
        # 숫자만 추출
        digits = re.sub(r"\D", "", phone)

        # 필리핀 번호: 63 또는 0으로 시작, 총 10-13자리
        if len(digits) < 10:
            return False, "Phone number too short"
        if len(digits) > 13:
            return False, "Phone number too long"

        return True, None

    @staticmethod
    def validate_enum(
        value: str,
        allowed_values: List[str],
        field_name: str = "field"
    ) -> Tuple[bool, Optional[str]]:
        """
        📋 열거형 검증 (허용된 값만 수락)

        Args:
            value: 검증할 값
            allowed_values: 허용된 값 리스트
            field_name: 필드명

        Returns:
            (True, None) | (False, 에러메시지)
        """
        if value not in allowed_values:
            return False, f"{field_name} must be one of {allowed_values}"
        return True, None

    @staticmethod
    def validate_unique_booking(
        therapist_id: int,
        booking_date: date,
        booking_time: time,
        existing_bookings: List[Dict]
    ) -> Tuple[bool, Optional[str]]:
        """
        📋 예약 중복 검증

        같은 테라피스트, 같은 날짜, 겹치는 시간대의 예약 확인

        Args:
            therapist_id: 테라피스트 ID
            booking_date: 예약 날짜
            booking_time: 예약 시간
            existing_bookings: 기존 예약 리스트

        Returns:
            (True, None) | (False, 중복 예약 메시지)
        """
        for booking in existing_bookings:
            if (booking["therapist_id"] == therapist_id and
                booking["booking_date"] == booking_date):
                # 시간 겹침 체크는 duration_minutes 고려 필요
                return False, f"Therapist already has booking at {booking_time}"

        return True, None

    @staticmethod
    def validate_percentage(
        value: float,
        field_name: str = "percentage"
    ) -> Tuple[bool, Optional[str]]:
        """
        📋 백분율 검증 (0~100%)

        Args:
            value: 백분율 값
            field_name: 필드명

        Returns:
            (True, None) | (False, 에러메시지)
        """
        if not (0 <= value <= 100):
            return False, f"{field_name} must be between 0 and 100"
        return True, None

    @staticmethod
    def validate_time_range(
        start_time: time,
        end_time: time,
        field_name: str = "time"
    ) -> Tuple[bool, Optional[str]]:
        """
        📋 시간 범위 검증 (start < end)

        Args:
            start_time: 시작 시간
            end_time: 종료 시간
            field_name: 필드명

        Returns:
            (True, None) | (False, 에러메시지)
        """
        if start_time >= end_time:
            return False, f"{field_name}: start_time must be before end_time"
        return True, None


# ============================================================
# 📌 변환 함수 라이브러리
# ============================================================

class Transformers:
    """데이터 변환 함수 모음"""

    @staticmethod
    def to_iso_date(value: Any, format: str = "%Y-%m-%d") -> str:
        """
        🔄 ISO 8601 날짜 형식으로 변환

        입력: "2026-06-02", datetime 객체, 등
        출력: "2026-06-02"
        """
        if isinstance(value, date):
            return value.isoformat()
        if isinstance(value, str):
            try:
                parsed = datetime.strptime(value, format).date()
                return parsed.isoformat()
            except ValueError:
                return value
        return str(value)

    @staticmethod
    def to_iso_datetime(value: Any, format: str = "%Y-%m-%d %H:%M:%S") -> str:
        """
        🔄 ISO 8601 날짜-시간 형식으로 변환

        입력: "2026-06-02 14:30:00", datetime 객체, 등
        출력: "2026-06-02T14:30:00"
        """
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, str):
            try:
                parsed = datetime.strptime(value, format)
                return parsed.isoformat()
            except ValueError:
                return value
        return str(value)

    @staticmethod
    def to_iso_time(value: Any, format: str = "%H:%M:%S") -> str:
        """
        🔄 ISO 8601 시간 형식으로 변환

        입력: "14:30:00", time 객체, 등
        출력: "14:30:00"
        """
        if isinstance(value, time):
            return value.isoformat()
        if isinstance(value, str):
            try:
                parsed = datetime.strptime(value, format).time()
                return parsed.isoformat()
            except ValueError:
                return value
        return str(value)

    @staticmethod
    def normalize_phone(phone: str) -> str:
        """
        🔄 전화번호 정규화 (필리핀 형식)

        입력: "09171234567", "(02) 1234-5678", "+639171234567"
        출력: "+639171234567" (국제 표준 형식)
        """
        # 숫자만 추출
        digits = re.sub(r"\D", "", phone)

        # 0으로 시작하면 63으로 변환 (필리핀 코드)
        if digits.startswith("0"):
            digits = "63" + digits[1:]

        # 63으로 시작하지 않으면 추가
        if not digits.startswith("63"):
            digits = "63" + digits

        return f"+{digits}"

    @staticmethod
    def to_decimal(value: Any, decimal_places: int = 2) -> Decimal:
        """
        🔄 십진수로 변환 (금융 정밀도)

        입력: "1000.50", 1000.50, "1000"
        출력: Decimal("1000.50")
        """
        try:
            return Decimal(str(value)).quantize(Decimal(10) ** -decimal_places)
        except:
            return Decimal("0.00")

    @staticmethod
    def to_lower_enum(value: str) -> str:
        """
        🔄 열거형을 소문자로 변환

        입력: "CONFIRMED", "Pending", "settled"
        출력: "confirmed", "pending", "settled"
        """
        return value.lower() if value else value

    @staticmethod
    def to_duration_minutes(value: Any) -> int:
        """
        🔄 지속 시간을 분(분)으로 변환

        입력: "01:30:00", 90, "1.5 hours"
        출력: 90 (분)
        """
        if isinstance(value, int):
            return value
        if isinstance(value, str):
            # "HH:MM:SS" 형식 파싱
            if ":" in value:
                parts = value.split(":")
                hours = int(parts[0])
                minutes = int(parts[1]) if len(parts) > 1 else 0
                return hours * 60 + minutes
            # "N hours" 또는 "N minutes" 파싱
            if "hour" in value:
                hours = float(value.split()[0])
                return int(hours * 60)
            if "minute" in value:
                return int(float(value.split()[0]))
        return 0


# ============================================================
# 📌 FieldDefinition: 단일 필드 스키마
# ============================================================

@dataclass
class FieldDefinition:
    """
    단일 필드의 완전한 정의

    Attributes:
        name: 필드명 (예: "booking_date")
        field_type: FieldType 값
        required: 필수 여부
        default: 기본값
        transformer: 변환 함수 (예: Transformers.to_iso_date)
        validators: 검증 함수 리스트 (예: [Validators.validate_date_range])
        comment: 필드 설명
        example: 예시 값
    """
    name: str
    field_type: FieldType
    required: bool = True
    default: Optional[Any] = None
    transformer: Optional[Callable] = None
    validators: Optional[List[Callable]] = None
    comment: str = ""
    example: Optional[Any] = None

    def transform(self, value: Any) -> Any:
        """값 변환"""
        if value is None and not self.required:
            return self.default
        if self.transformer:
            return self.transformer(value)
        return value

    def validate(self, value: Any) -> Tuple[bool, Optional[str]]:
        """값 검증"""
        # 필수 필드 체크
        if self.required and value is None:
            return False, f"{self.name} is required"

        # 선택 필드는 None 허용
        if value is None:
            return True, None

        # 등록된 검증자 실행
        if self.validators:
            for validator in self.validators:
                is_valid, error_msg = validator(value)
                if not is_valid:
                    return False, f"{self.name}: {error_msg}"

        return True, None


# ============================================================
# 📌 TableSchema: 테이블 전체 스키마
# ============================================================

@dataclass
class TableSchema:
    """
    테이블 전체 스키마 정의

    Attributes:
        table_name: 테이블명
        fields: FieldDefinition 리스트
        unique_constraints: 고유 제약 조건 (필드 조합)
        foreign_keys: 외래키 (필드 → 다른 테이블)
        validators: 테이블 전체 검증 로직
        comment: 테이블 설명
    """
    table_name: str
    fields: List[FieldDefinition]
    unique_constraints: Optional[List[List[str]]] = None
    foreign_keys: Optional[Dict[str, Tuple[str, str]]] = None
    validators: Optional[List[Callable]] = None
    comment: str = ""

    def get_field(self, name: str) -> Optional[FieldDefinition]:
        """필드 조회"""
        for field in self.fields:
            if field.name == name:
                return field
        return None

    def validate_row(self, row: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """행 전체 검증"""
        errors = []

        # 필드별 검증
        for field in self.fields:
            value = row.get(field.name)
            is_valid, error_msg = field.validate(value)
            if not is_valid:
                errors.append(error_msg)

        # 고유 제약 조건 검증
        if self.unique_constraints:
            for constraint_fields in self.unique_constraints:
                constraint_values = tuple(row.get(f) for f in constraint_fields)
                if all(v is not None for v in constraint_values):
                    # 실제 DB 조회는 호출자가 수행
                    pass

        # 테이블 전체 검증자 실행
        if self.validators:
            for validator in self.validators:
                is_valid, error_msg = validator(row)
                if not is_valid:
                    errors.append(error_msg)

        return len(errors) == 0, errors

    def transform_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """행 전체 변환"""
        transformed = {}
        for field in self.fields:
            if field.name in row:
                transformed[field.name] = field.transform(row[field.name])
        return transformed


# ============================================================
# 📌 TABLE SCHEMAS: 각 테이블 정의
# ============================================================

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📘 Bookings 테이블
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BOOKINGS_SCHEMA = TableSchema(
    table_name="bookings",
    fields=[
        FieldDefinition(
            name="id",
            field_type=FieldType.INTEGER,
            required=False,
            comment="예약 ID (자동 생성)",
            example=1001
        ),
        FieldDefinition(
            name="customer_id",
            field_type=FieldType.INTEGER,
            required=True,
            comment="고객 ID (customers.id 외래키)",
            example=501
        ),
        FieldDefinition(
            name="therapist_id",
            field_type=FieldType.INTEGER,
            required=True,
            comment="테라피스트 ID (therapists.id 외래키)",
            example=101
        ),
        FieldDefinition(
            name="service_id",
            field_type=FieldType.INTEGER,
            required=True,
            comment="서비스 ID (services.id 외래키)",
            example=201
        ),
        FieldDefinition(
            name="booking_date",
            field_type=FieldType.DATE,
            required=True,
            transformer=Transformers.to_iso_date,
            validators=[
                lambda v: Validators.validate_date_range(
                    v,
                    min_date=date.today()
                )
            ],
            comment="예약 날짜 (ISO 8601 형식)",
            example="2026-06-15"
        ),
        FieldDefinition(
            name="booking_time",
            field_type=FieldType.TIME,
            required=True,
            transformer=Transformers.to_iso_time,
            comment="예약 시간 (HH:MM:SS)",
            example="14:30:00"
        ),
        FieldDefinition(
            name="duration_minutes",
            field_type=FieldType.INTEGER,
            required=True,
            transformer=Transformers.to_duration_minutes,
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=15, max_value=480, field_name="duration_minutes")
            ],
            comment="서비스 소요 시간 (분)",
            example=60
        ),
        FieldDefinition(
            name="location",
            field_type=FieldType.STRING,
            required=False,
            comment="서비스 위치 (고객 주소 또는 센터명)",
            example="Makati Office"
        ),
        FieldDefinition(
            name="special_request",
            field_type=FieldType.TEXT,
            required=False,
            comment="특별 요청사항",
            example="No deep pressure"
        ),
        FieldDefinition(
            name="status",
            field_type=FieldType.STRING,
            required=True,
            default="pending",
            transformer=Transformers.to_lower_enum,
            validators=[
                lambda v: Validators.validate_enum(v, ["pending", "confirmed", "completed", "cancelled"], "status")
            ],
            comment="예약 상태",
            example="confirmed"
        ),
        FieldDefinition(
            name="total_price",
            field_type=FieldType.DECIMAL,
            required=False,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=0, field_name="total_price")
            ],
            comment="총 가격 (PHP)",
            example="2500.00"
        ),
        FieldDefinition(
            name="payment_method",
            field_type=FieldType.STRING,
            required=False,
            transformer=Transformers.to_lower_enum,
            validators=[
                lambda v: Validators.validate_enum(v, ["card", "cash", "kakaopay", "gcash"], "payment_method") if v else (True, None)
            ],
            comment="결제 수단",
            example="card"
        ),
        FieldDefinition(
            name="notes",
            field_type=FieldType.TEXT,
            required=False,
            comment="내부 메모",
            example="Customer requested 3pm"
        ),
        FieldDefinition(
            name="created_at",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="생성일시 (ISO 8601)",
            example="2026-06-02T10:30:00"
        ),
        FieldDefinition(
            name="updated_at",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="수정일시",
            example="2026-06-02T10:30:00"
        ),
    ],
    unique_constraints=[
        # 같은 테라피스트의 같은 시간대 예약 방지
        ["therapist_id", "booking_date", "booking_time"]
    ],
    foreign_keys={
        "customer_id": ("customers", "id"),
        "therapist_id": ("therapists", "id"),
        "service_id": ("services", "id"),
    },
    comment="고객 예약 기록 (날짜, 시간, 테라피스트, 가격)"
)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📗 Employees (Staff) 테이블
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EMPLOYEES_SCHEMA = TableSchema(
    table_name="staffs",
    fields=[
        FieldDefinition(
            name="id",
            field_type=FieldType.INTEGER,
            required=False,
            comment="직원 ID (자동 생성)",
            example=101
        ),
        FieldDefinition(
            name="name",
            field_type=FieldType.STRING,
            required=True,
            comment="직원 이름",
            example="Maria Santos"
        ),
        FieldDefinition(
            name="phone",
            field_type=FieldType.STRING,
            required=False,
            transformer=Transformers.normalize_phone,
            validators=[
                lambda v: Validators.validate_phone(v) if v else (True, None)
            ],
            comment="연락처 (필리핀 형식)",
            example="+639171234567"
        ),
        FieldDefinition(
            name="position",
            field_type=FieldType.STRING,
            required=False,
            transformer=Transformers.to_lower_enum,
            validators=[
                lambda v: Validators.validate_enum(v, ["therapist", "massage_therapist", "manager", "staff"], "position") if v else (True, None)
            ],
            comment="직급 (therapist, manager, 등)",
            example="therapist"
        ),
        FieldDefinition(
            name="rating",
            field_type=FieldType.FLOAT,
            required=False,
            default=4.0,
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=0, max_value=5, field_name="rating")
            ],
            comment="평점 (0.0~5.0)",
            example=4.5
        ),
        FieldDefinition(
            name="total_sessions",
            field_type=FieldType.INTEGER,
            required=False,
            default=0,
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=0, field_name="total_sessions")
            ],
            comment="누적 세션 수",
            example=1500
        ),
        FieldDefinition(
            name="month_sessions",
            field_type=FieldType.INTEGER,
            required=False,
            default=0,
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=0, field_name="month_sessions")
            ],
            comment="이달 세션 수",
            example=45
        ),
        FieldDefinition(
            name="available_time",
            field_type=FieldType.STRING,
            required=False,
            default="available",
            transformer=Transformers.to_lower_enum,
            validators=[
                lambda v: Validators.validate_enum(v, ["available", "busy", "unavailable"], "available_time") if v else (True, None)
            ],
            comment="근무 상태",
            example="available"
        ),
        FieldDefinition(
            name="bio",
            field_type=FieldType.TEXT,
            required=False,
            comment="프로필 설명",
            example="Certified massage therapist with 5 years experience"
        ),
        FieldDefinition(
            name="is_active",
            field_type=FieldType.BOOLEAN,
            required=False,
            default=True,
            comment="활성 여부",
            example=True
        ),
        FieldDefinition(
            name="created_at",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="생성일시",
            example="2025-01-15T09:00:00"
        ),
        FieldDefinition(
            name="updated_at",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="수정일시",
            example="2026-06-02T14:30:00"
        ),
    ],
    unique_constraints=[
        ["name", "phone"]  # 이름과 전화번호 조합으로 중복 제거
    ],
    comment="직원/테라피스트 기본 정보 (이름, 직급, 전문 분야, 평점)"
)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📙 Expenses 테이블
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXPENSES_SCHEMA = TableSchema(
    table_name="expenses",
    fields=[
        FieldDefinition(
            name="id",
            field_type=FieldType.INTEGER,
            required=False,
            comment="지출 ID (자동 생성)",
            example=5001
        ),
        FieldDefinition(
            name="report_date",
            field_type=FieldType.DATE,
            required=True,
            transformer=Transformers.to_iso_date,
            validators=[
                lambda v: Validators.validate_date_range(v)
            ],
            comment="보고 날짜 (YYYY-MM-DD)",
            example="2026-05-21"
        ),
        FieldDefinition(
            name="vendor",
            field_type=FieldType.STRING,
            required=False,
            comment="판매처/가게명",
            example="SM Makati"
        ),
        FieldDefinition(
            name="expense_date",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="실제 지출 날짜-시간",
            example="2026-05-21T14:30:00"
        ),
        FieldDefinition(
            name="category_name",
            field_type=FieldType.STRING,
            required=True,
            default="other",
            transformer=Transformers.to_lower_enum,
            validators=[
                lambda v: Validators.validate_enum(v, [
                    "food", "transport", "supplies", "utilities",
                    "entertainment", "medical", "other"
                ], "category_name")
            ],
            comment="지출 분류",
            example="food"
        ),
        FieldDefinition(
            name="amount",
            field_type=FieldType.DECIMAL,
            required=True,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=0, field_name="amount")
            ],
            comment="금액 (PHP)",
            example="450.75"
        ),
        FieldDefinition(
            name="currency",
            field_type=FieldType.STRING,
            required=False,
            default="PHP",
            transformer=lambda v: v.upper() if v else "PHP",
            comment="통화 (기본값: PHP)",
            example="PHP"
        ),
        FieldDefinition(
            name="items_json",
            field_type=FieldType.JSON,
            required=False,
            comment="품목 배열 (JSON 문자열)",
            example='[{"item": "Coffee", "qty": 2, "price": 150}]'
        ),
        FieldDefinition(
            name="description",
            field_type=FieldType.TEXT,
            required=False,
            comment="상세 설명 (메모)",
            example="Office supplies for June"
        ),
        FieldDefinition(
            name="receipt_url",
            field_type=FieldType.STRING,
            required=False,
            comment="영수증 이미지 URL",
            example="https://cdn.example.com/receipt-2026-05-21-001.jpg"
        ),
        FieldDefinition(
            name="created_by",
            field_type=FieldType.STRING,
            required=False,
            comment="생성자",
            example="admin@example.com"
        ),
        FieldDefinition(
            name="created_at",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="생성일시",
            example="2026-05-21T16:45:00"
        ),
        FieldDefinition(
            name="updated_at",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="수정일시",
            example="2026-05-21T16:45:00"
        ),
    ],
    comment="일일 지출 보고서 (영수증 기반, 날짜별 분류)"
)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📕 Attendance 테이블
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ATTENDANCE_SCHEMA = TableSchema(
    table_name="attendances",
    fields=[
        FieldDefinition(
            name="id",
            field_type=FieldType.INTEGER,
            required=False,
            comment="출퇴근 기록 ID",
            example=3001
        ),
        FieldDefinition(
            name="therapist_id",
            field_type=FieldType.INTEGER,
            required=True,
            comment="테라피스트 ID (therapists.id 외래키)",
            example=101
        ),
        FieldDefinition(
            name="therapist_name",
            field_type=FieldType.STRING,
            required=True,
            comment="테라피스트 이름",
            example="Maria Santos"
        ),
        FieldDefinition(
            name="date",
            field_type=FieldType.DATE,
            required=True,
            transformer=Transformers.to_iso_date,
            validators=[
                lambda v: Validators.validate_date_range(v)
            ],
            comment="근무 날짜 (YYYY-MM-DD)",
            example="2026-06-02"
        ),
        FieldDefinition(
            name="checked_in_at",
            field_type=FieldType.DATETIME,
            required=True,
            transformer=Transformers.to_iso_datetime,
            comment="출근 시각 (ISO 8601)",
            example="2026-06-02T09:00:00"
        ),
        FieldDefinition(
            name="checked_out_at",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="퇴근 시각",
            example="2026-06-02T17:30:00"
        ),
        FieldDefinition(
            name="status",
            field_type=FieldType.STRING,
            required=True,
            default="checked_in",
            transformer=Transformers.to_lower_enum,
            validators=[
                lambda v: Validators.validate_enum(v, ["checked_in", "checked_out"], "status")
            ],
            comment="상태 (checked_in, checked_out)",
            example="checked_out"
        ),
        FieldDefinition(
            name="total_sessions",
            field_type=FieldType.INTEGER,
            required=False,
            default=0,
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=0, field_name="total_sessions")
            ],
            comment="이날 처리 세션 수",
            example=8
        ),
        FieldDefinition(
            name="total_hours",
            field_type=FieldType.FLOAT,
            required=False,
            default=0.0,
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=0, field_name="total_hours")
            ],
            comment="근무 시간 (시간 단위)",
            example=8.5
        ),
        FieldDefinition(
            name="total_revenue",
            field_type=FieldType.DECIMAL,
            required=False,
            default=0.0,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=0, field_name="total_revenue")
            ],
            comment="이날 총 매출 (PHP)",
            example="15000.00"
        ),
        FieldDefinition(
            name="total_commission",
            field_type=FieldType.DECIMAL,
            required=False,
            default=0.0,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=0, field_name="total_commission")
            ],
            comment="이날 총 수수료 (PHP)",
            example="3750.00"
        ),
        FieldDefinition(
            name="created_at",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="기록 생성일시",
            example="2026-06-02T09:00:00"
        ),
        FieldDefinition(
            name="updated_at",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="기록 수정일시",
            example="2026-06-02T17:30:00"
        ),
    ],
    unique_constraints=[
        ["therapist_id", "date"]  # 테라피스트당 1일 1건의 출퇴근 기록
    ],
    foreign_keys={
        "therapist_id": ("therapists", "id"),
    },
    comment="테라피스트 출퇴근 기록 (시간 추적, 일일 통계)"
)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📔 Customers 테이블
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CUSTOMERS_SCHEMA = TableSchema(
    table_name="customers",
    fields=[
        FieldDefinition(
            name="id",
            field_type=FieldType.INTEGER,
            required=False,
            comment="고객 ID (자동 생성)",
            example=501
        ),
        FieldDefinition(
            name="name",
            field_type=FieldType.STRING,
            required=True,
            comment="고객 이름",
            example="John Doe"
        ),
        FieldDefinition(
            name="phone",
            field_type=FieldType.STRING,
            required=False,
            transformer=Transformers.normalize_phone,
            validators=[
                lambda v: Validators.validate_phone(v) if v else (True, None)
            ],
            comment="연락처",
            example="+639171234567"
        ),
        FieldDefinition(
            name="email",
            field_type=FieldType.STRING,
            required=False,
            comment="이메일 주소",
            example="john.doe@example.com"
        ),
        FieldDefinition(
            name="memo",
            field_type=FieldType.TEXT,
            required=False,
            comment="고객 메모 (선호도, 알레르기 등)",
            example="Prefers morning appointments"
        ),
        FieldDefinition(
            name="created_at",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="등록일시",
            example="2025-03-10T10:15:00"
        ),
        FieldDefinition(
            name="updated_at",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="수정일시",
            example="2026-06-02T14:30:00"
        ),
    ],
    unique_constraints=[
        ["phone"],
        ["email"],
    ],
    comment="고객 기본 정보 (이름, 연락처, 이메일)"
)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📓 Therapists 테이블
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THERAPISTS_SCHEMA = TableSchema(
    table_name="therapists",
    fields=[
        FieldDefinition(
            name="id",
            field_type=FieldType.INTEGER,
            required=False,
            comment="테라피스트 ID (자동 생성)",
            example=101
        ),
        FieldDefinition(
            name="name",
            field_type=FieldType.STRING,
            required=True,
            comment="테라피스트 이름",
            example="Maria Santos"
        ),
        FieldDefinition(
            name="specialty",
            field_type=FieldType.STRING,
            required=True,
            comment="전문 분야 (스웨디시, 타이, 발마사지 등)",
            example="Swedish Massage"
        ),
        FieldDefinition(
            name="bio",
            field_type=FieldType.TEXT,
            required=False,
            comment="프로필 설명",
            example="Certified massage therapist with 5 years experience in Swedish and Thai massage"
        ),
        FieldDefinition(
            name="experience_years",
            field_type=FieldType.INTEGER,
            required=False,
            default=0,
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=0, max_value=70, field_name="experience_years")
            ],
            comment="경력 (년)",
            example=5
        ),
        FieldDefinition(
            name="rating",
            field_type=FieldType.DECIMAL,
            required=False,
            default=0,
            transformer=lambda v: Transformers.to_decimal(v, 1),
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=0, max_value=5, field_name="rating")
            ],
            comment="평점 (0.0~5.0)",
            example="4.8"
        ),
        FieldDefinition(
            name="review_count",
            field_type=FieldType.INTEGER,
            required=False,
            default=0,
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=0, field_name="review_count")
            ],
            comment="리뷰 수",
            example=156
        ),
        FieldDefinition(
            name="phone",
            field_type=FieldType.STRING,
            required=False,
            transformer=Transformers.normalize_phone,
            validators=[
                lambda v: Validators.validate_phone(v) if v else (True, None)
            ],
            comment="연락처",
            example="+639171234567"
        ),
        FieldDefinition(
            name="email",
            field_type=FieldType.STRING,
            required=False,
            comment="이메일",
            example="maria.santos@example.com"
        ),
        FieldDefinition(
            name="location",
            field_type=FieldType.STRING,
            required=False,
            comment="근무 지역",
            example="Makati, BGC"
        ),
        FieldDefinition(
            name="available",
            field_type=FieldType.BOOLEAN,
            required=False,
            default=True,
            comment="가용성 (활성 여부)",
            example=True
        ),
        FieldDefinition(
            name="created_at",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="등록일시",
            example="2025-01-15T09:00:00"
        ),
        FieldDefinition(
            name="updated_at",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="수정일시",
            example="2026-06-02T14:30:00"
        ),
    ],
    unique_constraints=[
        ["email"],
    ],
    comment="테라피스트 상세 정보 (경력, 평점, 전문 분야)"
)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📐 Company Settlement 테이블
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPANY_SETTLEMENTS_SCHEMA = TableSchema(
    table_name="company_settlements",
    fields=[
        FieldDefinition(
            name="id",
            field_type=FieldType.INTEGER,
            required=False,
            comment="정산 기록 ID",
            example=8001
        ),
        FieldDefinition(
            name="company_id",
            field_type=FieldType.INTEGER,
            required=True,
            comment="업체 ID",
            example=1001
        ),
        FieldDefinition(
            name="settlement_period_year",
            field_type=FieldType.INTEGER,
            required=True,
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=2020, max_value=2100, field_name="settlement_period_year")
            ],
            comment="정산 연도",
            example=2026
        ),
        FieldDefinition(
            name="settlement_period_month",
            field_type=FieldType.INTEGER,
            required=True,
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=1, max_value=12, field_name="settlement_period_month")
            ],
            comment="정산 월",
            example=6
        ),
        FieldDefinition(
            name="total_revenue",
            field_type=FieldType.DECIMAL,
            required=True,
            default=0,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            validators=[
                lambda v: Validators.validate_numeric_range(v, min_value=0, field_name="total_revenue")
            ],
            comment="총 매출액 (PHP)",
            example="100000.00"
        ),
        FieldDefinition(
            name="guest_revenue",
            field_type=FieldType.DECIMAL,
            required=True,
            default=0,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            comment="비회원 매출 (회수율 100%)",
            example="50000.00"
        ),
        FieldDefinition(
            name="credit_revenue",
            field_type=FieldType.DECIMAL,
            required=True,
            default=0,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            comment="외상 매출 (회수율 변동)",
            example="30000.00"
        ),
        FieldDefinition(
            name="waived_revenue",
            field_type=FieldType.DECIMAL,
            required=True,
            default=0,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            comment="제외 매출 (회수율 0%)",
            example="20000.00"
        ),
        FieldDefinition(
            name="recovery_rate",
            field_type=FieldType.DECIMAL,
            required=True,
            default=100,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            validators=[
                lambda v: Validators.validate_percentage(v, "recovery_rate")
            ],
            comment="외상 회수율 (%)",
            example="85.00"
        ),
        FieldDefinition(
            name="recovered_amount",
            field_type=FieldType.DECIMAL,
            required=True,
            default=0,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            comment="실제 회수액",
            example="25500.00"
        ),
        FieldDefinition(
            name="platform_fee_rate",
            field_type=FieldType.DECIMAL,
            required=True,
            default=25,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            validators=[
                lambda v: Validators.validate_percentage(v, "platform_fee_rate")
            ],
            comment="플랫폼 수수료율 (%)",
            example="25.00"
        ),
        FieldDefinition(
            name="platform_fee",
            field_type=FieldType.DECIMAL,
            required=True,
            default=0,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            comment="플랫폼 수수료액",
            example="18750.00"
        ),
        FieldDefinition(
            name="refund_amount",
            field_type=FieldType.DECIMAL,
            required=True,
            default=0,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            comment="환불액",
            example="1000.00"
        ),
        FieldDefinition(
            name="dispute_deduction",
            field_type=FieldType.DECIMAL,
            required=True,
            default=0,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            comment="분쟁으로 인한 차감액",
            example="500.00"
        ),
        FieldDefinition(
            name="other_deduction",
            field_type=FieldType.DECIMAL,
            required=True,
            default=0,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            comment="기타 차감액",
            example="0.00"
        ),
        FieldDefinition(
            name="total_deductions",
            field_type=FieldType.DECIMAL,
            required=True,
            default=0,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            comment="총 차감액",
            example="1500.00"
        ),
        FieldDefinition(
            name="net_settlement",
            field_type=FieldType.DECIMAL,
            required=True,
            default=0,
            transformer=lambda v: Transformers.to_decimal(v, 2),
            comment="순정산액",
            example="55250.00"
        ),
        FieldDefinition(
            name="status",
            field_type=FieldType.STRING,
            required=True,
            default="draft",
            transformer=Transformers.to_lower_enum,
            validators=[
                lambda v: Validators.validate_enum(v, ["draft", "approved", "settled", "rejected", "confirmed"], "status")
            ],
            comment="정산 상태",
            example="settled"
        ),
        FieldDefinition(
            name="settlement_date",
            field_type=FieldType.DATE,
            required=False,
            transformer=Transformers.to_iso_date,
            comment="정산 완료일",
            example="2026-07-05"
        ),
        FieldDefinition(
            name="payment_method",
            field_type=FieldType.STRING,
            required=False,
            comment="지급 방법",
            example="bank_transfer"
        ),
        FieldDefinition(
            name="payment_date",
            field_type=FieldType.DATE,
            required=False,
            transformer=Transformers.to_iso_date,
            comment="실제 지급일",
            example="2026-07-05"
        ),
        FieldDefinition(
            name="notes",
            field_type=FieldType.TEXT,
            required=False,
            comment="일반 메모",
            example=""
        ),
        FieldDefinition(
            name="dispute_notes",
            field_type=FieldType.TEXT,
            required=False,
            comment="분쟁 관련 메모",
            example=""
        ),
        FieldDefinition(
            name="created_by",
            field_type=FieldType.STRING,
            required=False,
            comment="생성자",
            example="admin"
        ),
        FieldDefinition(
            name="approved_by",
            field_type=FieldType.STRING,
            required=False,
            comment="승인자",
            example="manager"
        ),
        FieldDefinition(
            name="paid_by",
            field_type=FieldType.STRING,
            required=False,
            comment="지급 담당자",
            example="accounting"
        ),
        FieldDefinition(
            name="created_at",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="생성일시",
            example="2026-07-01T10:00:00"
        ),
        FieldDefinition(
            name="updated_at",
            field_type=FieldType.DATETIME,
            required=False,
            transformer=Transformers.to_iso_datetime,
            comment="수정일시",
            example="2026-07-05T16:30:00"
        ),
    ],
    unique_constraints=[
        ["company_id", "settlement_period_year", "settlement_period_month"]
    ],
    comment="업체 월간 정산 기록 (매출, 수수료, 순정산액)"
)


# ============================================================
# 📌 SCHEMA REGISTRY: 모든 테이블 스키마 등록
# ============================================================

SCHEMA_REGISTRY: Dict[str, TableSchema] = {
    "bookings": BOOKINGS_SCHEMA,
    "staffs": EMPLOYEES_SCHEMA,
    "expenses": EXPENSES_SCHEMA,
    "attendances": ATTENDANCE_SCHEMA,
    "customers": CUSTOMERS_SCHEMA,
    "therapists": THERAPISTS_SCHEMA,
    "company_settlements": COMPANY_SETTLEMENTS_SCHEMA,
}


# ============================================================
# 📌 편의 함수: 스키마 조회 및 검증
# ============================================================

def get_schema(table_name: str) -> Optional[TableSchema]:
    """테이블 스키마 조회"""
    return SCHEMA_REGISTRY.get(table_name)


def validate_row(table_name: str, row: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """행 전체 검증"""
    schema = get_schema(table_name)
    if not schema:
        return False, [f"Unknown table: {table_name}"]
    return schema.validate_row(row)


def transform_row(table_name: str, row: Dict[str, Any]) -> Dict[str, Any]:
    """행 전체 변환"""
    schema = get_schema(table_name)
    if not schema:
        return row
    return schema.transform_row(row)


def get_required_fields(table_name: str) -> List[str]:
    """필수 필드 목록 반환"""
    schema = get_schema(table_name)
    if not schema:
        return []
    return [f.name for f in schema.fields if f.required]


def get_field_info(table_name: str, field_name: str) -> Optional[FieldDefinition]:
    """특정 필드의 상세 정보 반환"""
    schema = get_schema(table_name)
    if not schema:
        return None
    return schema.get_field(field_name)


# ============================================================
# 📌 테스트: 샘플 데이터 검증
# ============================================================

if __name__ == "__main__":
    # 예약 데이터 검증 테스트
    print("=" * 60)
    print("SCHEMA VALIDATION TEST")
    print("=" * 60)

    # 테스트 1: 유효한 예약
    booking_data = {
        "customer_id": 501,
        "therapist_id": 101,
        "service_id": 201,
        "booking_date": "2026-06-15",
        "booking_time": "14:30:00",
        "duration_minutes": 60,
        "status": "CONFIRMED",
        "total_price": "2500.00",
        "payment_method": "card",
    }

    is_valid, errors = validate_row("bookings", booking_data)
    print(f"\n[Booking Validation]")
    print(f"Valid: {is_valid}")
    if errors:
        print(f"Errors: {errors}")

    # 테스트 2: 변환 실행
    transformed = transform_row("bookings", booking_data)
    print(f"\nTransformed Booking:")
    for key, value in transformed.items():
        print(f"  {key}: {value} ({type(value).__name__})")

    # 테스트 3: 지출 데이터 검증
    expense_data = {
        "report_date": "2026-05-21",
        "vendor": "SM Makati",
        "category_name": "FOOD",
        "amount": "450.75",
    }

    is_valid, errors = validate_row("expenses", expense_data)
    print(f"\n[Expense Validation]")
    print(f"Valid: {is_valid}")
    if errors:
        print(f"Errors: {errors}")

    # 테스트 4: 필수 필드 확인
    print(f"\n[Required Fields]")
    for table in ["bookings", "expenses", "attendances"]:
        required = get_required_fields(table)
        print(f"{table}: {required}")
