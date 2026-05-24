"""
데이터베이스 무결성 검증 스크립트
경로: e:\elspa\check_db_integrity.py
목적: ElSpa 급여 시스템 DB 구조, 데이터 정합성, FK 관계 검증
"""

import os
import sys
from datetime import datetime
from decimal import Decimal
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL 환경변수가 설정되지 않았습니다.")
    sys.exit(1)

# SQLite 처리
if DATABASE_URL.startswith("sqlite://"):
    engine = create_engine(DATABASE_URL, echo=False)
else:
    engine = create_engine(DATABASE_URL, echo=False)

Session = sessionmaker(bind=engine)
session = Session()

# ============================================================
# 결과 저장 클래스
# ============================================================
class IntegrityReport:
    def __init__(self):
        self.results = {}
        self.overall_status = "PASS"
        self.errors = []
        self.warnings = []

    def add_result(self, table_name, checks):
        self.results[table_name] = checks

    def add_error(self, msg):
        self.errors.append(msg)
        self.overall_status = "FAIL"

    def add_warning(self, msg):
        self.warnings.append(msg)

    def print_report(self):
        print("\n" + "="*70)
        print("📊 데이터베이스 무결성 검증 결과")
        print("="*70)

        for table_name, checks in self.results.items():
            # Handle list results (like foreign_keys or constraints)
            if isinstance(checks, list):
                continue

            status = "✅ PASS" if checks.get("status") == "pass" else "❌ FAIL"
            print(f"\n### Table: {table_name} ({status})")

            for check_name, result in checks.items():
                if check_name == "status":
                    continue
                if isinstance(result, dict) and "status" in result and "message" in result:
                    symbol = "✅" if result["status"] else "❌"
                    print(f"  {symbol} {result['message']}")
                elif isinstance(result, list):
                    for item in result:
                        if isinstance(item, dict) and "status" in item:
                            symbol = "✅" if item["status"] else "❌"
                            print(f"  {symbol} {item['message']}")

        print("\n" + "="*70)
        print("### FK 검증")
        print("="*70)
        if "foreign_keys" in self.results:
            for fk_check in self.results["foreign_keys"]:
                symbol = "✅" if fk_check["status"] else "❌"
                print(f"{symbol} {fk_check['message']}")

        print("\n" + "="*70)
        print("### Constraint 검증")
        print("="*70)
        if "constraints" in self.results:
            for constraint_check in self.results["constraints"]:
                symbol = "✅" if constraint_check["status"] else "❌"
                print(f"{symbol} {constraint_check['message']}")

        if self.warnings:
            print("\n⚠️ 경고:")
            for warning in self.warnings:
                print(f"  - {warning}")

        if self.errors:
            print("\n❌ 에러:")
            for error in self.errors:
                print(f"  - {error}")

        print("\n" + "="*70)
        print(f"### 최종 판정: {self.overall_status}")
        print("="*70)

report = IntegrityReport()

# ============================================================
# 1. 테이블 존재 및 행 수 확인
# ============================================================
print("🔍 테이블 구조 검증 중...")

inspector = inspect(engine)
table_names = inspector.get_table_names()

print(f"✅ 발견된 테이블: {len(table_names)}개")
for table in sorted(table_names):
    print(f"  - {table}")

# ============================================================
# 2. Employee 테이블 검증
# ============================================================
print("\n🔍 Employee 테이블 검증 중...")
try:
    employees = session.query("*").from_statement(text("SELECT * FROM employees ORDER BY id")).all()
    emp_count = len(employees)

    checks = {
        "status": "pass" if emp_count == 6 else "fail",
        "행_수": {
            "status": emp_count == 6,
            "message": f"행 수: {emp_count} (예상: 6)"
        }
    }

    if emp_count > 0:
        # 샘플 행 검증
        result = session.execute(
            text("""
            SELECT id, name, phone, employee_type, base_salary, commission_rate, is_active
            FROM employees
            ORDER BY id
            """)
        )
        rows = result.fetchall()

        all_valid = True
        for row in rows:
            emp_id, name, phone, emp_type, base_salary, comm_rate, is_active = row

            # 필드 검증
            if not name or name == "":
                all_valid = False
                report.add_error(f"Employee {emp_id}: name이 비어있음")

            if not phone or phone == "":
                all_valid = False
                report.add_error(f"Employee {emp_id}: phone이 비어있음")

            if base_salary < 0:
                all_valid = False
                report.add_error(f"Employee {emp_id}: base_salary가 음수 ({base_salary})")

            if comm_rate < 0:
                all_valid = False
                report.add_error(f"Employee {emp_id}: commission_rate가 음수 ({comm_rate})")

            # Enum 값 검증
            valid_types = ["therapist", "nail", "driver", "maintenance", "hollys", "manager"]
            if emp_type not in valid_types:
                all_valid = False
                report.add_error(f"Employee {emp_id}: employee_type이 유효하지 않음 ({emp_type})")

        checks["필드_검증"] = {
            "status": all_valid,
            "message": f"모든 필드 유효: {all_valid}"
        }

    report.add_result("Employee", checks)
    print(f"✅ Employee 테이블 검증 완료 (행: {emp_count})")

