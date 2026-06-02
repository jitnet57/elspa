"""
============================================================
📌 table_mappings 통합 가이드 & 사용 예제
📋 목적: ETL, API, 데이터 임포트에서 스키마 활용
📅 작성일: 2026-06-02
============================================================

## 통합 예제

이 파일은 table_mappings.py를 다양한 상황에서
사용하는 방법을 보여줍니다.

사용 케이스:
  1. API 요청 검증
  2. Excel/CSV 임포트
  3. ETL 파이프라인
  4. 데이터 품질 검사
  5. 자동 문서화
"""

from typing import Dict, List, Any, Optional
from app.config.table_mappings import (
    validate_row,
    transform_row,
    get_schema,
    get_required_fields,
    get_field_info,
    SCHEMA_REGISTRY,
)
from fastapi import HTTPException
import json


# ============================================================
# 📘 Use Case 1: API 요청 검증 (FastAPI Endpoint)
# ============================================================

def validate_booking_request(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    예약 생성 API 요청 검증 및 변환

    Args:
        request_data: API에서 받은 JSON 데이터

    Returns:
        검증 및 변환된 데이터

    Raises:
        HTTPException: 검증 실패 시 400 Bad Request
    """
    # 1단계: 검증
    is_valid, errors = validate_row("bookings", request_data)

    if not is_valid:
        # 에러 메시지 포맷팅
        error_details = "\n".join(errors)
        raise HTTPException(
            status_code=400,
            detail=f"Booking validation failed:\n{error_details}"
        )

    # 2단계: 데이터 변환 (정규화)
    transformed = transform_row("bookings", request_data)

    return transformed


def validate_expense_request(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """지출 생성 API 요청 검증"""
    is_valid, errors = validate_row("expenses", request_data)

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"Expense validation failed: {', '.join(errors)}"
        )

    return transform_row("expenses", request_data)


# ============================================================
# 📗 Use Case 2: Excel/CSV 행 처리
# ============================================================

def process_booking_csv_row(
    row_number: int,
    csv_row: Dict[str, str]
) -> tuple[bool, Optional[Dict[str, Any]], List[str]]:
    """
    CSV 파일의 각 행을 처리

    Args:
        row_number: 행 번호 (에러 메시지용)
        csv_row: CSV에서 읽은 행 데이터

    Returns:
        (성공 여부, 변환된 데이터, 에러 목록)
    """
    # 1단계: 검증
    is_valid, errors = validate_row("bookings", csv_row)

    if not is_valid:
        # 에러에 행 번호 추가
        error_msgs = [f"Row {row_number}: {e}" for e in errors]
        return False, None, error_msgs

    # 2단계: 변환
    transformed = transform_row("bookings", csv_row)

    return True, transformed, []


def bulk_import_attendances(
    attendance_rows: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    출퇴근 기록 대량 임포트

    Args:
        attendance_rows: 출퇴근 기록 리스트

    Returns:
        {
            "success_count": N,
            "failure_count": M,
            "valid_rows": [...],
            "errors": [{"row": 2, "errors": [...]}, ...]
        }
    """
    valid_rows = []
    failures = []

    for idx, row in enumerate(attendance_rows, start=1):
        is_valid, errors = validate_row("attendances", row)

        if not is_valid:
            failures.append({
                "row": idx,
                "errors": errors
            })
        else:
            transformed = transform_row("attendances", row)
            valid_rows.append(transformed)

    return {
        "success_count": len(valid_rows),
        "failure_count": len(failures),
        "valid_rows": valid_rows,
        "errors": failures
    }


# ============================================================
# 📙 Use Case 3: ETL 파이프라인
# ============================================================

class ETLPipeline:
    """ETL 파이프라인 기본 구조"""

    def __init__(self, table_name: str):
        self.table_name = table_name
        self.schema = get_schema(table_name)
        if not self.schema:
            raise ValueError(f"Unknown table: {table_name}")

    def extract(self, source_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract: 데이터 소스에서 읽기
        """
        print(f"[EXTRACT] Reading {len(source_data)} rows from {self.table_name}")
        return source_data

    def transform(self, raw_data: List[Dict[str, Any]]) -> tuple[List[Dict], List[Dict]]:
        """
        Transform: 데이터 정규화 및 검증

        Returns:
            (성공한 행, 실패한 행)
        """
        success = []
        failures = []

        for idx, row in enumerate(raw_data, start=1):
            is_valid, errors = validate_row(self.table_name, row)

            if not is_valid:
                failures.append({
                    "row_number": idx,
                    "data": row,
                    "errors": errors
                })
                continue

            transformed = transform_row(self.table_name, row)
            success.append(transformed)

        print(f"[TRANSFORM] {len(success)} valid, {len(failures)} invalid")
        return success, failures

    def load(self, transformed_data: List[Dict[str, Any]], db_session) -> int:
        """
        Load: 데이터베이스에 저장

        Args:
            transformed_data: 변환된 데이터
            db_session: SQLAlchemy 세션

        Returns:
            삽입된 행 수
        """
        count = 0
        try:
            # 예: 테이블별 모델 매핑
            # model_map = {
            #     "bookings": Booking,
            #     "expenses": Expense,
            #     ...
            # }
            # model = model_map[self.table_name]

            # for row in transformed_data:
            #     db_obj = model(**row)
            #     db_session.add(db_obj)
            #     count += 1

            # db_session.commit()
            print(f"[LOAD] Inserted {count} rows into {self.table_name}")
        except Exception as e:
            db_session.rollback()
            print(f"[LOAD ERROR] {e}")
            raise

        return count

    def run(self, raw_data: List[Dict[str, Any]], db_session=None) -> Dict[str, Any]:
        """
        ETL 전체 실행

        Returns:
            {
                "table": "bookings",
                "extracted": N,
                "loaded": M,
                "failures": [...],
                "status": "success" | "partial" | "failure"
            }
        """
        # 1. Extract
        extracted = self.extract(raw_data)

        # 2. Transform
        success, failures = self.transform(extracted)

        # 3. Load
        loaded_count = 0
        if success and db_session:
            loaded_count = self.load(success, db_session)

        # 결과 요약
        status = "success" if not failures else ("partial" if success else "failure")

        return {
            "table": self.table_name,
            "extracted": len(extracted),
            "loaded": loaded_count,
            "failures": failures,
            "status": status
        }


# ============================================================
# 📕 Use Case 4: 데이터 품질 검사
# ============================================================

class DataQualityChecker:
    """데이터 품질 검증 도구"""

    @staticmethod
    def check_required_fields(table_name: str, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        필수 필드 누락 확인

        Returns:
            {
                "total_rows": N,
                "missing_fields": {
                    "customer_id": 5,  # 5개 행에서 누락
                    "booking_date": 2
                },
                "affected_rows": {...}
            }
        """
        required = get_required_fields(table_name)
        missing_counts = {field: 0 for field in required}
        affected_rows = {field: [] for field in required}

        for idx, row in enumerate(rows, start=1):
            for field in required:
                if field not in row or row[field] is None:
                    missing_counts[field] += 1
                    affected_rows[field].append(idx)

        return {
            "total_rows": len(rows),
            "missing_fields": {k: v for k, v in missing_counts.items() if v > 0},
            "affected_rows": {k: v for k, v in affected_rows.items() if v}
        }

    @staticmethod
    def check_field_values(
        table_name: str,
        field_name: str,
        rows: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        특정 필드의 값 검증

        Returns:
            {
                "field": "booking_date",
                "total_rows": N,
                "valid_count": M,
                "invalid_rows": [
                    {"row": 5, "value": "invalid", "error": "..."}
                ]
            }
        """
        field = get_field_info(table_name, field_name)
        if not field:
            return {"error": f"Field not found: {field_name}"}

        valid_count = 0
        invalid_rows = []

        for idx, row in enumerate(rows, start=1):
            if field_name not in row:
                continue

            value = row[field_name]
            is_valid, error = field.validate(value)

            if is_valid:
                valid_count += 1
            else:
                invalid_rows.append({
                    "row": idx,
                    "value": value,
                    "error": error
                })

        return {
            "field": field_name,
            "total_rows": len(rows),
            "valid_count": valid_count,
            "invalid_rows": invalid_rows
        }

    @staticmethod
    def generate_report(table_name: str, rows: List[Dict[str, Any]]) -> str:
        """전체 데이터 품질 리포트 생성"""
        report = f"\n{'='*60}\n"
        report += f"Data Quality Report: {table_name}\n"
        report += f"{'='*60}\n"
        report += f"Total Rows: {len(rows)}\n\n"

        # 필수 필드 확인
        required_check = DataQualityChecker.check_required_fields(table_name, rows)
        report += "Required Fields Check:\n"
        if required_check["missing_fields"]:
            for field, count in required_check["missing_fields"].items():
                report += f"  - {field}: {count} missing\n"
        else:
            report += "  ✓ All required fields present\n"

        report += "\n"
        return report


# ============================================================
# 📔 Use Case 5: 자동 문서화
# ============================================================

class SchemaDocGenerator:
    """스키마 자동 문서화"""

    @staticmethod
    def generate_field_docs(table_name: str) -> str:
        """테이블의 모든 필드 문서 생성"""
        schema = get_schema(table_name)
        if not schema:
            return f"Unknown table: {table_name}"

        doc = f"\n# {table_name}\n\n"
        doc += f"{schema.comment}\n\n"
        doc += "## Fields\n\n"

        for field in schema.fields:
            doc += f"### {field.name}\n"
            doc += f"- **Type**: {field.field_type.value}\n"
            doc += f"- **Required**: {field.required}\n"

            if field.default is not None:
                doc += f"- **Default**: {field.default}\n"

            if field.comment:
                doc += f"- **Description**: {field.comment}\n"

            if field.example is not None:
                doc += f"- **Example**: `{field.example}`\n"

            doc += "\n"

        return doc

    @staticmethod
    def generate_all_tables_docs() -> str:
        """모든 테이블 문서 생성"""
        doc = "\n# Database Schema\n\n"

        for table_name in SCHEMA_REGISTRY.keys():
            doc += SchemaDocGenerator.generate_field_docs(table_name)
            doc += "\n---\n"

        return doc

    @staticmethod
    def generate_json_schema(table_name: str) -> Dict[str, Any]:
        """JSON Schema 형식으로 생성"""
        schema = get_schema(table_name)
        if not schema:
            return {}

        properties = {}
        required = []

        for field in schema.fields:
            prop = {
                "type": field.field_type.value,
                "description": field.comment,
            }

            if field.example is not None:
                prop["example"] = field.example

            if field.default is not None:
                prop["default"] = field.default

            properties[field.name] = prop

            if field.required:
                required.append(field.name)

        return {
            "type": "object",
            "title": table_name,
            "description": schema.comment,
            "properties": properties,
            "required": required
        }


# ============================================================
# 🔧 Use Case 6: 커스텀 검증자 추가
# ============================================================

def create_custom_validator(validation_fn):
    """커스텀 검증 함수 래퍼"""
    def wrapper(value):
        try:
            result = validation_fn(value)
            return result if isinstance(result, tuple) else (True, None)
        except Exception as e:
            return False, str(e)
    return wrapper


# 예: 특정 값의 범위 검증
def validate_booking_future_date(value: str) -> tuple[bool, Optional[str]]:
    """예약은 미래 날짜만 가능"""
    from datetime import datetime, date as date_type
    try:
        booking_date = datetime.strptime(value, "%Y-%m-%d").date()
        if booking_date <= date_type.today():
            return False, "Booking must be in the future"
        return True, None
    except:
        return False, "Invalid date format"


# ============================================================
# 🎯 테스트 코드 예제
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("TABLE_MAPPINGS USAGE EXAMPLES")
    print("=" * 60)

    # 예제 1: API 요청 검증
    print("\n[EXAMPLE 1] API Request Validation")
    booking_request = {
        "customer_id": 501,
        "therapist_id": 101,
        "service_id": 201,
        "booking_date": "2026-06-15",
        "booking_time": "14:30:00",
        "duration_minutes": 60,
        "status": "CONFIRMED",
        "total_price": "2500.00",
    }

    try:
        validated = validate_booking_request(booking_request)
        print(f"✓ Booking valid: {json.dumps(validated, default=str, indent=2)}")
    except Exception as e:
        print(f"✗ Error: {e}")

    # 예제 2: CSV 행 처리
    print("\n[EXAMPLE 2] CSV Row Processing")
    csv_row = {
        "report_date": "2026-05-21",
        "vendor": "SM Makati",
        "category_name": "FOOD",
        "amount": "450.75",
    }

    success, data, errors = process_booking_csv_row(1, csv_row)
    print(f"Success: {success}")
    if errors:
        print(f"Errors: {errors}")

    # 예제 3: 데이터 품질 검사
    print("\n[EXAMPLE 3] Data Quality Check")
    test_rows = [
        {"report_date": "2026-05-21", "amount": "100"},
        {"report_date": "2026-05-22", "amount": "200"},
        {"amount": "150"},  # report_date 누락
    ]

    quality_check = DataQualityChecker.check_required_fields("expenses", test_rows)
    print(f"Quality Report: {json.dumps(quality_check, indent=2)}")

    # 예제 4: 자동 문서화
    print("\n[EXAMPLE 4] Auto Documentation")
    schema_doc = SchemaDocGenerator.generate_field_docs("bookings")
    print(schema_doc[:300] + "...")

    print("\n" + "=" * 60)
