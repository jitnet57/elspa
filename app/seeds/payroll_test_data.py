"""
정산 시스템 테스트 목데이터 (Mock Data)
경로: app/seeds/payroll_test_data.py
목적: 급여 정산이 제대로 작동하는지 테스트할 수 있는 완전한 샘플 데이터
생성일: 2026-05-28

테스트 케이스:
1. 테라피스트 10가지 시나리오 (업체별 수수료, 가이드 수수료, 예약 등)
2. 정직원 케이스 (출근, 결근, 지각, 오버타임, CA, 공휴일 등)
3. 드라이버 케이스 (식비 지급 포함)
"""

from datetime import datetime, date, timedelta
from decimal import Decimal

# ============================================================
# 1. 테라피스트 10가지 시나리오
# ============================================================

THERAPISTS_DATA = [
    # Case 1: 기본 정상 정산 (업체 소개 손님)
    {
        "id": 101,
        "name": "Maria Santos",
        "phone": "09171234567",
        "employee_type": "therapist",
        "pay_group": "weekly",
        "base_salary": Decimal("0"),  # 테라피스트는 시간급
        "commission_rate": Decimal("250"),  # 시간당 250페소
        "hire_date": date(2024, 1, 15),
        "is_active": True,
    },
    # Case 2: 높은 커미션율 (프리미엄 테라피스트)
    {
        "id": 102,
        "name": "Ana Mercado",
        "phone": "09172345678",
        "employee_type": "therapist",
        "pay_group": "weekly",
        "base_salary": Decimal("0"),
        "commission_rate": Decimal("350"),  # 높은 커미션
        "hire_date": date(2023, 6, 20),
        "is_active": True,
    },
    # Case 3: CA 선금이 있는 테라피스트
    {
        "id": 103,
        "name": "Rosa Chavez",
        "phone": "09173456789",
        "employee_type": "therapist",
        "pay_group": "weekly",
        "base_salary": Decimal("0"),
        "commission_rate": Decimal("280"),
        "hire_date": date(2024, 3, 1),
        "is_active": True,
    },
    # Case 4: 직접 손님 예약 (업체 수수료 없음)
    {
        "id": 104,
        "name": "Jennifer Cruz",
        "phone": "09174567890",
        "employee_type": "therapist",
        "pay_group": "biweekly",
        "base_salary": Decimal("0"),
        "commission_rate": Decimal("300"),
        "hire_date": date(2024, 2, 10),
        "is_active": True,
    },
    # Case 5: 가이드 수수료 있는 예약
    {
        "id": 105,
        "name": "Michael Santos",
        "phone": "09175678901",
        "employee_type": "therapist",
        "pay_group": "weekly",
        "base_salary": Decimal("0"),
        "commission_rate": Decimal("320"),
        "hire_date": date(2023, 11, 5),
        "is_active": True,
    },
    # Case 6: 휴직 상태 (정산 제외)
    {
        "id": 106,
        "name": "Mary Ann Garcia",
        "phone": "09176789012",
        "employee_type": "therapist",
        "pay_group": "weekly",
        "base_salary": Decimal("0"),
        "commission_rate": Decimal("270"),
        "hire_date": date(2024, 4, 1),
        "is_active": False,  # 휴직 중
    },
    # Case 7: 신입 테라피스트 (낮은 커미션)
    {
        "id": 107,
        "name": "Christopher Reyes",
        "phone": "09177890123",
        "employee_type": "therapist",
        "pay_group": "weekly",
        "base_salary": Decimal("0"),
        "commission_rate": Decimal("200"),  # 신입 낮은 급여
        "hire_date": date(2026, 4, 15),  # 최근 입사
        "is_active": True,
    },
    # Case 8: 오버타임 많은 테라피스트
    {
        "id": 108,
        "name": "Patricia Flores",
        "phone": "09178901234",
        "employee_type": "therapist",
        "pay_group": "biweekly",
        "base_salary": Decimal("0"),
        "commission_rate": Decimal("290"),
        "hire_date": date(2023, 8, 22),
        "is_active": True,
    },
    # Case 9: 여러 업체 수수료 조합
    {
        "id": 109,
        "name": "Robert Santos",
        "phone": "09179012345",
        "employee_type": "therapist",
        "pay_group": "weekly",
        "base_salary": Decimal("0"),
        "commission_rate": Decimal("310"),
        "hire_date": date(2023, 5, 30),
        "is_active": True,
    },
    # Case 10: 공휴일 근무 테라피스트
    {
        "id": 110,
        "name": "Linda Rodriguez",
        "phone": "09180123456",
        "employee_type": "therapist",
        "pay_group": "weekly",
        "base_salary": Decimal("0"),
        "commission_rate": Decimal("260"),
        "hire_date": date(2024, 1, 8),
        "is_active": True,
    },
]

