#!/usr/bin/env python3
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 한 개 레코드를 직접 insert해서 스키마 확인
test_service = {
    "name": "테스트",
}

try:
    response = supabase.table("massage_services").insert(test_service).execute()
    print("✅ Insert 성공")
    print(f"응답: {response}")
    
    # 삽입한 데이터 조회
    result = supabase.table("massage_services").select("*").execute()
    if result.data:
        print(f"\n📊 테이블 구조:")
        for key in result.data[0].keys():
            print(f"  - {key}")
except Exception as e:
    print(f"❌ 오류: {e}")
    print(f"유형: {type(e)}")
