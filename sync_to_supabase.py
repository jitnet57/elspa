#!/usr/bin/env python3
# ============================================================
# 📌 로컬 XLSX → Supabase 동기화 스크립트
# 📋 목적: ~/elspa/data/*.xlsx를 Supabase에 자동 업로드
# 🔧 사용: python3 sync_to_supabase.py
# 📅 작성일: 2026-06-02
# ============================================================

import os
import json
from pathlib import Path
from datetime import datetime
import pandas as pd
from supabase import create_client, Client
import openpyxl

# 설정
DATA_DIR = Path.home() / "elspa" / "data"
SUPABASE_URL = "https://qnqhqrpvqjhqarbufzqd.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucWhxcnB2cWpocWFyYnVmenFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTYyODgsImV4cCI6MjA5NTUzMjI4OH0.xK6AcI7vpWDiuQzEh__5gHFKX3X6eTFH0xrgdZzRB8I"

# ============================================================
# 🔐 Supabase 클라이언트 초기화
# ============================================================
def get_supabase_client() -> Client:
    """Supabase 클라이언트 생성"""
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"❌ Supabase 연결 실패: {e}")
        return None

# ============================================================
# 📊 XLSX → DataFrame 변환
# ============================================================
def load_xlsx(file_path: Path) -> pd.DataFrame:
    """XLSX 파일을 DataFrame으로 변환"""
    try:
        df = pd.read_excel(file_path)
        print(f"✅ 로드: {file_path.name} ({len(df)} 행)")
        return df
    except Exception as e:
        print(f"❌ 로드 실패: {file_path.name} - {e}")
        return None

# ============================================================
# 📤 Supabase에 업로드
# ============================================================
def upload_to_supabase(supabase: Client, table: str, data: list):
    """데이터를 Supabase 테이블에 업로드"""
    if not data:
        return False

    try:
        # 기존 데이터 삭제 (또는 upsert)
        supabase.table(table).delete().neq('id', -1).execute()

        # 새 데이터 삽입
        for batch in [data[i:i+100] for i in range(0, len(data), 100)]:
            supabase.table(table).insert(batch).execute()

        print(f"✅ 업로드 완료: {table} ({len(data)} 행)")
        return True
    except Exception as e:
        print(f"❌ 업로드 실패: {table} - {e}")
        return False

# ============================================================
# 🔄 메인 동기화 함수
# ============================================================
def sync_all():
    """모든 XLSX 파일을 Supabase에 동기화"""

    print("\n" + "="*60)
    print("🚀 Supabase 동기화 시작")
    print("="*60 + "\n")

    # Supabase 클라이언트 초기화
    supabase = get_supabase_client()
    if not supabase:
        return False

    # 데이터 디렉토리 확인
    if not DATA_DIR.exists():
        print(f"❌ 데이터 디렉토리 없음: {DATA_DIR}")
        return False

    print(f"📁 데이터 디렉토리: {DATA_DIR}\n")

    # 파일별 동기화
    sync_count = 0

    # 예약 데이터
    bookings_file = DATA_DIR / "bookings.xlsx"
    if bookings_file.exists():
        df = load_xlsx(bookings_file)
        if df is not None:
            data = df.fillna("").astype(str).to_dict('records')
            if upload_to_supabase(supabase, 'bookings', data):
                sync_count += 1

    # 비용 데이터
    expenses_file = DATA_DIR / "expenses.xlsx"
    if expenses_file.exists():
        df = load_xlsx(expenses_file)
        if df is not None:
            data = df.fillna("").astype(str).to_dict('records')
            if upload_to_supabase(supabase, 'expense_records', data):
                sync_count += 1

    # 출결 데이터
    attendance_file = DATA_DIR / "attendance.xlsx"
    if attendance_file.exists():
        df = load_xlsx(attendance_file)
        if df is not None:
            data = df.fillna("").astype(str).to_dict('records')
            if upload_to_supabase(supabase, 'attendance_logs', data):
                sync_count += 1

    # 직원 데이터
    employees_file = DATA_DIR / "employees.xlsx"
    if employees_file.exists():
        df = load_xlsx(employees_file)
        if df is not None:
            data = df.fillna("").astype(str).to_dict('records')
            if upload_to_supabase(supabase, 'employees', data):
                sync_count += 1

    print()
    print("="*60)
    print(f"✅ 동기화 완료: {sync_count}개 테이블 업로드")
    print("="*60 + "\n")

    return True

# ============================================================
# 🎯 실행
# ============================================================
if __name__ == "__main__":
    sync_all()
