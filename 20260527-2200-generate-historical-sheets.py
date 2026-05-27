#!/usr/bin/env python3
"""
============================================================
📌 ElSpa 역사적 테스트 데이터 생성기 v2 (.xlsx 다중 탭)
📋 목적: 비즈니스 피드백(가이드=업체, 테라피스트 소개 없음, 매니저만 결근차감)을 완벽 반영한 데이터셋 구축
📅 작성일: 2026-05-27
============================================================
"""

import sys
import os
from datetime import date, timedelta
from decimal import Decimal

# 데이터 분석 라이브러리 임포트 시도
try:
    import pandas as pd
    import openpyxl
except ImportError:
    print("⚠️ pandas 또는 openpyxl이 설치되지 않았습니다. 의존성 설치 후 다시 실행하세요.")
    sys.exit(1)

def generate_data():
    print("🚀 ElSpa 역사적 테스트 데이터셋 v2 생성 시작...")
    
    start_date = date(2026, 5, 16)
    end_date = date(2026, 5, 27)
    days_count = (end_date - start_date).days + 1
    date_list = [start_date + timedelta(days=x) for x in range(days_count)]
    
    # --------------------------------------------------------
    # [1] 부서/직급 마스터 데이터 (Department & Position Master)
    # --------------------------------------------------------
    dept_master = [
        {"Dept ID": "D01", "Department Name": "Therapy & Wellness", "Position Name": "Therapist", "Pay Group": "Weekly", "Base PHP": 15000, "Commission": "100 PHP/session", "Deductions": "Health Checkup (500 PHP/quarter)"},
        {"Dept ID": "D01", "Department Name": "Therapy & Wellness", "Position Name": "Nail Specialist", "Pay Group": "Weekly", "Base PHP": 14000, "Commission": "100 PHP/session", "Deductions": "None"},
        {"Dept ID": "D02", "Department Name": "Operations & Logistics", "Position Name": "Driver", "Pay Group": "Biweekly", "Base PHP": 20000, "Meal Allowance": "200 PHP/2-weeks", "Overtime": "70 PHP/hr (>=40mins)"},
        {"Dept ID": "D03", "Department Name": "Management", "Position Name": "Manager", "Pay Group": "Biweekly", "Base PHP": 30000, "Absence Deduction": "Base / 15 per day", "Overtime": "70 PHP/hr (>=40mins)"},
        {"Dept ID": "D02", "Department Name": "Operations & Logistics", "Position Name": "Maintenance Staff", "Pay Group": "Biweekly", "Base PHP": 18000, "Overtime": "70 PHP/hr (>=40mins)", "Deductions": "None"},
        {"Dept ID": "D04", "Department Name": "Front Office", "Position Name": "Hollys Receptionist", "Pay Group": "Biweekly", "Base PHP": 16000, "Overtime": "70 PHP/hr (>=40mins)", "Deductions": "None"}
    ]
    df_dept = pd.DataFrame(dept_master)
    
    # --------------------------------------------------------
    # [2] 가이드 업체 마스터 (Guide Agency Master) - 가이드는 업체와 같은 개념
    # --------------------------------------------------------
    agency_master = [
        {"Agency ID": "AG-01", "Agency Name": "Happy Tour (해피 투어)", "Commission Rate (PHP/pax)": 200, "Contact": "0917-111-2222", "Manager Name": "Mario"},
        {"Agency ID": "AG-02", "Agency Name": "Boracay Guide (보라카이 가이드)", "Commission Rate (PHP/pax)": 250, "Contact": "0917-333-4444", "Manager Name": "Elena"},
        {"Agency ID": "AG-03", "Agency Name": "RNL Travel (알앤엘 트래블)", "Commission Rate (PHP/pax)": 200, "Contact": "0918-555-6666", "Manager Name": "Julius"},
        {"Agency ID": "AG-04", "Agency Name": "Walk-in (자체 워크인)", "Commission Rate (PHP/pax)": 0, "Contact": "N/A", "Manager Name": "Front Desk"}
    ]
    df_agency = pd.DataFrame(agency_master)
    agency_dict = {a["Agency ID"]: a for a in agency_master}
    
    # --------------------------------------------------------
    # [3] 마스터 인원 정의 (10명 테라피스트 + 10명 정직원)
    # --------------------------------------------------------
    therapists = [
        {"ID": f"TH-{i:02d}", "Name": f"Therapist_{name}", "Type": "therapist", "Hire Date": hire, "Base Salary": base}
        for i, (name, hire, base) in enumerate([
            ("Ana", date(2023, 1, 15), 15000),
            ("Bella", date(2024, 6, 1), 15000),
            ("Chloe", date(2025, 2, 10), 15000),
            ("Diana", date(2026, 4, 1), 15000),
            ("Eva", date(2023, 11, 20), 15000),
            ("Fiona", date(2024, 8, 5), 15000),
            ("Grace", date(2025, 12, 1), 15000),
            ("Hannah", date(2022, 5, 12), 15000)
        ], start=1)
    ]
    # 네일 스페셜리스트 2명 추가
    therapists.extend([
        {"ID": "TH-09", "Name": "Nail_Irene", "Type": "nail", "Hire Date": date(2023, 6, 1), "Base Salary": 14000},
        {"ID": "TH-10", "Name": "Nail_Joy", "Type": "nail", "Hire Date": date(2025, 10, 15), "Base Salary": 14000}
    ])
    
    employees = [
        {"ID": f"EMP-{i:02d}", "Name": f"Staff_{name}", "Type": pos_type, "Hire Date": hire, "Base Salary": base}
        for i, (name, pos_type, hire, base) in enumerate([
            ("Kevin", "manager", date(2021, 1, 1), 30000),
            ("Liam", "manager", date(2024, 2, 1), 30000),
            ("Mason", "driver", date(2022, 6, 1), 20000),
            ("Noah", "driver", date(2025, 3, 15), 20000),
            ("Oliver", "driver", date(2023, 9, 1), 20000),
            ("Paul", "maintenance", date(2022, 1, 1), 18000),
            ("Quinn", "maintenance", date(2024, 7, 10), 18000),
            ("Ryan", "maintenance", date(2025, 1, 20), 18000),
            ("Sophia", "hollys", date(2023, 3, 1), 16000),
            ("Teresa", "hollys", date(2024, 11, 5), 16000)
        ], start=1)
    ]
    
    # --------------------------------------------------------
    # [4] 일일 테라피스트 근무 기록 & 가이드 업체 송객 이력
    # --------------------------------------------------------
    therapist_history = []
    agency_bookings = []
    
    booking_idx = 1
    
    for d in date_list:
        is_weekend = d.weekday() >= 5
        for th in therapists:
            # 주말에는 일부 테라피스트가 쉴 수도 있음
            if is_weekend and th["ID"] in ["TH-03", "TH-07"]:
                continue
                
            # 근무 시간 및 세션 완료 수
            working_hours = 8 if not is_weekend else 6
            sessions = 5 if is_weekend else 3
            if th["ID"] in ["TH-01", "TH-08"]: # 에이스 테라피스트
                sessions += 2
                
            # 가이드 업체 배정 (AG-01 ~ AG-04 배정)
            assigned_agency_id = f"AG-{(int(th['ID'].split('-')[1]) % 4) + 1:02d}"
            
            therapist_history.append({
                "Date": d,
                "Therapist ID": th["ID"],
                "Name": th["Name"],
                "Job Type": th["Type"],
                "Working Hours": working_hours,
                "Sessions Completed": sessions,
                "Assigned Agency ID": assigned_agency_id
            })
            
            # 가이드 업체 송객 예약 상세 이력 생성
            # (각 마사지 세션당 가이드 업체와 매칭하여 기록)
            agency_info = agency_dict[assigned_agency_id]
            for s in range(sessions):
                pax = 2 if s % 2 == 0 else 1  # 1명 또는 2명 고객 송객
                comm_rate = agency_info["Commission Rate (PHP/pax)"]
                total_comm = comm_rate * pax
                bed_id = (booking_idx % 10) + 1
                
                agency_bookings.append({
                    "Date": d,
                    "Booking ID": f"B-{booking_idx:04d}",
                    "Agency ID": assigned_agency_id,
                    "Agency Name": agency_info["Agency Name"],
                    "Guest Name": f"Guest_Group_{booking_idx}",
                    "Pax": pax,
                    "Commission Paid (PHP)": total_comm,
                    "Therapist ID": th["ID"],
                    "Therapist Name": th["Name"],
                    "Assigned Bed ID": bed_id,
                    "Session Price (PHP)": 1200 * pax
                })
                booking_idx += 1
                
    df_th_history = pd.DataFrame(therapist_history)
    df_bookings = pd.DataFrame(agency_bookings)
    
    # --------------------------------------------------------
    # [5] 공휴일 정보 (Holiday & Leave Records)
    # --------------------------------------------------------
    holidays = [
        {"Date": date(2026, 5, 25), "Holiday Name": "Memorial/Spring Holiday", "Holiday Type": "special", "Rate Multiplier": 1.3},
        {"Date": date(2026, 5, 18), "Holiday Name": "Local Foundation Day", "Holiday Type": "national", "Rate Multiplier": 2.0}
    ]
    df_holiday = pd.DataFrame(holidays)
    holiday_map = {h["Date"]: h["Holiday Type"] for h in holidays}
    
    # --------------------------------------------------------
    # [6] 정직원 근태 기록 (Employee Attendance)
    # --------------------------------------------------------
    # 요건:
    # - 11일 근무 근태 샘플 (EMP-01 Kevin: 매니저, 영업일 12일 중 5/20 하루 결근하여 총 11일 근무) -> 결근 차감 연계용
    # - 14일 근무 근태 샘플 (EMP-03 Mason: 드라이버, 주말 특근 포함 14일 연속 근무)
    # - 10일 공휴일 적용 스케줄 샘플
    # - 결근(Absences) 기록
    # - 초과근무(Overtime Records)
    
    emp_attendance = []
    overtime_logs = []
    
    for emp in employees:
        emp_id = emp["ID"]
        
        for d in date_list:
            is_weekend = d.weekday() >= 5
            holiday_type = holiday_map.get(d, "none")
            
            clock_in = "09:00"
            clock_out = "18:00"
            late_mins = 0
            ot_mins = 0
            is_absent = False
            
            # EMP-01 (매니저, 11일 근무): 5/20에 하루 결근하여 영업일 12일 중 11일 실근무 기록
            if emp_id == "EMP-01" and d == date(2026, 5, 20):
                is_absent = True
                clock_in, clock_out = None, None
                
            # EMP-03 (드라이버, 14일 근무): 주말 특근 모두 출근하여 매일 연속 근무
            elif emp_id == "EMP-03":
                if is_weekend:
                    clock_in = "10:00"
                    clock_out = "19:00"
                    ot_mins = 60 # 주말 기본 60분 OT 제공
            
            # 주말 휴무 처리 (EMP-03 드라이버 외 정직원들은 주말에 쉼)
            elif is_weekend:
                continue
                
            # 지각 샘플링
            if emp_id == "EMP-06" and d in [date(2026, 5, 19), date(2026, 5, 22)]:
                late_mins = 25 # 25분 지각 (지각 차감 대상)
            elif emp_id == "EMP-09" and d == date(2026, 5, 26):
                late_mins = 8  # 9분 이하는 지각 차감 면제 대상
                
            # 초과근무(OT) 샘플링
            if emp_id in ["EMP-03", "EMP-04", "EMP-07"] and d.weekday() == 4: # 금요일 OT
                ot_mins = 90
                overtime_logs.append({
                    "Date": d,
                    "Employee ID": emp_id,
                    "Name": emp["Name"],
                    "Overtime Minutes": 90,
                    "Overtime Bonus (PHP)": 140 # 2시간 올림
                })
            
            emp_attendance.append({
                "Date": d,
                "Employee ID": emp_id,
                "Name": emp["Name"],
                "Job Type": emp["Type"],
                "Clock In": clock_in,
                "Clock Out": clock_out,
                "Late Minutes": late_mins,
                "Overtime Minutes": ot_mins,
                "Is Absent": is_absent,
                "Holiday Type": holiday_type
            })
            
    df_emp_attendance = pd.DataFrame(emp_attendance)
    df_overtime = pd.DataFrame(overtime_logs)
    
    # --------------------------------------------------------
    # [7] 선지급금 로그 (Cash Advance Logs)
    # --------------------------------------------------------
    ca_logs = [
        {"Request Date": date(2026, 5, 10), "Employee ID": "TH-01", "Name": "Therapist_Ana", "Amount (PHP)": 2000, "Status": "SETTLED", "Reason": "Emergency Medical Fee"},
        {"Request Date": date(2026, 5, 18), "Employee ID": "TH-03", "Name": "Therapist_Chloe", "Amount (PHP)": 5000, "Status": "APPROVED", "Reason": "Child Tuition Fee"},
        {"Request Date": date(2026, 5, 24), "Employee ID": "TH-09", "Name": "Nail_Irene", "Amount (PHP)": 3000, "Status": "APPROVED", "Reason": "Family Wedding Cost"},
        {"Request Date": date(2026, 5, 26), "Employee ID": "EMP-03", "Name": "Staff_Mason", "Amount (PHP)": 4000, "Status": "PENDING", "Reason": "Bike Repair Cost"},
        {"Request Date": date(2026, 5, 12), "Employee ID": "EMP-06", "Name": "Staff_Paul", "Amount (PHP)": 1500, "Status": "SETTLED", "Reason": "Home Improvement"}
    ]
    df_ca = pd.DataFrame(ca_logs)
    
    # --------------------------------------------------------
    # [8] 급여 정산 요약 (Payroll Summary) - 매니저만 결근 차감 적용
    # --------------------------------------------------------
    payroll_summary = []
    
    # 1. 테라피스트/네일 급여 계산
    for th in therapists:
        th_id = th["ID"]
        th_name = th["Name"]
        base_salary = Decimal(str(th["Base Salary"]))
        
        # 5/16 ~ 5/27 근무한 세션 수 기반 커미션 계산
        th_history_filtered = [h for h in therapist_history if h["Therapist ID"] == th_id]
        total_sessions = sum(h["Sessions Completed"] for h in th_history_filtered)
        commission = Decimal(str(total_sessions * 100))
        
        # 공휴일 가산 수당
        holiday_bonus = Decimal(0)
        for h in th_history_filtered:
            h_date = h["Date"]
            if h_date in holiday_map:
                daily_rate = base_salary / Decimal(15)
                mult = Decimal("2.0") if holiday_map[h_date] == "national" else Decimal("1.3")
                holiday_bonus += daily_rate * mult
                
        gross = base_salary + commission + holiday_bonus
        
        # 테라피스트 결근차감 없음
        late_ded = Decimal(0)
        absent_ded = Decimal(0)
        
        # APPROVED CA 차감
        ca_ded = Decimal(sum(c["Amount (PHP)"] for c in ca_logs if c["Employee ID"] == th_id and c["Status"] == "APPROVED"))
        
        # 보건소 검사비 (Therapist는 분기말 500 PHP 차감 대상)
        health_check = Decimal(500) if th["Type"] == "therapist" else Decimal(0)
        
        # 13개월 보너스 선지급 차감
        years_employed = date(2026, 5, 27).year - th["Hire Date"].year
        months_employed = years_employed * 12 + (date(2026, 5, 27).month - th["Hire Date"].month)
        if date(2026, 5, 27).day >= th["Hire Date"].day:
            months_employed += 1
        months_employed = max(months_employed, 1)
        
        th13_ded = (base_salary / Decimal(12)) * Decimal(months_employed)
        
        total_deductions = ca_ded + health_check + th13_ded
        net = max(gross - total_deductions, Decimal(0))
        
        notes = f"📌 [수입] 기본급 {base_salary:,.0f} PHP + 커미션 {commission:,.0f} PHP (세션 {total_sessions}회) + 공휴일가산 {holiday_bonus:,.0f} PHP | [차감] CA {ca_ded:,.0f} PHP + 보건소비 {health_check:,.0f} PHP + 13개월보너스누적적립 {th13_ded:,.0f} PHP | [보장] Net PHP {net:,.0f}"
        
        payroll_summary.append({
            "Employee ID": th_id,
            "Name": th_name,
            "Job Type": th["Type"],
            "Base Salary (PHP)": base_salary,
            "Gross Pay (PHP)": gross,
            "Late Deduction (PHP)": late_ded,
            "Absence Deduction (PHP)": absent_ded,
            "CA Deduction (PHP)": ca_ded,
            "Health Checkup Deduction (PHP)": health_check,
            "13th Month Accumulation (PHP)": th13_ded,
            "Total Deductions (PHP)": total_deductions,
            "Net Pay (PHP)": net,
            "Payroll Notes": notes
        })
        
    # 2. 정직원 급여 계산 (결근 차감은 매니저 직군만 적용됨)
    for emp in employees:
        emp_id = emp["ID"]
        emp_name = emp["Name"]
        base_salary = Decimal(str(emp["Base Salary"]))
        
        # 근태 기록 필터
        emp_att_filtered = [a for a in emp_attendance if a["Employee ID"] == emp_id]
        
        # 초과근무 수당
        total_ot_mins = sum(a["Overtime Minutes"] for a in emp_att_filtered)
        hours = (total_ot_mins + 59) // 60
        overtime_pay = Decimal(str(hours * 70))
        
        # 공휴일 가산
        holiday_bonus = Decimal(0)
        for a in emp_att_filtered:
            a_date = a["Date"]
            if a_date in holiday_map:
                daily_rate = base_salary / Decimal(15)
                mult = Decimal("2.0") if holiday_map[a_date] == "national" else Decimal("1.3")
                holiday_bonus += daily_rate * mult
                
        # Driver 식대 (2주당 200 PHP)
        meal = Decimal(200) if emp["Type"] == "driver" else Decimal(0)
        
        gross = base_salary + overtime_pay + holiday_bonus + meal
        
        # 지각 차감
        total_late_ded = Decimal(0)
        for a in emp_att_filtered:
            if a["Late Minutes"] >= 10:
                total_late_ded += Decimal(str((a["Late Minutes"] - 9) * 10))
                
        # 📌 결근 차감 (매니저 직군만 적용!!!)
        absent_ded = Decimal(0)
        absent_days = sum(1 for a in emp_att_filtered if a["Is Absent"])
        if emp["Type"] == "manager":
            absent_ded = (base_salary / Decimal(15)) * Decimal(str(absent_days))
        else:
            # 매니저 외 직군은 결근이 있어도 결근 차감을 적용받지 않음 (기본값 0)
            absent_ded = Decimal(0)
            
        # APPROVED CA 차감
        ca_ded = Decimal(sum(c["Amount (PHP)"] for c in ca_logs if c["Employee ID"] == emp_id and c["Status"] == "APPROVED"))
        
        # 13개월 누적 차감
        years_employed = date(2026, 5, 27).year - emp["Hire Date"].year
        months_employed = years_employed * 12 + (date(2026, 5, 27).month - emp["Hire Date"].month)
        if date(2026, 5, 27).day >= emp["Hire Date"].day:
            months_employed += 1
        months_employed = max(months_employed, 1)
        
        th13_ded = (base_salary / Decimal(12)) * Decimal(months_employed)
        
        total_deductions = total_late_ded + absent_ded + ca_ded + th13_ded
        net = max(gross - total_deductions, Decimal(0))
        
        notes = f"📌 [수입] 기본급 {base_salary:,.0f} PHP + 초과근무수당 {overtime_pay:,.0f} PHP ({total_ot_mins}분) + 식대 {meal:,.0f} PHP | [차감] 지각차감 {total_late_ded:,.0f} PHP + 결근차감 {absent_ded:,.0f} PHP (결근 {absent_days}일) + CA {ca_ded:,.0f} PHP + 13개월누적적립 {th13_ded:,.0f} PHP | [보장] Net PHP {net:,.0f}"
        
        payroll_summary.append({
            "Employee ID": emp_id,
            "Name": emp_name,
            "Job Type": emp["Type"],
            "Base Salary (PHP)": base_salary,
            "Gross Pay (PHP)": gross,
            "Late Deduction (PHP)": total_late_ded,
            "Absence Deduction (PHP)": absent_ded,
            "CA Deduction (PHP)": ca_ded,
            "Health Checkup Deduction (PHP)": Decimal(0),
            "13th Month Accumulation (PHP)": th13_ded,
            "Total Deductions (PHP)": total_deductions,
            "Net Pay (PHP)": net,
            "Payroll Notes": notes
        })
        
    df_payroll = pd.DataFrame(payroll_summary)
    
    # --------------------------------------------------------
    # [9] 다중 탭을 가지는 단일 Excel 파일(.xlsx)로 저장
    # --------------------------------------------------------
    output_filename = "elspa_historical_test_data.xlsx"
    print(f"💾 다중 탭 엑셀 파일 {output_filename} v2 재생성 중...")
    
    with pd.ExcelWriter(output_filename, engine="openpyxl") as writer:
        df_th_history.to_excel(writer, sheet_name="Therapist Daily History", index=False)
        df_bookings.to_excel(writer, sheet_name="Agency Booking History", index=False) # 송객 이력
        df_agency.to_excel(writer, sheet_name="Agency Master", index=False)           # 가이드업체 마스터
        df_emp_attendance.to_excel(writer, sheet_name="Employee Attendance", index=False)
        df_holiday.to_excel(writer, sheet_name="Holiday & Leave Records", index=False)
        df_overtime.to_excel(writer, sheet_name="Overtime Logs", index=False)
        df_ca.to_excel(writer, sheet_name="Cash Advance Logs", index=False)
        df_payroll.to_excel(writer, sheet_name="Payroll Summary", index=False)
        df_dept.to_excel(writer, sheet_name="Department Position Master", index=False)
        
    print(f"🎉 성공적으로 비즈니스 요구사항 v2 반영 엑셀 파일이 생성되었습니다!")

if __name__ == "__main__":
    generate_data()
