#!/usr/bin/env python3
"""
Excel 파일명에서 업체명 추출해서 Supabase에 등록
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client
from pathlib import Path
import re

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# 다운로드 폴더의 xlsx 파일들
downloads_dir = Path.home() / "Downloads"
excel_files = list(downloads_dir.glob("*.xlsx"))

companies_set = set()

print("📂 Excel 파일에서 업체명 추출 중...\n")

for excel_file in sorted(excel_files):
    filename = excel_file.stem  # 확장자 제외
    
    # 파일명 분석: "월 업체명.." 형식에서 업체명 추출
    # 예: "02월 siw 마사지.." → "siw"
    # 예: "02월 가이드맨.." → "가이드맨"
    
    # "월" 이후의 텍스트 추출
    parts = filename.split()
    if len(parts) >= 2:
        # 첫 번째가 날짜(예: "02월"), 나머지가 업체명
        company_candidate = " ".join(parts[1:])
        
        # 마지막의 ".." 같은 것 제거
        company_candidate = re.sub(r'\.+$', '', company_candidate).strip()
        
        if company_candidate and len(company_candidate) > 0:
            # 영문자와 한글을 모두 포함하는 경우 처리
            companies_set.add(company_candidate)
            print(f"✅ {filename} → '{company_candidate}'")
    else:
        # 파일명이 직접 업체명인 경우
        companies_set.add(filename)
        print(f"✅ {filename}")

# Supabase에 등록
print(f"\n🔄 Supabase에 {len(companies_set)}개 업체 등록 중...\n")

success_count = 0
for company_name in sorted(companies_set):
    try:
        # 중복 확인
        existing = supabase.table("companies").select("id").eq("name", company_name).execute()
        if existing.data:
            print(f"⏭️  {company_name} (이미 등록됨)")
            continue
        
        # 새 업체 등록
        supabase.table("companies").insert({"name": company_name}).execute()
        print(f"✅ {company_name}")
        success_count += 1
    except Exception as e:
        print(f"⚠️  {company_name}: {str(e)[:40]}")

print(f"\n✅ {success_count}개 업체 등록 완료!")