# ============================================================
# 2. 정직원 데이터 (스태프)
# ============================================================

STAFF_DATA = [
    # Case 1: 일반 직원 (정상 출근, 기본급만)
    {
        "id": 201,
        "name": "John Doe",
        "phone": "09181234567",
        "employee_type": "manager",
        "pay_group": "biweekly",
        "base_salary": Decimal("30000"),  # 월급 30,000페소
        "commission_rate": Decimal("0"),
        "hire_date": date(2022, 1, 1),
        "is_active": True,
    },
    # Case 2: 결근 많은 직원
    {
        "id": 202,
        "name": "Jane Smith",
        "phone": "09182345678",
        "employee_type": "maintenance",
        "pay_group": "weekly",
        "base_salary": Decimal("15000"),  # 주급 15,000페소
        "commission_rate": Decimal("0"),
        "hire_date": date(2023, 6, 15),
        "is_active": True,
    },
    # Case 3: 드라이버 (식비 지급 + 거리비 포함)
    {
        "id": 203,
        "name": "Mike Johnson",
        "phone": "09183456789",
        "employee_type": "driver",
        "pay_group": "weekly",
        "base_salary": Decimal("20000"),  # 주급
        "commission_rate": Decimal("0"),
        "meal_allowance": Decimal("250"),  # 드라이버 식비 - 일일 250페소 (수정 가능)
        "hire_date": date(2023, 3, 20),
        "is_active": True,
    },
    # Case 4: CA 있는 직원
    {
        "id": 204,
        "name": "Sarah Johnson",
        "phone": "09184567890",
        "employee_type": "manager",
        "pay_group": "biweekly",
        "base_salary": Decimal("28000"),
        "commission_rate": Decimal("0"),
        "hire_date": date(2022, 9, 10),
        "is_active": True,
    },
    # Case 5: 신입 직원 (낮은 기본급 + CA)
    {
        "id": 205,
        "name": "Angela Reyes",
        "phone": "09185678901",
        "employee_type": "maintenance",
        "pay_group": "weekly",
        "base_salary": Decimal("12000"),  # 신입 낮은 급여
        "commission_rate": Decimal("0"),
        "hire_date": date(2026, 3, 1),
        "is_active": True,
    },
]

# ============================================================
# 3. 업체 데이터
# ============================================================

COMPANIES_DATA = [
    {
        "id": 1,
        "name": "Hotel Resort Manila",
        "contact_phone": "021234567",
        "commission_rate": Decimal("20"),  # 20% 수수료
        "is_active": True,
    },
    {
        "id": 2,
        "name": "Corporate Wellness Center",
        "contact_phone": "021111111",
        "commission_rate": Decimal("15"),  # 15% 수수료
        "is_active": True,
    },
    {
        "id": 3,
        "name": "Medical Office Building",
        "contact_phone": "021222222",
        "commission_rate": Decimal("25"),  # 25% 수수료
        "is_active": True,
    },
]

