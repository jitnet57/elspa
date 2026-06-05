#!/usr/bin/env python3
"""마사지 서비스 데이터 Supabase 등록 (EL SPA 메뉴판)"""

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

# 마사지 서비스 데이터 (EL SPA 메뉴판 기준 - 시간별 상품)
massage_services = [
    # ============= 스톤 마사지 =============
    {"name": "하와이라이아 핑크 스톤 (90분)", "base_duration_minutes": 90, "base_price": 2500, "is_active": True},
    {"name": "하와이라이아 핑크 스톤 (120분)", "base_duration_minutes": 120, "base_price": 3300, "is_active": True},
    {"name": "시그니처 마사지 (90분)", "base_duration_minutes": 90, "base_price": 1700, "is_active": True},
    {"name": "시그니처 마사지 (120분)", "base_duration_minutes": 120, "base_price": 2200, "is_active": True},
    
    # ============= 테라피 =============
    {"name": "하이방 (60분)", "base_duration_minutes": 60, "base_price": 1700, "is_active": True},
    {"name": "하이방 (90분)", "base_duration_minutes": 90, "base_price": 2200, "is_active": True},
    
    {"name": "곱은 코코넛 (60분)", "base_duration_minutes": 60, "base_price": 1300, "is_active": True},
    {"name": "곱은 코코넛 (90분)", "base_duration_minutes": 90, "base_price": 1700, "is_active": True},
    {"name": "곱은 코코넛 (120분)", "base_duration_minutes": 120, "base_price": 2200, "is_active": True},
    
    {"name": "임상부 (60분)", "base_duration_minutes": 60, "base_price": 1300, "is_active": True},
    {"name": "임상부 (90분)", "base_duration_minutes": 90, "base_price": 1700, "is_active": True},
    {"name": "임상부 (120분)", "base_duration_minutes": 120, "base_price": 2200, "is_active": True},
    
    # ============= 피부 진정 =============
    {"name": "그린 제이드 스톤 Cold (90분)", "base_duration_minutes": 90, "base_price": 1700, "is_active": True},
    {"name": "그린 제이드 스톤 Cold (120분)", "base_duration_minutes": 120, "base_price": 2200, "is_active": True},
    
    {"name": "알로에 Cold (60분)", "base_duration_minutes": 60, "base_price": 1300, "is_active": True},
    {"name": "알로에 Cold (90분)", "base_duration_minutes": 90, "base_price": 1700, "is_active": True},
    {"name": "알로에 Cold (120분)", "base_duration_minutes": 120, "base_price": 2200, "is_active": True},
    
    # ============= 기본 마사지 =============
    {"name": "아로마 (60분)", "base_duration_minutes": 60, "base_price": 1100, "is_active": True},
    {"name": "아로마 (90분)", "base_duration_minutes": 90, "base_price": 1500, "is_active": True},
    {"name": "아로마 (120분)", "base_duration_minutes": 120, "base_price": 2200, "is_active": True},
    
    {"name": "드라이 (60분)", "base_duration_minutes": 60, "base_price": 1100, "is_active": True},
    {"name": "드라이 (90분)", "base_duration_minutes": 90, "base_price": 1500, "is_active": True},
    {"name": "드라이 (120분)", "base_duration_minutes": 120, "base_price": 2200, "is_active": True},
    
    {"name": "코코넛 (60분)", "base_duration_minutes": 60, "base_price": 1100, "is_active": True},
    {"name": "코코넛 (90분)", "base_duration_minutes": 90, "base_price": 1500, "is_active": True},
    {"name": "코코넛 (120분)", "base_duration_minutes": 120, "base_price": 2200, "is_active": True},
    
    {"name": "정장 마사지 (60분)", "base_duration_minutes": 60, "base_price": 700, "is_active": True},
    {"name": "정장 마사지 (90분)", "base_duration_minutes": 90, "base_price": 900, "is_active": True},
    {"name": "정장 마사지 (120분)", "base_duration_minutes": 120, "base_price": 1100, "is_active": True},
    
    # ============= 발 마사지 =============
    {"name": "발광풋팩 (60분)", "base_duration_minutes": 60, "base_price": 1300, "is_active": True},
    
    {"name": "발 기본 (60분)", "base_duration_minutes": 60, "base_price": 900, "is_active": True},
    {"name": "발 기본 (90분)", "base_duration_minutes": 90, "base_price": 1300, "is_active": True},
]


def import_massage_services():
    """마사지 서비스 데이터 Supabase에 등록"""
    print("🔄 마사지 서비스 데이터 Supabase 등록 시작...")

    try:
        # 기존 데이터 제거
        print("⏳ 기존 데이터 제거 중...")
        supabase.table("massage_services").delete().neq("id", 0).execute()
        print("✅ 기존 데이터 제거 완료\n")

        # 새 데이터 삽입
        print("⏳ 새로운 마사지 서비스 등록 중...")
        for service in massage_services:
            response = supabase.table("massage_services").insert(service).execute()
            print(f"✅ {service['name']} (₱{service['base_price']})")

        print(f"\n✅ 모든 마사지 서비스 등록 완료!")
        print(f"📊 총 {len(massage_services)}개 서비스 등록됨")

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        sys.exit(1)


if __name__ == "__main__":
    import_massage_services()
