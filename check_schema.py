#!/usr/bin/env python3
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL or SUPABASE_KEY not set")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 현재 massage_services 테이블의 구조 확인
try:
    response = supabase.table("massage_services").select("*").limit(1).execute()
    print("✅ massage_services 테이블 접근 성공")
    print("\n현재 데이터 구조:")
    if response.data:
        print(response.data[0].keys())
    else:
        print("테이블이 비어있습니다")
except Exception as e:
    print(f"❌ 오류: {e}")