except Exception as e:
    report.add_error(f"Employee 테이블 검증 실패: {str(e)}")
    print(f"❌ 에러: {e}")

# ============================================================
# 3. AttendanceLog 테이블 검증
# ============================================================
print("\n🔍 AttendanceLog 테이블 검증 중...")
try:
    att_count = session.execute(text("SELECT COUNT(*) FROM attendance_logs")).scalar()

    checks = {
        "status": "pass" if att_count == 30 else "fail",
        "행_수": {
            "status": att_count == 30,
            "message": f"행 수: {att_count} (예상: 30)"
        }
    }

    # 유니크 제약 검증
    duplicate_check = session.execute(
        text("""
        SELECT employee_id, work_date, COUNT(*) as cnt
        FROM attendance_logs
        GROUP BY employee_id, work_date
        HAVING COUNT(*) > 1
        """)
    ).fetchall()

    has_duplicates = len(duplicate_check) > 0
    checks["유니크_검증"] = {
        "status": not has_duplicates,
        "message": f"(employee_id, work_date) 중복: {len(duplicate_check)}개"
    }

    # late_minutes, overtime_minutes >= 0 검증
    invalid_minutes = session.execute(
        text("""
        SELECT COUNT(*) FROM attendance_logs
        WHERE late_minutes < 0 OR overtime_minutes < 0
        """)
    ).scalar()

    checks["분_검증"] = {
        "status": invalid_minutes == 0,
        "message": f"late_minutes/overtime_minutes < 0: {invalid_minutes}개"
    }

    report.add_result("AttendanceLog", checks)
    print(f"✅ AttendanceLog 테이블 검증 완료 (행: {att_count})")

except Exception as e:
    report.add_error(f"AttendanceLog 테이블 검증 실패: {str(e)}")
    print(f"❌ 에러: {e}")

# ============================================================
# 4. CashAdvance 테이블 검증
# ============================================================
print("\n🔍 CashAdvance 테이블 검증 중...")
try:
    ca_count = session.execute(text("SELECT COUNT(*) FROM cash_advances")).scalar()

    checks = {
        "status": "pass" if ca_count == 3 else "fail",
        "행_수": {
            "status": ca_count == 3,
            "message": f"행 수: {ca_count} (예상: 3)"
        }
    }

    # 상태값 검증
    result = session.execute(
        text("SELECT status FROM cash_advances")
    ).fetchall()

    valid_statuses = ["pending", "approved", "rejected", "settled"]
    invalid_status = []
    for (status,) in result:
        if status not in valid_statuses:
            invalid_status.append(status)

    checks["상태값_검증"] = {
        "status": len(invalid_status) == 0,
        "message": f"유효하지 않은 상태값: {invalid_status if invalid_status else '없음'}"
    }

    # amount >= 0 검증
    invalid_amount = session.execute(
        text("SELECT COUNT(*) FROM cash_advances WHERE amount < 0")
    ).scalar()

    checks["금액_검증"] = {
        "status": invalid_amount == 0,
        "message": f"amount < 0: {invalid_amount}개"
    }

    report.add_result("CashAdvance", checks)
    print(f"✅ CashAdvance 테이블 검증 완료 (행: {ca_count})")

except Exception as e:
    report.add_error(f"CashAdvance 테이블 검증 실패: {str(e)}")
    print(f"❌ 에러: {e}")

# ============================================================
# 5. PhilippineHoliday 테이블 검증
# ============================================================
print("\n🔍 PhilippineHoliday 테이블 검증 중...")
try:
    ph_count = session.execute(text("SELECT COUNT(*) FROM philippine_holidays")).scalar()

    checks = {
        "status": "pass" if ph_count == 3 else "fail",
        "행_수": {
            "status": ph_count == 3,
            "message": f"행 수: {ph_count} (예상: 3)"
        }
    }

    # holiday_date 중복 검증
    duplicates = session.execute(
        text("""
        SELECT COUNT(*) FROM (
            SELECT holiday_date, COUNT(*) as cnt
            FROM philippine_holidays
            GROUP BY holiday_date
            HAVING COUNT(*) > 1
        ) t
        """)
    ).scalar()

    checks["중복_검증"] = {
        "status": duplicates == 0,
        "message": f"holiday_date 중복: {duplicates}개"
    }

    # holiday_type 검증
    result = session.execute(
        text("SELECT holiday_type FROM philippine_holidays")
    ).fetchall()

    valid_types = ["national", "special"]
    invalid_types = []
    for (htype,) in result:
        if htype not in valid_types:
            invalid_types.append(htype)

    checks["타입_검증"] = {
        "status": len(invalid_types) == 0,
        "message": f"유효하지 않은 holiday_type: {invalid_types if invalid_types else '없음'}"
    }

    report.add_result("PhilippineHoliday", checks)
    print(f"✅ PhilippineHoliday 테이블 검증 완료 (행: {ph_count})")

