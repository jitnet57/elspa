#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from supabase import create_client

os.chdir('/Users/kwangseobpark/elspa')
load_dotenv()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Hawaii Pink Stone 찾기
try:
    response = supabase.table("massage_services").select("*").ilike("name", "%Hawaii%").execute()
    print(f"✅ 'Hawaii' 포함 서비스: {len(response.data)}개")
    for svc in response.data:
        print(f"  - {svc['name']}: ₱{svc['base_price']}")
except Exception as e:
    print(f"❌ 검색 실패: {e}")

# 전체 개수 확인
try:
    response = supabase.table("massage_services").select("name").execute()
    print(f"\n💾 전체 massage_services: {len(response.data)}개")
    for svc in response.data[:5]:
        print(f"  - {svc['name']}")
    if len(response.data) > 5:
        print(f"  ... 외 {len(response.data)-5}개")
except Exception as e:
    print(f"❌ 에러: {e}")
