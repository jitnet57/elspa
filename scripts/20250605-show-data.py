#!/usr/bin/env python3
"""
============================================================
📌 스크립트: Supabase 데이터 조회 및 표시
📋 목적: 현재 등록된 데이터 확인
📅 작성일: 2026-06-05
============================================================
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from tabulate import tabulate

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL or SUPABASE_KEY not set")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("📊 ElSpa Supabase 데이터 현황")
print("=" * 80)

# ══════════════════════════════════════════════════════════
# 1. Employees (테라피스트)
# ══════════════════════════════════════════════════════════
print("\n1️⃣  EMPLOYEES (테라피스트 40명)")
print("-" * 80)

try:
    response = supabase.table("employees").select("id,name,employment_type,commission_rate").execute()
    data = response.data

    if data:
        # 1ST, 2ND, 3RD 구분
        first = [d for d in data if d.get('commission_rate') == 0.40]
        second = [d for d in data if d.get('commission_rate') == 0.45]
        third = [d for d in data if d.get('commission_rate') == 0.50]

        print(f"✅ 총 {len(data)}명 등록")
        print(f"   - 1ST Shift: {len(first)}명 (40% 수수료)")
        print(f"   - 2ND Shift: {len(second)}명 (45% 수수료)")
        print(f"   - 3RD Shift: {len(third)}명 (50% 수수료)")

        print("\n📋 샘플 데이터 (처음 5명):")
        table_data = [[d['id'], d['name'], d.get('commission_rate', 0)*100] for d in data[:5]]
        print(tabulate(table_data, headers=["ID", "Name", "Commission %"], tablefmt="grid"))
    else:
        print("⚠️ 데이터 없음")
except Exception as e:
    print(f"❌ 오류: {e}")

# ══════════════════════════════════════════════════════════
# 2. Beds (침대)
# ══════════════════════════════════════════════════════════
print("\n\n2️⃣  BEDS (침대 현황)")
print("-" * 80)

try:
    response = supabase.table("beds").select("id,bed_number,room_zone,status").execute()
    data = response.data

    if data:
        print(f"✅ 총 {len(data)}개 침대 등록")
        table_data = [[d['id'], d['bed_number'], d['room_zone'], d.get('status', 'unknown')] for d in data]
        print(tabulate(table_data, headers=["ID", "Bed#", "Room", "Status"], tablefmt="grid"))
    else:
        print("⚠️ 데이터 없음")
except Exception as e:
    print(f"❌ 오류: {e}")

# ══════════════════════════════════════════════════════════
# 3. Massage Services (마사지 종류)
# ══════════════════════════════════════════════════════════
print("\n\n3️⃣  MASSAGE_SERVICES (마사지 32개)")
print("-" * 80)

try:
    response = supabase.table("massage_services").select("id,name,base_price,base_duration_minutes").execute()
    data = response.data

    if data:
        print(f"✅ 총 {len(data)}개 서비스 등록")

        # 시간별 그룹화
        by_duration = {}
        for d in data:
            dur = d.get('base_duration_minutes', 0)
            if dur not in by_duration:
                by_duration[dur] = []
            by_duration[dur].append(d)

        for dur in sorted(by_duration.keys()):
            services = by_duration[dur]
            print(f"\n📌 {dur}분 옵션: {len(services)}개")
            table_data = [[d['id'], d['name'][:20], f"₱{d['base_price']}"] for d in services[:3]]
            print(tabulate(table_data, headers=["ID", "Service", "Price"], tablefmt="grid"))
            if len(services) > 3:
                print(f"   ... 외 {len(services)-3}개")
    else:
        print("⚠️ 데이터 없음")
except Exception as e:
    print(f"❌ 오류: {e}")

# ══════════════════════════════════════════════════════════
# 4. Companies (업체)
# ══════════════════════════════════════════════════════════
print("\n\n4️⃣  COMPANIES (업체 26개)")
print("-" * 80)

try:
    response = supabase.table("companies").select("id,name,status").execute()
    data = response.data

    if data:
        print(f"✅ 총 {len(data)}개 업체 등록")

        active = [d for d in data if d.get('status') == 'active']
        print(f"   - 활성: {len(active)}개")

        print("\n📋 샘플 업체 (처음 10개):")
        table_data = [[d['id'], d['name']] for d in data[:10]]
        print(tabulate(table_data, headers=["ID", "Company"], tablefmt="grid"))
        if len(data) > 10:
            print(f"   ... 외 {len(data)-10}개")
    else:
        print("⚠️ 데이터 없음")
except Exception as e:
    print(f"❌ 오류: {e}")

# ══════════════════════════════════════════════════════════
# 5. Bookings (예약)
# ══════════════════════════════════════════════════════════
print("\n\n5️⃣  BOOKINGS (예약 현황)")
print("-" * 80)

try:
    response = supabase.table("bookings").select("id,booking_date,guest_name,pay,status").execute()
    data = response.data

    if data:
        print(f"✅ 총 {len(data)}건 예약")

        # 날짜별 그룹화
        by_date = {}
        for d in data:
            date = d.get('booking_date', 'Unknown')
            if date not in by_date:
                by_date[date] = []
            by_date[date].append(d)

        print(f"   - 기간: {min(by_date.keys())} ~ {max(by_date.keys())}")

        print("\n📋 최근 예약 (처음 5건):")
        table_data = [[d['id'], d.get('booking_date', '-'), d.get('guest_name', '-'), f"₱{d.get('pay', 0)}"] for d in data[:5]]
        print(tabulate(table_data, headers=["ID", "Date", "Guest", "Pay"], tablefmt="grid"))
    else:
        print("⚠️ 데이터 없음")
except Exception as e:
    print(f"❌ 오류: {e}")

# ══════════════════════════════════════════════════════════
# 6. Expenses (지출)
# ══════════════════════════════════════════════════════════
print("\n\n6️⃣  EXPENSES (지출 현황)")
print("-" * 80)

try:
    response = supabase.table("expenses").select("id,report_date,vendor,amount,category_name").execute()
    data = response.data

    if data:
        print(f"✅ 총 {len(data)}건 지출")

        total = sum([d.get('amount', 0) for d in data])
        print(f"   - 총액: ₱{total:,.2f}")

        print("\n📋 최근 지출 (처음 5건):")
        table_data = [[d['id'], d.get('report_date', '-'), d.get('vendor', '-'), f"₱{d.get('amount', 0)}", d.get('category_name', '-')] for d in data[:5]]
        print(tabulate(table_data, headers=["ID", "Date", "Vendor", "Amount", "Category"], tablefmt="grid"))
    else:
        print("⚠️ 데이터 없음")
except Exception as e:
    print(f"❌ 오류: {e}")

# ══════════════════════════════════════════════════════════
# Summary
# ══════════════════════════════════════════════════════════
print("\n\n" + "=" * 80)
print("✅ 데이터 조회 완료!")
print("=" * 80)
print("\n💡 다음 단계:")
print("   1. Google Sheets 마이그레이션: python3 scripts/20250605-migrate-from-google-sheets.py")
print("   2. 프로덕션 배포: npm run build && npm run deploy")
print("=" * 80)