except Exception as e:
    report.add_error(f"PhilippineHoliday 테이블 검증 실패: {str(e)}")
    print(f"❌ 에러: {e}")

# ============================================================
# 6. PayrollPeriod 테이블 검증
# ============================================================
print("\n🔍 PayrollPeriod 테이블 검증 중...")
try:
    pp_count = session.execute(text("SELECT COUNT(*) FROM payroll_periods")).scalar()

    checks = {
        "status": "pass" if pp_count == 2 else "fail",
        "행_수": {
            "status": pp_count == 2,
            "message": f"행 수: {pp_count} (예상: 2)"
        }
    }

    # period_start < period_end 검증
    result = session.execute(
        text("SELECT id, period_start, period_end FROM payroll_periods")
    ).fetchall()

    invalid_periods = []
    for pp_id, start, end in result:
        if start >= end:
            invalid_periods.append(f"Period {pp_id}: {start} >= {end}")

    checks["기간_검증"] = {
        "status": len(invalid_periods) == 0,
        "message": f"period_start >= period_end: {len(invalid_periods)}개"
    }

    report.add_result("PayrollPeriod", checks)
    print(f"✅ PayrollPeriod 테이블 검증 완료 (행: {pp_count})")

except Exception as e:
    report.add_error(f"PayrollPeriod 테이블 검증 실패: {str(e)}")
    print(f"❌ 에러: {e}")

# ============================================================
# 7. PayrollRecord 테이블 검증
# ============================================================
print("\n🔍 PayrollRecord 테이블 검증 중...")
try:
    pr_count = session.execute(text("SELECT COUNT(*) FROM payroll_records")).scalar()

    checks = {
        "status": "pass",
        "행_수": {
            "status": True,
            "message": f"행 수: {pr_count}"
        }
    }

    # 데이터 타입 검증 (Numeric 정밀도)
    result = session.execute(
        text("""
        SELECT id, gross_pay, total_deductions, net_pay
        FROM payroll_records
        """)
    ).fetchall()

    invalid_amounts = []
    for pr_id, gross, deductions, net in result:
        if gross < 0:
            invalid_amounts.append(f"PR {pr_id}: gross_pay < 0")
        if deductions < 0:
            invalid_amounts.append(f"PR {pr_id}: total_deductions < 0")
        if net < 0:
            invalid_amounts.append(f"PR {pr_id}: net_pay < 0")

    checks["금액_검증"] = {
        "status": len(invalid_amounts) == 0,
        "message": f"음수 금액: {len(invalid_amounts)}개"
    }

    report.add_result("PayrollRecord", checks)
    print(f"✅ PayrollRecord 테이블 검증 완료 (행: {pr_count})")

except Exception as e:
    report.add_error(f"PayrollRecord 테이블 검증 실패: {str(e)}")
    print(f"❌ 에러: {e}")

# ============================================================
# 8. 외래키 검증
# ============================================================
print("\n🔍 외래키 관계 검증 중...")

fk_checks = []

# CashAdvance.employee_id → Employee.id
try:
    result = session.execute(
        text("""
        SELECT COUNT(*) FROM cash_advances ca
        WHERE ca.employee_id NOT IN (SELECT id FROM employees)
        """)
    ).scalar()

    fk_checks.append({
        "status": result == 0,
        "message": f"CashAdvance.employee_id → Employee.id: {result}개 무효"
    })
except Exception as e:
    fk_checks.append({"status": False, "message": f"CashAdvance FK 검증 실패: {e}"})

# AttendanceLog.employee_id → Employee.id
try:
    result = session.execute(
        text("""
        SELECT COUNT(*) FROM attendance_logs al
        WHERE al.employee_id NOT IN (SELECT id FROM employees)
        """)
    ).scalar()

    fk_checks.append({
        "status": result == 0,
        "message": f"AttendanceLog.employee_id → Employee.id: {result}개 무효"
    })