# ============================================================
# 4. 가이드 데이터
# ============================================================

GUIDES_DATA = [
    {
        "id": 1,
        "name": "Booking Guide - Online",
        "commission_rate": Decimal("5"),  # 5% 가이드 수수료
        "type": "online",
    },
    {
        "id": 2,
        "name": "Booking Guide - Phone",
        "commission_rate": Decimal("3"),  # 3% 가이드 수수료
        "type": "phone",
    },
]

# ============================================================
# 5. 마사지 예약 데이터 (테라피스트 별로 5월 10~31일)
# ============================================================

BOOKINGS_DATA = [
    # Case 1: Maria Santos - 업체 소개 + 가이드
    {
        "id": 1001,
        "therapist_id": 101,
        "service_type": "swedish",
        "duration_minutes": 120,
        "service_date": "2026-05-10",
        "service_start_time": "14:00",
        "service_end_time": "16:00",
        "customer_name": "John Smith (Hotel Resort)",
        "room_number": "01",
        "company_id": 1,  # Hotel Resort Manila
        "guide_id": 1,    # Online Guide
        "service_fee": Decimal("500"),  # 2시간 × 250페소
        "status": "completed",
    },
    # Case 2: Maria Santos - 직접 손님 (회사 수수료 없음)
    {
        "id": 1002,
        "therapist_id": 101,
        "service_type": "hot_stone",
        "duration_minutes": 90,
        "service_date": "2026-05-15",
        "service_start_time": "10:00",
        "service_end_time": "11:30",
        "customer_name": "Direct Customer",
        "room_number": "02",
        "company_id": None,  # 직접 손님 - 업체 없음
        "guide_id": None,
        "service_fee": Decimal("375"),  # 1.5시간 × 250페소
        "status": "completed",
    },
    # Case 3: Ana Mercado - 높은 수수료 업체
    {
        "id": 1003,
        "therapist_id": 102,
        "service_type": "thai",
        "duration_minutes": 120,
        "service_date": "2026-05-12",
        "service_start_time": "15:00",
        "service_end_time": "17:00",
        "customer_name": "Corporate Client A",
        "room_number": "03",
        "company_id": 2,  # Corporate Wellness - 15% 수수료
        "guide_id": 1,
        "service_fee": Decimal("700"),  # 2시간 × 350페소
        "status": "completed",
    },
    # Case 4: Rosa Chavez - 여러 예약
    {
        "id": 1004,
        "therapist_id": 103,
        "service_type": "foot_massage",
        "duration_minutes": 60,
        "service_date": "2026-05-11",
        "service_start_time": "09:00",
        "service_end_time": "10:00",
        "customer_name": "Medical Office Guest",
        "room_number": "04",
        "company_id": 3,  # Medical - 25% 수수료 (높음)
        "guide_id": 2,    # Phone Guide
        "service_fee": Decimal("280"),
        "status": "completed",
    },
    {
        "id": 1005,
        "therapist_id": 103,
        "service_type": "aromatherapy",
        "duration_minutes": 60,
        "service_date": "2026-05-18",
        "service_start_time": "14:00",
        "service_end_time": "15:00",
        "customer_name": "Repeat Customer",
        "room_number": "05",
        "company_id": 1,
        "guide_id": 1,
        "service_fee": Decimal("280"),
        "status": "completed",
    },
    # Case 5: Jennifer Cruz - 직접 손님만 (업체 수수료 없음)
    {
        "id": 1006,
        "therapist_id": 104,
        "service_type": "swedish",
        "duration_minutes": 120,
        "service_date": "2026-05-14",
        "service_start_time": "11:00",
        "service_end_time": "13:00",
        "customer_name": "VIP Direct Client",
        "room_number": "06",
        "company_id": None,
        "guide_id": None,
        "service_fee": Decimal("600"),  # 2시간 × 300페소
        "status": "completed",
    },
    # Case 6: Michael Santos - 가이드 수수료 여러 건
    {
        "id": 1007,
        "therapist_id": 105,
        "service_type": "thai",
        "duration_minutes": 90,
        "service_date": "2026-05-16",
        "service_start_time": "13:00",
        "service_end_time": "14:30",
        "customer_name": "Phone Booking",
        "room_number": "07",
        "company_id": 2,
        "guide_id": 2,  # Phone Guide 3% 수수료
        "service_fee": Decimal("480"),  # 1.5시간 × 320페소
        "status": "completed",
    },
    # Case 7: Christopher Reyes - 신입 저수익
    {
        "id": 1008,
        "therapist_id": 107,
        "service_type": "foot_massage",
        "duration_minutes": 60,
        "service_date": "2026-05-17",
        "service_start_time": "10:00",
        "service_end_time": "11:00",
        "customer_name": "Budget Customer",
        "room_number": "08",
        "company_id": 1,
        "guide_id": 1,
        "service_fee": Decimal("200"),  # 1시간 × 200페소 (신입)
        "status": "completed",
    },
    # Case 8: Patricia Flores - 오버타임 (야간 근무)
    {
        "id": 1009,
        "therapist_id": 108,
        "service_type": "swedish",
        "duration_minutes": 120,
        "service_date": "2026-05-19",
        "service_start_time": "18:00",
        "service_end_time": "20:00",
        "customer_name": "Evening Customer",
        "room_number": "09",
        "company_id": 3,
        "guide_id": 1,
        "service_fee": Decimal("580"),  # 야간 오버타임
        "status": "completed",
    },
    # Case 9: Robert Santos - 여러 업체 조합
    {
        "id": 1010,
        "therapist_id": 109,
        "service_type": "hot_stone",
        "duration_minutes": 120,
        "service_date": "2026-05-20",
        "service_start_time": "15:00",
        "service_end_time": "17:00",
        "customer_name": "Corporate B",
        "room_number": "10",
        "company_id": 2,
        "guide_id": 1,
        "service_fee": Decimal("620"),  # 2시간 × 310페소
        "status": "completed",
    },
    # Case 10: Linda Rodriguez - 공휴일 근무 (수당 2배)
    {
        "id": 1011,
        "therapist_id": 110,
        "service_type": "aromatherapy",
        "duration_minutes": 120,
        "service_date": "2026-06-12",  # 필리핀 기념일 (6월 12일 독립기념일)
        "service_start_time": "14:00",
        "service_end_time": "16:00",
        "customer_name": "Holiday Special",
        "room_number": "11",
        "company_id": 1,
        "guide_id": 2,
        "service_fee": Decimal("520"),  # 2시간 × 260페소 (공휴일 근무)
        "status": "completed",
    },
]

