#!/usr/bin/env python3
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# 간단한 데이터 - 테이블의 실제 컬럼에 맞춤
services = [
    {"name": "Hawaii Pink Stone", "base_price": 2500, "base_duration_minutes": 90},
    {"name": "Vulcaner Black Stone (Hot)", "base_price": 1700, "base_duration_minutes": 90},
    {"name": "Hibang (Traditional)", "base_price": 1700, "base_duration_minutes": 60},
    {"name": "Smooth Coconut", "base_price": 1300, "base_duration_minutes": 60},
    {"name": "Clinical Full Body", "base_price": 1300, "base_duration_minutes": 60},
    {"name": "Green Jade Stone (Cold)", "base_price": 1700, "base_duration_minutes": 90},
    {"name": "Aloe (Cold)", "base_price": 1300, "base_duration_minutes": 60},
    {"name": "Aroma Massage", "base_price": 1100, "base_duration_minutes": 60},
    {"name": "Dry Massage", "base_price": 1100, "base_duration_minutes": 60},
    {"name": "Coconut Oil Massage", "base_price": 1100, "base_duration_minutes": 60},
    {"name": "Corporate Massage", "base_price": 700, "base_duration_minutes": 60},
    {"name": "Foot Pack (Scrub + Massage)", "base_price": 1300, "base_duration_minutes": 60},
    {"name": "Basic Foot Massage", "base_price": 900, "base_duration_minutes": 60},
]

print("🔄 마사지 서비스 등록 시작...")
for svc in services:
    try:
        supabase.table("massage_services").insert(svc).execute()
        print(f"✅ {svc['name']}")
    except Exception as e:
        if "duplicate" in str(e).lower():
            print(f"⏭️  {svc['name']} (이미 있음)")
        else:
            print(f"❌ {svc['name']}: {str(e)[:40]}")

print("\n✅ 완료!")
