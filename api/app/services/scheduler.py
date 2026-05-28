from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging
from app.database import SessionLocal
from app.services.massage_booking_service import MassageBookingService

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()
service = MassageBookingService()


def daily_sync_massage_bookings():
    """매일 자정에 실행: Google Sheets + 로컬 DB 동기화"""
    db = SessionLocal()
    try:
        result = service.sync_with_cloud(db)
        logger.info(f"마사지 예약 동기화 완료: {result}")
    except Exception as e:
        logger.error(f"마사지 예약 동기화 실패: {e}")
    finally:
        db.close()


def start_scheduler():
    """백그라운드 스케줄러 시작"""
    if not scheduler.running:
        # 매일 자정(00:00)에 실행
        scheduler.add_job(
            daily_sync_massage_bookings,
            CronTrigger(hour=0, minute=0),  # 매일 자정
            id="massage_sync_daily",
            name="마사지 예약 일일 동기화",
            replace_existing=True,
        )

        scheduler.start()
        logger.info("마사지 예약 자동 동기화 스케줄러 시작")


def stop_scheduler():
    """스케줄러 중지"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("마사지 예약 자동 동기화 스케줄러 중지")