# ============================================================
# 6. 출퇴근 데이터 (정직원)
# ============================================================

ATTENDANCE_DATA = [
    # John Doe - 정상 출근
    {
        "id": 3001,
        "employee_id": 201,
        "work_date": "2026-05-10",
        "clock_in": "08:00",
        "clock_out": "17:00",
        "late_minutes": 0,
        "overtime_minutes": 0,
        "is_absent": False,
        "holiday_type": "none",
    },
    {
        "id": 3002,
        "employee_id": 201,
        "work_date": "2026-05-11",
        "clock_in": "08:15",
        "clock_out": "18:30",
        "late_minutes": 15,
        "overtime_minutes": 90,
        "is_absent": False,
        "holiday_type": "none",
    },
    # Jane Smith - 결근 + 지각
    {
        "id": 3003,
        "employee_id": 202,
        "work_date": "2026-05-12",
        "clock_in": None,
        "clock_out": None,
        "late_minutes": 0,
        "overtime_minutes": 0,
        "is_absent": True,  # 결근
        "holiday_type": "none",
    },
    {
        "id": 3004,
        "employee_id": 202,
        "work_date": "2026-05-13",
        "clock_in": "08:45",
        "clock_out": "17:00",
        "late_minutes": 45,
        "overtime_minutes": 0,
        "is_absent": False,
        "holiday_type": "none",
    },
    # Mike Johnson - 드라이버 정상 근무
    {
        "id": 3005,
        "employee_id": 203,
        "work_date": "2026-05-14",
        "clock_in": "07:00",
        "clock_out": "17:00",
        "late_minutes": 0,
        "overtime_minutes": 120,
        "is_absent": False,
        "holiday_type": "none",
    },
    # Sarah Johnson - 오버타임 많음
    {
        "id": 3006,
        "employee_id": 204,
        "work_date": "2026-05-15",
        "clock_in": "08:00",
        "clock_out": "20:00",
        "late_minutes": 0,
        "overtime_minutes": 240,  # 4시간 오버타임
        "is_absent": False,
        "holiday_type": "none",
    },
    # Angela Reyes - 신입 정상 근무
    {
        "id": 3007,
        "employee_id": 205,
        "work_date": "2026-05-16",
        "clock_in": "08:00",
        "clock_out": "17:00",
        "late_minutes": 0,
        "overtime_minutes": 0,
        "is_absent": False,
        "holiday_type": "none",
    },
]

