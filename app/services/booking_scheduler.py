# ============================================================
# 📌 예약 자동 저장 스케줄러 (3시간 마다)
# 📋 목적: Google Sheets → CSV → Supabase Storage 자동 내보내기
# 🔧 기능: APScheduler를 사용한 정기적 백업
# 📅 작성일: 2026-05-28
# ============================================================

import os
import csv
import logging
from datetime import datetime
from io import StringIO
from apscheduler.schedulers.background import BackgroundScheduler
from google.oauth2.credentials import Credentials
from app.services.google_oauth_service import GoogleOAuthService
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()
oauth_service = GoogleOAuthService()
supabase_service = SupabaseService()

# 임시 토큰 저장소
user_tokens: dict = {}


def export_bookings_to_csv():
    """
    Google Sheets에서 데이터를 읽어 CSV로 변환 후 Supabase에 저장

    스케줄: 3시간마다
    범위: A:I, 행 1-32
    파일명: booking_YYYYMMDD_HHMMSS.csv
    """
    try:
        # 토큰 확인
        if "default" not in user_tokens:
            logger.warning("Google Sheets 토큰이 없습니다. 자동 저장 스킵")
            return

        token_data = user_tokens["default"]
        credentials = Credentials(token=token_data["access_token"])

        # Google Sheets에서 데이터 읽기
        logger.info("📖 Google Sheets에서 데이터 읽는 중...")
        values = oauth_service.read_sheet_data(credentials)

        if not values:
            logger.warning("조회할 데이터가 없습니다")
            return

        # CSV 형식으로 변환
        csv_buffer = StringIO()
        csv_writer = csv.writer(csv_buffer)
        csv_writer.writerows(values)
        csv_content = csv_buffer.getvalue()

        # 파일명 생성 (날짜 + 시간)
        now = datetime.now()
        filename = f"booking_{now.strftime('%Y%m%d_%H%M%S')}.csv"

        # Supabase Storage에 저장
        logger.info(f"💾 Supabase에 저장 중: {filename}")
        success = supabase_service.upload_file(
            bucket="booking_exports",
            file_path=filename,
            file_content=csv_content.encode("utf-8"),
        )

        if success:
            logger.info(f"✅ 예약 데이터 자동 저장 완료: {filename}")
            logger.info(f"   행 수: {len(values)}, 크기: {len(csv_content)} bytes")
        else:
            logger.error(f"❌ Supabase 저장 실패: {filename}")

    except Exception as e:
        logger.error(f"❌ 자동 저장 실패: {e}", exc_info=True)


def start_scheduler():
    """3시간마다 자동 저장 스케줄러 시작"""
    try:
        # 기존 job이 있으면 제거
        if scheduler.running:
            scheduler.shutdown()

        # 3시간마다 실행 (10800초)
        scheduler.add_job(
            export_bookings_to_csv,
            "interval",
            hours=3,
            id="booking_export_job",
            name="Google Sheets → CSV → Supabase 자동 내보내기",
            max_instances=1,
            replace_existing=True,
        )

        scheduler.start()
        logger.info("✅ 예약 자동 저장 스케줄러 시작 (3시간 주기)")

    except Exception as e:
        logger.error(f"❌ 스케줄러 시작 실패: {e}", exc_info=True)


def stop_scheduler():
    """스케줄러 중지"""
    try:
        if scheduler.running:
            scheduler.shutdown()
            logger.info("✅ 예약 자동 저장 스케줄러 중지")
    except Exception as e:
        logger.error(f"❌ 스케줄러 중지 실패: {e}", exc_info=True)


def set_user_tokens(tokens: dict):
    """사용자 토큰 설정 (외부에서 호출)"""
    global user_tokens
    user_tokens = tokens
    logger.info("✅ 사용자 토큰 업데이트됨")
