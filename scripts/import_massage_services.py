#!/usr/bin/env python3
"""
============================================================
📌 스크립트: 마사지 서비스 데이터 Supabase 등록
📋 목적: EL SPA 메뉴의 12개 마사지 종류를 DB에 저장
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

# 마사지 서비스 데이터
massage_services = [
    # 스톤 마사지
    {
        "name": "Hawaii Pink Stone",
        "category": "Stone",
        "description": "하와이안 핑크 스톤 마사지",
        "base_duration_minutes": 90,
        "base_price": 2500,
        "duration_options": [
            {"duration": 90, "price": 2500},
            {"duration": 120, "price": 3300},
        ],
        "is_active": True,
    },
    {
        "name": "Vulcaner Black Stone (Hot)",
        "category": "Stone",
        "description": "불카너 블랙 스톤 (핫) 마사지",
        "base_duration_minutes": 90,
        "base_price": 1700,
        "duration_options": [
            {"duration": 90, "price": 1700},
            {"duration": 120, "price": 2200},
        ],
        "is_active": True,
    },
    # 테라피
    {
        "name": "Hibang (Traditional)",
        "category": "Therapy",
        "description": "전통 히방 마사지",
        "base_duration_minutes": 60,
        "base_price": 1700,
        "duration_options": [
            {"duration": 60, "price": 1700},
            {"duration": 90, "price": 2200},
        ],
        "is_active": True,
    },
    {
        "name": "Smooth Coconut",
        "category": "Therapy",
        "description": "곱은 코코넛 오일 마사지",
        "base_duration_minutes": 60,
        "base_price": 1300,
        "duration_options": [
            {"duration": 60, "price": 1300},
            {"duration": 90, "price": 1700},
            {"duration": 120, "price": 2200},
        ],
        "is_active": True,
    },
    {
        "name": "Clinical Full Body",
        "category": "Therapy",
        "description": "임상부 전용 마사지",
        "base_duration_minutes": 60,
        "base_price": 1300,
        "duration_options": [
            {"duration": 60, "price": 1300},
            {"duration": 90, "price": 1700},
            {"duration": 120, "price": 2200},
        ],
        "is_active": True,
    },
    # 피부 진정
    {
        "name": "Green Jade Stone (Cold)",
        "category": "Skin Soothing",
        "description": "그린 제이드 스톤 (콜드) 마사지",
        "base_duration_minutes": 90,
        "base_price": 1700,
        "duration_options": [
            {"duration": 90, "price": 1700},
            {"duration": 120, "price": 2200},
        ],
        "is_active": True,
    },
    {
        "name": "Aloe (Cold)",
        "category": "Skin Soothing",
        "description": "알로에 (콜드) 마사지",
        "base_duration_minutes": 60,
        "base_price": 1300,
        "duration_options": [
            {"duration": 60, "price": 1300},
            {"duration": 90, "price": 1700},
            {"duration": 120, "price": 2200},
        ],
        "is_active": True,
    },
    # 기본 마사지
    {
        "name": "Aroma Massage",
        "category": "Basic",
        "description": "아로마 마사지",
        "base_duration_minutes": 60,
        "base_price": 1100,
        "duration_options": [
            {"duration": 60, "price": 1100},
            {"duration": 90, "price": 1500},
            {"duration": 120, "price": 2200},
        ],
        "is_active": True,
    },
    {
        "name": "Dry Massage",
        "category": "Basic",
        "description": "드라이 마사지",
        "base_duration_minutes": 60,
        "base_price": 1100,
        "duration_options": [
            {"duration": 60, "price": 1100},
            {"duration": 90, "price": 1500},
            {"duration": 120, "price": 2200},
        ],
        "is_active": True,
    },
    {
        "name": "Coconut Oil Massage",
        "category": "Basic",
        "description": "코코넛 오일 마사지",
        "base_duration_minutes": 60,
        "base_price": 1100,
        "duration_options": [
            {"duration": 60, "price": 1100},
            {"duration": 90, "price": 1500},
            {"duration": 120, "price": 2200},
        ],
        "is_active": True,
    },
    {
        "name": "Corporate Massage",
        "category": "Basic",
        "description": "정장 마사지 (짧은 시간)",
        "base_duration_minutes": 60,
        "base_price": 700,
        "duration_options": [
            {"duration": 60, "price": 700},
            {"duration": 90, "price": 900},
            {"duration": 120, "price": 1100},
        ],
        "is_active": True,
    },
    # 발 마사지
    {
        "name": "Foot Pack (Scrub + Massage)",
        "category": "Foot",
        "description": "발광풋팩 (풋 스크럽 + 발 마사지)",
        "base_duration_minutes": 60,
        "base_price": 1300,
        "duration_options": [
            {"duration": 60, "price": 1300},
        ],
        "is_active": True,
    },
    {
        "name": "Basic Foot Massage",
        "category": "Foot",
        "description": "발 마사지 (기본)",
        "base_duration_minutes": 60,
        "base_price": 900,
        "duration_options": [
            {"duration": 60, "price": 900},
            {"duration": 90, "price": 1300},
        ],
        "is_active": True,
    },
]


def import_massage_services():
    """마사지 서비스 데이터 Supabase에 등록"""
    print("🔄 마사지 서비스 데이터 Supabase 등록 시작...")

    try:
        # 기존 데이터 제거 (선택사항)
        # supabase.table("massage_services").delete().neq("id", 0).execute()
        # print("✅ 기존 데이터 제거 완료")

        # 새 데이터 삽입
        for service in massage_services:
            response = supabase.table("massage_services").insert(service).execute()
            print(f"✅ {service['name']} 등록 완료")

        print("\n✅ 모든 마사지 서비스 등록 완료!")
        print(f"📊 총 {len(massage_services)}개 서비스 등록됨")

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        sys.exit(1)


if __name__ == "__main__":
    import_massage_services()
