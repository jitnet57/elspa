import os
import json
from datetime import datetime, date
from typing import List
from sqlalchemy.orm import Session
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from app.models.massage_booking import MassageBooking
from app.schemas.massage_booking import MassageBookingCreate


class GoogleSheetService:
    """Google Sheets API를 사용한 마사지 예약 동기화 서비스"""

    SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

    def __init__(self):
        self.credentials_json = os.getenv("GOOGLE_SHEETS_CREDENTIALS")
        self.sheet_id = os.getenv("GOOGLE_SHEET_ID")
        self.service = None

        if self.credentials_json and self.sheet_id:
            self._authenticate()

    def _authenticate(self):
        """Google Sheets API 인증"""
        try:
            creds_dict = json.loads(self.credentials_json)
            credentials = Credentials.from_service_account_info(
                creds_dict, scopes=self.SCOPES
            )
            self.service = build("sheets", "v4", credentials=credentials)
        except Exception as e:
            print(f"Google Sheets 인증 실패: {e}")
            self.service = None

    def append_booking_to_sheet(self, booking: MassageBooking) -> bool:
        """Google Sheet에 예약 추가"""
        if not self.service or not self.sheet_id:
            return False

        try:
            range_name = "SCHEDULE!A:G"
            values = [
                [
                    booking.id,
                    booking.therapist,
                    booking.service,
                    str(booking.date),
                    str(booking.time),
                    booking.guest_name,
                    booking.room_number or "",
                ]
            ]

            body = {"values": values}
            self.service.spreadsheets().values().append(
                spreadsheetId=self.sheet_id,
                range=range_name,
                valueInputOption="USER_ENTERED",
                body=body,
            ).execute()

            return True
        except Exception as e:
            print(f"Google Sheet 추가 실패: {e}")
            return False

    def sync_daily(self, db: Session) -> dict:
        """매일 자정에 실행: 미동기화 예약을 Google Sheet에 추가"""
        try:
            # 미동기화 예약 조회
            unsynced = db.query(MassageBooking).filter(
                MassageBooking.synced_to_sheet == False
            ).all()

            synced_count = 0
            for booking in unsynced:
                if self.append_booking_to_sheet(booking):
                    booking.synced_to_sheet = True
                    synced_count += 1

            db.commit()

            return {
                "status": "success",
                "synced_count": synced_count,
                "timestamp": datetime.now().isoformat(),
            }
        except Exception as e:
            db.rollback()
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            }


class MassageBookingService:
    """마사지 예약 서비스"""

    def __init__(self):
        self.sheet_service = GoogleSheetService()

    def create_booking(
        self, db: Session, booking_data: MassageBookingCreate
    ) -> MassageBooking:
        """마사지 예약 생성"""
        booking = MassageBooking(
            therapist=booking_data.therapist,
            service=booking_data.service,
            date=booking_data.date,
            time=booking_data.time,
            guest_name=booking_data.guest_name,
            room_number=booking_data.room_number,
            notes=booking_data.notes,
            status="confirmed",
        )

        db.add(booking)
        db.commit()
        db.refresh(booking)

        # Google Sheet에 추가 시도
        self.sheet_service.append_booking_to_sheet(booking)
        booking.synced_to_sheet = True
        db.commit()

        return booking

    def get_bookings_by_date(
        self, db: Session, target_date: date
    ) -> List[MassageBooking]:
        """특정 날짜의 모든 예약 조회"""
        return db.query(MassageBooking).filter(
            MassageBooking.date == target_date
        ).all()

    def get_all_bookings(self, db: Session) -> List[MassageBooking]:
        """모든 예약 조회"""
        return db.query(MassageBooking).order_by(
            MassageBooking.date.desc()
        ).all()

    def sync_with_cloud(self, db: Session) -> dict:
        """클라우드와 로컬 동기화 (매일 자정 실행)"""
        return self.sheet_service.sync_daily(db)
