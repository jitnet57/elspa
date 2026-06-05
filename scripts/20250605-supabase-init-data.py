#!/usr/bin/env python3
"""
============================================================
📌 스크립트: Supabase 초기 데이터 등록
📋 목적: ElSpa 테라피스트 40명 + 침대 4개 등록
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

# ══════════════════════════════════════════════════════════
# 1️⃣ 테라피스트 40명
# ══════════════════════════════════════════════════════════

therapists = [
    # 1ST시트 (1-18명, 40% 수수료)
    {"name": "SUL AMOR TORREON", "employment_type": "therapist", "specialty": "스웨디시", "commission_rate": 0.40, "status": "active"},
    {"name": "FATIMA TAMPAN", "employment_type": "therapist", "specialty": "타이마사지", "commission_rate": 0.40, "status": "active"},
    {"name": "NARSING ATILLO", "employment_type": "therapist", "specialty": "핫스톤", "commission_rate": 0.40, "status": "active"},
    {"name": "JANEL IGOT", "employment_type": "therapist", "specialty": "발마사지", "commission_rate": 0.40, "status": "active"},
    {"name": "JENALYN BACULE", "employment_type": "therapist", "specialty": "아로마테라피", "commission_rate": 0.40, "status": "active"},
    {"name": "JESSICA FRANCIS", "employment_type": "therapist", "specialty": "종합", "commission_rate": 0.40, "status": "active"},
    {"name": "WELLA CABALHUG", "employment_type": "therapist", "specialty": "스웨디시", "commission_rate": 0.40, "status": "active"},
    {"name": "WILFREDA ROSAS", "employment_type": "therapist", "specialty": "타이마사지", "commission_rate": 0.40, "status": "active"},
    {"name": "ROSELYN TAMSE", "employment_type": "therapist", "specialty": "핫스톤", "commission_rate": 0.40, "status": "active"},
    {"name": "CRISTY DEJITO", "employment_type": "therapist", "specialty": "발마사지", "commission_rate": 0.40, "status": "active"},
    {"name": "SHEILA", "employment_type": "therapist", "specialty": "아로마테라피", "commission_rate": 0.40, "status": "active"},
    {"name": "WILMA BENSIG", "employment_type": "therapist", "specialty": "종합", "commission_rate": 0.40, "status": "active"},
    {"name": "GINA DESTURA", "employment_type": "therapist", "specialty": "스웨디시", "commission_rate": 0.40, "status": "active"},
    {"name": "JOY", "employment_type": "therapist", "specialty": "타이마사지", "commission_rate": 0.40, "status": "active"},
    {"name": "ARCELEY PEJO", "employment_type": "therapist", "specialty": "핫스톤", "commission_rate": 0.40, "status": "active"},
    {"name": "EVELYN DINAPO", "employment_type": "therapist", "specialty": "발마사지", "commission_rate": 0.40, "status": "active"},
    {"name": "RITCHEL UMBLERO", "employment_type": "therapist", "specialty": "아로마테라피", "commission_rate": 0.40, "status": "active"},
    {"name": "LAURA CALLINO", "employment_type": "therapist", "specialty": "종합", "commission_rate": 0.40, "status": "active"},

    # 2ND시트 (19-36명, 45% 수수료)
    {"name": "ADELAIDA ESCOBIDO", "employment_type": "therapist", "specialty": "스웨디시", "commission_rate": 0.45, "status": "active"},
    {"name": "AGNES CALING", "employment_type": "therapist", "specialty": "타이마사지", "commission_rate": 0.45, "status": "active"},
    {"name": "ALICIA BUSMONTE", "employment_type": "therapist", "specialty": "핫스톤", "commission_rate": 0.45, "status": "active"},
    {"name": "ALONA PANDI", "employment_type": "therapist", "specialty": "발마사지", "commission_rate": 0.45, "status": "active"},
    {"name": "AMELIA CASIO", "employment_type": "therapist", "specialty": "아로마테라피", "commission_rate": 0.45, "status": "active"},
    {"name": "ANALIZA GAHONG", "employment_type": "therapist", "specialty": "종합", "commission_rate": 0.45, "status": "active"},
    {"name": "ANDREA CAPULONG", "employment_type": "therapist", "specialty": "스웨디시", "commission_rate": 0.45, "status": "active"},
    {"name": "ANNA PANAD", "employment_type": "therapist", "specialty": "타이마사지", "commission_rate": 0.45, "status": "active"},
    {"name": "ANTONIETA YONG", "employment_type": "therapist", "specialty": "핫스톤", "commission_rate": 0.45, "status": "active"},
    {"name": "APRIL CABALLES", "employment_type": "therapist", "specialty": "발마사지", "commission_rate": 0.45, "status": "active"},
    {"name": "AVELINA OSMAN", "employment_type": "therapist", "specialty": "아로마테라피", "commission_rate": 0.45, "status": "active"},
    {"name": "BELEN LINA", "employment_type": "therapist", "specialty": "종합", "commission_rate": 0.45, "status": "active"},
    {"name": "BENEDICTA MOLINA", "employment_type": "therapist", "specialty": "스웨디시", "commission_rate": 0.45, "status": "active"},
    {"name": "BERRY BUNGOS", "employment_type": "therapist", "specialty": "타이마사지", "commission_rate": 0.45, "status": "active"},
    {"name": "BETTE ABUTIN", "employment_type": "therapist", "specialty": "핫스톤", "commission_rate": 0.45, "status": "active"},
    {"name": "BLANCHE CUTING", "employment_type": "therapist", "specialty": "발마사지", "commission_rate": 0.45, "status": "active"},
    {"name": "BONITA CORADO", "employment_type": "therapist", "specialty": "아로마테라피", "commission_rate": 0.45, "status": "active"},
    {"name": "BRENDA ALEC", "employment_type": "therapist", "specialty": "종합", "commission_rate": 0.45, "status": "active"},

    # 3RD시트 (37-40명, 50% 수수료)
    {"name": "CARLA COSIO", "employment_type": "therapist", "specialty": "스웨디시", "commission_rate": 0.50, "status": "active"},
    {"name": "CARMELA RIOS", "employment_type": "therapist", "specialty": "타이마사지", "commission_rate": 0.50, "status": "active"},
    {"name": "CAROLINE OLIVO", "employment_type": "therapist", "specialty": "핫스톤", "commission_rate": 0.50, "status": "active"},
    {"name": "CELIA ABALORIA", "employment_type": "therapist", "specialty": "발마사지", "commission_rate": 0.50, "status": "active"},
]

# ══════════════════════════════════════════════════════════
# 2️⃣ 침대 4개
# ══════════════════════════════════════════════════════════

beds = [
    {"bed_number": 1, "room_zone": "Massage Room 1", "status": "available"},
    {"bed_number": 2, "room_zone": "Massage Room 2", "status": "available"},
    {"bed_number": 3, "room_zone": "VIP Room", "status": "available"},
    {"bed_number": 4, "room_zone": "Other Room", "status": "available"},
]


def init_employees():
    """테라피스트 40명 등록 (name 기준 upsert — 비파괴)

    ⚠️ delete-all 금지: employees 삭제 시 FK on delete cascade 로
       attendance_logs/payroll_records/cash_advances 등이 함께 삭제됨.
       → name(UNIQUE) 충돌 시 갱신하는 upsert 로 기존 급여데이터 보호.
    """
    print("🔄 테라피스트 upsert 시작...")

    try:
        # 기존 직원 name→id 매핑 (DB UNIQUE 제약에 의존하지 않는 수동 upsert)
        existing = supabase.table("employees").select("id,name").execute().data or []
        by_name = {r["name"]: r["id"] for r in existing}

        inserted = updated = 0
        for t in therapists:
            row = {
                **t,
                # payroll 분류용(employee_type) + monitor용(employment_type) 둘 다 채움
                "employee_type": "therapist",
                "department": "Therapy",
                "job_title": "Therapist",
                "is_active": True,
            }
            if t["name"] in by_name:
                supabase.table("employees").update(row).eq("id", by_name[t["name"]]).execute()
                updated += 1
            else:
                supabase.table("employees").insert(row).execute()
                inserted += 1

        print(f"✅ 테라피스트 처리 완료: 신규 {inserted} / 갱신 {updated} (총 {len(therapists)})")
        print(f"   - 1ST: 18명 (40%) / 2ND: 18명 (45%) / 3RD: 4명 (50%)")

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        sys.exit(1)


def init_beds():
    """침대 4개 등록 (bed_number 기준 upsert — 비파괴)"""
    print("\n🔄 침대 upsert 시작...")

    try:
        # 기존 bed_number→id (제약 무관 수동 upsert, 예약/상태 보존)
        existing = supabase.table("beds").select("id,bed_number").execute().data or []
        by_num = {r["bed_number"]: r["id"] for r in existing}
        for bed in beds:
            if bed["bed_number"] in by_num:
                supabase.table("beds").update(bed).eq("id", by_num[bed["bed_number"]]).execute()
            else:
                supabase.table("beds").insert(bed).execute()
            print(f"✅ Bed {bed['bed_number']} - {bed['room_zone']}")
        print(f"\n✅ 침대 {len(beds)}개 처리 완료")

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        sys.exit(1)


if __name__ == "__main__":
    print("=" * 60)
    print("📌 Supabase 초기 데이터 등록")
    print("=" * 60)

    init_employees()
    init_beds()

    print("\n" + "=" * 60)
    print("✅ 모든 데이터 등록 완료!")
    print("=" * 60)