# ============================================================
# 7. CA (Cash Advance) 선금 데이터
# ============================================================

CASH_ADVANCES_DATA = [
    # 테라피스트 CA
    {
        "id": 4001,
        "employee_id": 103,  # Rosa Chavez
        "amount": Decimal("2000"),
        "request_date": "2026-05-08",
        "reason": "Emergency medical",
        "status": "approved",
        "created_at": datetime(2026, 5, 8),
    },
    # 직원 CA
    {
        "id": 4002,
        "employee_id": 204,  # Sarah Johnson
        "amount": Decimal("3000"),
        "request_date": "2026-05-10",
        "reason": "Utility bill",
        "status": "approved",
        "created_at": datetime(2026, 5, 10),
    },
    # 신입 직원 CA
    {
        "id": 4003,
        "employee_id": 205,  # Angela Reyes
        "amount": Decimal("1500"),
        "request_date": "2026-05-12",
        "reason": "Initial setup",
        "status": "approved",
        "created_at": datetime(2026, 5, 12),
    },
]

# ============================================================
# 8. 공휴일 데이터 (필리핀 2026년 주요 공휴일)
# ============================================================

HOLIDAYS_DATA = [
    {
        "id": 5001,
        "holiday_date": "2026-05-10",  # 마사지 추도원, 모더스 데이
        "holiday_name": "Mother's Day (Sunday)",
        "holiday_type": "special",
        "rate_multiplier": Decimal("1.30"),  # 130% (특정 공휴일)
    },
    {
        "id": 5002,
        "holiday_date": "2026-06-12",
        "holiday_name": "Philippine Independence Day",
        "holiday_type": "national",
        "rate_multiplier": Decimal("2.00"),  # 200% (국가 공휴일)
    },
]

# ============================================================
# 9. 정산 기간 데이터
# ============================================================

PAYROLL_PERIODS_DATA = [
    {
        "id": 601,
        "period_start": "2026-05-01",
        "period_end": "2026-05-31",
        "pay_group": "weekly",
        "status": "draft",
        "created_at": datetime(2026, 5, 28),
    },
    {
        "id": 602,
        "period_start": "2026-05-01",
        "period_end": "2026-05-31",
        "pay_group": "biweekly",
        "status": "draft",
        "created_at": datetime(2026, 5, 28),
    },
]

# ============================================================
# 정산 계산 결과 (예상 결과)
# ============================================================