except Exception as e:
    fk_checks.append({"status": False, "message": f"AttendanceLog FK 검증 실패: {e}"})

# PayrollRecord.employee_id → Employee.id
try:
    result = session.execute(
        text("""
        SELECT COUNT(*) FROM payroll_records pr
        WHERE pr.employee_id NOT IN (SELECT id FROM employees)
        """)
    ).scalar()

    fk_checks.append({
        "status": result == 0,
        "message": f"PayrollRecord.employee_id → Employee.id: {result}개 무효"
    })
except Exception as e:
    fk_checks.append({"status": False, "message": f"PayrollRecord FK 검증 실패: {e}"})

# PayrollRecord.payroll_period_id → PayrollPeriod.id
try:
    result = session.execute(
        text("""
        SELECT COUNT(*) FROM payroll_records pr
        WHERE pr.payroll_period_id NOT IN (SELECT id FROM payroll_periods)
        """)
    ).scalar()

    fk_checks.append({
        "status": result == 0,
        "message": f"PayrollRecord.payroll_period_id → PayrollPeriod.id: {result}개 무효"
    })
except Exception as e:
    fk_checks.append({"status": False, "message": f"PayrollRecord PayrollPeriod FK 검증 실패: {e}"})

report.add_result("foreign_keys", fk_checks)

# ============================================================
# 9. Constraint 검증
# ============================================================
print("\n🔍 제약 조건 검증 중...")

constraint_checks = []

# base_salary >= 0
try:
    result = session.execute(
        text("SELECT COUNT(*) FROM employees WHERE base_salary < 0")
    ).scalar()

    constraint_checks.append({
        "status": result == 0,
        "message": f"CHECK base_salary >= 0: {result}개 위반"
    })
except Exception as e:
    constraint_checks.append({"status": False, "message": f"base_salary CHECK 검증 실패: {e}"})

# commission_rate >= 0
try:
    result = session.execute(
        text("SELECT COUNT(*) FROM employees WHERE commission_rate < 0")
    ).scalar()

    constraint_checks.append({
        "status": result == 0,
        "message": f"CHECK commission_rate >= 0: {result}개 위반"
    })
except Exception as e:
    constraint_checks.append({"status": False, "message": f"commission_rate CHECK 검증 실패: {e}"})

# amount >= 0
try:
    result = session.execute(
        text("SELECT COUNT(*) FROM cash_advances WHERE amount < 0")
    ).scalar()

    constraint_checks.append({
        "status": result == 0,
        "message": f"CHECK amount >= 0: {result}개 위반"
    })
except Exception as e:
    constraint_checks.append({"status": False, "message": f"amount CHECK 검증 실패: {e}"})

# gross_pay >= 0, total_deductions >= 0, net_pay >= 0
try:
    result = session.execute(
        text("""
        SELECT COUNT(*) FROM payroll_records
        WHERE gross_pay < 0 OR total_deductions < 0 OR net_pay < 0
        """)
    ).scalar()

    constraint_checks.append({
        "status": result == 0,
        "message": f"CHECK payroll_records 금액 >= 0: {result}개 위반"
    })
except Exception as e:
    constraint_checks.append({"status": False, "message": f"payroll_records 금액 CHECK 검증 실패: {e}"})

# UNIQUE (employee_id, work_date)
try:
    result = session.execute(
        text("""
        SELECT COUNT(*) FROM (
            SELECT employee_id, work_date, COUNT(*) as cnt
            FROM attendance_logs
            GROUP BY employee_id, work_date
            HAVING COUNT(*) > 1
        ) t
        """)
    ).scalar()

    constraint_checks.append({
        "status": result == 0,
        "message": f"UNIQUE (employee_id, work_date): {result}개 중복"
    })
except Exception as e:
    constraint_checks.append({"status": False, "message": f"attendance UNIQUE 검증 실패: {e}"})

# UNIQUE holiday_date
try:
    result = session.execute(
        text("""
        SELECT COUNT(*) FROM (
            SELECT holiday_date, COUNT(*) as cnt
            FROM philippine_holidays
            GROUP BY holiday_date
            HAVING COUNT(*) > 1
        ) t
        """)
    ).scalar()

    constraint_checks.append({
        "status": result == 0,
        "message": f"UNIQUE holiday_date: {result}개 중복"
    })
except Exception as e:
    constraint_checks.append({"status": False, "message": f"holiday UNIQUE 검증 실패: {e}"})

report.add_result("constraints", constraint_checks)

# ============================================================
# 최종 보고서 출력
# ============================================================
session.close()
report.print_report()

print(f"\n📅 검증 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*70)

sys.exit(0 if report.overall_status == "PASS" else 1)
