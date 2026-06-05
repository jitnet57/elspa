#!/usr/bin/env python3
"""
============================================================
📌 스크립트: Google Sheets → Supabase 자동 마이그레이션
📋 목적: 기존 Google Sheets 데이터를 Supabase로 이관
📅 작성일: 2026-06-05
============================================================
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
from google.auth.transport.requests import Request
from google.oauth2 import service_account
import gspread
from supabase import create_client, Client

load_dotenv()

# ══════════════════════════════════════════════════════════
# Supabase 설정
# ══════════════════════════════════════════════════════════

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL or SUPABASE_KEY not set")
    sys.exit(1)

if not GOOGLE_SHEET_ID:
    print("❌ Error: GOOGLE_SHEET_ID not set")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ══════════════════════════════════════════════════════════
# Google Sheets 접근 (OAuth 또는 API 키)
# ══════════════════════════════════════════════════════════

def get_google_sheets_data():
    """Google Sheets에서 데이터 읽기 (JSON 키 파일 또는 공개 시트)"""
    try:
        # 시도 1: Service Account JSON 파일 (프로덕션)
        creds_path = os.path.expanduser("~/.config/gspread/service_account.json")
        if os.path.exists(creds_path):
            print("🔐 Service Account 자격증명 사용...")
            gc = gspread.service_account(filename=creds_path)
        else:
            # 시도 2: 공개 Google Sheets (View access only)
            print("🌐 공개 Google Sheets 접근 시도...")
            import requests

            sheet_id = GOOGLE_SHEET_ID
            url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}?includeGridData=true&key={os.getenv('GOOGLE_CLIENT_ID', 'AIzaSy-dummy')}"

            # gspread 라이브러리로 공개 시트 접근
            gc = gspread.Spreadsheet

        # 스프레드시트 열기
        spreadsheet = gc.open_by_key(GOOGLE_SHEET_ID)
        print(f"✅ Google Sheets 연결 성공: {GOOGLE_SHEET_ID}")

        # 모든 시트 이름 확인
        sheet_names = [ws.title for ws in spreadsheet.worksheets()]
        print(f"📋 사용 가능한 시트: {sheet_names}")

        return spreadsheet, sheet_names

    except Exception as e:
        print(f"⚠️ Google Sheets 접근 실패: {e}")
        print("💡 대체 방법: gspread 라이브러리 설치하고 Service Account 설정")
        print("   pip install gspread google-auth-oauthlib")
        return None, []


def migrate_bookings(spreadsheet):
    """예약 데이터 마이그레이션 (bookings)"""
    print("\n🔄 예약 데이터 마이그레이션 시작...")

    try:
        # "예약" 또는 "SHEET_SCHEDULE" 시트 찾기
        sheet_names = [ws.title for ws in spreadsheet.worksheets()]
        booking_sheet_name = None

        for name in ["예약", "bookings", "SHEET_SCHEDULE", "Schedule"]:
            if name in sheet_names:
                booking_sheet_name = name
                break

        if not booking_sheet_name:
            print(f"⚠️ 예약 시트를 찾을 수 없습니다 (찾은 시트: {sheet_names})")
            return 0

        ws = spreadsheet.worksheet(booking_sheet_name)
        all_records = ws.get_all_records()

        print(f"📊 {booking_sheet_name} 시트: {len(all_records)}건 데이터 발견")

        # 데이터 정리 및 매핑
        bookings_to_insert = []
        for idx, row in enumerate(all_records):
            if not any(row.values()):  # 빈 줄 스킵
                continue

            # 컬럼 매핑 (Google Sheets → Supabase)
            booking = {
                "booking_date": str(row.get("날짜", row.get("Date", "2026-06-05")))[:10],
                "seq_no": int(row.get("순번", row.get("No", idx + 1)) or idx + 1),
                "treatment": str(row.get("마사지종류", row.get("Treatment", ""))),
                "start_time": str(row.get("시작시간", row.get("Start Time", ""))),
                "end_time": str(row.get("종료시간", row.get("End Time", ""))),
                "room_num": str(row.get("방번호", row.get("Room", ""))),
                "guest_name": str(row.get("고객명", row.get("Guest", ""))),
                "therapist_name": str(row.get("테라피스트", row.get("Therapist", ""))),
                "pay": float(row.get("비용", row.get("Pay", 0)) or 0),
                "tip": float(row.get("팁", row.get("Tip", 0)) or 0),
                "note": str(row.get("비고", row.get("Notes", ""))),
                "status": "normal",
            }
            bookings_to_insert.append(booking)

        # Supabase에 삽입
        if bookings_to_insert:
            response = supabase.table("bookings").insert(bookings_to_insert).execute()
            print(f"✅ {len(bookings_to_insert)}건의 예약 데이터 삽입 완료")
            return len(bookings_to_insert)
        else:
            print("⚠️ 삽입할 예약 데이터 없음")
            return 0

    except Exception as e:
        print(f"❌ 예약 마이그레이션 오류: {e}")
        return 0


def migrate_massage_bookings(spreadsheet):
    """마사지 예약 데이터 마이그레이션 (massage_bookings)"""
    print("\n🔄 마사지 예약 마이그레이션 시작...")

    try:
        sheet_names = [ws.title for ws in spreadsheet.worksheets()]
        massage_sheet_name = None

        for name in ["마사지예약", "massage_bookings", "Massage Bookings"]:
            if name in sheet_names:
                massage_sheet_name = name
                break

        if not massage_sheet_name:
            print(f"⚠️ 마사지 예약 시트를 찾을 수 없습니다")
            return 0

        ws = spreadsheet.worksheet(massage_sheet_name)
        all_records = ws.get_all_records()

        print(f"📊 {massage_sheet_name} 시트: {len(all_records)}건 데이터 발견")

        bookings = []
        for row in all_records:
            if not any(row.values()):
                continue

            booking = {
                "date": str(row.get("날짜", "2026-06-05"))[:10],
                "guest_name": str(row.get("고객명", "")),
                "therapist_name": str(row.get("테라피스트", "")),
                "service_name": str(row.get("마사지종류", "")),
                "service_price": float(row.get("가격", 0) or 0),
                "start_time": str(row.get("시작시간", "")),
                "end_time": str(row.get("종료시간", "")),
                "status": "completed",
            }
            bookings.append(booking)

        if bookings:
            response = supabase.table("massage_bookings").insert(bookings).execute()
            print(f"✅ {len(bookings)}건의 마사지 예약 데이터 삽입 완료")
            return len(bookings)
        else:
            print("⚠️ 삽입할 마사지 예약 데이터 없음")
            return 0

    except Exception as e:
        print(f"❌ 마사지 예약 마이그레이션 오류: {e}")
        return 0


def migrate_expenses(spreadsheet):
    """지출 데이터 마이그레이션 (expenses)"""
    print("\n🔄 지출 데이터 마이그레이션 시작...")

    try:
        sheet_names = [ws.title for ws in spreadsheet.worksheets()]
        expense_sheet_name = None

        for name in ["지출", "expenses", "Expenses"]:
            if name in sheet_names:
                expense_sheet_name = name
                break

        if not expense_sheet_name:
            print(f"⚠️ 지출 시트를 찾을 수 없습니다")
            return 0

        ws = spreadsheet.worksheet(expense_sheet_name)
        all_records = ws.get_all_records()

        print(f"📊 {expense_sheet_name} 시트: {len(all_records)}건 데이터 발견")

        expenses = []
        for row in all_records:
            if not any(row.values()):
                continue

            expense = {
                "report_date": str(row.get("날짜", "2026-06-05"))[:10],
                "vendor": str(row.get("업체", row.get("Vendor", ""))),
                "expense_date": str(row.get("지출날짜", "2026-06-05"))[:10],
                "amount": float(row.get("금액", row.get("Amount", 0)) or 0),
                "currency": "PHP",
                "category_name": str(row.get("카테고리", row.get("Category", "other"))).lower(),
                "description": str(row.get("설명", row.get("Description", ""))),
            }
            expenses.append(expense)

        if expenses:
            response = supabase.table("expenses").insert(expenses).execute()
            print(f"✅ {len(expenses)}건의 지출 데이터 삽입 완료")
            return len(expenses)
        else:
            print("⚠️ 삽입할 지출 데이터 없음")
            return 0

    except Exception as e:
        print(f"❌ 지출 마이그레이션 오류: {e}")
        return 0


def main():
    print("=" * 60)
    print("📌 Google Sheets → Supabase 데이터 마이그레이션")
    print("=" * 60)

    # Google Sheets 연결
    spreadsheet, sheet_names = get_google_sheets_data()

    if not spreadsheet:
        print("\n⚠️ Google Sheets 접근 실패")
        print("💡 수동 마이그레이션 안내:")
        print("   1. Google Sheets 데이터 다운로드 (CSV)")
        print("   2. Supabase Dashboard → Table Editor에서 직접 입력")
        print("   3. 또는 다음 명령어 실행:")
        print("      pip install gspread google-auth-oauthlib")
        sys.exit(1)

    # 데이터 마이그레이션 실행
    total_records = 0
    total_records += migrate_bookings(spreadsheet)
    total_records += migrate_massage_bookings(spreadsheet)
    total_records += migrate_expenses(spreadsheet)

    print("\n" + "=" * 60)
    print(f"✅ 마이그레이션 완료!")
    print(f"📊 총 {total_records}건의 데이터 이관됨")
    print("=" * 60)


if __name__ == "__main__":
    main()
