#!/usr/bin/env python3
"""
============================================================
📌 스크립트: 업체 정보 Supabase 등록
📋 목적: EL SPA 26개 업체를 DB에 저장
📅 작성일: 2026-06-05
============================================================
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL or SUPABASE_KEY not set")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 업체 정보 (26개)
companies = [
    # ============= 여행사 (4개) =============
    {"name": "WEGO"},
    {"name": "PETERPAN"},
    {"name": "JTB"},
    {"name": "HIS"},

    # ============= 가이드 서비스 (1개) =============
    {"name": "SIW"},

    # ============= 패키지/투어 (21개) =============
    {"name": "PTF"},
    {"name": "아라다이브"},
    {"name": "호핑따요"},
    {"name": "필버디"},
    {"name": "핑크데이"},
    {"name": "트레블포레스트"},
    {"name": "투어스타"},
    {"name": "투어레주르"},
    {"name": "유한필곳"},
    {"name": "예스투어"},
    {"name": "아시아트립"},
    {"name": "로맨스투어"},
    {"name": "락빌리지"},
    {"name": "디프리"},
    {"name": "더세부"},
    {"name": "가이드맨"},
    {"name": "세브랑"},
]

def import_companies():
    """업체 정보 Supabase에 등록"""
    print("🔄 업체 정보 Supabase 등록 시작...")

    try:
        # 1) 기존 데이터 제거
        print("⏳ 기존 데이터 제거 중...")
        supabase.table("companies").delete().neq("id", 0).execute()
        print("✅ 기존 데이터 제거 완료")

        # 2) 새 데이터 삽입
        print("\n⏳ 새로운 업체 정보 등록 중...")
        for idx, company in enumerate(companies, 1):
            response = supabase.table("companies").insert(company).execute()
            print(f"✅ {idx:2d}. {company['name']}")

        print(f"\n✅ 모든 업체 정보 등록 완료!")
        print(f"📊 총 {len(companies)}개 업체 등록됨")
        print(f"   - 여행사: 4개")
        print(f"   - 가이드 서비스: 1개")
        print(f"   - 패키지/투어: 21개")

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        sys.exit(1)


if __name__ == "__main__":
    import_companies()
