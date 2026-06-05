#!/usr/bin/env python3
"""
마사지 서비스 데이터 Supabase 등록
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client
import json

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL or SUPABASE_KEY not set")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

massage_services = [
    {"name": "Hawaii Pink Stone", "base_price": 2500, "base_duration_minutes": 90, "duration_options": json.dumps([{"duration": 90, "price": 2500}, {"duration": 120, "price": 3300}])},
    {"name": "Vulcaner Black Stone (Hot)", "base_price": 1700, "base_duration_minutes": 90, "duration_options": json.dumps([{"duration": 90, "price": 1700}, {"duration": 120, "price": 2200}])},
    {"name": "Hibang (Traditional)", "base_price": 1700, "base_duration_minutes": 60, "duration_options": json.dumps([{"duration": 60, "price": 1700}, {"duration": 90, "price": 2200}])},
    {"name": "Smooth Coconut", "base_price": 1300, "base_duration_minutes": 60, "duration_options": json.dumps([{"duration": 60, "price": 1300}, {"duration": 90, "price": 1700}, {"duration": 120, "price": 2200}])},
    {"name": "Clinical Full Body", "base_price": 1300, "base_duration_minutes": 60, "duration_options": json.dumps([{"duration": 60, "price": 1300}, {"duration": 90, "price": 1700}, {"duration": 120, "price": 2200}])},
    {"name": "Green Jade Stone (Cold)", "base_price": 1700, "base_duration_minutes": 90, "duration_options": json.dumps([{"duration": 90, "price": 1700}, {"duration": 120, "price": 2200}])},
    {"name": "Aloe (Cold)", "base_price": 1300, "base_duration_minutes": 60, "duration_options": json.dumps([{"duration": 60, "price": 1300}, {"duration": 90, "price": 1700}, {"duration": 120, "price": 2200}])},
    {"name": "Aroma Massage", "base_price": 1100, "base_duration_minutes": 60, "duration_options": json.dumps([{"duration": 60, "price": 1100}, {"duration": 90, "price": 1500}, {"duration": 120, "price": 2200}])},
    {"name": "Dry Massage", "base_price": 1100, "base_duration_minutes": 60, "duration_options": json.dumps([{"duration": 60, "price": 1100}, {"duration": 90, "price": 1500}, {"duration": 120, "price": 2200}])},
    {"name": "Coconut Oil Massage", "base_price": 1100, "base_duration_minutes": 60, "duration_options": json.dumps([{"duration": 60, "price": 1100}, {"duration": 90, "price": 1500}, {"duration": 120, "price": 2200}])},
    {"name": "Corporate Massage", "base_price": 700, "base_duration_minutes": 60, "duration_options": json.dumps([{"duration": 60, "price": 700}, {"duration": 90, "price": 900}, {"duration": 120, "price": 1100}])},
    {"name": "Foot Pack (Scrub + Massage)", "base_price": 1300, "base_duration_minutes": 60, "duration_options": json.dumps([{"duration": 60, "price": 1300}])},
    {"name": "Basic Foot Massage", "base_price": 900, "base_duration_minutes": 60, "duration_options": json.dumps([{"duration": 60, "price": 900}, {"duration": 90, "price": 1300}])},
]

try:
    print("🔄 마사지 서비스 데이터 등록 시작...")
    
    # 기존 데이터 확인
    existing = supabase.table("massage_services").select("*").execute()
    print(f"📊 기존 데이터: {len(existing.data)}개")
    
    # 새 데이터 삽입
    for service in massage_services:
        try:
            supabase.table("massage_services").insert(service).execute()
            print(f"✅ {service['name']} 등록")
        except Exception as e:
            print(f"⚠️  {service['name']}: {str(e)[:50]}")
    
    print("\n✅ 마사지 서비스 등록 완료!")
    
except Exception as e:
    print(f"❌ 오류: {e}")
    sys.exit(1)