EXPECTED_PAYROLL_SUMMARY = """
=== 2026년 5월 정산 예상 결과 ===

[테라피스트 정산]

Case 1: Maria Santos (ID: 101) - 업체 + 가이드 수수료
  - 예약 1: 500페소 (2시간) - Hotel Resort 20% - Guide 5% = 375페소
  - 예약 2: 375페소 (1.5시간) - 직접 손님 = 375페소
  - 소계: 750페소

Case 2: Ana Mercado (ID: 102) - 높은 커미션
  - 예약 1: 700페소 (2시간) - Corporate 15% - Guide 5% = 525페소
  - 소계: 525페소

Case 3: Rosa Chavez (ID: 103) - CA 선금 있음
  - 예약 1: 280페소 - Medical 25% - Guide 3% = 189.10페소
  - 예약 2: 280페소 - Hotel 20% - Guide 5% = 210페소
  - CA 차감: 2,000페소
  - 소계: 399.10페소 - 2,000페소 = -1,600.90페소 (다음 정산 이월)

Case 4: Jennifer Cruz (ID: 104) - 직접 손님만
  - 예약 1: 600페소 (직접 손님, 수수료 없음) = 600페소
  - 소계: 600페소

Case 5: Michael Santos (ID: 105) - 가이드 수수료
  - 예약 1: 480페소 - Corporate 15% - Guide 3% = 396페소
  - 소계: 396페소

Case 7: Christopher Reyes (ID: 107) - 신입 저수익
  - 예약 1: 200페소 (신입) - Hotel 20% - Guide 5% = 150페소
  - 소계: 150페소

Case 8: Patricia Flores (ID: 108) - 야간 오버타임
  - 예약 1: 580페소 (야간근무) - Medical 25% - Guide 5% = 406페소
  - 소계: 406페소

Case 9: Robert Santos (ID: 109) - 여러 업체
  - 예약 1: 620페소 - Corporate 15% - Guide 5% = 473페소
  - 소계: 473페소

Case 10: Linda Rodriguez (ID: 110) - 공휴일 근무 (2배 수당)
  - 예약 1: 520페소 (공휴일 2배) - Hotel 20% - Guide 3% = 379.20페소
  - 소계: 379.20페소

[정직원 정산]

John Doe (ID: 201) - 기본급 + 오버타임
  - 기본급: 30,000페소
  - 오버타임: 90분 (1.5시간) = 900페소 (시간당 600페소 기준)
  - 소계: 30,900페소

Jane Smith (ID: 202) - 결근 차감
  - 기본급: 15,000페소
  - 결근: 1일 차감 = 3,000페소 (일급 기준)
  - 지각: 45분 차감 = 225페소
  - 소계: 11,775페소

Mike Johnson (ID: 203) - 드라이버 (식비 + 거리비)
  - 기본급: 20,000페소
  - 오버타임: 120분 (2시간) = 1,200페소
  - 식비 지급: 2,000페소 (일일 250페소 × 8일)
  - 소계: 23,200페소

Sarah Johnson (ID: 204) - 고오버타임 + CA
  - 기본급: 28,000페소
  - 오버타임: 240분 (4시간) = 2,400페소
  - CA 차감: 3,000페소
  - 소계: 27,400페소

Angela Reyes (ID: 205) - 신입 + CA
  - 기본급: 12,000페소
  - CA 차감: 1,500페소
  - 소계: 10,500페소

=== 총 정산 금액 ===
테라피스트: 4,224.30페소
정직원: 103,775페소
총계: 107,999.30페소
"""

if __name__ == "__main__":
    print("Payroll Mock Data Prepared")
    print(f"Therapists: {len(THERAPISTS_DATA)}")
    print(f"Staff: {len(STAFF_DATA)}")
    print(f"Bookings: {len(BOOKINGS_DATA)}")
    print(f"Attendance: {len(ATTENDANCE_DATA)}")
    print(f"Cash Advances: {len(CASH_ADVANCES_DATA)}")
    print("\n정산 예상 결과:")
    print(EXPECTED_PAYROLL_SUMMARY)
