#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

try:
    # massage_services 테이블의 모든 컬럼과 데이터 확인
    response = supabase.table("massage_services").select("*").limit(1).execute()
    
    if response.data:
        print("✅ massage_services 테이블 구조:")
        first_record = response.data[0]
        for key in first_record.keys():
            value = first_record[key]
            print(f"  - {key}: {type(value).__name__} = {value}")
    else:
        print("❌ 데이터 없음")
        
except Exception as e:
    print(f"❌ 에러: {e}")
